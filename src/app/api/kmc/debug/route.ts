/**
 * KMC 디버그 v2 - Vercel 환경 상세 분석
 * GET /api/kmc/debug
 */

import { NextResponse } from 'next/server';
import { execSync, spawn } from 'child_process';
import { copyFileSync, chmodSync, existsSync, statSync, readFileSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';

const TMP_PATH = '/tmp/KmcCrypto';
const SRC_PATH = path.join(process.cwd(), 'bin', 'KmcCrypto');

function ensureBin() {
  if (!existsSync(TMP_PATH)) {
    copyFileSync(SRC_PATH, TMP_PATH);
    chmodSync(TMP_PATH, 0o755);
  }
}

function sha256(filePath: string): string {
  const buf = readFileSync(filePath);
  return createHash('sha256').update(buf).digest('hex');
}

function shellExec(cmd: string): string {
  try {
    return execSync(cmd, { timeout: 5000, encoding: 'utf-8' }).trim();
  } catch (e: any) {
    return `ERROR: ${e.message?.substring(0, 200)}`;
  }
}

function spawnWithEnv(binPath: string, mode: string, input: string, env?: Record<string, string>): Promise<string> {
  return new Promise((resolve) => {
    const proc = spawn(binPath, [], { env: env || process.env });
    const chunks: Buffer[] = [];

    const timer = setTimeout(() => {
      proc.kill();
      resolve('TIMEOUT');
    }, 5000);

    proc.stdout.on('data', (c: Buffer) => chunks.push(c));
    proc.stderr.on('data', (c: Buffer) => console.error('stderr:', c.toString()));

    proc.on('close', () => {
      clearTimeout(timer);
      resolve(Buffer.concat(chunks).toString('utf-8').trim());
    });

    proc.stdin.write(`${mode}:0^*${input}\n`);
    proc.stdin.end();
  });
}

export async function GET() {
  ensureBin();

  const testInput = 'IVTT1001/003001/20260226120000123456/20260226120000////////0000000000000000';
  const results: Record<string, string> = {};

  // 1. 바이너리 해시 비교
  results['src_sha256'] = sha256(SRC_PATH);
  results['tmp_sha256'] = sha256(TMP_PATH);
  results['expect_sha256'] = 'e6cd3f84d6dc5963011daa275342606729386c0f95d5dceac84d9c83b15c365c';
  results['hash_match'] = results['src_sha256'] === results['expect_sha256'] ? 'YES' : 'NO';

  // 2. 환경 정보
  results['env_LANG'] = process.env.LANG || '(not set)';
  results['env_LC_ALL'] = process.env.LC_ALL || '(not set)';
  results['env_LC_CTYPE'] = process.env.LC_CTYPE || '(not set)';
  results['locale'] = shellExec('locale 2>&1 || echo no_locale');
  results['node_version'] = process.version;
  results['platform'] = process.platform;
  results['arch'] = process.arch;
  results['cwd'] = process.cwd();

  // 3. glibc 버전
  results['ldd'] = shellExec(`ldd ${TMP_PATH} 2>&1`);
  results['glibc'] = shellExec('ldd --version 2>&1 | head -1');

  // 4. enc 테스트 - /tmp 경로
  results['tmp_enc'] = await spawnWithEnv(TMP_PATH, 'enc', testInput);
  results['tmp_msg'] = await spawnWithEnv(TMP_PATH, 'msg', testInput);

  // 5. enc 테스트 - 원본 경로 직접 실행
  try {
    chmodSync(SRC_PATH, 0o755);
    results['src_enc'] = await spawnWithEnv(SRC_PATH, 'enc', testInput);
  } catch (e: any) {
    results['src_enc'] = `CHMOD_ERROR: ${e.message}`;
  }

  // 6. locale 설정 후 테스트
  results['enc_LANG_C'] = await spawnWithEnv(TMP_PATH, 'enc', testInput, 
    { ...process.env, LANG: 'C' } as any);
  results['enc_LANG_UTF8'] = await spawnWithEnv(TMP_PATH, 'enc', testInput, 
    { ...process.env, LANG: 'en_US.UTF-8' } as any);
  results['enc_LANG_EUCKR'] = await spawnWithEnv(TMP_PATH, 'enc', testInput, 
    { ...process.env, LANG: 'ko_KR.euckr' } as any);

  // 7. 최소 환경 테스트 (PATH만)
  results['enc_minimal_env'] = await spawnWithEnv(TMP_PATH, 'enc', testInput, 
    { PATH: '/usr/bin:/bin' });

  // 8. file 명령
  results['file_info'] = shellExec(`file ${TMP_PATH} 2>&1`);

  return NextResponse.json(results, { status: 200 });
}
