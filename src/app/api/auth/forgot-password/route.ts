import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/forgot-password
 * 
 * 비로그인 상태 비밀번호 찾기 (Option B)
 * 
 * 핵심 원칙: recovery 세션을 만들지 않는다.
 * - resetPasswordForEmail()은 callback 경유 → recovery 세션 생성 → 기존 세션 덮어씌움 ❌
 * - admin.generateLink() → 서버에서 토큰 추출 → Resend로 커스텀 이메일 발송 ✅
 * - 이메일 링크: /auth/reset-password?token_hash=XXX&type=recovery
 * - 비밀번호 변경: PATCH /api/auth/reset-password (서버에서 verifyOtp + updateUserById)
 * - /auth/callback 경유 안 함 → recovery 세션 생성 안 함
 * 
 * 보안:
 * - 이메일 존재 여부를 노출하지 않음 (항상 성공 응답)
 * - Supabase 내장 토큰 만료 메커니즘 사용
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: '이메일을 입력해주세요.' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // ── Resend API Key 확인 ──
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('[forgot-password] RESEND_API_KEY 환경변수 미설정');
      return NextResponse.json(
        { error: '이메일 발송 설정이 완료되지 않았습니다.' },
        { status: 500 }
      );
    }

    // ── admin.generateLink로 토큰 생성 ──
    // resetPasswordForEmail()과 달리 이메일을 직접 발송하지 않음
    // 토큰만 추출하여 커스텀 이메일로 발송
    const serviceClient = await createServiceClient();

    const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
      type: 'recovery',
      email: trimmedEmail,
    });

    if (linkError) {
      // 이메일이 존재하지 않는 경우에도 동일한 성공 응답
      // (보안: 이메일 존재 여부 노출 방지)
      console.log('[forgot-password] generateLink error (email may not exist):', linkError.message);
      return NextResponse.json({ success: true });
    }

    // ── 토큰 추출 ──
    const actionLink = linkData?.properties?.action_link;
    const hashedToken = linkData?.properties?.hashed_token;

    if (!actionLink || !hashedToken) {
      console.error('[forgot-password] generateLink 응답에 토큰 없음');
      return NextResponse.json({ success: true }); // 보안: 에러 노출 방지
    }

    // ── 커스텀 리셋 링크 생성 ──
    // /auth/callback 경유 안 함 → recovery 세션 생성 안 함
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://poppon.co.kr';
    const resetUrl = `${origin}/auth/reset-password?token_hash=${encodeURIComponent(hashedToken)}&type=recovery`;

    // ── Resend API로 커스텀 이메일 발송 ──
    const emailHtml = buildResetEmail(resetUrl);

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'POPPON <poppon@poppon.kr>',
        to: trimmedEmail,
        subject: '[POPPON] 비밀번호 재설정',
        html: emailHtml,
      }),
    });

    if (!resendRes.ok) {
      const resendError = await resendRes.text();
      console.error('[forgot-password] Resend API error:', resendError);
      return NextResponse.json(
        { error: '이메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[forgot-password] Unexpected error:', err);
    return NextResponse.json(
      { error: err?.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 비밀번호 재설정 이메일 HTML 템플릿
 * Supabase 이메일 템플릿과 동일한 한국어 브랜딩
 */
function buildResetEmail(resetUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>비밀번호 재설정 - POPPON</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

          <!-- 헤더 -->
          <tr>
            <td style="background-color:#ef4444;padding:32px 24px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                POPPON
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">
                팝콘처럼 터지는 쿠폰
              </p>
            </td>
          </tr>

          <!-- 본문 -->
          <tr>
            <td style="padding:32px 24px;">
              <h2 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#1a1a1a;">
                비밀번호 재설정
              </h2>
              <p style="margin:0 0 24px;font-size:14px;color:#666666;line-height:1.6;">
                아래 버튼을 클릭하여 새 비밀번호를 설정해주세요.
              </p>

              <!-- CTA 버튼 -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${resetUrl}"
                       target="_blank"
                       style="display:inline-block;padding:14px 32px;background-color:#ef4444;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">
                      비밀번호 재설정하기
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:12px;color:#999999;line-height:1.5;">
                이 링크는 <strong>1시간</strong> 동안 유효합니다.
              </p>
              <p style="margin:0;font-size:12px;color:#999999;line-height:1.5;">
                비밀번호 재설정을 요청하지 않으셨다면 이 메일을 무시해주세요.
              </p>
            </td>
          </tr>

          <!-- 푸터 -->
          <tr>
            <td style="padding:20px 24px;border-top:1px solid #f0f0f0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#bbbbbb;">
                &copy; ${new Date().getFullYear()} POPPON (INVITO corp.) &middot; 모든 권리 보유
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
