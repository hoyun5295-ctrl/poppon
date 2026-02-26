/**
 * KMC 본인확인서비스 암호화 모듈 래퍼
 *
 * KmcCrypto 바이너리를 child_process.spawn으로 호출하여
 * 암호화(enc), 복호화(dec), 위변조 해시(msg) 처리
 *
 * 프로토콜: stdin → "mode:id^*input\n" / stdout → "id:result\n"
 */

import { spawn } from 'child_process';
import { copyFileSync, chmodSync, existsSync } from 'fs';
import path from 'path';

// iconv-lite 동적 로드 (dec에서만 필요)
let iconvDecode: ((buffer: Buffer, encoding: string) => string) | null = null;
async function getIconvDecode() {
  if (!iconvDecode) {
    try {
      const iconv = await import('iconv-lite');
      iconvDecode = iconv.default?.decode || iconv.decode;
    } catch (e) {
      console.error('[KMC] iconv-lite 로드 실패:', e);
    }
  }
  return iconvDecode;
}

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
    console.log('[KMC] Binary copied to /tmp/KmcCrypto');
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
    const chunks: Buffer[] = [];

    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error(`KmcCrypto timeout (mode=${mode})`));
    }, 10_000);

    proc.stdout.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    proc.stderr.on('data', (data: Buffer) => {
      console.error('[KmcCrypto stderr]', data.toString('utf-8'));
    });

    proc.on('close', async (code) => {
      clearTimeout(timer);

      const rawBuffer = Buffer.concat(chunks);

      if (rawBuffer.length === 0) {
        return reject(new Error(`KmcCrypto empty response (mode=${mode}, code=${code})`));
      }

      // "id:" 구분자 찾기 (바이트 레벨)
      const colonIdx = rawBuffer.indexOf(0x3a); // ':'
      if (colonIdx < 0) {
        return reject(new Error(`Invalid KmcCrypto response (no colon): ${rawBuffer.toString('utf-8').substring(0, 50)}`));
      }

      // result 부분 추출 (colon 다음부터)
      let resultBuffer = rawBuffer.slice(colonIdx + 1);

      // 줄바꿈 제거
      let endPos = resultBuffer.indexOf(0x0a);
      if (endPos >= 0) resultBuffer = resultBuffer.slice(0, endPos);
      if (resultBuffer.length > 0 && resultBuffer[resultBuffer.length - 1] === 0x0d) {
        resultBuffer = resultBuffer.slice(0, -1);
      }

      let result: string;

      if (mode === 'dec') {
        // dec: 한글(EUC-KR) 포함 가능 → iconv 디코딩
        try {
          const decode = await getIconvDecode();
          if (decode) {
            result = decode(resultBuffer, 'euc-kr');
          } else {
            result = resultBuffer.toString('utf-8');
          }
        } catch (e) {
          console.error('[KMC] iconv decode error, fallback utf-8:', e);
          result = resultBuffer.toString('utf-8');
        }
      } else {
        // enc/msg: ASCII(hex) 결과 → utf-8으로 충분
        result = resultBuffer.toString('utf-8');
      }

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

  const plainText = `${cpId}/${urlCode}/${certNum}/${date}/${certMet}///////${plusInfo}/${extendVar}`;

  console.log('[KMC] Encrypting, plaintext length:', plainText.length);

  // 1차 암호화
  const tmpEnc = await kmcExec('enc', plainText);
  console.log('[KMC] 1차 enc:', tmpEnc.substring(0, 30) + '...');

  // 위변조 검증값 생성
  const tmpMsg = await kmcExec('msg', tmpEnc);
  console.log('[KMC] msg hash:', tmpMsg.substring(0, 30) + '...');

  // 2차 암호화
  const trCert = await kmcExec('enc', `${tmpEnc}/${tmpMsg}/${extendVar}`);
  console.log('[KMC] tr_cert:', trCert.substring(0, 30) + '...');

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
  gender: string;
  nation: string;
  name: string;
  result: string;
  certMet: string;
  ip: string;
  plusInfo: string;
  di: string;
}

export async function decryptRecCert(apiRecCert: string): Promise<KmcVerifyResult> {
  const tmpDec1 = await kmcExec('dec', apiRecCert);

  const inf1 = tmpDec1.indexOf('/', 0);
  const inf2 = tmpDec1.indexOf('/', inf1 + 1);

  const tmpDec2 = tmpDec1.substring(0, inf1);
  const tmpMsg1 = tmpDec1.substring(inf1 + 1, inf2);

  const tmpMsg2 = await kmcExec('msg', tmpDec2);
  if (tmpMsg1 !== tmpMsg2) {
    throw new Error('KMC 위변조 검증 실패 (해시 불일치)');
  }

  const recCert = await kmcExec('dec', tmpDec2);
  const arr = recCert.split('/');

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
