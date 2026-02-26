/**
 * KMC 본인인증 콜백 (tr_url)
 *
 * POST /api/kmc/callback
 * ← KMC가 인증 완료 후 apiToken + certNum을 form POST로 전송
 * → 토큰 검증 API 호출 → 복호화 → profiles 저장 → 부모 창에 postMessage
 */

import { NextRequest, NextResponse } from 'next/server';
import { kmcExec, decryptRecCert, getKstDateString } from '@/lib/kmc/crypto';
import {
  createServerSupabaseClient,
  createServiceClient,
} from '@/lib/supabase/server';

// ─── KMC 토큰 검증 API ───
const KMC_TOKEN_API =
  'https://www.kmcert.com/kmcis/api/kmcisToken_api.jsp';

export async function POST(req: NextRequest) {
  try {
    // ── 1. KMC에서 전송한 apiToken, certNum 수신 ──
    const formData = await req.formData();
    let apiToken = (formData.get('apiToken') as string) || '';
    let certNum = (formData.get('certNum') as string) || '';

    if (
      !apiToken ||
      apiToken === 'null' ||
      apiToken === 'undefined' ||
      !certNum ||
      certNum === 'null' ||
      certNum === 'undefined'
    ) {
      return returnHtml({
        success: false,
        error: '인증 정보가 유효하지 않습니다.',
      });
    }

    // ── 2. apiToken, certNum 복호화 ──
    const decApiToken = await kmcExec('dec', apiToken);
    const decCertNum = await kmcExec('dec', certNum);

    if (!decApiToken || !decCertNum) {
      return returnHtml({
        success: false,
        error: '인증 정보 복호화에 실패했습니다.',
      });
    }

    // ── 3. KMC 토큰 검증 API 호출 ──
    const apiDate = getKstDateString();

    const tokenRes = await fetch(KMC_TOKEN_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        apiToken: decApiToken,
        apiDate,
      }),
    });

    if (!tokenRes.ok) {
      console.error('[KMC callback] Token API HTTP error:', tokenRes.status);
      return returnHtml({
        success: false,
        error: 'KMC 서버 통신에 실패했습니다.',
      });
    }

    const tokenJson = await tokenRes.json();

    if (tokenJson.result_cd !== 'APR01') {
      console.error('[KMC callback] Token API result:', tokenJson.result_cd);
      return returnHtml({
        success: false,
        error: getTokenErrorMessage(tokenJson.result_cd),
      });
    }

    // ── 4. 결과 데이터 복호화 ──
    const data = await decryptRecCert(tokenJson.apiRecCert);

    if (data.result !== 'Y') {
      return returnHtml({
        success: false,
        error: '본인인증에 실패하였습니다.',
      });
    }

    console.log('[KMC callback] 인증 성공:', {
      name: data.name,
      phoneNo: data.phoneNo.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
    });

    // ── 5. 로그인된 유저의 profiles 업데이트 ──
    let profileSaved = false;
    try {
      const anonSb = await createServerSupabaseClient();
      const {
        data: { user },
      } = await anonSb.auth.getUser();

      if (user) {
        const serviceSb = await createServiceClient();
        const { error: updateError } = await serviceSb
          .from('profiles')
          .update({
            phone: data.phoneNo,
            name: data.name,
            ci: data.ci,
            di: data.di,
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('[KMC callback] Profile update error:', updateError);
        } else {
          profileSaved = true;
        }
      }
    } catch (profileErr) {
      console.error('[KMC callback] Profile save error:', profileErr);
    }

    // ── 6. 부모 창에 결과 전달 (HTML) ──
    return returnHtml({
      success: true,
      data: {
        name: data.name,
        phoneNo: data.phoneNo,
        profileSaved,
      },
    });
  } catch (error) {
    console.error('[KMC callback] Unexpected error:', error);
    return returnHtml({
      success: false,
      error: '인증 처리 중 오류가 발생했습니다.',
    });
  }
}

// ─── 토큰 API 에러 메시지 ───
function getTokenErrorMessage(code: string): string {
  const map: Record<string, string> = {
    APR02: '인증 시간이 만료되었습니다. 다시 시도해주세요.',
    APR03: '인증 토큰을 찾을 수 없습니다.',
    APR04: '요청 일시 형식 오류',
    APR05: '토큰 형식 오류',
    APR06: '재요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',
  };
  return map[code] || '인증 처리 중 오류가 발생했습니다.';
}

// ─── 결과 HTML (팝업 → 부모 postMessage → 닫기) ───
function returnHtml(result: {
  success: boolean;
  error?: string;
  data?: { name: string; phoneNo: string; profileSaved: boolean };
}) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>본인인증 처리중</title>
  <style>
    body { display:flex; align-items:center; justify-content:center; min-height:100vh;
           font-family:-apple-system,sans-serif; background:#f8f9fa; margin:0; }
    .box { text-align:center; padding:2rem; }
    .spinner { width:40px; height:40px; border:3px solid #e9ecef; border-top:3px solid #FF3B5C;
               border-radius:50%; animation:spin 0.8s linear infinite; margin:0 auto 1rem; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .msg { color:#495057; font-size:14px; }
    .btn { margin-top:1rem; padding:10px 24px; background:#FF3B5C; color:#fff;
           border:none; border-radius:8px; font-size:14px; cursor:pointer; }
  </style>
</head>
<body>
  <div class="box" id="box">
    <div class="spinner"></div>
    <p class="msg">인증 결과를 처리하고 있습니다...</p>
  </div>
  <script>
    (function() {
      var result = ${JSON.stringify(result)};

      function showFallback() {
        var box = document.getElementById('box');
        if (result.success) {
          box.innerHTML = '<p class="msg">✅ 본인인증이 완료되었습니다.</p>'
            + '<button class="btn" onclick="window.close()">닫기</button>';
        } else {
          box.innerHTML = '<p class="msg">❌ ' + (result.error || '인증 실패') + '</p>'
            + '<button class="btn" onclick="window.close()">닫기</button>';
        }
      }

      // Desktop: 부모 창에 postMessage → 팝업 닫기
      if (window.opener) {
        try {
          window.opener.postMessage({ type: 'KMC_RESULT', payload: result }, '*');
          setTimeout(function() { window.close(); }, 300);
        } catch (e) {
          showFallback();
        }
        return;
      }

      // Mobile (앱): 딥링크로 결과 전달
      var isApp = /poppon/i.test(navigator.userAgent) ||
                  document.referrer.indexOf('poppon://') > -1;
      if (isApp || /iPhone|iPad|Android/i.test(navigator.userAgent)) {
        try {
          var params = new URLSearchParams({
            success: String(result.success),
            name: (result.data && result.data.name) || '',
            phone: (result.data && result.data.phoneNo) || '',
            error: result.error || ''
          });
          window.location.href = 'poppon://kmc/callback?' + params.toString();
          setTimeout(showFallback, 2000); // 딥링크 실패 시 fallback
        } catch (e) {
          showFallback();
        }
        return;
      }

      // Fallback: 버튼 표시
      showFallback();
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
