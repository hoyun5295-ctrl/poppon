import Link from 'next/link';

export const metadata = {
  title: '서비스 이용약관 - POPPON',
  description: 'POPPON 서비스 이용약관',
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-16">
      <Link href="/" className="text-sm text-primary-500 hover:text-primary-600 mb-6 inline-block">
        ← 홈으로
      </Link>

      <h1 className="text-2xl font-bold text-surface-900 mb-2">서비스 이용약관</h1>
      <p className="text-sm text-surface-400 mb-10">시행일: 2026년 2월 18일 | 최종 수정일: 2026년 2월 24일</p>

      <div className="space-y-10 text-[15px] text-surface-700 leading-relaxed">

        {/* 제1조 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">제1조 (목적)</h2>
          <p>
            이 약관은 주식회사 인비토(이하 &quot;회사&quot;)가 운영하는 POPPON 서비스(이하 &quot;서비스&quot;)의 
            이용 조건 및 절차, 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        {/* 제2조 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">제2조 (정의)</h2>
          <ul className="list-decimal list-inside space-y-1.5 text-surface-600">
            <li>&quot;서비스&quot;란 회사가 poppon.kr 및 관련 도메인을 통해 제공하는 할인/쿠폰/프로모션 정보 수집·제공 플랫폼을 말합니다.</li>
            <li>&quot;이용자&quot;란 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
            <li>&quot;회원&quot;이란 서비스에 가입하여 이용자 계정을 부여받은 자를 말합니다.</li>
            <li>&quot;비회원&quot;이란 회원으로 가입하지 않고 서비스를 이용하는 자를 말합니다.</li>
            <li>&quot;딜&quot;이란 서비스에서 제공하는 할인, 쿠폰, 프로모션, 특가 등의 혜택 정보를 말합니다.</li>
          </ul>
        </section>

        {/* 제3조 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">제3조 (약관의 효력 및 변경)</h2>
          <ul className="list-decimal list-inside space-y-1.5 text-surface-600">
            <li>이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
            <li>회사는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 약관을 변경할 수 있으며, 변경 시 시행 7일 전 서비스 내에 공지합니다.</li>
            <li>변경된 약관에 동의하지 않는 이용자는 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
            <li>변경된 약관 시행일 이후 서비스를 계속 이용하는 경우, 변경된 약관에 동의한 것으로 간주합니다.</li>
          </ul>
        </section>

        {/* 제4조 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">제4조 (서비스의 내용)</h2>
          <p className="mb-2">회사가 제공하는 서비스는 다음과 같습니다.</p>
          <ul className="list-disc list-inside space-y-1.5 text-surface-600">
            <li>온라인 할인/쿠폰/프로모션 정보의 수집 및 제공</li>
            <li>딜 검색, 카테고리 탐색, 브랜드관 기능</li>
            <li>딜 저장, 브랜드 구독, 알림 서비스</li>
            <li>이용자 맞춤형 딜 추천</li>
            <li>쿠폰 코드 제공 및 브랜드 사이트 연결</li>
            <li>기타 회사가 추가로 개발하거나 제휴를 통해 제공하는 서비스</li>
          </ul>
        </section>

        {/* 제5조 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">제5조 (서비스의 특성 및 면책)</h2>
          <ul className="list-decimal list-inside space-y-1.5 text-surface-600">
            <li>
              서비스는 각 브랜드 및 판매자가 공개한 할인/프로모션 정보를 수집·정리하여 이용자에게 안내하는 정보 제공 플랫폼입니다. 
              회사는 개별 딜의 실제 이용 가능 여부, 할인율의 정확성, 제품 및 서비스의 품질을 보증하지 않습니다.
            </li>
            <li>
              이용자가 딜 정보를 통해 외부 사이트로 이동하여 발생하는 거래(구매, 결제, 환불 등)는 
              해당 브랜드/판매자와 이용자 간의 직접 거래이며, 회사는 이에 대한 책임을 지지 않습니다.
            </li>
            <li>
              딜 정보는 해당 브랜드/판매자의 사정에 따라 예고 없이 변경, 조기 종료 또는 삭제될 수 있습니다.
            </li>
            <li>
              서비스에 게시된 딜 정보의 출처는 해당 브랜드/판매자에게 있으며, 
              회사는 정보의 정확성을 위해 노력하되, 실시간 변경 사항이 즉시 반영되지 않을 수 있습니다.
            </li>
            <li>
              해당 브랜드/판매자가 자사 프로모션 정보의 게시 중단을 요청하는 경우, 
              회사는 확인 후 지체 없이 해당 정보를 삭제 또는 비공개 처리합니다.
            </li>
          </ul>
        </section>

        {/* 제6조 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">제6조 (회원가입 및 탈퇴)</h2>
          <ul className="list-decimal list-inside space-y-1.5 text-surface-600">
            <li>
              회원가입은 이용자가 약관에 동의하고, 이메일 또는 SNS(카카오, 네이버, Apple) 계정을 통해 
              가입 절차를 완료함으로써 성립됩니다.
            </li>
            <li>
              회원은 언제든지 마이페이지에서 탈퇴를 요청할 수 있으며, 
              회사는 30일의 유예기간을 둔 후 개인정보를 파기합니다. 
              유예기간 내 재로그인 시 탈퇴가 철회됩니다.
            </li>
            <li>
              회사는 다음에 해당하는 경우 회원가입을 거부하거나 사후에 이용 계약을 해지할 수 있습니다.
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>타인의 정보를 이용한 경우</li>
                <li>허위 정보를 기재한 경우</li>
                <li>기타 본 약관을 위반한 경우</li>
              </ul>
            </li>
          </ul>
        </section>

        {/* 제7조 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">제7조 (이용자의 의무)</h2>
          <p className="mb-2">이용자는 다음 행위를 하여서는 안 됩니다.</p>
          <ul className="list-disc list-inside space-y-1.5 text-surface-600">
            <li>타인의 정보를 도용하여 회원가입하거나 서비스를 이용하는 행위</li>
            <li>서비스를 이용하여 얻은 정보를 회사의 사전 서면 동의 없이 상업적으로 이용하거나 제3자에게 제공하는 행위</li>
            <li>회사 또는 제3자의 지식재산권, 초상권 등 권리를 침해하는 행위</li>
            <li>서비스의 운영을 고의로 방해하거나 안정적 운영을 저해하는 행위</li>
            <li>자동화된 수단(봇, 크롤러 등)을 이용하여 서비스에 접근하거나 데이터를 수집하는 행위</li>
            <li>기타 관련 법령 및 본 약관에 위배되는 행위</li>
          </ul>
        </section>

        {/* 제8조 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">제8조 (지식재산권)</h2>
          <ul className="list-decimal list-inside space-y-1.5 text-surface-600">
            <li>
              서비스 내의 콘텐츠(딜 정보 편집·큐레이션, 디자인, 로고, UI, 소프트웨어 등)에 대한 
              저작권 및 지식재산권은 회사에 귀속됩니다.
            </li>
            <li>
              개별 딜의 원본 정보(상품명, 가격, 이미지 등)에 대한 권리는 해당 브랜드/판매자에게 있으며, 
              회사는 이를 이용자에 대한 정보 제공 목적으로 활용합니다.
            </li>
            <li>
              이용자는 서비스를 이용함으로써 얻은 정보를 회사의 사전 승낙 없이 복제, 전송, 출판, 배포, 방송 
              기타 방법에 의하여 영리 목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.
            </li>
          </ul>
        </section>

        {/* 제9조 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">제9조 (서비스의 변경 및 중단)</h2>
          <ul className="list-decimal list-inside space-y-1.5 text-surface-600">
            <li>
              회사는 서비스의 내용, 운영상 또는 기술적 필요에 따라 제공하고 있는 서비스를 변경할 수 있으며, 
              변경 전 서비스 내에 공지합니다.
            </li>
            <li>
              회사는 시스템 점검, 설비 교체, 천재지변, 국가 비상사태 등 불가피한 사유가 있는 경우 
              서비스의 제공을 일시적으로 중단할 수 있습니다.
            </li>
            <li>
              회사는 서비스 중단의 경우 사전에 공지하며, 부득이한 경우 사후에 공지할 수 있습니다.
            </li>
          </ul>
        </section>

        {/* 제10조 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">제10조 (손해배상)</h2>
          <p>
            회사는 무료로 제공하는 서비스와 관련하여 이용자에게 어떠한 손해가 발생하더라도, 
            회사의 고의 또는 중과실로 인한 손해가 아닌 한 이에 대한 책임을 부담하지 않습니다.
          </p>
        </section>

        {/* 제11조 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">제11조 (분쟁 해결)</h2>
          <ul className="list-decimal list-inside space-y-1.5 text-surface-600">
            <li>본 약관에 관한 분쟁은 대한민국 법령을 준거법으로 합니다.</li>
            <li>서비스 이용으로 발생한 분쟁에 대해 소송이 제기될 경우, 회사 소재지 관할 법원을 전속 관할 법원으로 합니다.</li>
          </ul>
        </section>

        {/* 부칙 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">부칙</h2>
          <p>이 약관은 2026년 2월 18일부터 시행합니다.</p>
        </section>

        {/* 회사 정보 */}
        <section className="pt-6 border-t border-surface-200">
          <div className="text-sm text-surface-500 space-y-1">
            <p className="font-semibold text-surface-700">주식회사 인비토</p>
            <p>대표이사: 유호윤</p>
            <p>사업자등록번호: 667-86-00578</p>
            <p>통신판매업신고: 제 2017-서울송파-0160호</p>
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
