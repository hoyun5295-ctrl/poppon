/**
 * KMC 본인인증 팝업 페이지
 *
 * GET /api/kmc/verify
 * → tr_cert 생성 → 자동 form POST로 KMC 인증 페이지 이동
 *
 * 사용법:
 * - 웹: window.open('/api/kmc/verify', 'kmc_popup', 'width=430,height=600')
 * - 앱: WebBrowser.openBrowserAsync(url)
 */

import { NextRequest, NextResponse } from 'next/server';
import { encryptTrCert, generateCertNum } from '@/lib/kmc/crypto';

const KMC_CP_ID = 'IVTT1001';
const KMC_URL_CODE = '003002';
const KMC_FORM_URL = 'https://www.kmcert.com/kmcis/web/kmcisReq.jsp';

export async function GET(req: NextRequest) {
  try {
    const { certNum, date } = generateCertNum();

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      'https://poppon.vercel.app';

    const trUrl = `${baseUrl}/api/kmc/callback`;

    const trCert = await encryptTrCert({
      cpId: KMC_CP_ID,
      urlCode: KMC_URL_CODE,
      certNum,
      date,
    });

    // 자동 제출 HTML 반환
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>본인인증</title>
  <style>
    body { display:flex; align-items:center; justify-content:center; min-height:100vh;
           font-family:-apple-system,sans-serif; background:#f8f9fa; margin:0; }
    .box { text-align:center; padding:2rem; }
    .spinner { width:40px; height:40px; border:3px solid #e9ecef; border-top:3px solid #FF3B5C;
               border-radius:50%; animation:spin 0.8s linear infinite; margin:0 auto 1rem; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .msg { color:#495057; font-size:14px; }
  </style>
</head>
<body>
  <div class="box">
    <div class="spinner"></div>
    <p class="msg">본인인증 페이지로 이동 중...</p>
  </div>
  <form id="kmcForm" method="POST" action="${KMC_FORM_URL}">
    <input type="hidden" name="tr_cert" value="${trCert}" />
    <input type="hidden" name="tr_url" value="${trUrl}" />
    <input type="hidden" name="tr_add" value="N" />
    <input type="hidden" name="tr_ver" value="V2" />
  </form>
  <script>
    document.getElementById('kmcForm').submit();
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    console.error('[KMC verify] error:', error);

    const errorHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>오류</title>
<style>body{display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:-apple-system,sans-serif;background:#f8f9fa;margin:0;}.box{text-align:center;padding:2rem;}.msg{color:#dc3545;font-size:14px;}.btn{margin-top:1rem;padding:10px 24px;background:#FF3B5C;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;}</style></head>
<body><div class="box"><p class="msg">❌ 본인인증 준비 중 오류가 발생했습니다.</p><button class="btn" onclick="window.close()">닫기</button></div></body></html>`;

    return new NextResponse(errorHtml, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
