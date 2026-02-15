import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { dealId } = await params;

  const supabase = await createServerSupabaseClient();

  // 1) 딜 조회 → 리다이렉트 URL 결정
  const { data: deal, error } = await supabase
    .from('deals')
    .select('affiliate_url, landing_url, source_url')
    .eq('id', dealId)
    .single();

  if (error || !deal) {
    // 딜 못 찾으면 홈으로
    return NextResponse.redirect(new URL('/', request.url));
  }

  const redirectUrl = deal.affiliate_url || deal.landing_url || deal.source_url;

  if (!redirectUrl) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2) outbound_clicks 기록 (비동기 — 리다이렉트 지연 방지용 fire-and-forget)
  const referrer = request.headers.get('referer') || null;
  const userAgent = request.headers.get('user-agent') || null;

  // insert + click_out_count 증가를 병렬 실행
  const clickPromise = supabase.from('outbound_clicks').insert({
    deal_id: dealId,
    redirect_url: redirectUrl,
    session_id: null,   // 추후 세션 구현 시 채움
    user_id: null,      // 추후 인증 구현 시 채움
    network_id: null,
  });

  const countPromise = supabase.rpc('increment_click_out_count', {
    deal_id_input: dealId,
  });

  // 둘 다 fire-and-forget (실패해도 리다이렉트는 진행)
  Promise.all([clickPromise, countPromise]).catch(() => {});

  // 3) 302 리다이렉트
  return NextResponse.redirect(redirectUrl, { status: 302 });
}
