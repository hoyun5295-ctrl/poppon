/**
 * KMC 디버그 v4 - GCONV_PATH 수정 검증
 * GET /api/kmc/debug
 */

import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { copyFileSync, chmodSync, existsSync, statSync, mkdirSync, readdirSync } from 'fs';
import path from 'path';

const TMP_BIN = '/tmp/KmcCrypto';
const TMP_GCONV = '/tmp/gconv';

function ensureFiles() {
  // 바이너리
  if (!existsSync(TMP_BIN)) {
    const src = path.join(process.cwd(), 'bin', 'KmcCrypto');
    copyFileSync(src, TMP_BIN);
    chmodSync(TMP_BIN, 0o755);
  }

  // gconv 모듈
  if (!existsSync(TMP_GCONV)) {
    mkdirSync(TMP_GCONV, { recursive: true });
    const gconvSrc = path.join(process.cwd(), 'bin', 'gconv');
    for (const file of ['EUC-KR.so', 'gconv-modules']) {
      const s = path.join(gconvSrc, file);
      const d = path.join(TMP_GCONV, file);
      if (existsSync(s)) copyFileSync(s, d);
    }
  }
}

function runBinary(
  mode: string,
  input: string,
  env?: Record<string, string>
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn(TMP_BIN, [], {
      env: { ...process.env, ...env },
    });

    const out: Buffer[] = [];
    const err: Buffer[] = [];

    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      resolve({ code: -999, stdout: Buffer.concat(out).toString('utf-8').trim(), stderr: 'TIMEOUT' });
    }, 5000);

    proc.stdout.on('data', (c: Buffer) => out.push(c));
    proc.stderr.on('data', (c: Buffer) => err.push(c));

    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        code,
        stdout: Buffer.concat(out).toString('utf-8').trim(),
        stderr: Buffer.concat(err).toString('utf-8').trim(),
      });
    });

    proc.on('error', (e) => {
      clearTimeout(timer);
      resolve({ code: -1, stdout: '', stderr: `SPAWN_ERROR: ${e.message}` });
    });

    proc.stdin.end(`${mode}:0^*${input}\n`);
  });
}

export async function GET() {
  ensureFiles();

  const testInput = 'IVTT1001/003001/20260226120000123456/20260226120000////////0000000000000000';
  const results: Record<string, unknown> = {};

  // 1. 파일 확인
  results['binary_size'] = statSync(TMP_BIN).size;
  results['gconv_files'] = (() => {
    try { return readdirSync(TMP_GCONV); } catch { return 'MISSING'; }
  })();
  results['gconv_euckr_size'] = (() => {
    try { return statSync(path.join(TMP_GCONV, 'EUC-KR.so')).size; } catch { return 'MISSING'; }
  })();

  // 2. GCONV_PATH 없이 (현재 실패하는 방식)
  results['enc_without_gconv'] = await runBinary('enc', testInput);

  // 3. GCONV_PATH=/tmp/gconv 설정 (수정된 방식)
  results['enc_with_gconv'] = await runBinary('enc', testInput, { GCONV_PATH: TMP_GCONV });

  // 4. msg 테스트 (비교용)
  results['msg_test'] = await runBinary('msg', testInput, { GCONV_PATH: TMP_GCONV });

  // 5. 전체 tr_cert 플로우 테스트
  try {
    const enc1 = await runBinary('enc', testInput, { GCONV_PATH: TMP_GCONV });
    const enc1Result = enc1.stdout.split(':').slice(1).join(':');

    if (enc1Result && !enc1Result.includes('ERROR')) {
      const msgResult = await runBinary('msg', enc1Result, { GCONV_PATH: TMP_GCONV });
      const msgHash = msgResult.stdout.split(':').slice(1).join(':');

      const enc2Input = `${enc1Result}/${msgHash}/0000000000000000`;
      const enc2 = await runBinary('enc', enc2Input, { GCONV_PATH: TMP_GCONV });
      const trCert = enc2.stdout.split(':').slice(1).join(':');

      results['full_flow'] = {
        enc1: enc1Result.substring(0, 30) + '...',
        msg: msgHash.substring(0, 30) + '...',
        trCert: trCert.substring(0, 30) + '...',
        success: trCert.startsWith('KMC'),
      };
    } else {
      results['full_flow'] = { error: enc1Result };
    }
  } catch (e: unknown) {
    results['full_flow'] = { error: e instanceof Error ? e.message : String(e) };
  }

  return NextResponse.json(results, { status: 200 });
}
