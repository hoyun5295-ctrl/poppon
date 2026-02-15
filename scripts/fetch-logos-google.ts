/**
 * POPPON 머천트 로고 수집 — 구글 이미지 검색 fallback
 * ────────────────────────────────────────────────────
 * v3.1에서 못 찾은 머천트 대상으로 구글 이미지 검색
 * "[브랜드명] CI" → 첫 번째 고품질 이미지 가져오기
 *
 * 사용법:
 *   npx ts-node scripts/fetch-logos-google.ts              # 실행
 *   npx ts-node scripts/fetch-logos-google.ts --dry-run    # 미리보기
 *   npx ts-node scripts/fetch-logos-google.ts --limit 5    # 5개만
 *   npx ts-node scripts/fetch-logos-google.ts --all        # 고품질 포함 전체
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ALL_MODE = args.includes('--all');
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 0;

// ──────────────────────────────────────────
// 이미지 URL 검증
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
// 구글 이미지 검색 → 원본 이미지 URL 추출
// ──────────────────────────────────────────
async function searchGoogleImage(
  page: Page,
  brandName: string
): Promise<{ logoUrl: string | null; source: string }> {
  try {
    // 검색어: "[브랜드명] CI" (CI = Corporate Identity = 공식 로고)
    const query = encodeURIComponent(`${brandName} CI`);
    const searchUrl = `https://www.google.com/search?q=${query}&tbm=isch&hl=ko`;

    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2000));

    // 구글 이미지 검색 결과에서 이미지 데이터 추출
    // 구글은 이미지 URL을 여러 방식으로 인코딩함
    const imageData = await page.evaluate(() => {
      const results: Array<{ src: string; width: number; height: number; alt: string }> = [];

      // 방법 1: 썸네일 img 태그에서 data-src 또는 src 추출
      const imgs = document.querySelectorAll('img');
      imgs.forEach((img) => {
        const src = img.getAttribute('data-src') || img.getAttribute('src') || '';
        const alt = img.getAttribute('alt') || '';
        const width = img.naturalWidth || parseInt(img.getAttribute('width') || '0');
        const height = img.naturalHeight || parseInt(img.getAttribute('height') || '0');

        // 구글 UI 이미지 제외 (로고, 아이콘 등)
        if (src.includes('gstatic.com/images')) return;
        if (src.includes('google.com/images')) return;
        if (src.includes('googleapis.com/customsearch')) return;
        if (src.startsWith('data:image/svg')) return;
        if (src.startsWith('data:image/gif')) return; // 1px 트래킹 픽셀

        // 너무 작은 이미지 제외
        if (width > 0 && width < 30) return;
        if (height > 0 && height < 30) return;

        if (src && src.startsWith('http')) {
          results.push({ src, width, height, alt });
        }
      });

      return results.slice(0, 10);
    });

    // 방법 2: 페이지 소스에서 원본 이미지 URL 추출
    // 구글 이미지 검색은 원본 URL을 스크립트 내에 인코딩해서 저장
    const originalUrls = await page.evaluate(() => {
      const urls: string[] = [];
      // 페이지 내 모든 a 태그에서 imgurl= 파라미터 추출
      document.querySelectorAll('a').forEach((a) => {
        const href = a.getAttribute('href') || '';
        const match = href.match(/imgurl=([^&]+)/);
        if (match) {
          try {
            urls.push(decodeURIComponent(match[1]));
          } catch { /* skip */ }
        }
      });

      // AF_initDataCallback 내 JSON에서 이미지 URL 추출
      const scripts = document.querySelectorAll('script');
      scripts.forEach((script) => {
        const text = script.textContent || '';
        // 원본 이미지 URL 패턴: ["https://example.com/logo.png",width,height]
        const regex = /\["(https?:\/\/[^"]+\.(?:png|jpg|jpeg|svg|webp))"(?:,\d+,\d+)?/gi;
        let m;
        while ((m = regex.exec(text)) !== null) {
          const url = m[1];
          // 구글 자체 도메인 제외
          if (url.includes('google.com')) continue;
          if (url.includes('gstatic.com')) continue;
          if (url.includes('googleapis.com')) continue;
          if (url.includes('youtube.com')) continue;
          urls.push(url);
        }
      });

      return [...new Set(urls)]; // 중복 제거
    });

    // 원본 URL 우선, 없으면 썸네일
    const candidates = [...originalUrls, ...imageData.map((d) => d.src)];

    // 로고에 적합한 이미지 필터링
    for (const url of candidates.slice(0, 15)) {
      // 위키백과, 나무위키, 공식 사이트 출처 우선
      const isPriority =
        url.includes('wikipedia') ||
        url.includes('wikimedia') ||
        url.includes('namu.wiki') ||
        url.includes('play.google.com') ||
        url.includes('facebook.com') ||
        url.includes('instagram.com');

      const { valid, size, type } = await validateImageUrl(url);
      if (!valid) continue;

      // SVG는 무조건 최고
      if (type.includes('svg') || url.endsWith('.svg')) {
        return { logoUrl: url, source: 'google-svg' };
      }

      // PNG 우선 (투명 배경 가능성)
      if (url.endsWith('.png') || type.includes('png')) {
        if (size > 2000) { // 2KB 이상
          return { logoUrl: url, source: isPriority ? 'google-priority-png' : 'google-png' };
        }
      }

      // JPG도 5KB 이상이면 수용
      if (size > 5000) {
        return { logoUrl: url, source: isPriority ? 'google-priority' : 'google-img' };
      }
    }

    // 아무것도 못 찾으면 "로고" 키워드로 재검색
    const query2 = encodeURIComponent(`${brandName} 로고 공식`);
    const searchUrl2 = `https://www.google.com/search?q=${query2}&tbm=isch&hl=ko`;

    await page.goto(searchUrl2, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2000));

    const retryUrls = await page.evaluate(() => {
      const urls: string[] = [];
      const scripts = document.querySelectorAll('script');
      scripts.forEach((script) => {
        const text = script.textContent || '';
        const regex = /\["(https?:\/\/[^"]+\.(?:png|jpg|jpeg|svg|webp))"(?:,\d+,\d+)?/gi;
        let m;
        while ((m = regex.exec(text)) !== null) {
          const url = m[1];
          if (url.includes('google.com') || url.includes('gstatic.com')) continue;
          urls.push(url);
        }
      });
      return [...new Set(urls)];
    });

    for (const url of retryUrls.slice(0, 10)) {
      const { valid, size, type } = await validateImageUrl(url);
      if (!valid) continue;
      if (type.includes('svg') || url.endsWith('.svg')) {
        return { logoUrl: url, source: 'google-retry-svg' };
      }
      if (size > 3000) {
        return { logoUrl: url, source: 'google-retry' };
      }
    }

    return { logoUrl: null, source: 'not-found' };
  } catch (err: any) {
    return { logoUrl: null, source: `error: ${err.message?.slice(0, 60)}` };
  }
}

// ──────────────────────────────────────────
// 메인
// ──────────────────────────────────────────
async function main() {
  console.log('🔍 POPPON 로고 수집 — 구글 이미지 검색');
  console.log(`   모드: ${DRY_RUN ? '🔍 미리보기' : '💾 실제 적용'}`);
  if (ALL_MODE) console.log('   대상: 전체');
  if (LIMIT) console.log(`   제한: ${LIMIT}개`);
  console.log('');

  // 대상: Google Favicon이거나 logo_url이 NULL인 머천트
  let query = supabase
    .from('merchants')
    .select('id, name, slug, logo_url, official_url')
    .order('name');

  if (!ALL_MODE) {
    query = query.or('logo_url.is.null,logo_url.like.%google.com/s2/favicons%');
  }

  const { data: merchants, error } = await query;
  if (error || !merchants) {
    console.error('❌ 머천트 조회 실패:', error);
    return;
  }

  let targets = merchants;
  if (LIMIT) targets = targets.slice(0, LIMIT);

  console.log(`📋 대상: ${targets.length}개 머천트`);
  console.log('─'.repeat(80));

  const browser: Browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1440,900',
      '--lang=ko-KR',
    ],
  });

  const results = {
    found: 0,
    kept: 0,
    failed: 0,
    sources: {} as Record<string, number>,
  };

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
  });

  for (let i = 0; i < targets.length; i++) {
    const m = targets[i];
    const progress = `[${i + 1}/${targets.length}]`;

    process.stdout.write(`${progress} ${m.name.padEnd(20)} `);

    const { logoUrl, source } = await searchGoogleImage(page, m.name);
    results.sources[source] = (results.sources[source] || 0) + 1;

    if (logoUrl) {
      console.log(`✅ ${source} → ${logoUrl.slice(0, 70)}`);

      if (!DRY_RUN) {
        const { error: updateErr } = await supabase
          .from('merchants')
          .update({ logo_url: logoUrl })
          .eq('id', m.id);

        if (updateErr) {
          console.log(`   ⚠️ DB 업데이트 실패: ${updateErr.message}`);
          results.failed++;
        } else {
          results.found++;
        }
      } else {
        results.found++;
      }
    } else {
      console.log(`❌ ${source}`);
      results.kept++;
    }

    // 봇 차단 방지: 2~4초 랜덤 딜레이
    const delay = 2000 + Math.random() * 2000;
    await new Promise((r) => setTimeout(r, delay));
  }

  await browser.close();

  console.log('');
  console.log('═'.repeat(80));
  console.log('📊 결과 요약');
  console.log('─'.repeat(80));
  console.log(`   ✅ 로고 발견: ${results.found}개`);
  console.log(`   ⏭️ 못 찾음: ${results.kept}개`);
  console.log(`   ❌ 실패: ${results.failed}개`);
  console.log('');
  console.log('📋 출처별:');
  Object.entries(results.sources)
    .sort((a, b) => b[1] - a[1])
    .forEach(([source, count]) => {
      console.log(`   ${source}: ${count}개`);
    });

  if (DRY_RUN) {
    console.log('');
    console.log('🔍 미리보기 모드 — DB 변경 없음');
    console.log('   실제 적용: npx ts-node scripts/fetch-logos-google.ts');
  }
}

main().catch(console.error);
