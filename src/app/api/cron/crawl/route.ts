/**
 * POPPON — 자동 크롤 배치 (Vercel Cron)
 *
 * 파일 위치: src/app/api/cron/crawl/route.ts
 *
 * 매일 06:00 KST (21:00 UTC) 자동 실행
 * - ① 만료 딜 일괄 전환 (ends_at 지난 active → expired)
 * - ② 크롤링 (변경 감지 적용)
 * - 성공/실패 요약 로그
 *
 * vercel.json에서 schedule: "0 21 * * *" 로 트리거
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { crawlWithAI, closeBrowser } from '@/lib/crawl/ai-engine';
import {
  saveAICrawlResults,
  createCrawlRunLog,
  completeCrawlRunLog,
  failCrawlRunLog,
  type AIDealCandidate,
} from '@/lib/crawl/save-deals';

// Vercel Cron 인증 확인
function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;

  // Vercel이 자동으로 보내는 헤더
  const vercelCron = request.headers.get('x-vercel-cron');
  if (vercelCron) return true;

  // 로컬 개발용
  if (process.env.NODE_ENV === 'development') return true;

  return false;
}

/**
 * ① 만료 딜 일괄 전환
 * ends_at이 지났고 아직 active인 딜 → expired로 전환
 */
async function expireOverdueDeals(supabase: any): Promise<number> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('deals')
    .update({
      status: 'expired',
      expired_at: now,
    })
    .eq('status', 'active')
    .not('ends_at', 'is', null)
    .lt('ends_at', now)
    .select('id');

  if (error) {
    console.error('[Cron] ❌ 만료 전환 실패:', error.message);
    return 0;
  }

  const count = data?.length || 0;
  if (count > 0) {
    console.log(`[Cron] 🕐 만료 전환: ${count}개 딜 → expired`);
  } else {
    console.log('[Cron] 🕐 만료 전환: 대상 없음');
  }

  return count;
}

export async function GET(request: NextRequest) {
  // 1. 인증 확인
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const supabase = await createServiceClient();

  console.log('[Cron] 🕐 일일 배치 시작');

  // ━━━ ① 만료 딜 전환 ━━━
  const expiredCount = await expireOverdueDeals(supabase);

  // ━━━ ② 크롤링 ━━━
  const { data: connectors, error } = await supabase
    .from('crawl_connectors')
    .select('id, name, merchant_id, source_url, config, status, fail_count')
    .eq('status', 'active')
    .order('name');

  if (error || !connectors || connectors.length === 0) {
    console.error('[Cron] ❌ 커넥터 조회 실패:', error?.message);
    return NextResponse.json({
      error: 'No active connectors',
      expiredDeals: expiredCount,
    }, { status: 500 });
  }

  console.log(`[Cron] 📋 크롤 대상: ${connectors.length}개 커넥터`);

  // 순차 실행
  let successCount = 0;
  let failCount = 0;
  let totalNewDeals = 0;
  let totalUpdatedDeals = 0;
  let totalTokens = 0;
  const errors: string[] = [];

  for (let i = 0; i < connectors.length; i++) {
    const connector = connectors[i];
    const runId = await createCrawlRunLog(connector.id, supabase);

    try {
      const crawlResult = await crawlWithAI({
        id: connector.id,
        merchant_id: connector.merchant_id,
        name: connector.name,
        source_url: connector.source_url,
        config: connector.config as Record<string, unknown>,
        status: connector.status,
        fail_count: connector.fail_count,
      });

      if (crawlResult.status === 'failed') {
        failCount++;
        errors.push(`${connector.name}: ${crawlResult.errorMessage}`);

        if (runId) await failCrawlRunLog(runId, crawlResult.errorMessage || '크롤 실패', supabase);

        await supabase
          .from('crawl_connectors')
          .update({
            fail_count: connector.fail_count + 1,
            status: connector.fail_count >= 4 ? 'error' : 'active',
            last_run_at: new Date().toISOString(),
          })
          .eq('id', connector.id);

        continue;
      }

      // 성공 → 저장
      const deals = crawlResult.deals as AIDealCandidate[];
      const saveResult = await saveAICrawlResults(
        deals,
        {
          id: connector.id,
          name: connector.name,
          merchant_id: connector.merchant_id,
          source_url: connector.source_url,
          config: connector.config as Record<string, unknown>,
        },
        supabase,
        { autoApprove: true, expireOldDeals: false }
      );

      if (runId) await completeCrawlRunLog(runId, saveResult, crawlResult.tokensUsed || 0, supabase);

      await supabase
        .from('crawl_connectors')
        .update({ fail_count: 0, status: 'active', last_run_at: new Date().toISOString() })
        .eq('id', connector.id);

      successCount++;
      totalNewDeals += saveResult.newCount;
      totalUpdatedDeals += saveResult.updatedCount;
      totalTokens += crawlResult.tokensUsed || 0;

      // 10개마다 진행률 로그
      if ((i + 1) % 10 === 0) {
        console.log(`[Cron] 📊 진행: ${i + 1}/${connectors.length} (성공 ${successCount}, 실패 ${failCount})`);
      }

    } catch (err) {
      failCount++;
      const errorMsg = (err as Error).message;
      errors.push(`${connector.name}: ${errorMsg}`);
      if (runId) await failCrawlRunLog(runId, errorMsg, supabase);
    }

    // 커넥터 간 딜레이 (rate limit + 서버 부담 방지)
    await new Promise(r => setTimeout(r, 2000));
  }

  // 브라우저 정리
  try { await closeBrowser(); } catch { /* ignore */ }

  // 결과 요약
  const durationMs = Date.now() - startTime;
  const durationMin = (durationMs / 60000).toFixed(1);
  const estimatedCost = `$${(totalTokens * 0.000003).toFixed(4)}`;
  const failRate = connectors.length > 0 ? (failCount / connectors.length * 100).toFixed(1) : '0';

  const summary = {
    timestamp: new Date().toISOString(),
    duration: `${durationMin}분`,
    // 만료 처리
    expiredDeals: expiredCount,
    // 크롤링
    totalConnectors: connectors.length,
    successCount,
    failCount,
    failRate: `${failRate}%`,
    totalNewDeals,
    totalUpdatedDeals,
    totalTokens,
    estimatedCost,
    errors: errors.slice(0, 10),
  };

  console.log(`\n[Cron] ✅ 일일 배치 완료`);
  console.log(`[Cron] 🕐 만료 전환: ${expiredCount}개`);
  console.log(`[Cron] 📊 크롤: ${successCount}/${connectors.length} 성공 (실패율 ${failRate}%)`);
  console.log(`[Cron] 📦 신규 ${totalNewDeals} | 업데이트 ${totalUpdatedDeals}`);
  console.log(`[Cron] 💰 비용 ${estimatedCost} | 소요시간 ${durationMin}분`);

  if (parseFloat(failRate) > 30) {
    console.warn(`[Cron] ⚠️ 실패율 ${failRate}% — 운영자 확인 필요!`);
  }

  return NextResponse.json(summary);
}
