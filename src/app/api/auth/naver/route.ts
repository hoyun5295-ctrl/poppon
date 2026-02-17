import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * /api/auth/naver
 * 
 * 네이버 OAuth 로그인 시작
 * - CSRF 방지용 state 생성 → 쿠키 저장
 * - 네이버 OAuth 인증 페이지로 리다이렉트
 */
export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const clientId = process.env.NAVER_CLIENT_ID!;
  const redirectUri = `${origin}/auth/callback/naver`;

  // CSRF 방지용 state 생성
  const state = crypto.randomUUID();

  // state를 쿠키에 저장 (콜백에서 검증)
  const cookieStore = await cookies();
  cookieStore.set('naver_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 300, // 5분
    path: '/',
  });

  // 네이버 OAuth 인증 URL 구성
  const naverAuthUrl = new URL('https://nid.naver.com/oauth2.0/authorize');
  naverAuthUrl.searchParams.set('response_type', 'code');
  naverAuthUrl.searchParams.set('client_id', clientId);
  naverAuthUrl.searchParams.set('redirect_uri', redirectUri);
  naverAuthUrl.searchParams.set('state', state);

  return NextResponse.redirect(naverAuthUrl.toString());
}
