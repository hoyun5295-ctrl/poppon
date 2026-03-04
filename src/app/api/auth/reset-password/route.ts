import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/reset-password
 * 
 * 서버에서 비밀번호 변경 (service_role 사용)
 * 클라이언트에서 supabase.auth.updateUser() 호출 시 auth lock 문제 발생하므로
 * 마이페이지 프로필 저장과 동일한 패턴으로 서버 API 통일
 */
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 1) 세션 쿠키로 유저 식별 (anon key)
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: '인증이 만료되었습니다. 마이페이지에서 비밀번호 재설정을 다시 요청해 주세요.' },
        { status: 401 }
      );
    }

    // 2) service_role로 비밀번호 변경
    const serviceClient = await createServiceClient();
    const { error: updateError } = await serviceClient.auth.admin.updateUserById(
      user.id,
      { password }
    );

    if (updateError) {
      if (updateError.message.includes('same_password') || updateError.message.includes('different_password')) {
        return NextResponse.json(
          { error: '현재 비밀번호와 동일합니다. 다른 비밀번호를 입력해 주세요.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: updateError.message || '비밀번호 변경에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
