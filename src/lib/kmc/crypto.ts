/**
 * KMC 본인확인서비스 암호화 모듈 래퍼
 *
 * KmcCrypto 바이너리를 child_process.spawn으로 호출하여
 * 암호화(enc), 복호화(dec), 위변조 해시(msg) 처리
 *
 * 프로토콜: stdin → "mode:id^*input\n" / stdout → "id:result\n"
 * 결과는 EUC-KR 인코딩으로 반환됨
 */

import { spawn } from 'child_process';
import { copyFileSync, chmodSync, existsSync } from 'fs';
import path from 'path';
import iconv from 'iconv-lite';

// ─── 바이너리 경로 ───
const TMP_PATH = '/tmp/KmcCrypto';
let binaryReady = false;

function ensureBinary(): string {
  if (!binaryReady || !existsSync(TMP_PATH)) {
    const srcPath = path.join(process.cwd(), 'bin', 'KmcCrypto');
    if (!existsSync(srcPath)) {
      throw new Error(`KmcCrypto binary not found at ${srcPath}`);
    }
    copyFileSync(srcPath, TMP_PATH);
    chmodSync(TMP_PATH, 0o755);
    binaryReady = true;
  }
  return TMP_PATH;
}

// ─── 바이너리 실행 (per-request spawn) ───
export async function kmcExec(
  mode: 'enc' | 'dec' | 'msg',
  input: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const binPath = ensureBinary();
    const proc = spawn(binPath);
    let stdout = Buffer.alloc(0);

    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error(`KmcCrypto timeout (mode=${mode})`));
    }, 10_000);

    proc.stdout.on('data', (chunk: Buffer) => {
      stdout = Buffer.concat([stdout, chunk]);
    });

    proc.stderr.on('data', (data: Buffer) => {
      console.error('[KmcCrypto stderr]', data.toString());
    });

    proc.on('close', () => {
      clearTimeout(timer);
      // 응답: "id:result\n" — EUC-KR 인코딩
      const line = iconv.decode(stdout, 'euc-kr').trim();
      const colonIdx = line.indexOf(':');
      if (colonIdx < 0) {
        return reject(new Error(`Invalid KmcCrypto response: ${line}`));
      }
      const result = line.substring(colonIdx + 1);
      if (result.startsWith('ERR')) {
        return reject(new Error(`KmcCrypto error: ${result}`));
      }
      resolve(result);
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`KmcCrypto spawn error: ${err.message}`));
    });

    // 프로토콜: "mode:id^*input\n"
    proc.stdin.write(`${mode}:0^*${input}\n`);
    proc.stdin.end();
  });
}

// ─── KST 날짜 생성 (YYYYMMDDHHmmss) ───
export function getKstDateString(): string {
  const now = new Date();
  now.setHours(now.getHours() + 9); // UTC → KST
  return now.toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14);
}

// ─── 요청번호 생성 ───
export function generateCertNum(): { certNum: string; date: string } {
  const date = getKstDateString();
  const random = Math.floor(100000 + Math.random() * 900000);
  return { certNum: date + random, date };
}

// ─── tr_cert 암호화 (서비스 호출용) ───
export async function encryptTrCert(params: {
  cpId: string;
  urlCode: string;
  certNum: string;
  date: string;
  certMet?: string;
  plusInfo?: string;
}): Promise<string> {
  const { cpId, urlCode, certNum, date, certMet = '', plusInfo = '' } = params;
  const extendVar = '0000000000000000';

  // 원문 조합: cpId/urlCode/certNum/date/certMet///////plusInfo/extendVar
  const plainText = `${cpId}/${urlCode}/${certNum}/${date}/${certMet}///////${plusInfo}/${extendVar}`;

  // 1차 암호화
  const tmpEnc = await kmcExec('enc', plainText);
  // 위변조 검증값 생성
  const tmpMsg = await kmcExec('msg', tmpEnc);
  // 2차 암호화
  const trCert = await kmcExec('enc', `${tmpEnc}/${tmpMsg}/${extendVar}`);

  return trCert;
}

// ─── rec_cert 복호화 (결과 수신용) ───
export interface KmcVerifyResult {
  certNum: string;
  date: string;
  ci: string;
  phoneNo: string;
  phoneCorp: string;
  birthDay: string;
  gender: string; // "0"=남 "1"=여
  nation: string; // "0"=내국인 "1"=외국인
  name: string;
  result: string; // "Y"=성공 "N"=실패 "F"=오류
  certMet: string;
  ip: string;
  plusInfo: string;
  di: string;
}

export async function decryptRecCert(apiRecCert: string): Promise<KmcVerifyResult> {
  // 1차 복호화
  const tmpDec1 = await kmcExec('dec', apiRecCert);

  const inf1 = tmpDec1.indexOf('/', 0);
  const inf2 = tmpDec1.indexOf('/', inf1 + 1);

  const tmpDec2 = tmpDec1.substring(0, inf1); // 암호화된 통합 파라미터
  const tmpMsg1 = tmpDec1.substring(inf1 + 1, inf2); // 해시값

  // 위변조 검증
  const tmpMsg2 = await kmcExec('msg', tmpDec2);
  if (tmpMsg1 !== tmpMsg2) {
    throw new Error('KMC 위변조 검증 실패 (해시 불일치)');
  }

  // 2차 복호화 → 최종 평문
  const recCert = await kmcExec('dec', tmpDec2);
  const arr = recCert.split('/');

  // CI, DI 추가 복호화
  const ci = arr[2] ? await kmcExec('dec', arr[2]) : '';
  const di = arr[17] ? await kmcExec('dec', arr[17]) : '';

  return {
    certNum: arr[0] || '',
    date: arr[1] || '',
    ci,
    phoneNo: arr[3] || '',
    phoneCorp: arr[4] || '',
    birthDay: arr[5] || '',
    gender: arr[6] || '',
    nation: arr[7] || '',
    name: arr[8] || '',
    result: arr[9] || '',
    certMet: arr[10] || '',
    ip: arr[11] || '',
    plusInfo: arr[16] || '',
    di,
  };
}
