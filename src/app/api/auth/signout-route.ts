import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  // 1. 서버 사이드 signOut — SSR 쿠키 핸들러를 통해 확실하게 쿠키 삭제
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  } catch {
    // signOut 실패해도 쿠키는 수동 삭제
  }

  // 2. 안전장치: sb- 접두사 쿠키 수동 삭제
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    for (const cookie of allCookies) {
      if (cookie.name.startsWith('sb-')) {
        cookieStore.set(cookie.name, '', {
          maxAge: 0,
          path: '/',
        });
      }
    }
  } catch {
    // 쿠키 삭제 실패 무시
  }

  return NextResponse.json({ success: true });
}
