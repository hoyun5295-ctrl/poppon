/**
 * POPPON 머천트 로고 수집 v3.1
 * ────────────────────────────────────
 * v3 대비 개선:
 *   - 이미지 리소스 차단 해제 (header 로고 감지 정확도 향상)
 *   - favicon.ico 필터링 (실제 크기 64px 미만이면 거부)
 *   - 도메인 검증 (가져온 로고가 원래 사이트 것인지 확인)
 *   - SVG 로고 지원 (벡터 → 무한 확장, 최고 품질)
 *   - og:image 제외 (배너 이미지일 가능성 높음)
 *
 * 사용법:
 *   npx ts-node scripts/fetch-merchant-logos-v3.ts              # 실행
 *   npx ts-node scripts/fetch-merchant-logos-v3.ts --dry-run    # 미리보기
 *   npx ts-node scripts/fetch-merchant-logos-v3.ts --limit 10   # 10개만
 *   npx ts-node scripts/fetch-merchant-logos-v3.ts --all        # 전체 재수집
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CLI 인자
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ALL_MODE = args.includes('--all');
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 0;

const KR_HEADERS: Record<string, string> = {
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

// ──────────────────────────────────────────
// 도메인 추출
// ──────────────────────────────────────────
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

// ──────────────────────────────────────────
// 도메인 검증: 로고 URL이 원래 사이트 것인지
// ──────────────────────────────────────────
function isSameDomain(logoUrl: string, siteUrl: string): boolean {
  const logoDomain = extractDomain(logoUrl);
  const siteDomain = extractDomain(siteUrl);
  if (!logoDomain || !siteDomain) return false;

  return logoDomain === siteDomain
    || logoDomain.endsWith('.' + siteDomain)
    || siteDomain.endsWith('.' + logoDomain)
    || logoDomain.includes(siteDomain.split('.')[0]);
}

// ──────────────────────────────────────────
// 이미지 URL 검증 + 품질 체크
// ──────────────────────────────────────────
async function validateImageUrl(url: string): Promise<{ valid: boolean; isSvg: boolean; size: number }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: KR_HEADERS,
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!res.ok) return { valid: false, isSvg: false, size: 0 };

    const contentType = res.headers.get('content-type') || '';
    const contentLength = parseInt(res.headers.get('content-length') || '0', 10);
    const isSvg = contentType.includes('svg') || url.endsWith('.svg');
    const isImage = contentType.includes('image') || contentType.includes('octet-stream') || isSvg;

    if (!isImage) return { valid: false, isSvg: false, size: 0 };

    // favicon.ico 품질 필터: 1KB 미만이면 16x16 수준 → 거부
    if (url.endsWith('.ico') && contentLength > 0 && contentLength < 1024) {
      return { valid: false, isSvg: false, size: contentLength };
    }

    return { valid: true, isSvg, size: contentLength };
  } catch {
    return { valid: false, isSvg: false, size: 0 };
  }
}

// ──────────────────────────────────────────
// URL 절대경로 변환
// ──────────────────────────────────────────
function toAbsoluteUrl(href: string, baseUrl: string): string {
  try {
    if (!href || href.trim() === '') return '';
    if (href.startsWith('data:')) return '';
    if (href.startsWith('//')) return `https:${href}`;
    if (href.startsWith('http')) return href;
    return new URL(href, baseUrl).href;
  } catch {
    return '';
  }
}

function parseIconSize(sizes: string | null): number {
  if (!sizes) return 0;
  const match = sizes.match(/(\d+)x(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

type LogoQuality = 'excellent' | 'good' | 'acceptable' | 'poor';

function classifyLogo(method: string, isSvg: boolean, size: number): LogoQuality {
  if (isSvg) return 'excellent';
  if (method.includes('apple-touch-icon')) return 'good';
  if (method.includes('manifest') || (method.includes('icon') && size > 5000)) return 'good';
  if (method === 'header-logo' && size > 2000) return 'good';
  if (method === 'header-logo') return 'acceptable';
  return 'poor';
}

// ──────────────────────────────────────────
// Puppeteer 로고 추출
// ──────────────────────────────────────────
async function extractLogo(
  page: Page,
  url: string,
  merchantName: string
): Promise<{ logoUrl: string | null; method: string; quality: LogoQuality }> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2000));

    const baseUrl = page.url();

    // 도메인 리다이렉트 검증 (만료 도메인 방지)
    const originalDomain = extractDomain(url);
    const currentDomain = extractDomain(baseUrl);
    if (originalDomain && currentDomain) {
      const origBase = originalDomain.split('.').slice(-2).join('.');
      const currBase = currentDomain.split('.').slice(-2).join('.');
      if (origBase !== currBase && !currBase.includes(origBase.split('.')[0])) {
        return { logoUrl: null, method: 'domain-redirect', quality: 'poor' };
      }
    }

    // ═══════ 1단계: <head> 아이콘 ═══════
    const headIcons = await page.evaluate(() => {
      const icons: Array<{ href: string; sizes: string | null; rel: string; type: string | null }> = [];

      document.querySelectorAll('link[rel*="apple-touch-icon"]').forEach((el) => {
        const href = el.getAttribute('href');
        if (href) icons.push({ href, sizes: el.getAttribute('sizes'), rel: 'apple-touch-icon', type: el.getAttribute('type') });
      });

      document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach((el) => {
        const href = el.getAttribute('href');
        if (href) icons.push({ href, sizes: el.getAttribute('sizes'), rel: 'icon', type: el.getAttribute('type') });
      });

      const msIcon = document.querySelector('meta[name="msapplication-TileImage"]');
      if (msIcon) {
        const content = msIcon.getAttribute('content');
        if (content) icons.push({ href: content, sizes: '144x144', rel: 'ms-tile', type: null });
      }

      return icons;
    });

    const sortedIcons = headIcons
      .map((icon) => ({
        ...icon,
        size: parseIconSize(icon.sizes),
        isSvg: icon.type?.includes('svg') || icon.href.endsWith('.svg') || false,
      }))
      .sort((a, b) => {
        if (a.rel === 'apple-touch-icon' && b.rel !== 'apple-touch-icon') return -1;
        if (b.rel === 'apple-touch-icon' && a.rel !== 'apple-touch-icon') return 1;
        if (a.isSvg && !b.isSvg) return -1;
        if (b.isSvg && !a.isSvg) return 1;
        return b.size - a.size;
      });

    for (const icon of sortedIcons) {
      const absUrl = toAbsoluteUrl(icon.href, baseUrl);
      if (!absUrl) continue;
      if (absUrl.endsWith('/favicon.ico') && !icon.isSvg) continue;
      if (icon.rel !== 'apple-touch-icon' && icon.size > 0 && icon.size < 48) continue;

      const { valid, isSvg, size } = await validateImageUrl(absUrl);
      if (valid) {
        const method = icon.isSvg || isSvg
          ? 'svg-icon'
          : icon.rel === 'apple-touch-icon'
            ? `apple-touch-icon${icon.size ? ` ${icon.size}px` : ''}`
            : `icon ${icon.size || '?'}px`;
        const quality = classifyLogo(method, isSvg || icon.isSvg, size);
        return { logoUrl: absUrl, method, quality };
      }
    }

    // ═══════ 2단계: manifest.json ═══════
    const manifestUrl = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return link ? link.getAttribute('href') : null;
    });

    if (manifestUrl) {
      try {
        const absManifest = toAbsoluteUrl(manifestUrl, baseUrl);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(absManifest, { signal: controller.signal, headers: KR_HEADERS });
        clearTimeout(timeout);

        if (res.ok) {
          const manifest = await res.json();
          const icons = (manifest.icons || []) as Array<{ src: string; sizes?: string; type?: string }>;
          const sorted = icons
            .map((i) => ({ src: i.src, size: parseIconSize(i.sizes || ''), isSvg: i.type?.includes('svg') || i.src.endsWith('.svg') || false }))
            .filter((i) => i.size >= 96 || i.isSvg)
            .sort((a, b) => {
              if (a.isSvg && !b.isSvg) return -1;
              if (b.isSvg && !a.isSvg) return 1;
              return b.size - a.size;
            });

          for (const icon of sorted) {
            const absUrl = toAbsoluteUrl(icon.src, absManifest);
            if (!absUrl) continue;
            const { valid, isSvg, size } = await validateImageUrl(absUrl);
            if (valid) {
              const method = isSvg || icon.isSvg ? 'manifest-svg' : `manifest ${icon.size}px`;
              return { logoUrl: absUrl, method, quality: classifyLogo(method, isSvg || icon.isSvg, size) };
            }
          }
        }
      } catch { /* skip */ }
    }

    // ═══════ 3단계: header/nav 로고 img ═══════
    const headerLogos = await page.evaluate(() => {
      const candidates: Array<{ src: string; score: number; isSvg: boolean }> = [];

      const containers = document.querySelectorAll(
        'header, nav, [class*="header"], [class*="gnb"], [class*="logo"], [id*="header"], [id*="logo"], [class*="Header"], [class*="Logo"], [class*="navbar"], [class*="top-bar"], [class*="topbar"]'
      );

      containers.forEach((container) => {
        container.querySelectorAll('img').forEach((img) => {
          const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
          if (!src) return;

          const alt = (img.getAttribute('alt') || '').toLowerCase();
          const className = (img.className || '').toLowerCase();
          const parentClass = (img.parentElement?.className || '').toLowerCase();
          const nw = img.naturalWidth || 0;
          const nh = img.naturalHeight || 0;
          const isSvg = src.endsWith('.svg') || src.includes('.svg?');

          let score = 0;
          if (alt.includes('logo') || alt.includes('로고') || alt.includes('brand')) score += 15;
          if (className.includes('logo') || className.includes('brand')) score += 15;
          if (parentClass.includes('logo') || parentClass.includes('brand')) score += 10;
          if (src.toLowerCase().includes('logo')) score += 10;
          if (isSvg) score += 20;
          if (nw >= 48 && nw <= 500) score += 5;
          if (nw > 600 || nh > 400) score -= 20;
          if (nw > 0 && nw < 20) score -= 10;

          if (score > 0) candidates.push({ src, score, isSvg });
        });

        container.querySelectorAll('object[data$=".svg"], embed[src$=".svg"]').forEach((el) => {
          const src = el.getAttribute('data') || el.getAttribute('src');
          if (src) candidates.push({ src, score: 25, isSvg: true });
        });
      });

      return candidates.sort((a, b) => b.score - a.score).slice(0, 8);
    });

    for (const logo of headerLogos) {
      const absUrl = toAbsoluteUrl(logo.src, baseUrl);
      if (!absUrl) continue;
      if (!isSameDomain(absUrl, baseUrl)) continue;

      const { valid, isSvg, size } = await validateImageUrl(absUrl);
      if (valid) {
        const method = isSvg || logo.isSvg ? 'header-logo-svg' : 'header-logo';
        return { logoUrl: absUrl, method, quality: classifyLogo(method, isSvg || logo.isSvg, size) };
      }
    }

    // ═══════ 4단계: apple-touch-icon 직접 경로 ═══════
    const origin = new URL(baseUrl).origin;
    for (const p of [
      '/apple-touch-icon.png',
      '/apple-touch-icon-precomposed.png',
      '/apple-touch-icon-180x180.png',
      '/apple-touch-icon-152x152.png',
      '/apple-touch-icon-120x120.png',
    ]) {
      const directUrl = `${origin}${p}`;
      const { valid, size } = await validateImageUrl(directUrl);
      if (valid && size > 1000) {
        return { logoUrl: directUrl, method: 'direct-apple-touch-icon', quality: 'good' };
      }
    }

    return { logoUrl: null, method: 'not-found', quality: 'poor' };
  } catch (err: any) {
    return { logoUrl: null, method: `error: ${err.message?.slice(0, 80)}`, quality: 'poor' };
  }
}

// ──────────────────────────────────────────
// 메인
// ──────────────────────────────────────────
async function main() {
  console.log('🚀 POPPON 머천트 로고 수집 v3.1 (Puppeteer)');
  console.log(`   모드: ${DRY_RUN ? '🔍 미리보기' : '💾 실제 적용'}`);
  if (ALL_MODE) console.log('   대상: 전체');
  if (LIMIT) console.log(`   제한: ${LIMIT}개`);
  console.log('');

  let query = supabase
    .from('merchants')
    .select('id, name, slug, logo_url, official_url')
    .not('official_url', 'is', null)
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
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--window-size=1280,720'],
  });

  const results = {
    upgraded: 0,
    kept: 0,
    newFound: 0,
    failed: 0,
    methods: {} as Record<string, number>,
    qualities: { excellent: 0, good: 0, acceptable: 0, poor: 0 } as Record<LogoQuality, number>,
  };

  const page = await browser.newPage();
  await page.setExtraHTTPHeaders(KR_HEADERS);
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  // 폰트/미디어만 차단 (이미지는 허용!)
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const type = req.resourceType();
    if (['font', 'media'].includes(type)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  for (let i = 0; i < targets.length; i++) {
    const m = targets[i];
    const progress = `[${i + 1}/${targets.length}]`;
    const isCurrentlyFavicon = m.logo_url?.includes('google.com/s2/favicons');
    const hasNoLogo = !m.logo_url;

    process.stdout.write(`${progress} ${m.name.padEnd(20)} `);

    const { logoUrl, method, quality } = await extractLogo(page, m.official_url!, m.name);
    results.methods[method] = (results.methods[method] || 0) + 1;

    if (logoUrl && quality !== 'poor') {
      results.qualities[quality]++;

      if (isCurrentlyFavicon || hasNoLogo) {
        const emoji = quality === 'excellent' ? '🌟' : quality === 'good' ? '✅' : '🔶';
        console.log(`${emoji} [${quality}] ${method} → ${logoUrl.slice(0, 70)}`);

        if (!DRY_RUN) {
          const { error: updateErr } = await supabase
            .from('merchants')
            .update({ logo_url: logoUrl })
            .eq('id', m.id);

          if (updateErr) {
            console.log(`   ⚠️ DB 업데이트 실패: ${updateErr.message}`);
            results.failed++;
          } else {
            if (hasNoLogo) results.newFound++;
            else results.upgraded++;
          }
        } else {
          if (hasNoLogo) results.newFound++;
          else results.upgraded++;
        }
      } else {
        console.log(`⏭️ 기존 유지 (이미 고품질)`);
        results.kept++;
      }
    } else {
      console.log(`❌ ${method}`);
      results.kept++;
    }
  }

  await browser.close();

  console.log('');
  console.log('═'.repeat(80));
  console.log('📊 결과 요약');
  console.log('─'.repeat(80));
  console.log(`   🌟 excellent (SVG): ${results.qualities.excellent}개`);
  console.log(`   ✅ good (apple-touch/manifest): ${results.qualities.good}개`);
  console.log(`   🔶 acceptable (header-logo): ${results.qualities.acceptable}개`);
  console.log(`   ─────`);
  console.log(`   총 교체: ${results.upgraded}개 | 신규: ${results.newFound}개`);
  console.log(`   기존 유지: ${results.kept}개 | 실패: ${results.failed}개`);
  console.log('');
  console.log('📋 추출 방법별:');
  Object.entries(results.methods)
    .sort((a, b) => b[1] - a[1])
    .forEach(([method, count]) => {
      console.log(`   ${method}: ${count}개`);
    });

  if (DRY_RUN) {
    console.log('');
    console.log('🔍 미리보기 모드 — DB 변경 없음');
    console.log('   실제 적용: npx ts-node scripts/fetch-merchant-logos-v3.ts');
  }
}

main().catch(console.error);
