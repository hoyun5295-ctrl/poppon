import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * /auth/callback/reset
 * 
 * 비밀번호 재설정 전용 콜백
 * resetPasswordForEmail()의 redirectTo로 지정된 경로
 * code → session 교환 후 /auth/reset-password 페이지로 리다이렉트
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

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
      return NextResponse.redirect(new URL('/auth/reset-password', requestUrl.origin));
    }
  }

  // code 없거나 교환 실패 시
  return NextResponse.redirect(new URL('/auth?error=reset_failed', requestUrl.origin));
}
