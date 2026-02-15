/**
 * POPPON — 유저 딜 제보 API
 *
 * POST /api/submit
 *   - body: { url: string, comment?: string }
 *   - 비로그인도 제보 가능 (user_id nullable)
 *   - 중복 URL 체크
 *   - submissions 테이블에 저장 → 운영자 검토
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  let body: { url?: string; comment?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식' }, { status: 400 });
  }

  const { url, comment } = body;

  // 1. URL 검증
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL이 필요합니다' }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: '올바른 URL 형식이 아닙니다' }, { status: 400 });
  }

  // 2. 중복 체크 (같은 URL이 이미 pending 상태로 있는지)
  const { data: existing } = await supabase
    .from('submissions')
    .select('id')
    .eq('url', url.trim())
    .eq('status', 'pending')
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: '이미 제보된 URL입니다. 검토 중이에요!' },
      { status: 409 }
    );
  }

  // 3. 현재 로그인 유저 확인 (없으면 null)
  const { data: { user } } = await supabase.auth.getUser();

  // 4. 제보 저장
  const { data: submission, error } = await supabase
    .from('submissions')
    .insert({
      url: url.trim(),
      comment: comment?.trim() || null,
      user_id: user?.id || null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Submit] 저장 실패:', error.message);

    // submissions 테이블이 없으면 deals에 직접 메모로 남김
    if (error.message.includes('does not exist') || error.code === '42P01') {
      return NextResponse.json(
        { error: '제보 기능 준비 중입니다. 곧 사용 가능해요!' },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: '제보 저장에 실패했습니다' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    submissionId: submission.id,
    message: '제보가 접수되었습니다. 검토 후 등록됩니다.',
  });
}
