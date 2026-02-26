/**
 * KMC 디버그 엔드포인트
 * GET /api/kmc/debug
 *
 * iconv_shim.so LD_PRELOAD 방식으로 enc/msg/full_flow 한번에 테스트
 */

import { NextResponse } from 'next/server';
import { existsSync, statSync } from 'fs';
import path from 'path';
import { encrypt, hash, encryptTrCert, generateCertNum } from '@/lib/kmc/crypto';

export async function GET() {
  const binDir = path.join(process.cwd(), 'bin');
  const results: Record<string, unknown> = {};

  // 1. 파일 존재 확인
  const binaryPath = path.join(binDir, 'KmcCrypto');
  const shimPath = path.join(binDir, 'iconv_shim.so');

  results.binary_exists = existsSync(binaryPath);
  results.binary_size = results.binary_exists ? statSync(binaryPath).size : 0;
  results.shim_exists = existsSync(shimPath);
  results.shim_size = results.shim_exists ? statSync(shimPath).size : 0;

  // /tmp 복사 상태
  results.tmp_binary = existsSync('/tmp/KmcCrypto');
  results.tmp_shim = existsSync('/tmp/iconv_shim.so');

  // 2. enc 테스트 (이게 ENCODING_ERROR 나던 것)
  try {
    const encResult = await encrypt('test_data_20260226');
    results.enc_test = { success: true, result: encResult.substring(0, 30) + '...' };
  } catch (e: unknown) {
    results.enc_test = { success: false, error: e instanceof Error ? e.message : String(e) };
  }

  // 3. msg 테스트 (해시, 원래 잘 됨)
  try {
    const msgResult = await hash('test_hash_input');
    results.msg_test = { success: true, result: msgResult.substring(0, 30) + '...' };
  } catch (e: unknown) {
    results.msg_test = { success: false, error: e instanceof Error ? e.message : String(e) };
  }

  // 4. 실제 tr_cert 생성 풀 플로우 (enc 2회 + msg 1회)
  try {
    const { certNum, date } = generateCertNum();
    const trCert = await encryptTrCert({
      cpId: 'IVTT1001',
      urlCode: '003001',
      certNum,
      date,
    });
    results.full_flow = {
      success: true,
      certNum,
      trCert_length: trCert.length,
      trCert_preview: trCert.substring(0, 30) + '...',
    };
  } catch (e: unknown) {
    results.full_flow = { success: false, error: e instanceof Error ? e.message : String(e) };
  }

  // 5. 종합 판정
  const allPass = (results.enc_test as { success: boolean })?.success &&
                  (results.msg_test as { success: boolean })?.success &&
                  (results.full_flow as { success: boolean })?.success;

  results.verdict = allPass ? '✅ KMC 암호화 모듈 정상 작동' : '❌ 일부 테스트 실패';

  return NextResponse.json(results);
}
