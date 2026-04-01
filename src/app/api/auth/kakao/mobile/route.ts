import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/auth/kakao/mobile
 *
 * 모바일 앱 전용 카카오 OAuth 엔드포인트
 * 앱에서 카카오 네이티브 SDK로 access_token을 받아온 후,
 * 서버에서 유저 검증 + Supabase 세션 생성하여 앱에 반환
 *
 * Body: { kakao_access_token: string }
 * Response: { access_token, refresh_token, is_new_user } 또는 { error }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kakao_access_token } = body;

    if (!kakao_access_token) {
      return NextResponse.json({ error: 'kakao_access_token is required' }, { status: 400 });
    }

    // ── 1. 카카오 유저 정보 조회 ──
    const profileRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${kakao_access_token}` },
    });

    if (!profileRes.ok) {
      console.error('[Kakao Mobile] Profile fetch failed:', profileRes.status);
      return NextResponse.json({ error: 'profile_fetch_failed' }, { status: 400 });
    }

    const kakaoUser = await profileRes.json();
    const kakaoAccount = kakaoUser.kakao_account;

    if (!kakaoAccount?.email) {
      return NextResponse.json({ error: 'no_email', message: '카카오 계정에 이메일이 없습니다. 카카오 설정에서 이메일을 등록해주세요.' }, { status: 400 });
    }

    const email = kakaoAccount.email;
    const name = kakaoAccount.profile?.nickname || '';
    const avatarUrl = kakaoAccount.profile?.profile_image_url || '';
    const kakaoId = String(kakaoUser.id);
    const phone = kakaoAccount.phone_number || '';
    const gender = kakaoAccount.gender; // 'male' | 'female'
    const birthday = kakaoAccount.birthday; // 'MMDD'
    const birthyear = kakaoAccount.birthyear; // 'YYYY'

    // ── 2. Supabase Admin Client (service_role) ──
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ── 3. 유저 생성 또는 기존 매칭 ──
    let isNewUser = false;

    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        avatar_url: avatarUrl,
        kakao_id: kakaoId,
        provider: 'kakao',
      },
    });

    if (!createError) {
      isNewUser = true;
    }

    // ── 4. Magic Link 생성 → 세션 토큰 획득 ──
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('[Kakao Mobile] Generate link error:', linkError);
      return NextResponse.json({ error: 'link_generation_failed' }, { status: 500 });
    }

    // 기존 유저인 경우 metadata에 kakao 정보 추가
    if (!isNewUser && linkData.user?.id) {
      await supabaseAdmin.auth.admin.updateUserById(linkData.user.id, {
        user_metadata: {
          ...linkData.user.user_metadata,
          kakao_id: kakaoId,
          full_name: name || linkData.user.user_metadata?.full_name,
          avatar_url: avatarUrl || linkData.user.user_metadata?.avatar_url,
        },
      });
    }

    // ── 5. verifyOtp로 실제 세션 생성 ──
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
      console.error('[Kakao Mobile] Verify OTP error:', verifyError);
      return NextResponse.json({ error: 'session_creation_failed' }, { status: 500 });
    }

    // ── 6. profiles 테이블에 프로필 정보 저장 ──
    const userId = linkData.user?.id;
    if (userId) {
      try {
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('linked_providers')
          .eq('id', userId)
          .single();

        const profileUpdate: Record<string, any> = {
          provider: 'kakao',
        };

        if (name) profileUpdate.name = name;
        if (avatarUrl) profileUpdate.avatar_url = avatarUrl;

        if (gender) {
          profileUpdate.gender = gender === 'male' ? '남성' : gender === 'female' ? '여성' : gender;
        }

        if (birthyear && birthday) {
          // birthday: 'MMDD' → 'MM-DD'
          const mm = birthday.substring(0, 2);
          const dd = birthday.substring(2, 4);
          profileUpdate.birth_date = `${birthyear}-${mm}-${dd}`;
        }

        if (phone) {
          // 카카오 전화번호: '+82 10-1234-5678' → '010-1234-5678'
          profileUpdate.phone = phone.replace(/^\+82\s?/, '0');
        }

        const currentProviders: string[] = existingProfile?.linked_providers || [];
        if (!currentProviders.includes('kakao')) {
          profileUpdate.linked_providers = [...currentProviders, 'kakao'];
        }

        await supabaseAdmin
          .from('profiles')
          .update(profileUpdate)
          .eq('id', userId);

      } catch (profileError) {
        console.error('[Kakao Mobile] Profile update error:', profileError);
      }
    }

    // ── 7. 앱에 세션 토큰 반환 ──
    return NextResponse.json({
      access_token: verifyData.session.access_token,
      refresh_token: verifyData.session.refresh_token,
      is_new_user: isNewUser,
    });

  } catch (error) {
    console.error('[Kakao Mobile] Unexpected error:', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
