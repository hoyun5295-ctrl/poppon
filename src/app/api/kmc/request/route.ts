/**
 * KMC 본인인증 요청 API
 *
 * POST /api/kmc/request
 * → tr_cert 암호화 생성 + 팝업 호출에 필요한 파라미터 반환
 */

import { NextRequest, NextResponse } from 'next/server';
import { encryptTrCert, generateCertNum } from '@/lib/kmc/crypto';

const KMC_CP_ID = 'IVTT1001';
const KMC_URL_CODE = '003001';

export async function POST(req: NextRequest) {
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
      tr_cert: trCert,
      tr_url: trUrl,
      tr_add: 'N',
      tr_ver: 'V2',
    });
  } catch (error) {
    console.error('[KMC request] error:', error);
    return NextResponse.json(
      { error: 'KMC 요청 생성 실패' },
      { status: 500 }
    );
  }
}
