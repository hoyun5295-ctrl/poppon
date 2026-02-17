import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * /auth/callback/naver
 * 
 * 네이버 OAuth 콜백 엔드포인트
 * 1. code + state 검증
 * 2. 네이버 access_token 교환
 * 3. 네이버 유저 정보 조회
 * 4. Supabase 유저 생성 또는 기존 매칭
 * 5. 세션 설정 (magiclink 방식)
 * 6. 신규 → /?onboarding=sns / 기존 → /
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');

  const cookieStore = await cookies();
  const savedState = cookieStore.get('naver_oauth_state')?.value;

  // ── 1. State 검증 (CSRF 방지) ──
  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(new URL('/auth?error=invalid_state', origin));
  }

  // state 쿠키 삭제
  cookieStore.delete('naver_oauth_state');

  try {
    // ── 2. 네이버 access_token 교환 ──
    const tokenRes = await fetch('https://nid.naver.com/oauth2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NAVER_CLIENT_ID!,
        client_secret: process.env.NAVER_CLIENT_SECRET!,
        code,
        state,
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error('Naver token error:', tokenData);
      return NextResponse.redirect(new URL('/auth?error=token_failed', origin));
    }

    // ── 3. 네이버 유저 정보 조회 ──
    const profileRes = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profileData = await profileRes.json();

    if (profileData.resultcode !== '00' || !profileData.response) {
      console.error('Naver profile error:', profileData);
      return NextResponse.redirect(new URL('/auth?error=profile_failed', origin));
    }

    const naverUser = profileData.response;
    const email = naverUser.email;
    const name = naverUser.name || naverUser.nickname || '';
    const avatarUrl = naverUser.profile_image || '';
    const naverId = naverUser.id;

    if (!email) {
      return NextResponse.redirect(new URL('/auth?error=no_email', origin));
    }

    // ── 4. Supabase Admin Client (service_role) ──
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ── 5. 유저 생성 또는 기존 매칭 ──
    let isNewUser = false;

    // 먼저 신규 유저 생성 시도
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        avatar_url: avatarUrl,
        naver_id: naverId,
        provider: 'naver',
      },
    });

    if (!createError) {
      isNewUser = true;
    }
    // 이미 존재하는 유저면 createError 발생 → 무시하고 진행

    // ── 6. Magic Link 생성 → 세션 토큰 획득 ──
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('Generate link error:', linkError);
      return NextResponse.redirect(new URL('/auth?error=link_failed', origin));
    }

    // 기존 유저인 경우 metadata에 naver 정보 추가
    if (!isNewUser && linkData.user?.id) {
      await supabaseAdmin.auth.admin.updateUser(linkData.user.id, {
        user_metadata: {
          ...linkData.user.user_metadata,
          naver_id: naverId,
          full_name: name || linkData.user.user_metadata?.full_name,
          avatar_url: avatarUrl || linkData.user.user_metadata?.avatar_url,
        },
      });
    }

    // ── 7. 서버사이드 Supabase Client로 verifyOtp → 세션 쿠키 설정 ──
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
            } catch {
              // 무시
            }
          },
        },
      }
    );

    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: 'magiclink',
    });

    if (verifyError) {
      console.error('Verify OTP error:', verifyError);
      return NextResponse.redirect(new URL('/auth?error=verify_failed', origin));
    }

    // ── 8. 리다이렉트 ──
    if (isNewUser) {
      return NextResponse.redirect(new URL('/?onboarding=sns', origin));
    }

    // 기존 유저: 온보딩 완료 여부 체크
    try {
      const userId = linkData.user?.id;
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('interest_categories, marketing_agreed')
          .eq('id', userId)
          .single();

        const needsOnboarding = !profile ||
          ((!profile.interest_categories || profile.interest_categories.length === 0) &&
           profile.marketing_agreed === null);

        if (needsOnboarding) {
          return NextResponse.redirect(new URL('/?onboarding=sns', origin));
        }
      }
    } catch {
      // 프로필 조회 실패해도 로그인은 성공시킴
    }

    return NextResponse.redirect(new URL('/', origin));

  } catch (error) {
    console.error('Naver OAuth callback error:', error);
    return NextResponse.redirect(new URL('/auth?error=callback_failed', origin));
  }
}
