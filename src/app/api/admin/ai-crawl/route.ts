/**
 * POPPON — AI 크롤 실행 API
 * 
 * 파일 위치: src/app/api/admin/ai-crawl/route.ts
 * 
 * POST /api/admin/ai-crawl
 *   - body: { connectorIds?: string[], all?: boolean, autoApprove?: boolean }
 *   - connectorIds: 특정 커넥터만 크롤
 *   - all: true면 모든 active 커넥터 크롤
 *   - autoApprove: true면 바로 active (기본: false → pending)
 * 
 * GET /api/admin/ai-crawl
 *   - AI 크롤 가능한 커넥터 목록 + 최근 실행 현황
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { crawlWithAI, crawlBatchWithAI, closeBrowser } from '@/lib/crawl/ai-engine';
import {
  saveAICrawlResults,
  createCrawlRunLog,
  completeCrawlRunLog,
  failCrawlRunLog,
  type AIDealCandidate,
  type SaveResult,
} from '@/lib/crawl/save-deals';

// ============================================================
// GET — AI 크롤 현황 조회
// ============================================================

export async function GET() {
  const supabase = await createServiceClient();

  // AI 크롤 가능한 커넥터 (engine_type = 'ai' 또는 모든 active 커넥터)
  const { data: connectors, error } = await supabase
    .from('crawl_connectors')
    .select('id, name, merchant_id, source_url, status, last_run_at, fail_count, config')
    .eq('status', 'active')
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 최근 AI 크롤 로그
  const { data: recentRuns } = await supabase
    .from('crawl_runs')
    .select('*, crawl_connectors(name)')
    .order('started_at', { ascending: false })
    .limit(20);

  // 통계
  const { count: totalDeals } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .eq('source_type', 'crawl');

  const { count: pendingDeals } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .eq('source_type', 'crawl')
    .eq('status', 'pending');

  return NextResponse.json({
    connectors: connectors || [],
    recentRuns: recentRuns || [],
    stats: {
      totalConnectors: connectors?.length || 0,
      totalCrawledDeals: totalDeals || 0,
      pendingDeals: pendingDeals || 0,
    },
  });
}

// ============================================================
// POST — AI 크롤 실행
// ============================================================

interface CrawlRequest {
  connectorIds?: string[];
  all?: boolean;
  autoApprove?: boolean;
  expireOldDeals?: boolean;
}

export async function POST(request: NextRequest) {
  const supabase = await createServiceClient();
  const body: CrawlRequest = await request.json();

  const { connectorIds, all = false, autoApprove = false, expireOldDeals = false } = body;

  // 1. 크롤할 커넥터 조회
  let query = supabase
    .from('crawl_connectors')
    .select('id, name, merchant_id, source_url, config, status, fail_count');

  if (all) {
    query = query.eq('status', 'active');
  } else if (connectorIds && connectorIds.length > 0) {
    query = query.in('id', connectorIds);
  } else {
    return NextResponse.json(
      { error: 'connectorIds 또는 all: true 필요' },
      { status: 400 }
    );
  }

  const { data: connectors, error } = await query;

  if (error || !connectors || connectors.length === 0) {
    return NextResponse.json(
      { error: '크롤할 커넥터가 없습니다', detail: error?.message },
      { status: 404 }
    );
  }

  // 2. 순차 실행 + 결과 저장
  const results: Array<{
    connector: string;
    crawl: { dealCount: number; tokensUsed?: number; status: string; errorMessage?: string };
    save: SaveResult | null;
  }> = [];

  let totalNewDeals = 0;
  let totalUpdatedDeals = 0;
  let totalTokens = 0;

  for (const connector of connectors) {
    const connectorInfo = {
      id: connector.id,
      name: connector.name,
      merchant_id: connector.merchant_id,
      source_url: connector.source_url,
      config: connector.config as Record<string, unknown>,
    };

    // 크롤 로그 시작
    const runId = await createCrawlRunLog(connector.id, supabase);

    try {
      // 3. AI 크롤 실행 (Puppeteer + Claude)
      console.log(`[AI-Crawl] 🚀 시작: ${connector.name}`);
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
        console.log(`[AI-Crawl] ❌ 실패: ${connector.name} — ${crawlResult.errorMessage}`);

        // 실패 로그
        if (runId) await failCrawlRunLog(runId, crawlResult.errorMessage || '알 수 없는 에러', supabase);

        // 커넥터 fail_count 증가
        await supabase
          .from('crawl_connectors')
          .update({
            fail_count: connector.fail_count + 1,
            status: connector.fail_count >= 4 ? 'error' : 'active',
            last_run_at: new Date().toISOString(),
          })
          .eq('id', connector.id);

        results.push({
          connector: connector.name,
          crawl: {
            dealCount: 0,
            status: 'failed',
            errorMessage: crawlResult.errorMessage,
          },
          save: null,
        });
        continue;
      }

      // 4. 크롤 성공 → deals 테이블에 저장
      const deals = crawlResult.deals as AIDealCandidate[];
      console.log(`[AI-Crawl] ✅ ${connector.name}: ${deals.length}개 딜 추출`);

      const saveResult = await saveAICrawlResults(
        deals,
        connectorInfo,
        supabase,
        { autoApprove, expireOldDeals }
      );

      // 5. 로그 완료
      if (runId) {
        await completeCrawlRunLog(runId, saveResult, crawlResult.tokensUsed || 0, supabase);
      }

      // 6. 커넥터 상태 업데이트
      await supabase
        .from('crawl_connectors')
        .update({
          fail_count: 0,
          status: 'active',
          last_run_at: new Date().toISOString(),
        })
        .eq('id', connector.id);

      totalNewDeals += saveResult.newCount;
      totalUpdatedDeals += saveResult.updatedCount;
      totalTokens += crawlResult.tokensUsed || 0;

      results.push({
        connector: connector.name,
        crawl: {
          dealCount: deals.length,
          tokensUsed: crawlResult.tokensUsed,
          status: 'success',
        },
        save: saveResult,
      });

      console.log(`[AI-Crawl] 💾 ${connector.name}: 신규 ${saveResult.newCount} / 업데이트 ${saveResult.updatedCount} / 스킵 ${saveResult.skippedCount}`);

    } catch (err) {
      const errorMsg = (err as Error).message;
      console.error(`[AI-Crawl] 💥 ${connector.name}: ${errorMsg}`);

      if (runId) await failCrawlRunLog(runId, errorMsg, supabase);

      results.push({
        connector: connector.name,
        crawl: { dealCount: 0, status: 'error', errorMessage: errorMsg },
        save: null,
      });
    }

    // 커넥터 간 딜레이 (rate limit)
    await new Promise(r => setTimeout(r, 2000));
  }

  // 7. 브라우저 정리
  try {
    await closeBrowser();
  } catch {
    // 무시
  }

  // 8. 최종 요약 응답
  const summary = {
    totalConnectors: connectors.length,
    successCount: results.filter(r => r.crawl.status === 'success').length,
    failCount: results.filter(r => r.crawl.status !== 'success').length,
    totalNewDeals,
    totalUpdatedDeals,
    totalTokens,
    estimatedCost: `$${(totalTokens * 0.000003).toFixed(4)}`,
    results,
  };

  console.log(`\n[AI-Crawl] 📊 완료: ${summary.successCount}/${connectors.length} 성공 | 신규 ${totalNewDeals} | 업데이트 ${totalUpdatedDeals} | 비용 ${summary.estimatedCost}`);

  return NextResponse.json(summary);
}
