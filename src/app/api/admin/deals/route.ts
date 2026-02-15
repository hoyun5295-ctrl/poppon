import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// GET /api/admin/deals — 딜 목록 조회
export async function GET(request: NextRequest) {
  const supabase = await createServiceClient();
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status');
  const categoryId = searchParams.get('category_id');
  const merchantId = searchParams.get('merchant_id');
  const search = searchParams.get('q');
  const sortBy = searchParams.get('sort') || 'created_at';
  const sortOrder = searchParams.get('order') || 'desc';

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('deals')
    .select('*, merchants(name, logo_url), categories(name, icon)', { count: 'exact' });

  if (status) query = query.eq('status', status);
  if (categoryId) query = query.eq('category_id', categoryId);
  if (merchantId) query = query.eq('merchant_id', merchantId);
  if (search) query = query.ilike('title', `%${search}%`);

  query = query
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    deals: data,
    total: count,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  });
}

// POST /api/admin/deals — 딜 생성
export async function POST(request: NextRequest) {
  const supabase = await createServiceClient();
  const body = await request.json();

  // slug 자동 생성
  if (!body.slug) {
    const timestamp = Date.now().toString(36);
    const cleanTitle = body.title
      .replace(/[^\w\sㄱ-ㅎ가-힣]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase()
      .substring(0, 80);
    body.slug = `${cleanTitle}-${timestamp}`;
  }

  const { data, error } = await supabase
    .from('deals')
    .insert(body)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ deal: data }, { status: 201 });
}
