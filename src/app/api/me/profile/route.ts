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

  // service_role로 RLS 우회하여 확실하게 조회
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
 * 프로필 부분 업데이트 (관심 카테고리, 알림 채널, 마케팅 동의, 푸시 설정)
 * 
 * body: { interest_categories?: string[], marketing_channel?: string[], marketing_agreed?: boolean, push_enabled?: boolean }
 */
export async function PATCH(request: NextRequest) {
  // anon 클라이언트로 인증 확인
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // body 파싱
  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // 허용된 필드만 추출 (안전)
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
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  // service_role 클라이언트로 RLS 우회하여 확실하게 저장
  const serviceClient = await createServiceClient();
  const { error } = await serviceClient
    .from('profiles')
    .update(updateData)
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
