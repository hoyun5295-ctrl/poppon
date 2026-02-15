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

  // 2) 세션 ID 읽기 (클라이언트 쿠키)
  const sessionId = request.cookies.get('ppn_sid')?.value || null;

  // 3) 기록 — outbound_clicks + deal_actions + click_out_count 병렬 실행
  const clickPromise = supabase.from('outbound_clicks').insert({
    deal_id: dealId,
    redirect_url: redirectUrl,
    session_id: sessionId,
    user_id: null,      // 추후 인증 구현 시 채움
    network_id: null,
  });

  const actionPromise = supabase.from('deal_actions').insert({
    deal_id: dealId,
    action_type: 'click_out',
    session_id: sessionId,
    user_id: null,
  });

  const countPromise = supabase.rpc('increment_click_out_count', {
    deal_id_input: dealId,
  });

  // 전부 fire-and-forget (실패해도 리다이렉트는 진행)
  Promise.all([clickPromise, actionPromise, countPromise]).catch(() => {});

  // 4) 302 리다이렉트
  return NextResponse.redirect(redirectUrl, { status: 302 });
}
