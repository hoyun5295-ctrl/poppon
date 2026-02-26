/**
 * KMC 암호화 모듈 래퍼 (Vercel Lambda 호환)
 *
 * KmcCrypto 바이너리는 내부적으로 iconv_open("EUC-KR")을 호출함.
 * Vercel Lambda(Amazon Linux 2)에는 gconv 모듈이 없어서
 * GCONV_PATH 환경변수로 번들된 EUC-KR.so를 가리켜야 함.
 */

import { spawn } from 'child_process';
import { copyFileSync, chmodSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import * as iconv from 'iconv-lite';

const BIN_NAME = 'KmcCrypto';
const TMP_BIN = `/tmp/${BIN_NAME}`;
const TMP_GCONV = '/tmp/gconv';

/** 바이너리 + gconv 모듈을 /tmp에 복사 */
function ensureBinary(): void {
  // 바이너리 복사
  if (!existsSync(TMP_BIN)) {
    const src = path.join(process.cwd(), 'bin', BIN_NAME);
    copyFileSync(src, TMP_BIN);
    chmodSync(TMP_BIN, 0o755);
  }

  // gconv 모듈 복사 (EUC-KR.so + gconv-modules)
  if (!existsSync(TMP_GCONV)) {
    mkdirSync(TMP_GCONV, { recursive: true });
    const gconvSrc = path.join(process.cwd(), 'bin', 'gconv');
    for (const file of ['EUC-KR.so', 'gconv-modules']) {
      const srcFile = path.join(gconvSrc, file);
      const dstFile = path.join(TMP_GCONV, file);
      if (existsSync(srcFile) && !existsSync(dstFile)) {
        copyFileSync(srcFile, dstFile);
      }
    }
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
        GCONV_PATH: TMP_GCONV,  // ← 핵심: EUC-KR 인코딩 모듈 경로
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

/**
 * tr_cert 생성 (KMC 인증 요청용)
 * 개발가이드 p.5 참조
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
    certMet = '',
    plusInfo = '',
    extendVar = '0000000000000000',
  } = params;

  // 1차 암호화 대상 문자열 (개발가이드 형식)
  const plainText = `${cpId}/${urlCode}/${certNum}/${date}/${certMet}///////${plusInfo}/${extendVar}`;

  console.log(`[KMC] plainText length=${plainText.length}`);

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
 * 개발가이드 p.6 참조
 */
export async function decryptRecCert(apiRecCert: string): Promise<{
  certNum: string;
  date: string;
  ci: string;
  phoneNo: string;
  name: string;
  birthday: string;
  gender: string;
  nation: string;
  carrier: string;
  di: string;
  result: string;
}> {
  // 1차 복호화
  const tmpDec1 = await decrypt(apiRecCert);
  const [tmpDec2, tmpMsg1] = tmpDec1.split('/');

  // 위변조 검증
  const tmpMsg2 = await hash(tmpDec2);
  if (tmpMsg1 !== tmpMsg2) {
    throw new Error('KMC 위변조 검증 실패');
  }

  // 2차 복호화
  const recCert = await decrypt(tmpDec2);
  const fields = recCert.split('/');

  // CI/DI 추가 복호화
  const ci = await decrypt(fields[2] || '');
  const di = await decrypt(fields[17] || '');

  return {
    certNum: fields[0] || '',
    date: fields[1] || '',
    ci,
    phoneNo: fields[3] || '',
    name: fields[4] || '',
    birthday: fields[5] || '',
    gender: fields[6] || '',
    nation: fields[7] || '',
    carrier: fields[8] || '',
    di,
    result: fields[16] || '',
  };
}
