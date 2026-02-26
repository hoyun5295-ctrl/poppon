/**
 * KMC 본인인증 요청 API
 *
 * GET /api/kmc/request
 * → tr_cert + tr_url + form_url을 JSON으로 반환
 * → AuthSheet에서 받아서 현재 페이지(/auth)에서 form submit
 *   (Referer가 등록된 URL과 일치해야 KMC가 허용)
 */

import { NextRequest, NextResponse } from 'next/server';
import { encryptTrCert, generateCertNum } from '@/lib/kmc/crypto';

const KMC_CP_ID = 'IVTT1001';
const KMC_URL_CODE = '003002';

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

    return NextResponse.json({
      success: true,
      tr_cert: trCert,
      tr_url: trUrl,
      tr_add: 'N',
      tr_ver: 'V2',
      form_url: 'https://www.kmcert.com/kmcis/web/kmcisReq.jsp',
    });
  } catch (error) {
    console.error('[KMC request] error:', error);
    return NextResponse.json(
      { success: false, error: 'tr_cert 생성 실패' },
      { status: 500 }
    );
  }
}
