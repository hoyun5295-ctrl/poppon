/**
 * POPPON — 만료 자동 전환 배치 (Vercel Cron)
 *
 * 파일 위치: src/app/api/cron/expire/route.ts
 *
 * 매일 06:10 KST (21:10 UTC) 자동 실행 — 크롤 배치(06:00) 직후
 * 1) ends_at 지난 active 딜 → expired 전환
 * 2) 30일 이상 지난 expired 딜 → hidden 전환 (SEO noindex)
 * 3) merchant별 active_deal_count 재계산
 *
 * vercel.json에서 schedule: "10 21 * * *" 로 트리거
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Vercel Cron 인증 확인 (cron/crawl/route.ts와 동일)
function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;

  const vercelCron = request.headers.get('x-vercel-cron');
  if (vercelCron) return true;

  if (process.env.NODE_ENV === 'development') return true;

  return false;
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const now = new Date().toISOString();

  console.log('[Expire] 🕐 만료 전환 배치 시작');

  try {
    // 1) ends_at 지난 active 딜 → expired
    const { data: expiredDeals, error: expireError } = await supabase
      .from('deals')
      .update({
        status: 'expired',
        expired_at: now,
        updated_at: now,
      })
      .eq('status', 'active')
      .eq('is_evergreen', false)
      .not('ends_at', 'is', null)
      .lt('ends_at', now)
      .select('id, title, merchant_id');

    if (expireError) {
      console.error('[Expire] ❌ 만료 전환 실패:', expireError.message);
      return NextResponse.json({ error: expireError.message }, { status: 500 });
    }

    const expiredCount = expiredDeals?.length || 0;
    console.log(`[Expire] 📦 ${expiredCount}개 딜 → expired 전환`);

    // 2) 30일 이상 지난 expired → hidden (SEO noindex)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: hiddenDeals, error: hideError } = await supabase
      .from('deals')
      .update({
        status: 'hidden',
        updated_at: now,
      })
      .eq('status', 'expired')
      .not('expired_at', 'is', null)
      .lt('expired_at', thirtyDaysAgo)
      .select('id');

    if (hideError) {
      console.error('[Expire] ❌ hidden 전환 실패:', hideError.message);
    }

    const hiddenCount = hiddenDeals?.length || 0;
    console.log(`[Expire] 🗂️ ${hiddenCount}개 딜 → hidden 전환 (30일 경과)`);

    // 3) 변경된 merchant의 active_deal_count 재계산
    if (expiredCount > 0 || hiddenCount > 0) {
      const affectedMerchantIds = [
        ...new Set([
          ...(expiredDeals || []).map((d) => d.merchant_id),
        ]),
      ];

      for (const merchantId of affectedMerchantIds) {
        const { count } = await supabase
          .from('deals')
          .select('id', { count: 'exact', head: true })
          .eq('merchant_id', merchantId)
          .eq('status', 'active');

        await supabase
          .from('merchants')
          .update({ active_deal_count: count || 0, updated_at: now })
          .eq('id', merchantId);
      }

      console.log(`[Expire] 🔄 ${affectedMerchantIds.length}개 머천트 active_deal_count 재계산`);
    }

    // 4) 결과 요약
    const summary = {
      success: true,
      timestamp: now,
      expired: expiredCount,
      hidden: hiddenCount,
      titles: (expiredDeals || []).map((d) => d.title).slice(0, 10),
    };

    console.log(`[Expire] ✅ 완료: ${expiredCount}개 만료, ${hiddenCount}개 숨김`);
    return NextResponse.json(summary);
  } catch (err) {
    const errorMsg = (err as Error).message;
    console.error('[Expire] ❌ 예외:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
