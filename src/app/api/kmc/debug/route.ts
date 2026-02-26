/**
 * KMC 디버그 테스트 엔드포인트 (배포 확인 후 삭제)
 * GET /api/kmc/debug
 */

import { NextResponse } from 'next/server';
import { execSync, spawn } from 'child_process';
import { copyFileSync, chmodSync, existsSync, statSync } from 'fs';
import path from 'path';

const TMP_PATH = '/tmp/KmcCrypto';

function ensureBin() {
  if (!existsSync(TMP_PATH)) {
    const src = path.join(process.cwd(), 'bin', 'KmcCrypto');
    copyFileSync(src, TMP_PATH);
    chmodSync(TMP_PATH, 0o755);
  }
}

// shell exec 방식 테스트
function shellTest(mode: string, input: string): string {
  try {
    const cmd = `echo '${mode}:0^*${input}' | ${TMP_PATH}`;
    const result = execSync(cmd, { timeout: 5000, encoding: 'utf-8' });
    return result.trim();
  } catch (e: any) {
    return `SHELL_ERROR: ${e.message}`;
  }
}

// spawn 방식 테스트 (현재 crypto.ts 방식)
function spawnTest(mode: string, input: string): Promise<string> {
  return new Promise((resolve) => {
    const proc = spawn(TMP_PATH);
    const chunks: Buffer[] = [];

    const timer = setTimeout(() => {
      proc.kill();
      resolve('SPAWN_TIMEOUT');
    }, 5000);

    proc.stdout.on('data', (c: Buffer) => chunks.push(c));
    proc.stderr.on('data', (c: Buffer) => console.error('stderr:', c.toString()));

    proc.on('close', () => {
      clearTimeout(timer);
      const raw = Buffer.concat(chunks);
      resolve(`raw_hex=[${raw.slice(0, 40).toString('hex')}] raw_utf8=[${raw.toString('utf-8').trim()}]`);
    });

    proc.on('error', (e) => {
      clearTimeout(timer);
      resolve(`SPAWN_ERROR: ${e.message}`);
    });

    const cmd = `${mode}:0^*${input}\n`;
    proc.stdin.write(cmd);
    proc.stdin.end();
  });
}

// spawn 방식 - end() 없이 테스트
function spawnTestNoEnd(mode: string, input: string): Promise<string> {
  return new Promise((resolve) => {
    const proc = spawn(TMP_PATH);
    const chunks: Buffer[] = [];

    const timer = setTimeout(() => {
      proc.kill();
      const raw = Buffer.concat(chunks);
      resolve(`NOEND_TIMEOUT raw=[${raw.toString('utf-8').trim()}]`);
    }, 3000);

    proc.stdout.on('data', (c: Buffer) => chunks.push(c));

    proc.on('close', () => {
      clearTimeout(timer);
      const raw = Buffer.concat(chunks);
      resolve(`NOEND_CLOSE raw=[${raw.toString('utf-8').trim()}]`);
    });

    const cmd = `${mode}:0^*${input}\n`;
    proc.stdin.write(cmd);
    // 의도적으로 end() 호출 안 함
  });
}

// spawn - Buffer로 write
function spawnTestBuffer(mode: string, input: string): Promise<string> {
  return new Promise((resolve) => {
    const proc = spawn(TMP_PATH);
    const chunks: Buffer[] = [];

    const timer = setTimeout(() => {
      proc.kill();
      resolve('BUF_TIMEOUT');
    }, 5000);

    proc.stdout.on('data', (c: Buffer) => chunks.push(c));

    proc.on('close', () => {
      clearTimeout(timer);
      const raw = Buffer.concat(chunks);
      resolve(`BUF raw=[${raw.toString('utf-8').trim()}]`);
    });

    const cmd = Buffer.from(`${mode}:0^*${input}\n`, 'utf-8');
    proc.stdin.write(cmd);
    proc.stdin.end();
  });
}

export async function GET() {
  ensureBin();

  const size = statSync(TMP_PATH).size;
  const testInput = 'IVTT1001/003001/20260226120000123456/20260226120000/////////0000000000000000';

  const results: Record<string, string> = {
    binary_size: String(size),
    input_length: String(testInput.length),
    input_preview: testInput.substring(0, 50) + '...',
  };

  // 1. shell exec
  results['shell_enc'] = shellTest('enc', testInput);
  results['shell_msg'] = shellTest('msg', 'test');

  // 2. spawn + end()
  results['spawn_enc'] = await spawnTest('enc', testInput);
  results['spawn_msg'] = await spawnTest('msg', 'test');

  // 3. spawn - no end()
  results['spawn_noend_enc'] = await spawnTestNoEnd('enc', testInput);

  // 4. spawn with Buffer
  results['spawn_buf_enc'] = await spawnTestBuffer('enc', testInput);

  return NextResponse.json(results, { status: 200 });
}
