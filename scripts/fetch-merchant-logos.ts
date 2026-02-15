/**
 * 머천트 로고 수집 스크립트 v2
 * 
 * 3단계 fallback으로 최고 품질 로고 확보:
 *   1순위: 사이트 HTML에서 apple-touch-icon (180x180 고해상도)
 *   2순위: Clearbit Logo API (글로벌 브랜드)
 *   3순위: Google Favicon API (128px, 항상 존재)
 * 
 * 사용법:
 *   npx ts-node scripts/fetch-merchant-logos.ts
 *   npx ts-node scripts/fetch-merchant-logos.ts --dry-run
 *   npx ts-node scripts/fetch-merchant-logos.ts --limit 10
 *   npx ts-node scripts/fetch-merchant-logos.ts --force       (이미 있는 것도 재수집)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');
const limitIdx = args.indexOf('--limit');
const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : 1000;

// URL에서 도메인/origin 추출
function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function extractOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

// 1순위: HTML에서 apple-touch-icon / 큰 favicon 찾기
async function fetchIconFromHTML(siteUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(siteUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const html = await res.text();
    const origin = extractOrigin(siteUrl);

    // apple-touch-icon (보통 180x180, 최고 품질)
    const patterns = [
      // apple-touch-icon (sizes 순서: 큰 것 우선)
      /<link[^>]+rel=["']apple-touch-icon(?:-precomposed)?["'][^>]+href=["']([^"']+)["']/gi,
      // 큰 사이즈 favicon
      /<link[^>]+rel=["']icon["'][^>]+sizes=["'](?:192|180|152|144|128|120|96)[^"']*["'][^>]+href=["']([^"']+)["']/gi,
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']icon["'][^>]+sizes=["'](?:192|180|152|144|128|120|96)/gi,
    ];

    for (const pattern of patterns) {
      const matches = [...html.matchAll(pattern)];
      if (matches.length > 0) {
        // 가장 큰 사이즈 선택 (마지막 매치가 보통 가장 큼)
        let iconUrl = matches[matches.length - 1][1];
        iconUrl = resolveUrl(iconUrl, origin!);
        if (iconUrl && await isImageValid(iconUrl)) {
          return iconUrl;
        }
      }
    }

    // apple-touch-icon.png 직접 접근 시도
    const appleIconUrl = `${origin}/apple-touch-icon.png`;
    if (await isImageValid(appleIconUrl)) {
      return appleIconUrl;
    }

    // apple-touch-icon-precomposed.png
    const precomposedUrl = `${origin}/apple-touch-icon-precomposed.png`;
    if (await isImageValid(precomposedUrl)) {
      return precomposedUrl;
    }

    return null;
  } catch {
    return null;
  }
}

// URL 정규화 (상대 → 절대)
function resolveUrl(iconUrl: string, origin: string): string {
  if (iconUrl.startsWith('//')) return 'https:' + iconUrl;
  if (iconUrl.startsWith('/')) return origin + iconUrl;
  if (iconUrl.startsWith('http')) return iconUrl;
  return origin + '/' + iconUrl;
}

// 이미지 URL 유효성 체크 (HEAD 요청)
async function isImageValid(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!res.ok) return false;
    const contentType = res.headers.get('content-type') || '';
    // 이미지인지, 또는 content-type 없어도 OK (일부 CDN)
    return contentType.includes('image') || contentType.includes('octet-stream') || res.ok;
  } catch {
    return false;
  }
}

// 2순위: Clearbit Logo API
async function fetchClearbitLogo(domain: string): Promise<string | null> {
  const url = `https://logo.clearbit.com/${domain}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal, redirect: 'follow' });
    clearTimeout(timeout);

    if (res.ok) return url;
    return null;
  } catch {
    return null;
  }
}

// 3순위: Google Favicon (항상 존재)
function googleFavicon(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

// 메인
async function main() {
  console.log('🏷️  머천트 로고 수집 v2');
  console.log(`   모드: ${isDryRun ? '🔍 미리보기' : '💾 실제 업데이트'}`);
  console.log(`   대상: ${isForce ? '전체 (force)' : '로고 없는 것만'}`);
  console.log(`   제한: ${limit}개\n`);

  // 대상 머천트 가져오기
  let query = supabase
    .from('merchants')
    .select('id, name, official_url, logo_url')
    .not('official_url', 'is', null)
    .limit(limit);

  if (!isForce) {
    query = query.or('logo_url.is.null,logo_url.like.%google.com/s2/favicons%');
  }

  const { data: merchants, error } = await query;

  if (error) {
    console.error('❌ DB 조회 실패:', error.message);
    return;
  }

  console.log(`📋 대상 머천트: ${merchants.length}개\n`);

  const stats = { apple: 0, clearbit: 0, google: 0, fail: 0 };

  for (let i = 0; i < merchants.length; i++) {
    const m = merchants[i];
    const domain = extractDomain(m.official_url);

    if (!domain) {
      console.log(`  [${i + 1}/${merchants.length}] ⏭️ ${m.name} — 도메인 추출 실패`);
      stats.fail++;
      continue;
    }

    process.stdout.write(`  [${i + 1}/${merchants.length}] ${m.name.padEnd(15)} `);

    let logoUrl: string | null = null;
    let source = '';

    // 1순위: apple-touch-icon
    logoUrl = await fetchIconFromHTML(m.official_url);
    if (logoUrl) {
      source = '🍎 Apple';
      stats.apple++;
    }

    // 2순위: Clearbit
    if (!logoUrl) {
      logoUrl = await fetchClearbitLogo(domain);
      if (logoUrl) {
        source = '🔷 Clearbit';
        stats.clearbit++;
      }
    }

    // 3순위: Google Favicon
    if (!logoUrl) {
      logoUrl = googleFavicon(domain);
      source = '🔍 Google';
      stats.google++;
    }

    console.log(`${source} | ${logoUrl.substring(0, 70)}`);

    if (!isDryRun && logoUrl) {
      const { error: updateErr } = await supabase
        .from('merchants')
        .update({ logo_url: logoUrl })
        .eq('id', m.id);

      if (updateErr) {
        console.log(`    ❌ DB 업데이트 실패: ${updateErr.message}`);
      }
    }

    // 레이트리밋 방지
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 결과 요약');
  console.log(`   전체: ${merchants.length}개`);
  console.log(`   🍎 Apple Touch Icon (고품질): ${stats.apple}개`);
  console.log(`   🔷 Clearbit Logo: ${stats.clearbit}개`);
  console.log(`   🔍 Google Favicon (fallback): ${stats.google}개`);
  console.log(`   ❌ 실패: ${stats.fail}개`);
  console.log(`\n   품질 비율: ${Math.round((stats.apple + stats.clearbit) / merchants.length * 100)}% 고품질`);
  if (isDryRun) {
    console.log('\n   💡 실제 적용: --dry-run 제거 후 재실행');
  }
  console.log('='.repeat(50));
}

main().catch(console.error);
