import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * /api/me/follows/merchants
 * 
 * GET    — 내 구독 브랜드 목록
 * POST   — 브랜드 구독 { merchant_id }
 * DELETE — 구독 해제 ?merchant_id=xxx
 */

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('followed_merchants')
    .select(`
      id, notify, created_at,
      merchants:merchant_id (id, name, slug, logo_url, brand_color, active_deal_count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ followedMerchants: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const { merchant_id } = await request.json();
  if (!merchant_id) {
    return NextResponse.json({ error: 'merchant_id 필수' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('followed_merchants')
    .insert({ user_id: user.id, merchant_id })
    .select()
    .single();

  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return NextResponse.json({ error: '이미 구독 중입니다' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ follow: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const merchantId = searchParams.get('merchant_id');

  if (!merchantId) {
    return NextResponse.json({ error: 'merchant_id 필수' }, { status: 400 });
  }

  const { error } = await supabase
    .from('followed_merchants')
    .delete()
    .eq('user_id', user.id)
    .eq('merchant_id', merchantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
