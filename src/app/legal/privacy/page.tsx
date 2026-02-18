import Link from 'next/link';

export const metadata = {
  title: '개인정보처리방침 - POPPON',
  description: 'POPPON 개인정보처리방침',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-16">
      <Link href="/" className="text-sm text-primary-500 hover:text-primary-600 mb-6 inline-block">
        ← 홈으로
      </Link>

      <h1 className="text-2xl font-bold text-surface-900 mb-2">개인정보처리방침</h1>
      <p className="text-sm text-surface-400 mb-10">시행일: 2026년 2월 18일 | 최종 수정일: 2026년 2월 18일</p>

      <div className="space-y-10 text-[15px] text-surface-700 leading-relaxed">

        <p>
          주식회사 인비토(이하 &quot;회사&quot;)는 POPPON 서비스(이하 &quot;서비스&quot;)를 운영함에 있어 
          「개인정보 보호법」 등 관련 법령에 따라 이용자의 개인정보를 보호하고, 
          이와 관련한 고충을 신속하게 처리하기 위하여 다음과 같이 개인정보처리방침을 수립·공개합니다.
        </p>

        {/* 제1조 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">제1조 (수집하는 개인정보 항목 및 수집 방법)</h2>
          
          <h3 className="text-base font-semibold text-surface-800 mt-4 mb-2">1. 회원가입 시 수집 항목</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left py-2.5 pr-4 font-semibold text-surface-700">구분</th>
                  <th className="text-left py-2.5 pr-4 font-semibold text-surface-700">수집 항목</th>
                  <th className="text-left py-2.5 font-semibold text-surface-700">필수/선택</th>
                </tr>
              </thead>
              <tbody className="text-surface-600">
                <tr className="border-b border-surface-100">
                  <td className="py-2.5 pr-4 align-top whitespace-nowrap">이메일 가입</td>
                  <td className="py-2.5 pr-4">이메일 주소, 비밀번호</td>
                  <td className="py-2.5 whitespace-nowrap">필수</td>
                </tr>
                <tr className="border-b border-surface-100">
                  <td className="py-2.5 pr-4 align-top whitespace-nowrap">카카오 로그인</td>
                  <td className="py-2.5 pr-4">이용자 식별자, 닉네임, 이메일 주소, 프로필 사진, 성별, 생일, 출생연도, 연령대</td>
                  <td className="py-2.5 whitespace-nowrap">필수/선택</td>
                </tr>
                <tr className="border-b border-surface-100">
                  <td className="py-2.5 pr-4 align-top whitespace-nowrap">네이버 로그인</td>
                  <td className="py-2.5 pr-4">이용자 식별자, 이름, 이메일 주소, 별명(닉네임), 프로필 사진, 성별, 생일, 출생연도, 연령대, 휴대전화번호</td>
                  <td className="py-2.5 whitespace-nowrap">필수/선택</td>
                </tr>
                <tr className="border-b border-surface-100">
                  <td className="py-2.5 pr-4 align-top whitespace-nowrap">서비스 이용 중</td>
                  <td className="py-2.5 pr-4">관심 카테고리, 마케팅 수신 동의 여부 및 채널</td>
                  <td className="py-2.5 whitespace-nowrap">선택</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-base font-semibold text-surface-800 mt-6 mb-2">2. 서비스 이용 과정에서 자동 수집되는 항목</h3>
          <p>
            딜 조회·클릭·저장·공유 기록, 쿠폰 코드 복사 기록, 검색어, 브랜드 구독 정보, 
            접속 일시, IP 주소, 쿠키, 브라우저 유형, 기기 정보, 세션 식별자
          </p>

          <h3 className="text-base font-semibold text-surface-800 mt-6 mb-2">3. 수집 방법</h3>
          <p>
            회원가입 및 서비스 이용 과정에서 이용자가 직접 입력하거나, 
            SNS 로그인 연동(카카오, 네이버) 시 이용자의 동의 하에 해당 플랫폼으로부터 제공받습니다. 
            서비스 이용 기록 및 행동 데이터는 자동으로 생성·수집됩니다.
          </p>
        </section>

        {/* 제2조 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">제2조 (개인정보의 수집·이용 목적)</h2>
          <p className="mb-3">회사는 수집한 개인정보를 다음의 목적으로 이용합니다.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left py-2.5 pr-4 font-semibold text-surface-700 whitespace-nowrap">이용 목적</th>
                  <th className="text-left py-2.5 font-semibold text-surface-700">상세 내용</th>
                </tr>
              </thead>
              <tbody className="text-surface-600">
                <tr className="border-b border-surface-100">
                  <td className="py-2.5 pr-4 align-top whitespace-nowrap">회원 관리</td>
                  <td className="py-2.5">회원 식별, 본인 확인, 부정 이용 방지, 가입 및 탈퇴 처리</td>
                </tr>
                <tr className="border-b border-surface-100">
                  <td className="py-2.5 pr-4 align-top whitespace-nowrap">서비스 제공</td>
                  <td className="py-2.5">할인/쿠폰/프로모션 정보 제공, 딜 저장·구독·알림, 검색 기능, 맞춤형 딜 추천</td>
                </tr>
                <tr className="border-b border-surface-100">
                  <td className="py-2.5 pr-4 align-top whitespace-nowrap">마케팅 활용</td>
                  <td className="py-2.5">
                    관심 카테고리·브랜드·행동 데이터 기반 맞춤형 마케팅 정보 발송 (별도 동의 시), 
                    카카오 알림톡, SMS, 이메일 알림. 
                    회사가 운영하는 한줄로AI(hanjul.ai) 타겟 마케팅 시스템을 통해 
                    이용자의 관심사 및 행동 패턴에 기반한 맞춤형 혜택 정보를 제공할 수 있습니다.
                  </td>
                </tr>
                <tr className="border-b border-surface-100">
                  <td className="py-2.5 pr-4 align-top whitespace-nowrap">서비스 개선</td>
                  <td className="py-2.5">이용 통계 분석, 서비스 품질 향상, 신규 서비스 개발</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-surface-500 mt-3">
            ※ 한줄로AI(hanjul.ai)는 회사가 운영하는 자사 CRM 마케팅 서비스로, 
            이용자 개인정보의 제3자 제공에 해당하지 않습니다.
          </p>
        </section>

        {/* 제3조 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">제3조 (개인정보의 보유 및 이용 기간)</h2>
          <p className="mb-3">
            회사는 개인정보 수집·이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 
            다만, 다음의 경우에는 명시한 기간 동안 보관합니다.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left py-2.5 pr-4 font-semibold text-surface-700">보관 항목</th>
                  <th className="text-left py-2.5 pr-4 font-semibold text-surface-700">보관 기간</th>
                  <th className="text-left py-2.5 font-semibold text-surface-700">근거</th>
                </tr>
              </thead>
              <tbody className="text-surface-600">
                <tr className="border-b border-surface-100">
                  <td className="py-2.5 pr-4">탈퇴 회원 정보</td>
                  <td className="py-2.5 pr-4">30일</td>
                  <td className="py-2.5">재가입 방지 및 복구 지원</td>
                </tr>
                <tr className="border-b border-surface-100">
                  <td className="py-2.5 pr-4">서비스 이용 기록 (접속 로그)</td>
                  <td className="py-2.5 pr-4">3개월</td>
                  <td className="py-2.5">통신비밀보호법</td>
                </tr>
                <tr className="border-b border-surface-100">
                  <td className="py-2.5 pr-4">표시·광고에 관한 기록</td>
                  <td className="py-2.5 pr-4">6개월</td>
                  <td className="py-2.5">전자상거래 등에서의 소비자보호에 관한 법률</td>
                </tr>
                <tr className="border-b border-surface-100">
                  <td className="py-2.5 pr-4">계약 또는 청약철회에 관한 기록</td>
                  <td className="py-2.5 pr-4">5년</td>
                  <td className="py-2.5">전자상거래 등에서의 소비자보호에 관한 법률</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 제4조 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">제4조 (개인정보의 제3자 제공)</h2>
          <p>
            회사는 이용자의 개인정보를 제2조에서 명시한 범위 내에서만 처리하며, 
            이용자의 사전 동의 없이 본래의 범위를 초과하여 처리하거나 제3자에게 제공하지 않습니다. 
            다만, 다음의 경우에는 예외로 합니다.
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1.5 text-surface-600">
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 의하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
          </ul>
        </section>

        {/* 제5조 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">제5조 (개인정보 처리 위탁)</h2>
          <p className="mb-3">회사는 서비스 운영을 위해 다음과 같이 개인정보 처리를 위탁하고 있습니다.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left py-2.5 pr-4 font-semibold text-surface-700">수탁자</th>
                  <th className="text-left py-2.5 font-semibold text-surface-700">위탁 업무</th>
                </tr>
              </thead>
              <tbody className="text-surface-600">
                <tr className="border-b border-surface-100">
                  <td className="py-2.5 pr-4">Supabase Inc.</td>
                  <td className="py-2.5">데이터베이스 운영 및 회원 인증 서비스</td>
                </tr>
                <tr className="border-b border-surface-100">
                  <td className="py-2.5 pr-4">Vercel Inc.</td>
                  <td className="py-2.5">웹 서비스 호스팅 및 서버리스 함수 실행</td>
                </tr>
                <tr className="border-b border-surface-100">
                  <td className="py-2.5 pr-4">카카오 주식회사</td>
                  <td className="py-2.5">카카오 로그인 인증, 카카오 알림톡 발송</td>
                </tr>
                <tr className="border-b border-surface-100">
                  <td className="py-2.5 pr-4">네이버 주식회사</td>
                  <td className="py-2.5">네이버 로그인 인증</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 제6조 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">제6조 (개인정보의 파기 절차 및 방법)</h2>
          <p className="mb-2">
            회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는 
            지체 없이 해당 개인정보를 파기합니다.
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-surface-600">
            <li>전자적 파일 형태: 복구 및 재생이 불가능한 기술적 방법을 사용하여 삭제</li>
            <li>기록물, 인쇄물: 분쇄기로 분쇄하거나 소각</li>
            <li>회원 탈퇴 시: 30일간 보관 후 영구 삭제 (30일 이내 재로그인 시 계정 복구 가능)</li>
          </ul>
        </section>

        {/* 제7조 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">제7조 (이용자의 권리·의무 및 행사 방법)</h2>
          <p className="mb-2">이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
          <ul className="list-disc list-inside space-y-1.5 text-surface-600">
            <li>개인정보 열람: 마이페이지 → 설정 → 내 정보에서 직접 확인</li>
            <li>개인정보 수정: SNS 계정 정보 변경 후 재로그인 시 자동 반영</li>
            <li>회원 탈퇴(처리 정지): 마이페이지 → 설정 → 회원 탈퇴</li>
            <li>마케팅 수신 동의 철회: 마이페이지 → 설정 → 마케팅 동의</li>
          </ul>
          <p className="mt-2">
            이용자가 개인정보의 오류에 대한 정정을 요청한 경우, 정정을 완료하기 전까지 해당 개인정보를 이용 또는 제공하지 않습니다.
          </p>
        </section>

        {/* 제8조 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">제8조 (쿠키의 운영 및 거부)</h2>
          <p>
            회사는 이용자의 로그인 세션 유지 및 서비스 이용 편의를 위해 쿠키(Cookie)를 사용합니다. 
            이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 
            이 경우 로그인이 필요한 서비스 이용에 제한이 있을 수 있습니다.
          </p>
        </section>

        {/* 제9조 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">제9조 (개인정보의 안전성 확보 조치)</h2>
          <p className="mb-2">회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
          <ul className="list-disc list-inside space-y-1.5 text-surface-600">
            <li>비밀번호 암호화 저장 (bcrypt)</li>
            <li>SSL/TLS를 통한 데이터 전송 구간 암호화</li>
            <li>데이터베이스 접근 권한 관리 (Row Level Security)</li>
            <li>관리자 시스템 접근 제한 및 별도 인증</li>
            <li>정기적 데이터 백업</li>
          </ul>
        </section>

        {/* 제10조 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">제10조 (개인정보 보호 책임자)</h2>
          <p className="mb-3">
            회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 
            개인정보 처리와 관련한 이용자의 불만 처리 및 피해 구제를 위하여 아래와 같이 
            개인정보 보호 책임자를 지정하고 있습니다.
          </p>
          <div className="bg-surface-50 rounded-xl p-4">
            <table className="text-sm">
              <tbody className="text-surface-600">
                <tr>
                  <td className="py-1.5 pr-6 font-medium text-surface-700">성명</td>
                  <td className="py-1.5">서수란</td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-6 font-medium text-surface-700">직책</td>
                  <td className="py-1.5">개인정보 보호 책임자 (팀장)</td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-6 font-medium text-surface-700">이메일</td>
                  <td className="py-1.5">
                    <a href="mailto:suran@invitocorp.com" className="text-primary-500 hover:text-primary-600">
                      suran@invitocorp.com
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-6 font-medium text-surface-700">전화</td>
                  <td className="py-1.5">
                    <a href="tel:1800-8125" className="text-primary-500 hover:text-primary-600">
                      1800-8125
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4 mb-2">
            개인정보 침해에 대한 신고나 상담이 필요하신 경우, 아래 기관에 문의하실 수 있습니다.
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-surface-600">
            <li>개인정보침해신고센터 (privacy.kisa.or.kr / 국번없이 118)</li>
            <li>개인정보분쟁조정위원회 (www.kopico.go.kr / 1833-6972)</li>
            <li>대검찰청 사이버수사과 (www.spo.go.kr / 국번없이 1301)</li>
            <li>경찰청 사이버안전국 (ecrm.police.go.kr / 국번없이 182)</li>
          </ul>
        </section>

        {/* 제11조 */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">제11조 (개인정보처리방침의 변경)</h2>
          <p>
            이 개인정보처리방침은 2026년 2월 18일부터 적용됩니다. 
            법령·정책 또는 보안 기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 경우, 
            변경 사항의 시행 7일 전부터 서비스 내 공지사항을 통하여 고지합니다.
          </p>
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
