import Link from 'next/link';

export const metadata = {
  title: '마케팅 정보 수신 동의 - POPPON',
  description: 'POPPON 마케팅 정보 수신 동의 안내',
};

export default function MarketingConsentPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-16">
      <Link href="/" className="text-sm text-primary-500 hover:text-primary-600 mb-6 inline-block">
        ← 홈으로
      </Link>

      <h1 className="text-2xl font-bold text-surface-900 mb-2">마케팅 정보 수신 동의</h1>
      <p className="text-sm text-surface-400 mb-10">시행일: 2026년 2월 18일 | 최종 수정일: 2026년 2월 18일</p>

      <div className="space-y-10 text-[15px] text-surface-700 leading-relaxed">

        <p>
          주식회사 인비토(이하 &quot;회사&quot;)는 POPPON 서비스 이용자에게 유용한 할인·쿠폰·프로모션 정보를 
          제공하기 위해 아래와 같이 마케팅 정보 수신에 대한 동의를 받고 있습니다.
        </p>

        {/* 수집 항목 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">1. 마케팅 활용 항목</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left py-2.5 pr-4 font-semibold text-surface-700">항목</th>
                  <th className="text-left py-2.5 font-semibold text-surface-700">활용 내용</th>
                </tr>
              </thead>
              <tbody className="text-surface-600">
                <tr className="border-b border-surface-100">
                  <td className="py-2.5 pr-4 align-top whitespace-nowrap">관심 카테고리</td>
                  <td className="py-2.5">선택한 카테고리(패션, 뷰티, 식품 등) 기반 맞춤형 딜 추천</td>
                </tr>
                <tr className="border-b border-surface-100">
                  <td className="py-2.5 pr-4 align-top whitespace-nowrap">구독 브랜드</td>
                  <td className="py-2.5">구독한 브랜드의 신규 딜·이벤트 알림</td>
                </tr>
                <tr className="border-b border-surface-100">
                  <td className="py-2.5 pr-4 align-top whitespace-nowrap">서비스 이용 내역</td>
                  <td className="py-2.5">딜 조회·저장·클릭 이력 기반 개인화 혜택 정보 제공</td>
                </tr>
                <tr className="border-b border-surface-100">
                  <td className="py-2.5 pr-4 align-top whitespace-nowrap">연락처 정보</td>
                  <td className="py-2.5">이메일, 휴대전화번호 (수신 채널용)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 수신 채널 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">2. 수신 채널</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left py-2.5 pr-4 font-semibold text-surface-700">채널</th>
                  <th className="text-left py-2.5 pr-4 font-semibold text-surface-700">발송 내용</th>
                  <th className="text-left py-2.5 font-semibold text-surface-700">빈도</th>
                </tr>
              </thead>
              <tbody className="text-surface-600">
                <tr className="border-b border-surface-100">
                  <td className="py-2.5 pr-4 whitespace-nowrap">카카오 알림톡</td>
                  <td className="py-2.5 pr-4">새 딜 알림, 마감 임박 딜, 맞춤 추천</td>
                  <td className="py-2.5 whitespace-nowrap">수시</td>
                </tr>
                <tr className="border-b border-surface-100">
                  <td className="py-2.5 pr-4 whitespace-nowrap">푸시 알림</td>
                  <td className="py-2.5 pr-4">앱/브라우저 알림</td>
                  <td className="py-2.5 whitespace-nowrap">수시</td>
                </tr>
                <tr className="border-b border-surface-100">
                  <td className="py-2.5 pr-4 whitespace-nowrap">이메일</td>
                  <td className="py-2.5 pr-4">주간 베스트 딜 요약, 이벤트 안내</td>
                  <td className="py-2.5 whitespace-nowrap">주 1회 이내</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 한줄로AI */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">3. 맞춤형 마케팅 서비스</h2>
          <p>
            회사는 자사가 운영하는 한줄로AI(hanjul.ai) 타겟 마케팅 시스템을 통해 
            이용자의 관심사 및 행동 패턴에 기반한 맞춤형 혜택 정보를 제공할 수 있습니다. 
            한줄로AI는 회사(주식회사 인비토)가 직접 운영하는 자사 서비스로, 
            개인정보의 제3자 제공에 해당하지 않습니다.
          </p>
        </section>

        {/* 동의 철회 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">4. 동의 철회 방법</h2>
          <p className="mb-2">
            마케팅 수신 동의는 선택사항이며, 동의하지 않아도 서비스 이용에 제한이 없습니다. 
            동의 후에도 언제든지 철회할 수 있습니다.
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-surface-600">
            <li>마이페이지 → 설정 → 마케팅 수신 동의 해제</li>
            <li>개인정보 보호 책임자 이메일로 철회 요청: <a href="mailto:suran@invitocorp.com" className="text-primary-500 hover:text-primary-600">suran@invitocorp.com</a></li>
            <li>고객센터 전화 문의: <a href="tel:1800-8125" className="text-primary-500 hover:text-primary-600">1800-8125</a></li>
          </ul>
        </section>

        {/* 보유 기간 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">5. 보유 및 이용 기간</h2>
          <p>
            마케팅 목적으로 수집된 정보는 동의 철회 시 또는 회원 탈퇴 시까지 보유·이용됩니다. 
            동의를 철회하더라도 이전에 발송된 마케팅 정보에 대해서는 소급하여 적용되지 않습니다.
          </p>
        </section>

        {/* 관련 법령 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">6. 관련 법령</h2>
          <p>
            본 마케팅 수신 동의는 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 제50조 및 
            「개인정보 보호법」 관련 규정에 따라 운영됩니다.
          </p>
        </section>

        {/* 회사 정보 */}
        <section className="pt-6 border-t border-surface-200">
          <div className="text-sm text-surface-500 space-y-1">
            <p className="font-semibold text-surface-700">주식회사 인비토</p>
            <p>대표이사: 유호윤</p>
            <p>사업자등록번호: 667-86-00578</p>
            <p>주소: 서울시 송파구 오금로36길46, 4층</p>
            <p>
              전화: <a href="tel:1800-8125" className="text-primary-500">1800-8125</a>
              {' · '}
              이메일: <a href="mailto:webmaster@poppon.kr" className="text-primary-500">webmaster@poppon.kr</a>
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
