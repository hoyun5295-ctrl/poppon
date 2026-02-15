/**
 * POPPON — AI 크롤 실행 API (v3 — DB 해시 변경감지)
 * 
 * 파일 위치: src/app/api/admin/ai-crawl/route.ts
 * 
 * v3 변경:
 * - content_hash를 DB에서 읽어서 crawlWithAI에 전달
 * - 크롤 후 newContentHash를 DB에 저장
 * - 서버 재시작해도 변경감지 유지
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
  type SaveResult,
} from '@/lib/crawl/save-deals';

// ============================================================
// GET — AI 크롤 현황 조회
// ============================================================

export async function GET() {
  const supabase = await createServiceClient();

  const { data: connectors, error } = await supabase
    .from('crawl_connectors')
    .select('id, name, merchant_id, source_url, status, last_run_at, fail_count, config')
    .eq('status', 'active')
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: recentRuns } = await supabase
    .from('crawl_runs')
    .select('*, crawl_connectors(name)')
    .order('started_at', { ascending: false })
    .limit(20);

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
// POST — AI 크롤 실행 (병렬 + DB 해시)
// ============================================================

interface CrawlRequest {
  connectorIds?: string[];
  all?: boolean;
  autoApprove?: boolean;
  expireOldDeals?: boolean;
  concurrency?: number;
}

interface ConnectorRow {
  id: string;
  name: string;
  merchant_id: string;
  source_url: string;
  config: Record<string, unknown>;
  status: string;
  fail_count: number;
  content_hash: string | null;  // ✅ DB 해시
}

interface SingleResult {
  connector: string;
  crawl: { dealCount: number; tokensUsed?: number; status: string; errorMessage?: string };
  save: SaveResult | null;
}

// 단일 커넥터 크롤+저장 처리
async function processConnector(
  connector: ConnectorRow,
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  options: { autoApprove: boolean; expireOldDeals: boolean }
): Promise<SingleResult> {
  const connectorInfo = {
    id: connector.id,
    name: connector.name,
    merchant_id: connector.merchant_id,
    source_url: connector.source_url,
    config: connector.config,
  };

  const runId = await createCrawlRunLog(connector.id, supabase);

  try {
    const crawlResult = await crawlWithAI({
      id: connector.id,
      merchant_id: connector.merchant_id,
      name: connector.name,
      source_url: connector.source_url,
      config: connector.config,
      status: connector.status,
      fail_count: connector.fail_count,
      content_hash: connector.content_hash,  // ✅ DB 해시 전달
    });

    // ✅ skipped (변경감지 → 콘텐츠 동일)
    if (crawlResult.status === 'skipped') {
      if (runId) await completeCrawlRunLog(runId, { newCount: 0, updatedCount: 0, skippedCount: 0, errors: [] }, 0, supabase);

      await supabase
        .from('crawl_connectors')
        .update({
          last_run_at: new Date().toISOString(),
          // 해시 유지 (이미 동일하니까 업데이트 불필요하지만 timestamp 갱신)
          hash_updated_at: new Date().toISOString(),
        })
        .eq('id', connector.id);

      return {
        connector: connector.name,
        crawl: { dealCount: 0, status: 'skipped', tokensUsed: 0 },
        save: null,
      };
    }

    // 실패
    if (crawlResult.status === 'failed') {
      if (runId) await failCrawlRunLog(runId, crawlResult.errorMessage || '알 수 없는 에러', supabase);

      await supabase
        .from('crawl_connectors')
        .update({
          fail_count: connector.fail_count + 1,
          status: connector.fail_count >= 4 ? 'error' : 'active',
          last_run_at: new Date().toISOString(),
        })
        .eq('id', connector.id);

      return {
        connector: connector.name,
        crawl: { dealCount: 0, status: 'failed', errorMessage: crawlResult.errorMessage },
        save: null,
      };
    }

    // 성공 → 저장
    const deals = crawlResult.deals as AIDealCandidate[];
    const saveResult = await saveAICrawlResults(deals, connectorInfo, supabase, options);

    if (runId) {
      await completeCrawlRunLog(runId, saveResult, crawlResult.tokensUsed || 0, supabase);
    }

    // ✅ 성공 시 content_hash DB에 저장
    await supabase
      .from('crawl_connectors')
      .update({
        fail_count: 0,
        status: 'active',
        last_run_at: new Date().toISOString(),
        content_hash: crawlResult.newContentHash || null,      // ✅ 해시 저장
        hash_updated_at: new Date().toISOString(),             // ✅ 해시 시점
      })
      .eq('id', connector.id);

    console.log(`[AI-Crawl] 💾 ${connector.name}: ${deals.length}딜 → 신규 ${saveResult.newCount} / 업데이트 ${saveResult.updatedCount}`);

    return {
      connector: connector.name,
      crawl: { dealCount: deals.length, tokensUsed: crawlResult.tokensUsed, status: 'success' },
      save: saveResult,
    };
  } catch (err) {
    const errorMsg = (err as Error).message;
    console.error(`[AI-Crawl] 💥 ${connector.name}: ${errorMsg}`);
    if (runId) await failCrawlRunLog(runId, errorMsg, supabase);

    return {
      connector: connector.name,
      crawl: { dealCount: 0, status: 'error', errorMessage: errorMsg },
      save: null,
    };
  }
}

export async function POST(request: NextRequest) {
  const totalStart = Date.now();
  const supabase = await createServiceClient();
  const body: CrawlRequest = await request.json();

  const {
    connectorIds,
    all = false,
    autoApprove = false,
    expireOldDeals = false,
    concurrency = 3,
  } = body;

  // 1. 크롤할 커넥터 조회 (✅ content_hash 포함)
  let query = supabase
    .from('crawl_connectors')
    .select('id, name, merchant_id, source_url, config, status, fail_count, content_hash');

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

  console.log(`\n[AI-Crawl] 🚀 배치 시작: ${connectors.length}개 커넥터, 동시 ${concurrency}개`);

  // 2. 병렬 배치 실행
  const results: SingleResult[] = [];

  for (let i = 0; i < connectors.length; i += concurrency) {
    const batch = connectors.slice(i, i + concurrency);
    const batchNum = Math.floor(i / concurrency) + 1;
    const totalBatches = Math.ceil(connectors.length / concurrency);

    console.log(`[AI-Crawl] 📦 배치 ${batchNum}/${totalBatches}: ${batch.map(c => c.name).join(', ')}`);

    const batchResults = await Promise.allSettled(
      batch.map(connector =>
        processConnector(
          connector as ConnectorRow,
          supabase,
          { autoApprove, expireOldDeals }
        )
      )
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error(`[AI-Crawl] 병렬 에러:`, result.reason);
      }
    }

    if (i + concurrency < connectors.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // 3. 브라우저 정리
  try {
    await closeBrowser();
  } catch {
    // 무시
  }

  // 4. 최종 요약
  const totalDurationMs = Date.now() - totalStart;
  const successResults = results.filter(r => r.crawl.status === 'success');
  const skippedResults = results.filter(r => r.crawl.status === 'skipped');
  const failedResults = results.filter(r => r.crawl.status === 'failed' || r.crawl.status === 'error');

  const totalNewDeals = results.reduce((sum, r) => sum + (r.save?.newCount || 0), 0);
  const totalUpdatedDeals = results.reduce((sum, r) => sum + (r.save?.updatedCount || 0), 0);
  const totalTokens = results.reduce((sum, r) => sum + (r.crawl.tokensUsed || 0), 0);

  const summary = {
    totalConnectors: connectors.length,
    successCount: successResults.length,
    skippedCount: skippedResults.length,
    failCount: failedResults.length,
    totalNewDeals,
    totalUpdatedDeals,
    totalTokens,
    estimatedCost: `$${(totalTokens * 0.000003).toFixed(4)}`,
    durationMs: totalDurationMs,
    durationFormatted: formatDuration(totalDurationMs),
    concurrency,
    results,
  };

  console.log(`\n[AI-Crawl] 📊 완료 (${summary.durationFormatted})`);
  console.log(`  ✅ 성공: ${summary.successCount} | ⏭️ 스킵: ${summary.skippedCount} | ❌ 실패: ${summary.failCount}`);
  console.log(`  📝 신규: ${totalNewDeals} | 🔄 업데이트: ${totalUpdatedDeals}`);
  console.log(`  💰 토큰: ${totalTokens} (${summary.estimatedCost})`);

  return NextResponse.json(summary);
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${seconds}초`;
  return `${minutes}분 ${remainingSeconds}초`;
}
