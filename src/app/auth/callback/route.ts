import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * /auth/callback
 * 
 * Supabase 인증 콜백 엔드포인트
 * 
 * 1) SNS OAuth 로그인: code → session 교환 → 프로필 저장 → 온보딩/홈
 * 2) 비밀번호 재설정: code + type=recovery → session 교환 → /auth/reset-password
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
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
            } catch {
              // 무시
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // ── ✅ 비밀번호 재설정 (recovery) 처리 ──
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/auth/reset-password', requestUrl.origin));
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // ── ✅ profiles 테이블에 프로필 정보 저장 ──
          await saveProviderProfile(user);

          // 온보딩 여부 체크
          const { data: profile } = await supabase
            .from('profiles')
            .select('interest_categories, marketing_agreed')
            .eq('id', user.id)
            .single();

          // 관심 카테고리가 비어있고 마케팅 동의가 null → 신규 (온보딩 필요)
          const isNewUser = !profile ||
            ((!profile.interest_categories || profile.interest_categories.length === 0) &&
            profile.marketing_agreed === null);

          if (isNewUser) {
            return NextResponse.redirect(new URL('/?onboarding=sns', requestUrl.origin));
          }
        }
      } catch {
        // 프로필 조회 실패해도 로그인은 성공시킴
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // 에러 시 auth 페이지로
  return NextResponse.redirect(new URL('/auth?error=callback_failed', requestUrl.origin));
}

/**
 * SNS 로그인 후 user_metadata에서 프로필 정보를 추출하여 profiles 테이블에 저장
 * 카카오/구글 등 Supabase 빌트인 provider 공통 처리
 * 
 * ✅ v2: app_metadata.providers (복수형 배열)로 linked_providers 동기화
 */
async function saveProviderProfile(user: any) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const metadata = user.user_metadata || {};
    const identityData = user.identities?.[0]?.identity_data || {};

    // provider 판별 (카카오/구글 등)
    const provider = user.app_metadata?.provider || 'unknown';

    // ── 프로필 정보 추출 (다양한 키 대응) ──
    const name = metadata.full_name || metadata.name || identityData.full_name || identityData.name || '';
    const nickname = metadata.preferred_username || metadata.user_name || identityData.preferred_username || '';
    const avatarUrl = metadata.avatar_url || metadata.picture || identityData.avatar_url || '';
    const phone = metadata.phone_number || identityData.phone_number || '';

    // 성별 매핑
    const rawGender = metadata.gender || identityData.gender || '';
    let gender = '';
    if (rawGender === 'male' || rawGender === 'M') gender = '남성';
    else if (rawGender === 'female' || rawGender === 'F') gender = '여성';
    else if (rawGender) gender = rawGender;

    // 생년월일 (카카오: birthday=MMDD or MM-DD, birthyear=YYYY)
    const birthyear = metadata.birthyear || identityData.birthyear || '';
    const birthday = metadata.birthday || identityData.birthday || '';
    let birthDate = '';
    if (birthyear && birthday) {
      const formattedBday = birthday.includes('-') ? birthday : `${birthday.slice(0, 2)}-${birthday.slice(2)}`;
      birthDate = `${birthyear}-${formattedBday}`;
    } else if (birthday) {
      birthDate = birthday;
    }

    // ── 업데이트 객체 구성 (비어있지 않은 값만) ──
    const profileUpdate: Record<string, any> = {
      provider,
    };

    if (name) profileUpdate.name = name;
    if (nickname) profileUpdate.nickname = nickname;
    if (avatarUrl) profileUpdate.avatar_url = avatarUrl;
    if (gender) profileUpdate.gender = gender;
    if (birthDate) profileUpdate.birth_date = birthDate;
    if (phone) profileUpdate.phone = phone;

    // ── ✅ v2: linked_providers 동기화 (app_metadata.providers 배열 기반) ──
    const supabaseProviders: string[] = user.app_metadata?.providers || [];

    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('linked_providers')
      .eq('id', user.id)
      .single();

    const currentProviders: string[] = existingProfile?.linked_providers || [];

    const mergedProviders = [...new Set([...currentProviders, ...supabaseProviders])];

    if (!mergedProviders.includes(provider)) {
      mergedProviders.push(provider);
    }

    profileUpdate.linked_providers = mergedProviders;

    // ── profiles 업데이트 ──
    await supabaseAdmin
      .from('profiles')
      .update(profileUpdate)
      .eq('id', user.id);

  } catch (profileError) {
    console.error('Provider profile save error:', profileError);
  }
}
