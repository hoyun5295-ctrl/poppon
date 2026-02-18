import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET: 구독 브랜드 목록
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('followed_merchants')
    .select('id, merchant_id, created_at, merchants(id, name, slug, logo_url, active_deal_count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ followedMerchants: data || [] });
}

// POST: 브랜드 구독
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { merchant_id } = body;

  if (!merchant_id) {
    return NextResponse.json({ error: 'merchant_id required' }, { status: 400 });
  }

  // 중복 체크
  const { data: existing } = await supabase
    .from('followed_merchants')
    .select('id')
    .eq('user_id', user.id)
    .eq('merchant_id', merchant_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'Already followed' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('followed_merchants')
    .insert({ user_id: user.id, merchant_id })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ follow: data }, { status: 201 });
}

// DELETE: 브랜드 구독 해제
export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const merchant_id = searchParams.get('merchant_id');

  if (!merchant_id) {
    return NextResponse.json({ error: 'merchant_id required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('followed_merchants')
    .delete()
    .eq('user_id', user.id)
    .eq('merchant_id', merchant_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
