import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/me/profile
 * 로그인한 유저의 전체 프로필 정보 반환
 */
export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceClient = await createServiceClient();
  const { data: profile, error } = await serviceClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile });
}

/**
 * PATCH /api/me/profile
 * 프로필 부분 업데이트
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('[PATCH /api/me/profile] auth failed:', authError?.message);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[PATCH /api/me/profile] user:', user.id);

  // body 파싱
  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log('[PATCH /api/me/profile] body:', JSON.stringify(body));

  // 허용된 필드만 추출
  const allowedFields = ['interest_categories', 'marketing_channel', 'marketing_agreed', 'push_enabled'];
  const updateData: Record<string, any> = {};

  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  // marketing_agreed 변경 시 동의 시각 자동 처리
  if ('marketing_agreed' in updateData) {
    updateData.marketing_agreed_at = updateData.marketing_agreed
      ? new Date().toISOString()
      : null;
  }

  if (Object.keys(updateData).length === 0) {
    console.error('[PATCH /api/me/profile] no valid fields');
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  console.log('[PATCH /api/me/profile] updateData:', JSON.stringify(updateData));

  const serviceClient = await createServiceClient();
  const { data, error } = await serviceClient
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)
    .select('id, interest_categories, marketing_agreed, marketing_channel');

  console.log('[PATCH /api/me/profile] result:', JSON.stringify({ data, error: error?.message }));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, updated: data });
}
