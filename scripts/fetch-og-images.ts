/**
 * OG 이미지 크롤링 스크립트
 * 
 * thumbnail_url이 없는 딜의 landing_url/source_url에서 og:image를 가져옴
 * 
 * 사용법:
 *   npx ts-node scripts/fetch-og-images.ts
 *   npx ts-node scripts/fetch-og-images.ts --dry-run    (미리보기만)
 *   npx ts-node scripts/fetch-og-images.ts --limit 10   (10개만 처리)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// CLI 옵션 파싱
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const limitIdx = args.indexOf('--limit');
const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : 500;

// og:image 추출 (HTML fetch + 파싱)
async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PopponBot/1.0; +https://poppon.co.kr)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    // HTML에서 og:image 추출 (전체 파싱 대신 정규식으로 빠르게)
    const html = await res.text();
    
    // og:image 메타태그 찾기
    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      // twitter:image도 fallback
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        let imgUrl = match[1];
        
        // 상대 URL → 절대 URL 변환
        if (imgUrl.startsWith('//')) {
          imgUrl = 'https:' + imgUrl;
        } else if (imgUrl.startsWith('/')) {
          const urlObj = new URL(url);
          imgUrl = urlObj.origin + imgUrl;
        }

        // 유효한 이미지 URL인지 기본 체크
        if (imgUrl.startsWith('http') && imgUrl.length < 2000) {
          return imgUrl;
        }
      }
    }

    return null;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.log(`    ⏰ 타임아웃: ${url}`);
    }
    return null;
  }
}

async function main() {
  console.log('🖼️  OG 이미지 크롤링 시작');
  console.log(`   모드: ${isDryRun ? '🔍 미리보기 (dry-run)' : '💾 실제 업데이트'}`);
  console.log(`   제한: ${limit}개\n`);

  // 1) 이미지 없는 active 딜 가져오기
  const { data: deals, error } = await supabase
    .from('deals')
    .select('id, title, landing_url, source_url, merchant_id')
    .eq('status', 'active')
    .is('thumbnail_url', null)
    .is('og_image_url', null)
    .limit(limit);

  if (error) {
    console.error('❌ DB 조회 실패:', error.message);
    return;
  }

  console.log(`📋 이미지 없는 딜: ${deals.length}개\n`);

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < deals.length; i++) {
    const deal = deals[i];
    const url = deal.landing_url || deal.source_url;

    if (!url) {
      console.log(`  [${i + 1}/${deals.length}] ⏭️ URL 없음: ${deal.title}`);
      skipped++;
      continue;
    }

    process.stdout.write(`  [${i + 1}/${deals.length}] 🔍 ${deal.title.substring(0, 30)}... `);

    const ogImage = await fetchOgImage(url);

    if (ogImage) {
      console.log(`✅ ${ogImage.substring(0, 60)}...`);

      if (!isDryRun) {
        const { error: updateErr } = await supabase
          .from('deals')
          .update({ og_image_url: ogImage })
          .eq('id', deal.id);

        if (updateErr) {
          console.log(`    ❌ DB 업데이트 실패: ${updateErr.message}`);
          failed++;
        } else {
          success++;
        }
      } else {
        success++;
      }
    } else {
      console.log('❌ OG 이미지 없음');
      failed++;
    }

    // 과도한 요청 방지 (200ms 간격)
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log('\n==============================');
  console.log(`📊 결과 요약`);
  console.log(`   전체: ${deals.length}개`);
  console.log(`   ✅ 성공: ${success}개`);
  console.log(`   ❌ 실패: ${failed}개`);
  console.log(`   ⏭️ 스킵: ${skipped}개`);
  if (isDryRun) {
    console.log('\n   💡 실제 적용하려면 --dry-run 옵션 제거 후 재실행');
  }
  console.log('==============================');
}

main().catch(console.error);
