import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';

/**
 * /api/auth/reset-password
 * 
 * 두 가지 방식의 비밀번호 변경을 지원:
 * 
 * POST — 로그인 상태에서 직접 변경 (마이페이지)
 *   - 세션 쿠키로 유저 식별 → service_role로 비밀번호 변경
 *   - recovery 세션 없음, auth lock 없음
 * 
 * PATCH — 이메일 링크 토큰 기반 변경 (비로그인)
 *   - admin.generateLink()에서 발급한 token_hash로 유저 검증
 *   - 서버에서만 verifyOtp 호출 → 브라우저 쿠키/세션 영향 0
 *   - recovery 세션 없음
 */

// ════════════════════════════════════════════
// POST: 로그인 상태에서 비밀번호 직접 변경
// ════════════════════════════════════════════
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
        { error: '로그인이 필요합니다.' },
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

// ════════════════════════════════════════════
// PATCH: 이메일 링크 토큰 기반 비밀번호 변경 (비로그인)
// ════════════════════════════════════════════
export async function PATCH(request: NextRequest) {
  try {
    const { token_hash, type, password } = await request.json();

    // ── 입력 검증 ──
    if (!token_hash || !type) {
      return NextResponse.json(
        { error: '유효하지 않은 링크입니다. 비밀번호 재설정을 다시 요청해 주세요.' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // ── service_role 클라이언트로 토큰 검증 ──
    // 서버에서만 실행 → 브라우저 쿠키/세션 영향 0
    const serviceClient = await createServiceClient();

    const { data: verifyData, error: verifyError } = await serviceClient.auth.verifyOtp({
      token_hash,
      type: 'recovery',
    });

    if (verifyError || !verifyData?.user) {
      return NextResponse.json(
        { error: '링크가 만료되었거나 유효하지 않습니다. 비밀번호 재설정을 다시 요청해 주세요.' },
        { status: 400 }
      );
    }

    // ── 비밀번호 변경 ──
    const { error: updateError } = await serviceClient.auth.admin.updateUserById(
      verifyData.user.id,
      { password }
    );

    if (updateError) {
      if (updateError.message.includes('same_password') || updateError.message.includes('different_password')) {
        return NextResponse.json(
          { error: '기존 비밀번호와 동일합니다. 다른 비밀번호를 입력해 주세요.' },
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
