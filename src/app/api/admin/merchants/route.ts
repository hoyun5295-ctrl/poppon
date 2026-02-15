import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// GET /api/admin/merchants
export async function GET(request: NextRequest) {
  const supabase = await createServiceClient();
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const search = searchParams.get('q');

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('merchants')
    .select('*', { count: 'exact' });

  if (search) query = query.ilike('name', `%${search}%`);

  query = query.order('name', { ascending: true }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    merchants: data,
    total: count,
    page,
    limit,
  });
}

// POST /api/admin/merchants
export async function POST(request: NextRequest) {
  const supabase = await createServiceClient();
  const body = await request.json();

  // slug 자동 생성
  if (!body.slug) {
    body.slug = body.name
      .replace(/[^\w\sㄱ-ㅎ가-힣]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase();
  }

  const { data, error } = await supabase
    .from('merchants')
    .insert(body)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ merchant: data }, { status: 201 });
}
