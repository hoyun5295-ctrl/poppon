import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    return NextResponse.json({ error: 'ADMIN_SECRET 미설정' }, { status: 500 });
  }

  if (password !== adminSecret) {
    return NextResponse.json({ error: '비밀번호 불일치' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set('admin_token', adminSecret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
