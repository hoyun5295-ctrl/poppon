/**
 * POPPON — 단일 커넥터 AI 크롤 실행
 * 
 * 파일 위치: src/app/api/admin/ai-crawl/[connectorId]/route.ts
 * 
 * POST /api/admin/ai-crawl/:connectorId
 *   - 특정 브랜드 하나만 AI 크롤 실행
 *   - body: { autoApprove?: boolean }
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

type RouteParams = { params: Promise<{ connectorId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { connectorId } = await params;
  const supabase = await createServiceClient();
  const body = await request.json().catch(() => ({}));
  const { autoApprove = false } = body;

  // 1. 커넥터 조회
  const { data: connector, error } = await supabase
    .from('crawl_connectors')
    .select('id, name, merchant_id, source_url, config, status, fail_count')
    .eq('id', connectorId)
    .single();

  if (error || !connector) {
    return NextResponse.json({ error: '커넥터를 찾을 수 없습니다' }, { status: 404 });
  }

  // 2. 크롤 로그 시작
  const runId = await createCrawlRunLog(connector.id, supabase);

  try {
    // 3. AI 크롤 실행
    const crawlResult = await crawlWithAI({
      id: connector.id,
      merchant_id: connector.merchant_id,
      name: connector.name,
      source_url: connector.source_url,
      config: connector.config as Record<string, unknown>,
      status: connector.status,
      fail_count: connector.fail_count,
    });

    // 브라우저 정리
    await closeBrowser().catch(() => {});

    if (crawlResult.status === 'failed') {
      if (runId) await failCrawlRunLog(runId, crawlResult.errorMessage || '크롤 실패', supabase);

      await supabase
        .from('crawl_connectors')
        .update({
          fail_count: connector.fail_count + 1,
          status: connector.fail_count >= 4 ? 'error' : 'active',
          last_run_at: new Date().toISOString(),
        })
        .eq('id', connector.id);

      return NextResponse.json({
        status: 'failed',
        connector: connector.name,
        error: crawlResult.errorMessage,
      }, { status: 500 });
    }

    // 4. 딜 저장
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
      { autoApprove }
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

    return NextResponse.json({
      status: 'success',
      connector: connector.name,
      crawl: {
        dealsExtracted: deals.length,
        tokensUsed: crawlResult.tokensUsed,
        estimatedCost: `$${((crawlResult.tokensUsed || 0) * 0.000003).toFixed(4)}`,
      },
      save: {
        new: saveResult.newCount,
        updated: saveResult.updatedCount,
        skipped: saveResult.skippedCount,
        errors: saveResult.errors,
      },
    });

  } catch (err) {
    const errorMsg = (err as Error).message;
    if (runId) await failCrawlRunLog(runId, errorMsg, supabase);
    await closeBrowser().catch(() => {});

    return NextResponse.json({
      status: 'error',
      connector: connector.name,
      error: errorMsg,
    }, { status: 500 });
  }
}
