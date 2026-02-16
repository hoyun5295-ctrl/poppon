import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL('/', request.url);
  const response = NextResponse.redirect(url);

  // sb- 접두사 쿠키 전부 삭제 (response 객체에 직접 부착)
  request.cookies.getAll().forEach((cookie) => {
    if (cookie.name.startsWith('sb-')) {
      response.cookies.set(cookie.name, '', {
        maxAge: 0,
        path: '/',
      });
    }
  });

  return response;
}
