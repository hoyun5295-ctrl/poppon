import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * /api/me/saved-deals
 * 
 * GET  — 내 저장 딜 목록
 * POST — 딜 저장
 * DELETE — 딜 저장 해제 (?deal_id=xxx)
 */

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('saved_deals')
    .select(`
      id, created_at,
      deals:deal_id (
        id, title, benefit_summary, deal_type, slug, ends_at, is_evergreen, coupon_code,
        merchants:merchant_id (name, slug, logo_url, brand_color),
        categories!deals_category_id_fkey (name, slug)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ savedDeals: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const { deal_id } = await request.json();
  if (!deal_id) {
    return NextResponse.json({ error: 'deal_id 필수' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('saved_deals')
    .insert({ user_id: user.id, deal_id })
    .select()
    .single();

  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return NextResponse.json({ error: '이미 저장된 딜입니다' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ savedDeal: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dealId = searchParams.get('deal_id');

  if (!dealId) {
    return NextResponse.json({ error: 'deal_id 필수' }, { status: 400 });
  }

  const { error } = await supabase
    .from('saved_deals')
    .delete()
    .eq('user_id', user.id)
    .eq('deal_id', dealId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
