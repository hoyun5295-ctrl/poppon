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
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    console.log('[saved-deals POST] user:', user?.id || 'null');

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const body = await request.json();
    const { deal_id } = body;
    console.log('[saved-deals POST] deal_id:', deal_id);

    if (!deal_id) {
      return NextResponse.json({ error: 'deal_id 필수' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('saved_deals')
      .insert({ user_id: user.id, deal_id })
      .select()
      .single();

    if (error) {
      console.error('[saved-deals POST] supabase error:', error.message, error.code, error.details);
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        return NextResponse.json({ error: '이미 저장된 딜입니다' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[saved-deals POST] success:', data?.id);
    return NextResponse.json({ savedDeal: data });

  } catch (err: any) {
    console.error('[saved-deals POST] unhandled:', err?.message, err?.stack);
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    console.log('[saved-deals DELETE] user:', user?.id || 'null');

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('deal_id');
    console.log('[saved-deals DELETE] deal_id:', dealId);

    if (!dealId) {
      return NextResponse.json({ error: 'deal_id 필수' }, { status: 400 });
    }

    const { error } = await supabase
      .from('saved_deals')
      .delete()
      .eq('user_id', user.id)
      .eq('deal_id', dealId);

    if (error) {
      console.error('[saved-deals DELETE] supabase error:', error.message, error.code);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[saved-deals DELETE] success');
    return NextResponse.json({ ok: true });

  } catch (err: any) {
    console.error('[saved-deals DELETE] unhandled:', err?.message, err?.stack);
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}
