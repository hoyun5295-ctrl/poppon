import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// GET /api/admin/categories — 카테고리 목록 (드롭다운용)
export async function GET() {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, icon, parent_id, depth, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 대>중>소 트리 구조로 변환
  const roots = data.filter((c) => !c.parent_id);
  const tree = roots.map((parent) => ({
    ...parent,
    children: data
      .filter((c) => c.parent_id === parent.id)
      .map((mid) => ({
        ...mid,
        children: data.filter((c) => c.parent_id === mid.id),
      })),
  }));

  return NextResponse.json({ categories: data, tree });
}
