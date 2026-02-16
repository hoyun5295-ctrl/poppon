import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * DELETE /api/me/delete-account
 * 
 * 회원 탈퇴 (soft delete):
 * 1. profiles.status → 'withdrawn'
 * 2. withdrawn_at 기록
 * 3. 세션 종료 (로그아웃)
 * 
 * ※ 실제 데이터 삭제는 어드민 Cron에서 30일 후 처리
 * ※ 어드민에서 복구 가능
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

    // 탈퇴 사유 (optional)
    let reason = '';
    try {
      const body = await request.json();
      reason = body.reason || '';
    } catch { /* no body */ }

    // service_role로 profiles 업데이트 (RLS 우회)
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        status: 'withdrawn',
        withdrawn_at: new Date().toISOString(),
        withdraw_reason: reason,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json({ error: '탈퇴 처리 중 오류가 발생했습니다' }, { status: 500 });
    }

    // 세션 종료
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({ error: '탈퇴 처리 중 오류가 발생했습니다' }, { status: 500 });
  }
}
