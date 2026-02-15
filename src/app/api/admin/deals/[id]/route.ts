import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/admin/deals/[id]
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from('deals')
    .select('*, merchants(name, logo_url), categories(name, icon)')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ deal: data });
}

// PUT /api/admin/deals/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createServiceClient();
  const body = await request.json();

  // updated_at 자동 갱신
  body.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('deals')
    .update(body)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ deal: data });
}

// DELETE /api/admin/deals/[id]
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createServiceClient();

  const { error } = await supabase
    .from('deals')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
