import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * DELETE /api/me/delete-account
 * 
 * 회원 탈퇴 요청 (pending):
 * 1. profiles.status → 'pending_withdrawal' (어드민 승인 전)
 * 2. withdrawn_at 기록
 * 3. withdraw_reason 기록
 * 
 * ※ 어드민 승인 후 → status: 'withdrawn' → 30일 후 완전 삭제
 * ※ 어드민 거부 시 → status: 'active' 복원
 * ※ pending_withdrawal 상태에서도 서비스 이용 가능 (세션 유지)
 */
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch { /* ignore */ }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    // 이미 pending_withdrawal인지 확인
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: currentProfile } = await adminClient
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single();

    if (currentProfile?.status === 'pending_withdrawal') {
      return NextResponse.json({ error: '이미 탈퇴 요청이 접수되어 심사 중입니다' }, { status: 400 });
    }

    if (currentProfile?.status === 'withdrawn') {
      return NextResponse.json({ error: '이미 탈퇴 처리된 계정입니다' }, { status: 400 });
    }

    // 탈퇴 사유 (optional)
    let reason = '';
    try {
      const body = await request.json();
      reason = body.reason || '';
    } catch { /* no body */ }

    // pending_withdrawal로 변경 (어드민 승인 대기)
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        status: 'pending_withdrawal',
        withdrawn_at: new Date().toISOString(),
        withdraw_reason: reason,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json({ error: '탈퇴 요청 중 오류가 발생했습니다' }, { status: 500 });
    }

    // ✅ 세션 종료하지 않음 — pending 상태에서도 서비스 이용 가능

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({ error: '탈퇴 요청 중 오류가 발생했습니다' }, { status: 500 });
  }
}
