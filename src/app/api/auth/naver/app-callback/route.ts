import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/auth/naver/app-callback
 *
 * 모바일 앱 전용 네이버 OAuth 콜백 엔드포인트
 * 네이버 → 이 엔드포인트 → poppon://auth/callback (앱으로 리다이렉트)
 *
 * ⚠️ Android Chrome Custom Tabs는 HTTP 307 redirect → custom scheme(poppon://)을 자동 follow하지 않음.
 * iOS ASWebAuthenticationSession은 자동 follow됨.
 * → 모든 deep link redirect를 HTML + JS window.location 으로 통일 (양쪽 모두 정상 작동).
 */

// HTML page를 응답해서 JS로 deep link 트리거 (Android Custom Tabs 호환)
function deepLinkRedirect(url: string): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>로그인 처리 중</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fff; color: #333; }
    .box { text-align: center; }
    .spinner { width: 32px; height: 32px; border: 3px solid #eee; border-top-color: #03C75A; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="box">
    <div class="spinner"></div>
    <p>로그인 처리 중...</p>
  </div>
  <script>
    window.location.href = ${JSON.stringify(url)};
  </script>
</body>
</html>`;
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return deepLinkRedirect('poppon://auth/error?message=no_code');
    }

    // ── 1. code → access_token 교환 ──
    const tokenRes = await fetch('https://nid.naver.com/oauth2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NAVER_CLIENT_ID!,
        client_secret: process.env.NAVER_CLIENT_SECRET!,
        code,
        state: 'mobile_app',
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error('[Naver AppCallback] Token error:', tokenData);
      return deepLinkRedirect('poppon://auth/error?message=token_failed');
    }

    // ── 2. 네이버 유저 정보 조회 ──
    const profileRes = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profileData = await profileRes.json();

    if (profileData.resultcode !== '00' || !profileData.response) {
      console.error('[Naver AppCallback] Profile error:', profileData);
      return deepLinkRedirect('poppon://auth/error?message=profile_failed');
    }

    const naverUser = profileData.response;
    const email = naverUser.email;

    if (!email) {
      return deepLinkRedirect('poppon://auth/error?message=no_email');
    }

    // ── 3. Supabase Admin Client ──
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ── 4. 유저 생성 또는 기존 매칭 ──
    let isNewUser = false;

    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: naverUser.name || naverUser.nickname || '',
        avatar_url: naverUser.profile_image || '',
        naver_id: naverUser.id,
        provider: 'naver',
      },
    });

    if (!createError) {
      isNewUser = true;
    }

    // ── 5. Magic Link → 세션 토큰 ──
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('[Naver AppCallback] Generate link error:', linkError);
      return deepLinkRedirect('poppon://auth/error?message=link_failed');
    }

    // 기존 유저 metadata 업데이트
    if (!isNewUser && linkData.user?.id) {
      await supabaseAdmin.auth.admin.updateUserById(linkData.user.id, {
        user_metadata: {
          ...linkData.user.user_metadata,
          naver_id: naverUser.id,
          full_name: naverUser.name || linkData.user.user_metadata?.full_name,
          avatar_url: naverUser.profile_image || linkData.user.user_metadata?.avatar_url,
        },
      });
    }

    // ── 6. verifyOtp → 세션 ──
    const { createClient: createAnonClient } = await import('@supabase/supabase-js');
    const supabaseAnon = createAnonClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: verifyData, error: verifyError } = await supabaseAnon.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: 'magiclink',
    });

    if (verifyError || !verifyData.session) {
      console.error('[Naver AppCallback] Verify error:', verifyError);
      return deepLinkRedirect('poppon://auth/error?message=session_failed');
    }

    // ── 7. profiles 업데이트 ──
    const userId = linkData.user?.id;
    if (userId) {
      try {
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('linked_providers')
          .eq('id', userId)
          .single();

        const profileUpdate: Record<string, any> = { provider: 'naver' };
        if (naverUser.name) profileUpdate.name = naverUser.name;
        if (naverUser.nickname) profileUpdate.nickname = naverUser.nickname;
        if (naverUser.profile_image) profileUpdate.avatar_url = naverUser.profile_image;
        if (naverUser.gender) {
          profileUpdate.gender = naverUser.gender === 'M' ? '남성' : naverUser.gender === 'F' ? '여성' : naverUser.gender;
        }
        if (naverUser.birthyear && naverUser.birthday) {
          profileUpdate.birth_date = `${naverUser.birthyear}-${naverUser.birthday}`;
        }
        if (naverUser.mobile) profileUpdate.phone = naverUser.mobile;

        const currentProviders: string[] = existingProfile?.linked_providers || [];
        if (!currentProviders.includes('naver')) {
          profileUpdate.linked_providers = [...currentProviders, 'naver'];
        }

        await supabaseAdmin.from('profiles').update(profileUpdate).eq('id', userId);
      } catch (e) {
        console.error('[Naver AppCallback] Profile update error:', e);
      }
    }

    // ── 8. 앱으로 deep link (HTML + JS) ──
    const appRedirect = `poppon://auth/callback?access_token=${encodeURIComponent(verifyData.session.access_token)}&refresh_token=${encodeURIComponent(verifyData.session.refresh_token)}&is_new_user=${isNewUser}`;
    return deepLinkRedirect(appRedirect);

  } catch (error) {
    console.error('[Naver AppCallback] Unexpected error:', error);
    return deepLinkRedirect('poppon://auth/error?message=internal_error');
  }
}
