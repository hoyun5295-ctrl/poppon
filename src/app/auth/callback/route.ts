import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * /auth/callback
 * 
 * SNS OAuth 로그인 후 Supabase가 리다이렉트하는 콜백 엔드포인트
 * code → session 교환 후:
 *   - 신규 유저 → /?onboarding=sns (카테고리+마케팅 동의 온보딩)
 *   - 기존 유저 → / (토스트만 표시)
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
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
      // 신규 유저인지 확인: profiles에서 온보딩 완료 여부 체크
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
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
