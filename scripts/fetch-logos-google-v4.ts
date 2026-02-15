/**
 * POPPON 머천트 로고 수집 v4 — 품질 기반 스마트 교체
 * ──────────────────────────────────────────────────────
 * 1단계: 전체 머천트 logo_url을 HEAD 요청으로 품질 체크
 *   - 404/timeout → 교체 대상
 *   - 이미지 5KB 미만 → 교체 대상 (파비콘급)
 *   - SVG 또는 5KB+ → 스킵 (고품질)
 * 2단계: 교체 대상만 구글 이미지 검색으로 새 로고 수집
 * 3단계: 기존 URL 백업 → 롤백 가능
 *
 * 사용법:
 *   npx ts-node scripts/fetch-logos-google-v4.ts              # 실행
 *   npx ts-node scripts/fetch-logos-google-v4.ts --dry-run    # 미리보기
 *   npx ts-node scripts/fetch-logos-google-v4.ts --limit 10   # 10개만
 *   npx ts-node scripts/fetch-logos-google-v4.ts --check-only # 품질 체크만 (검색 안 함)
 *   npx ts-node scripts/fetch-logos-google-v4.ts --rollback   # 백업에서 복원
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ROLLBACK = args.includes('--rollback');
const CHECK_ONLY = args.includes('--check-only');
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 0;

// 품질 기준
const MIN_GOOD_SIZE = 5000;  // 5KB 이상이면 고품질로 간주

// 파일 경로
const BACKUP_DIR = path.resolve(process.cwd(), 'debug-ai-crawl');
const BACKUP_FILE = path.join(BACKUP_DIR, 'logo-backup.csv');
const RESULT_FILE = path.join(BACKUP_DIR, 'logo-results.csv');
const CHECK_FILE = path.join(BACKUP_DIR, 'logo-quality-check.csv');

// ──────────────────────────────────────────
// 롤백 모드
// ──────────────────────────────────────────
async function rollback() {
  if (!fs.existsSync(BACKUP_FILE)) {
    console.error('❌ 백업 파일 없음:', BACKUP_FILE);
    return;
  }

  const csv = fs.readFileSync(BACKUP_FILE, 'utf-8');
  const lines = csv.trim().split('\n').slice(1);

  console.log(`🔄 롤백 시작 — ${lines.length}개 머천트 복원`);

  let restored = 0;
  let failed = 0;

  for (const line of lines) {
    const parts = line.split(',');
    const id = parts[0];
    const name = parts[1];
    const oldUrl = parts.slice(2).join(',').replace(/^"|"$/g, '');

    const { error } = await supabase
      .from('merchants')
      .update({ logo_url: oldUrl || null })
      .eq('id', id);

    if (error) {
      console.log(`  ❌ ${name}: ${error.message}`);
      failed++;
    } else {
      restored++;
    }
  }

  console.log(`✅ 복원 완료: ${restored}개 성공, ${failed}개 실패`);
}

// ──────────────────────────────────────────
// 이미지 URL 품질 체크 (HEAD → 필요시 GET)
// ──────────────────────────────────────────
async function checkImageQuality(url: string): Promise<{
  status: 'good' | 'low_quality' | 'broken';
  size: number;
  type: string;
  reason: string;
}> {
  if (!url) {
    return { status: 'broken', size: 0, type: '', reason: 'empty_url' };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { status: 'broken', size: 0, type: '', reason: `http_${res.status}` };
    }

    const contentType = res.headers.get('content-type') || '';
    const size = parseInt(res.headers.get('content-length') || '0', 10);
    const isImage = contentType.includes('image');

    if (!isImage) {
      return { status: 'broken', size, type: contentType, reason: 'not_image' };
    }

    // SVG는 항상 고품질
    if (contentType.includes('svg') || url.endsWith('.svg')) {
      return { status: 'good', size, type: contentType, reason: 'svg' };
    }

    // content-length 0이면 GET으로 실제 크기 확인
    if (size === 0) {
      try {
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 8000);
        const getRes = await fetch(url, {
          signal: controller2.signal,
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        clearTimeout(timeout2);
        const blob = await getRes.blob();
        const actualSize = blob.size;

        if (actualSize < MIN_GOOD_SIZE) {
          return { status: 'low_quality', size: actualSize, type: contentType, reason: `small_${actualSize}b` };
        }
        return { status: 'good', size: actualSize, type: contentType, reason: 'get_verified' };
      } catch {
        return { status: 'good', size: 0, type: contentType, reason: 'size_unknown_kept' };
      }
    }

    if (size < MIN_GOOD_SIZE) {
      return { status: 'low_quality', size, type: contentType, reason: `small_${size}b` };
    }

    return { status: 'good', size, type: contentType, reason: `ok_${size}b` };
  } catch (err: any) {
    const msg = err.message || '';
    if (msg.includes('abort')) {
      return { status: 'broken', size: 0, type: '', reason: 'timeout' };
    }
    return { status: 'broken', size: 0, type: '', reason: `error: ${msg.slice(0, 40)}` };
  }
}

// ──────────────────────────────────────────
// 이미지 URL 검증 (구글 검색 결과용)
// ──────────────────────────────────────────
async function validateImageUrl(url: string): Promise<{ valid: boolean; size: number; type: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!res.ok) return { valid: false, size: 0, type: '' };

    const contentType = res.headers.get('content-type') || '';
    const size = parseInt(res.headers.get('content-length') || '0', 10);
    const isImage = contentType.includes('image');

    return { valid: isImage, size, type: contentType };
  } catch {
    return { valid: false, size: 0, type: '' };
  }
}

// ──────────────────────────────────────────
// 구글 이미지 검색
// ──────────────────────────────────────────
async function searchGoogleImage(
  page: Page,
  brandName: string
): Promise<{ logoUrl: string | null; source: string }> {
  try {
    const query = encodeURIComponent(`${brandName} CI`);
    const searchUrl = `https://www.google.com/search?q=${query}&tbm=isch&hl=ko`;

    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2000));

    const candidates = await extractImageUrls(page);
    const result = await findBestLogo(candidates);
    if (result) return result;

    const query2 = encodeURIComponent(`${brandName} 로고 공식`);
    const searchUrl2 = `https://www.google.com/search?q=${query2}&tbm=isch&hl=ko`;

    await page.goto(searchUrl2, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2000));

    const candidates2 = await extractImageUrls(page);
    const result2 = await findBestLogo(candidates2, 'retry');
    if (result2) return result2;

    return { logoUrl: null, source: 'not-found' };
  } catch (err: any) {
    return { logoUrl: null, source: `error: ${err.message?.slice(0, 60)}` };
  }
}

// ──────────────────────────────────────────
// 페이지에서 이미지 URL 후보 추출
// ──────────────────────────────────────────
async function extractImageUrls(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const urls: string[] = [];

    document.querySelectorAll('a').forEach((a) => {
      const href = a.getAttribute('href') || '';
      const match = href.match(/imgurl=([^&]+)/);
      if (match) {
        try { urls.push(decodeURIComponent(match[1])); } catch { /* skip */ }
      }
    });

    document.querySelectorAll('script').forEach((script) => {
      const text = script.textContent || '';
      const regex = /\["(https?:\/\/[^"]+\.(?:png|jpg|jpeg|svg|webp))"(?:,\d+,\d+)?/gi;
      let m;
      while ((m = regex.exec(text)) !== null) {
        const url = m[1];
        if (url.includes('google.com') || url.includes('gstatic.com') || url.includes('googleapis.com') || url.includes('youtube.com')) continue;
        urls.push(url);
      }
    });

    document.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('data-src') || img.getAttribute('src') || '';
      if (!src.startsWith('http')) return;
      if (src.includes('gstatic.com') || src.includes('google.com/images')) return;
      if (src.startsWith('data:')) return;
      const w = img.naturalWidth || parseInt(img.getAttribute('width') || '0');
      if (w > 0 && w < 30) return;
      urls.push(src);
    });

    return [...new Set(urls)];
  });
}

// ──────────────────────────────────────────
// 후보 중 최적 로고 선택
// ──────────────────────────────────────────
async function findBestLogo(
  candidates: string[],
  prefix = ''
): Promise<{ logoUrl: string; source: string } | null> {
  const tag = prefix ? `google-${prefix}` : 'google';

  for (const url of candidates.slice(0, 15)) {
    const { valid, size, type } = await validateImageUrl(url);
    if (!valid) continue;

    if (type.includes('svg') || url.endsWith('.svg')) {
      return { logoUrl: url, source: `${tag}-svg` };
    }

    if ((url.endsWith('.png') || type.includes('png')) && size > 2000) {
      return { logoUrl: url, source: `${tag}-png` };
    }

    if (size > 5000) {
      return { logoUrl: url, source: `${tag}-img` };
    }
  }

  return null;
}

// ──────────────────────────────────────────
// 메인
// ──────────────────────────────────────────
async function main() {
  if (ROLLBACK) {
    await rollback();
    return;
  }

  console.log('');
  console.log('🔍 POPPON 로고 수집 v4 — 품질 기반 스마트 교체');
  console.log('═'.repeat(70));
  console.log(`   모드: ${CHECK_ONLY ? '📋 품질 체크만' : DRY_RUN ? '🔍 미리보기' : '💾 실제 적용'}`);
  if (LIMIT) console.log(`   제한: ${LIMIT}개`);
  console.log('');

  // 전체 머천트 조회
  const { data: allMerchants, error } = await supabase
    .from('merchants')
    .select('id, name, slug, logo_url, official_url')
    .order('name');

  if (error || !allMerchants) {
    console.error('❌ 머천트 조회 실패:', error);
    return;
  }

  console.log(`📋 전체 머천트: ${allMerchants.length}개`);
  console.log('');

  // ════════════════════════════════════════
  // 1단계: 전체 품질 체크
  // ════════════════════════════════════════
  console.log('🔎 1단계: 로고 품질 체크...');
  console.log('─'.repeat(70));

  type QualityResult = {
    id: string;
    name: string;
    logo_url: string | null;
    status: 'good' | 'low_quality' | 'broken' | 'no_url';
    size: number;
    reason: string;
  };

  const qualityResults: QualityResult[] = [];

  for (let i = 0; i < allMerchants.length; i++) {
    const m = allMerchants[i];
    const progress = `[${i + 1}/${allMerchants.length}]`;

    if (!m.logo_url) {
      qualityResults.push({ id: m.id, name: m.name, logo_url: null, status: 'no_url', size: 0, reason: 'no_url' });
      console.log(`${progress} ⬜ ${m.name.padEnd(20)} 로고 없음`);
      continue;
    }

    const check = await checkImageQuality(m.logo_url);
    qualityResults.push({
      id: m.id, name: m.name, logo_url: m.logo_url,
      status: check.status === 'good' ? 'good' : check.status,
      size: check.size, reason: check.reason,
    });

    const icon = check.status === 'good' ? '✅' : check.status === 'low_quality' ? '🟡' : '❌';
    const sizeStr = check.size > 0 ? `(${(check.size / 1024).toFixed(1)}KB)` : '';
    console.log(`${progress} ${icon} ${m.name.padEnd(20)} ${check.reason} ${sizeStr}`);
  }

  // 결과 CSV 저장
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const checkLines = ['id,name,status,size_bytes,reason,logo_url'];
  qualityResults.forEach((r) => {
    checkLines.push(`${r.id},${r.name},${r.status},${r.size},${r.reason},"${r.logo_url || ''}"`);
  });
  fs.writeFileSync(CHECK_FILE, checkLines.join('\n'), 'utf-8');

  // 통계
  const stats = { good: 0, low_quality: 0, broken: 0, no_url: 0 };
  qualityResults.forEach((r) => { stats[r.status]++; });

  console.log('');
  console.log('📊 품질 체크 결과:');
  console.log(`   ✅ 고품질 (유지):    ${stats.good}개`);
  console.log(`   🟡 저품질 (<5KB):    ${stats.low_quality}개`);
  console.log(`   ❌ 깨짐 (404/에러):  ${stats.broken}개`);
  console.log(`   ⬜ URL 없음:         ${stats.no_url}개`);
  console.log(`   → 교체 대상: ${stats.low_quality + stats.broken + stats.no_url}개`);
  console.log(`📁 상세: ${CHECK_FILE}`);

  if (CHECK_ONLY) {
    console.log('');
    console.log('📋 품질 체크만 수행 완료.');
    return;
  }

  // ════════════════════════════════════════
  // 2단계: 교체 대상 → 구글 검색
  // ════════════════════════════════════════
  const targets = qualityResults.filter(
    (r) => r.status === 'low_quality' || r.status === 'broken' || r.status === 'no_url'
  );

  if (targets.length === 0) {
    console.log('');
    console.log('🎉 교체 대상 없음! 모든 로고가 고품질입니다.');
    return;
  }

  let searchTargets = targets;
  if (LIMIT) searchTargets = searchTargets.slice(0, LIMIT);

  console.log('');
  console.log(`🔍 2단계: 구글 이미지 검색 (${searchTargets.length}개)`);
  console.log('─'.repeat(70));

  // 백업
  const backupLines = ['id,name,old_logo_url'];
  searchTargets.forEach((t) => {
    backupLines.push(`${t.id},${t.name},"${t.logo_url || ''}"`);
  });
  fs.writeFileSync(BACKUP_FILE, backupLines.join('\n'), 'utf-8');
  console.log(`💾 백업: ${BACKUP_FILE}`);
  console.log('');

  // Puppeteer
  const browser: Browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
      '--disable-gpu', '--window-size=1440,900', '--lang=ko-KR',
    ],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8' });

  const results = { replaced: 0, notFound: 0, dbError: 0, sources: {} as Record<string, number> };
  const resultLines = ['id,name,old_status,action,old_logo_url,new_logo_url,source'];

  for (let i = 0; i < searchTargets.length; i++) {
    const t = searchTargets[i];
    const icon = t.status === 'no_url' ? '⬜' : t.status === 'broken' ? '❌' : '🟡';
    const progress = `[${i + 1}/${searchTargets.length}]`;

    process.stdout.write(`${progress} ${icon} ${t.name.padEnd(20)} `);

    const { logoUrl, source } = await searchGoogleImage(page, t.name);
    results.sources[source] = (results.sources[source] || 0) + 1;

    if (logoUrl) {
      console.log(`✅ ${source}`);

      if (!DRY_RUN) {
        const { error: updateErr } = await supabase
          .from('merchants')
          .update({ logo_url: logoUrl })
          .eq('id', t.id);

        if (updateErr) {
          console.log(`   ⚠️ DB 실패: ${updateErr.message}`);
          results.dbError++;
          resultLines.push(`${t.id},${t.name},${t.status},db_error,"${t.logo_url || ''}","${logoUrl}",${source}`);
        } else {
          results.replaced++;
          resultLines.push(`${t.id},${t.name},${t.status},replaced,"${t.logo_url || ''}","${logoUrl}",${source}`);
        }
      } else {
        results.replaced++;
        resultLines.push(`${t.id},${t.name},${t.status},would_replace,"${t.logo_url || ''}","${logoUrl}",${source}`);
      }
    } else {
      console.log(`❌ ${source}`);
      results.notFound++;
      resultLines.push(`${t.id},${t.name},${t.status},not_found,"${t.logo_url || ''}","",${source}`);
    }

    const delay = 2000 + Math.random() * 2000;
    await new Promise((r) => setTimeout(r, delay));
  }

  await browser.close();

  fs.writeFileSync(RESULT_FILE, resultLines.join('\n'), 'utf-8');

  console.log('');
  console.log('═'.repeat(70));
  console.log('📊 최종 결과');
  console.log('─'.repeat(70));
  console.log(`   ✅ 교체: ${results.replaced}개`);
  console.log(`   ❌ 못찾음: ${results.notFound}개`);
  console.log(`   ⚠️ 에러: ${results.dbError}개`);
  console.log('');
  console.log('📋 출처별:');
  Object.entries(results.sources)
    .sort((a, b) => b[1] - a[1])
    .forEach(([src, count]) => console.log(`   ${src}: ${count}개`));
  console.log('');
  console.log(`📁 결과: ${RESULT_FILE}`);
  console.log(`📁 백업: ${BACKUP_FILE}`);

  if (DRY_RUN) {
    console.log('');
    console.log('🔍 미리보기 — 실제 적용: npx ts-node scripts/fetch-logos-google-v4.ts');
  } else {
    console.log('');
    console.log('🔄 롤백: npx ts-node scripts/fetch-logos-google-v4.ts --rollback');
  }
}

main().catch(console.error);
