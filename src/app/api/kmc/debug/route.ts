/**
 * KMC 디버그 v3 - cwd + stderr + exit code 집중 분석
 * GET /api/kmc/debug
 */

import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { copyFileSync, chmodSync, existsSync, statSync, readdirSync } from 'fs';
import path from 'path';

const TMP_PATH = '/tmp/KmcCrypto';
const SRC_DIR = path.join(process.cwd(), 'bin');
const SRC_PATH = path.join(SRC_DIR, 'KmcCrypto');

function ensureBin() {
  if (!existsSync(TMP_PATH)) {
    copyFileSync(SRC_PATH, TMP_PATH);
    chmodSync(TMP_PATH, 0o755);
  }
}

function runBinary(
  binPath: string,
  mode: string,
  input: string,
  cwd?: string
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const opts: { cwd?: string } = {};
    if (cwd) opts.cwd = cwd;

    const proc = spawn(binPath, [], opts);
    const outChunks: Buffer[] = [];
    const errChunks: Buffer[] = [];

    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      resolve({
        code: -999,
        stdout: Buffer.concat(outChunks).toString('utf-8').trim(),
        stderr: 'TIMEOUT (5s)',
      });
    }, 5000);

    proc.stdout.on('data', (c: Buffer) => outChunks.push(c));
    proc.stderr.on('data', (c: Buffer) => errChunks.push(c));

    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        code,
        stdout: Buffer.concat(outChunks).toString('utf-8').trim(),
        stderr: Buffer.concat(errChunks).toString('utf-8').trim(),
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
  ensureBin();

  const testInput =
    'IVTT1001/003001/20260226120000123456/20260226120000////////0000000000000000';

  const results: Record<string, unknown> = {};

  // 1. 바이너리 정보
  results['binary_size'] = statSync(TMP_PATH).size;
  results['src_dir'] = SRC_DIR;
  results['src_dir_files'] = (() => {
    try { return readdirSync(SRC_DIR); } catch { return 'READ_ERROR'; }
  })();
  results['tmp_dir_files'] = (() => {
    try { return readdirSync('/tmp').filter(f => f.includes('Kmc') || f.includes('kmc')); } catch { return 'READ_ERROR'; }
  })();

  // 2. cwd 없이 (현재 방식)
  results['no_cwd'] = await runBinary(TMP_PATH, 'enc', testInput);

  // 3. cwd = /tmp (바이너리 위치)
  results['cwd_tmp'] = await runBinary(TMP_PATH, 'enc', testInput, '/tmp');

  // 4. cwd = bin 폴더 (원본 위치)
  results['cwd_bin'] = await runBinary(TMP_PATH, 'enc', testInput, SRC_DIR);

  // 5. 원본 경로에서 직접 실행 + cwd = bin
  try {
    chmodSync(SRC_PATH, 0o755);
    results['src_cwd_bin'] = await runBinary(SRC_PATH, 'enc', testInput, SRC_DIR);
  } catch (e: unknown) {
    results['src_cwd_bin'] = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 6. msg 테스트 (비교용 - 이건 항상 성공)
  results['msg_test'] = await runBinary(TMP_PATH, 'msg', testInput);

  // 7. stdin hex dump 확인
  const cmd = `enc:0^*${testInput}\n`;
  results['stdin_hex_first20'] = Buffer.from(cmd, 'utf-8')
    .slice(0, 40)
    .toString('hex');
  results['stdin_hex_last10'] = Buffer.from(cmd, 'utf-8')
    .slice(-20)
    .toString('hex');
  results['stdin_length'] = cmd.length;

  // 8. 환경 정보
  results['platform'] = process.platform;
  results['arch'] = process.arch;
  results['node'] = process.version;
  results['cwd'] = process.cwd();

  return NextResponse.json(results, { status: 200 });
}
