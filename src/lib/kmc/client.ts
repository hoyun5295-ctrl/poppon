/**
 * KMC 본인인증 클라이언트 유틸리티
 *
 * 사용법:
 *   const result = await startKmcVerification();
 *   if (result.success) {
 *     console.log(result.data.name, result.data.phoneNo);
 *   }
 */

export interface KmcResult {
  success: boolean;
  error?: string;
  data?: {
    name: string;
    phoneNo: string;
    profileSaved: boolean;
  };
}

/**
 * KMC 본인인증 팝업 실행
 * - 데스크톱: 팝업 → postMessage로 결과 수신
 * - 모바일: 페이지 전환 방식
 */
export async function startKmcVerification(): Promise<KmcResult> {
  // 1. 서버에서 tr_cert 생성
  const res = await fetch('/api/kmc/request', { method: 'POST' });
  if (!res.ok) {
    throw new Error('KMC 요청 생성 실패');
  }
  const { tr_cert, tr_url, tr_add, tr_ver } = await res.json();

  const isMobile =
    /iPhone|iPad|Android|Windows CE|BlackBerry|Symbian|Windows Phone|webOS|Opera Mini|Opera Mobi/i.test(
      navigator.userAgent
    );

  if (isMobile) {
    // 모바일: 현재 페이지에서 form submit (페이지 전환)
    return submitKmcForm({
      tr_cert,
      tr_url,
      tr_add,
      tr_ver,
      target: '_self',
    });
  }

  // 2. 데스크톱: 팝업 열기
  const popup = window.open(
    '',
    'KMCISWindow',
    'width=425,height=550,resizable=0,scrollbars=no,status=0,titlebar=0,toolbar=0,left=435,top=250'
  );

  if (!popup) {
    throw new Error(
      '팝업이 차단되었습니다. 팝업 차단을 해제해주세요.'
    );
  }

  // 3. 팝업에 form 생성 → KMC로 POST
  submitKmcForm({ tr_cert, tr_url, tr_add, tr_ver, target: popup });

  // 4. postMessage 결과 대기
  return new Promise<KmcResult>((resolve) => {
    const cleanup = () => {
      window.removeEventListener('message', handler);
      clearInterval(pollClosed);
      clearTimeout(timeout);
    };

    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'KMC_RESULT') {
        cleanup();
        resolve(event.data.payload as KmcResult);
      }
    };

    // 팝업이 결과 없이 닫힌 경우
    const pollClosed = setInterval(() => {
      if (popup.closed) {
        cleanup();
        resolve({ success: false, error: '인증이 취소되었습니다.' });
      }
    }, 500);

    // 5분 타임아웃
    const timeout = setTimeout(() => {
      cleanup();
      if (!popup.closed) popup.close();
      resolve({ success: false, error: '인증 시간이 초과되었습니다.' });
    }, 5 * 60 * 1000);

    window.addEventListener('message', handler);
  });
}

// ─── KMC form submit 헬퍼 ───
function submitKmcForm(params: {
  tr_cert: string;
  tr_url: string;
  tr_add: string;
  tr_ver: string;
  target: Window | '_self';
}): Promise<KmcResult> {
  const { tr_cert, tr_url, tr_add, tr_ver, target } = params;

  if (target === '_self') {
    // 모바일: 현재 창에서 submit
    const form = document.createElement('form');
    form.method = 'post';
    form.action = 'https://www.kmcert.com/kmcis/web/kmcisReq.jsp';

    const fields = { tr_cert, tr_url, tr_add, tr_ver };
    Object.entries(fields).forEach(([name, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();

    // 모바일은 페이지가 전환되므로 resolve되지 않음
    return new Promise(() => {});
  }

  // 데스크톱: 팝업 윈도우에 form 작성 → submit
  const popup = target as Window;
  const doc = popup.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>본인인증</title></head>
    <body>
      <form name="reqKMCISForm" method="post" action="https://www.kmcert.com/kmcis/web/kmcisReq.jsp">
        <input type="hidden" name="tr_cert" value="${tr_cert}">
        <input type="hidden" name="tr_url" value="${tr_url}">
        <input type="hidden" name="tr_add" value="${tr_add}">
        <input type="hidden" name="tr_ver" value="${tr_ver}">
      </form>
      <script>document.reqKMCISForm.submit();<\/script>
    </body>
    </html>
  `);
  doc.close();

  // 결과는 postMessage로 수신 (startKmcVerification에서 처리)
  return Promise.resolve({ success: false });
}
