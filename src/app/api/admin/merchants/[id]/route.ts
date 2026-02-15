import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/admin/merchants/[id]
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ merchant: data });
}

// PUT /api/admin/merchants/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createServiceClient();
  const body = await request.json();
  body.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('merchants')
    .update(body)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ merchant: data });
}

// DELETE /api/admin/merchants/[id]
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createServiceClient();

  const { error } = await supabase
    .from('merchants')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
