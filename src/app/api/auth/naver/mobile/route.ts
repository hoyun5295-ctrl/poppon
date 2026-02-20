import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/auth/naver/mobile
 * 
 * 모바일 앱 전용 네이버 OAuth 엔드포인트
 * 앱에서 네이버 인앱 브라우저로 code를 받아온 후,
 * 서버에서 토큰 교환 + Supabase 세션 생성하여 앱에 반환
 * 
 * Body: { code: string, redirect_uri: string }
 * Response: { access_token, refresh_token } 또는 { error }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, redirect_uri } = body;

    if (!code) {
      return NextResponse.json({ error: 'code is required' }, { status: 400 });
    }

    // ── 1. 네이버 access_token 교환 ──
    const tokenRes = await fetch('https://nid.naver.com/oauth2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NAVER_CLIENT_ID!,
        client_secret: process.env.NAVER_CLIENT_SECRET!,
        code,
        state: 'mobile', // 앱에서는 state 검증을 앱 사이드에서 처리
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error('[Naver Mobile] Token error:', tokenData);
      return NextResponse.json({ error: 'token_exchange_failed' }, { status: 400 });
    }

    // ── 2. 네이버 유저 정보 조회 ──
    const profileRes = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profileData = await profileRes.json();

    if (profileData.resultcode !== '00' || !profileData.response) {
      console.error('[Naver Mobile] Profile error:', profileData);
      return NextResponse.json({ error: 'profile_fetch_failed' }, { status: 400 });
    }

    const naverUser = profileData.response;
    const email = naverUser.email;
    const name = naverUser.name || naverUser.nickname || '';
    const avatarUrl = naverUser.profile_image || '';
    const naverId = naverUser.id;

    if (!email) {
      return NextResponse.json({ error: 'no_email' }, { status: 400 });
    }

    // ── 3. Supabase Admin Client (service_role) ──
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
        full_name: name,
        avatar_url: avatarUrl,
        naver_id: naverId,
        provider: 'naver',
      },
    });

    if (!createError) {
      isNewUser = true;
    }

    // ── 5. Magic Link 생성 → 세션 토큰 획득 ──
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('[Naver Mobile] Generate link error:', linkError);
      return NextResponse.json({ error: 'link_generation_failed' }, { status: 500 });
    }

    // 기존 유저인 경우 metadata에 naver 정보 추가
    if (!isNewUser && linkData.user?.id) {
      await supabaseAdmin.auth.admin.updateUserById(linkData.user.id, {
        user_metadata: {
          ...linkData.user.user_metadata,
          naver_id: naverId,
          full_name: name || linkData.user.user_metadata?.full_name,
          avatar_url: avatarUrl || linkData.user.user_metadata?.avatar_url,
        },
      });
    }

    // ── 6. verifyOtp로 실제 세션 생성 ──
    // 앱용이므로 쿠키 대신 토큰을 직접 반환
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
      console.error('[Naver Mobile] Verify OTP error:', verifyError);
      return NextResponse.json({ error: 'session_creation_failed' }, { status: 500 });
    }

    // ── 7. profiles 테이블에 프로필 정보 저장 ──
    const userId = linkData.user?.id;
    if (userId) {
      try {
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('linked_providers')
          .eq('id', userId)
          .single();

        const profileUpdate: Record<string, any> = {
          provider: 'naver',
        };

        if (naverUser.name) profileUpdate.name = naverUser.name;
        if (naverUser.nickname) profileUpdate.nickname = naverUser.nickname;
        if (naverUser.profile_image) profileUpdate.avatar_url = naverUser.profile_image;

        if (naverUser.gender) {
          profileUpdate.gender = naverUser.gender === 'M' ? '남성' : naverUser.gender === 'F' ? '여성' : naverUser.gender;
        }

        if (naverUser.birthyear && naverUser.birthday) {
          profileUpdate.birth_date = `${naverUser.birthyear}-${naverUser.birthday}`;
        } else if (naverUser.birthday) {
          profileUpdate.birth_date = naverUser.birthday;
        }

        if (naverUser.mobile) profileUpdate.phone = naverUser.mobile;

        const currentProviders: string[] = existingProfile?.linked_providers || [];
        if (!currentProviders.includes('naver')) {
          profileUpdate.linked_providers = [...currentProviders, 'naver'];
        }

        await supabaseAdmin
          .from('profiles')
          .update(profileUpdate)
          .eq('id', userId);

      } catch (profileError) {
        console.error('[Naver Mobile] Profile update error:', profileError);
      }
    }

    // ── 8. 앱에 세션 토큰 반환 ──
    return NextResponse.json({
      access_token: verifyData.session.access_token,
      refresh_token: verifyData.session.refresh_token,
      is_new_user: isNewUser,
    });

  } catch (error) {
    console.error('[Naver Mobile] Unexpected error:', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
