/**
 * KMC 암호화 모듈 래퍼 (Vercel Lambda 호환)
 *
 * KmcCrypto 바이너리는 내부적으로 iconv_open("EUC-KR")을 호출함.
 * Vercel Lambda에 gconv 모듈이 없으므로 LD_PRELOAD로
 * iconv를 통째로 가로채는 shim .so를 주입하여 해결.
 */

import { spawn } from 'child_process';
import { copyFileSync, chmodSync, existsSync } from 'fs';
import path from 'path';
import * as iconv from 'iconv-lite';

const BIN_NAME = 'KmcCrypto';
const SHIM_NAME = 'iconv_shim.so';
const TMP_BIN = `/tmp/${BIN_NAME}`;
const TMP_SHIM = `/tmp/${SHIM_NAME}`;

/** 바이너리 + shim을 /tmp에 복사 */
function ensureBinary(): void {
  const binDir = path.join(process.cwd(), 'bin');

  if (!existsSync(TMP_BIN)) {
    copyFileSync(path.join(binDir, BIN_NAME), TMP_BIN);
    chmodSync(TMP_BIN, 0o755);
  }

  if (!existsSync(TMP_SHIM)) {
    copyFileSync(path.join(binDir, SHIM_NAME), TMP_SHIM);
    chmodSync(TMP_SHIM, 0o755);
  }
}

/**
 * KmcCrypto 바이너리 실행
 * 프로토콜: stdin에 "mode:id^*input\n" → stdout에 "id:result\n"
 */
function execBinary(mode: string, input: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ensureBinary();

    const proc = spawn(TMP_BIN, [], {
      env: {
        ...process.env,
        LD_PRELOAD: TMP_SHIM,  // ← 핵심: iconv를 shim이 가로챔
      },
    });

    const chunks: Buffer[] = [];
    const errChunks: Buffer[] = [];

    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error(`KMC ${mode} timeout (5s)`));
    }, 5000);

    proc.stdout.on('data', (c: Buffer) => chunks.push(c));
    proc.stderr.on('data', (c: Buffer) => errChunks.push(c));

    proc.on('close', (code) => {
      clearTimeout(timer);

      const raw = Buffer.concat(chunks);
      const stderr = Buffer.concat(errChunks).toString('utf-8').trim();

      if (stderr) {
        console.error(`[KMC] stderr (${mode}):`, stderr);
      }

      // dec 모드: EUC-KR → UTF-8 디코딩 필요
      // enc/msg 모드: ASCII 결과 → UTF-8로 충분
      const output = mode === 'dec'
        ? iconv.decode(raw, 'euc-kr').trim()
        : raw.toString('utf-8').trim();

      // 결과 형식: "id:result"
      const colonIdx = output.indexOf(':');
      if (colonIdx === -1) {
        reject(new Error(`KMC ${mode} invalid output: ${output.substring(0, 50)}`));
        return;
      }

      const result = output.substring(colonIdx + 1);

      if (!result || result === 'ENCODING_ERROR' || result.startsWith('ERR')) {
        reject(new Error(`KMC ${mode} error: ${result} (code=${code})`));
        return;
      }

      resolve(result);
    });

    proc.on('error', (e) => {
      clearTimeout(timer);
      reject(new Error(`KMC spawn error: ${e.message}`));
    });

    // 프로토콜: "mode:id^*input\n"
    proc.stdin.end(`${mode}:0^*${input}\n`);
  });
}

/** 암호화 */
export function encrypt(plainText: string): Promise<string> {
  return execBinary('enc', plainText);
}

/** 복호화 */
export function decrypt(cipherText: string): Promise<string> {
  return execBinary('dec', cipherText);
}

/** 해시 (위변조 검증용) */
export function hash(input: string): Promise<string> {
  return execBinary('msg', input);
}

/** 하위 호환: callback route에서 사용 */
export async function kmcExec(
  mode: 'enc' | 'dec' | 'msg',
  input: string
): Promise<string> {
  return execBinary(mode, input);
}

/** KST 날짜 문자열 (YYYYMMDDHHmmss) */
export function getKstDateString(): string {
  const now = new Date();
  now.setHours(now.getHours() + 9);
  return now.toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14);
}

/** 요청번호 생성 */
export function generateCertNum(): { certNum: string; date: string } {
  const date = getKstDateString();
  const random = Math.floor(100000 + Math.random() * 900000);
  return { certNum: date + random, date };
}

/**
 * tr_cert 생성 (KMC 인증 요청용)
 * 개발가이드 p.5 참조
 *
 * plainText 규격 (13필드, 12슬래시):
 *   cpId / urlCode / certNum / date / certMet / (빈필드×6) / plusInfo / extendVar
 *   → certMet과 plusInfo 사이에 슬래시 7개 (빈 예비필드 6개)
 */
export async function encryptTrCert(params: {
  cpId: string;
  urlCode: string;
  certNum: string;
  date: string;
  certMet?: string;
  plusInfo?: string;
  extendVar?: string;
}): Promise<string> {
  const {
    cpId,
    urlCode,
    certNum,
    date,
    certMet = 'M',
    plusInfo = '',
    extendVar = '0000000000000000',
  } = params;

  // 1차 암호화 대상 문자열 (13필드 — certMet~plusInfo 사이 슬래시 7개)
  const plainText = `${cpId}/${urlCode}/${certNum}/${date}/${certMet}///////${plusInfo}/${extendVar}`;

  console.log(`[KMC] plainText length=${plainText.length}, fields=13`);

  // 1차 암호화
  const tmpEnc = await encrypt(plainText);
  console.log(`[KMC] 1차 enc 성공: ${tmpEnc.substring(0, 20)}...`);

  // 위변조 해시
  const tmpMsg = await hash(tmpEnc);
  console.log(`[KMC] msg hash: ${tmpMsg.substring(0, 20)}...`);

  // 2차 암호화 (최종 tr_cert)
  const trCert = await encrypt(`${tmpEnc}/${tmpMsg}/${extendVar}`);
  console.log(`[KMC] 2차 enc 성공: ${trCert.substring(0, 20)}...`);

  return trCert;
}

/**
 * rec_cert 복호화 (KMC 인증 결과 수신용)
 * 개발가이드 p.8~9 참조
 *
 * 결과 plainText 규격 (19필드):
 *   1:certNum / 2:date / 3:CI / 4:phoneNo / 5:phoneCorp / 6:birthDay /
 *   7:gender / 8:nation / 9:name / 10:result / 11:certMet / 12:ip /
 *   13:reserve1 / 14:reserve2 / 15:reserve3 / 16:reserve4 /
 *   17:plusInfo / 18:DI / 19:extendVar
 */
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
  // 1차 복호화
  const tmpDec1 = await decrypt(apiRecCert);

  const inf1 = tmpDec1.indexOf('/');
  const inf2 = tmpDec1.indexOf('/', inf1 + 1);

  const tmpDec2 = tmpDec1.substring(0, inf1);
  const tmpMsg1 = tmpDec1.substring(inf1 + 1, inf2);

  // 위변조 검증
  const tmpMsg2 = await hash(tmpDec2);
  if (tmpMsg1 !== tmpMsg2) {
    throw new Error('KMC 위변조 검증 실패 (해시 불일치)');
  }

  // 2차 복호화 → 최종 평문
  const recCert = await decrypt(tmpDec2);
  const arr = recCert.split('/');

  // CI, DI 추가 복호화
  const ci = arr[2] ? await decrypt(arr[2]) : '';
  const di = arr[17] ? await decrypt(arr[17]) : '';

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
