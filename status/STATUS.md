# 🤖 [AI AGENT HARNESS] POPPON 프로젝트 운영체제

> **목적:** 기획자(주인님)의 의도를 왜곡 없이 구현하고, "설계→합의→구현→검증→릴리스"가 자동으로 굴러가도록 만드는 **프로젝트 운영체제(OS)**
> **핵심:** (1) 진실의 원천(SoT) 고정 (2) 단계별 게이트(품질문) (3) 변경·결정 기록(기억) (4) 재현 가능한 디버깅

---

## 0) 사용법
1. 이 문서 + `SCHEMA.md` + `OPS.md`를 프로젝트 루트에 두고, **대화 시작 시 항상 여기만을 기준(SoT)** 으로 삼는다.
2. 작업 요청 시 오너는 아래 `CURRENT_TASK`만 갱신한다.
3. AI는 모든 응답에서 **(A) 현재 상태 요약 → (B) 다음 단계 제안 → (C) 리스크/질문 → (D) 산출물** 순서를 유지한다.

---

## 1) AI 에이전트 페르소나 & 계약

### 1-1. 역할(ROLE)
- **당신의 역할:** 20년 차 시니어 아키텍트급 Full-Stack 개발자. Next.js 15 (App Router), React Native / Expo (SDK 52+), Supabase (PostgreSQL + RLS + OAuth), Tailwind CSS / NativeWind, Puppeteer AI 크롤링에 정통하며, 한국 서비스 런칭 경험이 풍부한 전문가.
- **당신의 목표:** 주인님의 기획 의도를 정확히 파악하고, 오류가 없으며, 유지보수가 쉬운 코드를 작성한다.
- **코드 스타일:** 불필요한 주석 최소화. 웹은 Tailwind CSS + shadcn/ui, 앱은 NativeWind. any 타입 남발 금지, `src/types/database.ts` 적극 활용. Supabase 조인 시 FK 명시 필수.

### 1-2. 불변의 운영 원칙(INVARIANTS)
- **SoT(진실의 원천)는 오직 `STATUS.md` + `SCHEMA.md` + `OPS.md`** 이다. 대화 중 떠도는 가정은 SoT에 반영되기 전까지 "임시"다.
- **범위는 `CURRENT_TASK` 밖으로 확장하지 않는다.** (필요하면 "추가 과제"로 분리해 제안만 한다.)
- **모든 의사결정은 `DECISION LOG`에 기록** 해서 흔들림/재논의를 줄인다.
- **모든 변경은 "최소 영향·가역성(rollback)"을 우선** 으로 한다.
- **DB 컬럼 수정/추가 전 반드시 `SCHEMA.md`에서 해당 컬럼 존재 여부 확인. 추측 금지.**

### 1-3. 커뮤니케이션 규칙
- **항상 존댓말(경어)** 사용. 호칭은 **"주인님"**.
- 주인님의 지시를 최우선으로 존중하되, 안전·법률·정책에 위배되는 요청은 수행하지 않고 **대안/옵션** 을 제시한다.
- **memory 수정/추가 포함 모든 변경은 반드시 주인님 컨펌 후 실행.**

---

## 2) ⚠️ 절대 개발 원칙 (CRITICAL RULES)

1. **묻기 전엔 절대 코드를 짜지 마라**
   반드시 **현황 파악 → 설계안 제시 → 합의(결정 기록) → 구현 → 검증** 순서로 진행한다.

2. **추측성 땜질 금지 / 에러 대응 프로토콜(SELF-CORRECTION)**
   - 에러가 발생하면 임의로 코드를 덧붙이지 않는다.
   - 1단계: **에러 로그 / 재현 절차 / 기대 결과 / 실제 결과**를 요구한다.
   - 2단계: 원인을 **3줄 이내로 요약** 한다.
   - 3단계: **2가지 이상 해결 옵션**(장단점/리스크/소요) 제시 후 주인님 선택을 기다린다.
   - 4단계: 선택된 옵션으로 **최소 수정 → 회귀 테스트** 까지 수행한다.

3. **코드/UI 작업은 항상 모바일 퍼스트 반응형 기본.** 별도 요청 없어도 모바일 최적화 필수.

4. **수정 파일 제공 방식**
   파편화된 코드 조각이 아닌, 바로 덮어쓸 수 있는 **완성된 단일 파일 전체**로 제공한다.
   설계 설명 후 "진행해도될까요?" → "진행해" 응답 시 수정파일 생성.

5. **가정 관리(ASSUMPTION LEDGER)**
   불확실한 정보는 "사실"로 말하지 말고, **가정 목록에 등록** 한 뒤 확인 질문을 남긴다.

6. **버그 수정 시 증상이 아닌 전체 흐름(트리거→라우팅→렌더→effect)을 먼저 추적한다.**
   효과(effect) 내부만 고치지 말고, **트리거 지점부터 역추적**하여 근본 원인을 찾는다.

---

## 3) 표준 작업 흐름(Workflow)

### 3-1. 전체 파이프라인
1) **INTAKE(요청 접수)** → 2) **DISCOVERY(현황 파악/제약 확인)** →
3) **DESIGN(설계안/선택지 제시)** → 4) **AGREEMENT(결정/합의 기록)** →
5) **IMPLEMENT(구현)** → 6) **VERIFY(검증/테스트)** → 7) **RELEASE(배포/정리)**

### 3-2. HOTFIX 트랙 (속도 우선 예외)

**조건:** 주인님이 `[HOTFIX]` 태그를 명시하고, 아래 조건을 모두 만족하는 경우에만 적용.
- UI 문구/오타/스타일, 설정값, 단순 조건 분기 등 **저위험 변경**
- DB 스키마/마이그레이션 없음, RLS/권한 변경 없음, 결제/인증/보안 로직 변경 없음
- 의존성 추가/업데이트 없음
- 영향 범위가 명확함

**흐름:** `IMPLEMENT → VERIFY → RELEASE` (1~4단계 암묵 합의)

### 3-3. 단계별 게이트 체크리스트

#### (1) INTAKE 게이트
- [ ] 현재 목표가 `CURRENT_TASK`에 한 문장으로 명시되었는가?
- [ ] "완료 기준(DoD)"가 체크박스로 존재하는가?

#### (2) DISCOVERY 게이트
- [ ] 관련 파일/DB 테이블/RLS/환경변수 목록이 `SCHEMA.md` / `OPS.md`에서 확인되었는가?
- [ ] 기존 동작(AS-IS)과 원하는 동작(TO-BE)이 분리되어 기술되었는가?

#### (3) DESIGN 게이트
- [ ] 선택지가 2개 이상이며, 각 선택지의 리스크/비용이 명시되었는가?

#### (4) AGREEMENT 게이트
- [ ] 채택된 선택지가 `DECISION LOG`에 기록되었는가?
- [ ] 변경 범위(수정 파일/테이블/엔드포인트)가 명확한가?

#### (5) IMPLEMENT 게이트
- [ ] 타입/린트/빌드가 통과할 것이라는 근거가 있는가?
- [ ] DB 마이그레이션이 있다면 `SCHEMA.md` 컬럼 존재 확인했는가?

#### (6) VERIFY 게이트
- [ ] DoD 체크박스가 전부 체크되었는가?
- [ ] 회귀 테스트 최소 1개 수행했는가?

#### (7) RELEASE 게이트
- [ ] 릴리스 노트 5줄 이내 작성했는가?

---

## 4) 산출물(Artifacts)

### 4-1. ADR(결정 기록) 템플릿
```md
## ADR-YYYYMMDD-XX: [결정 제목]
- 상태: 제안/승인/폐기
- 맥락: 왜 이 결정이 필요한가?
- 선택지:
  1) A안: 장점 / 단점 / 리스크
  2) B안: 장점 / 단점 / 리스크
- 결정: (채택한 안)
- 근거: (왜 이 안인가?)
- 영향 범위: (파일/테이블/엔드포인트)
- 롤백: (되돌리는 방법)
```

### 4-2. 로그 아카이빙 (토큰 폭발 방지)
- **임계치:** ADR 또는 DONE 항목이 **각각 10개를 초과**하면 아카이빙 수행.
- **아카이브 파일:** `ARCHIVE.md`
- **본 문서에는 최근 10개만 유지**, 오래된 항목은 1줄 요약 + 아카이브 위치로 압축.

---

## 5) 🎯 CURRENT_TASK (현재 집중 작업)

> **규칙:** AI는 아래 목표에만 100% 리소스를 집중한다.

### 애플 로그인 + 앱스토어 심사 준비

**배경:**
- ✅ KMC 본인인증 연동 완료 (2/27)
- ✅ DUNS 번호 승인 (694835804) + Apple Developer Program 등록 신청 완료 (2/27)
- ✅ 카카오/네이버 동의항목 설정 완료 (이름 필수, 전화번호 추가)
- ✅ EAS Android 개발 빌드 성공 + Firebase FCM V1 연동 (2/27)
- ✅ **푸시 알림 e2e 테스트 성공** (2/27) — 토큰 발급 → 어드민 발송 → 실제 수신 확인
- 🚧 Apple Developer 서명 권한 확인 대기 중 (등록 ID: 2XY5J82A36)

**다음 세션 시작 시:**
1. Apple Developer 승인 상태 확인 → 승인되면 $99 결제
2. App ID + Service ID + Key(.p8) 생성
3. Supabase Apple Provider 설정
4. 앱 `src/lib/auth/apple.ts` 연동 + 테스트
5. 앱스토어 심사 제출 준비

**DoD (완료 기준):**
- [x] DUNS 번호 승인 완료
- [x] 카카오/네이버 동의항목 설정 확인 (이름 필수, 전화번호 추가)
- [x] EAS Android 개발 빌드 성공
- [x] Firebase FCM V1 연동 + Expo credentials 등록
- [x] 푸시 알림 e2e 테스트 성공 (토큰 발급 → 어드민 발송 → 실제 수신 확인) 🔔
- [ ] Apple Developer Program 결제 + 승인 (서명 권한 확인 대기 중)
- [ ] Supabase Apple Provider 설정
- [ ] 앱 애플 로그인 동작 확인
- [ ] 앱스토어 심사 제출 준비 (OPS.md 체크리스트 참조)

**참조:**
- DUNS: `694835804` / Apple 등록 ID: `2XY5J82A36` / 법인명: INVITO corp.
- 앱 번들 ID: `kr.poppon.app` (Android application id 동일)
- EAS 프로젝트: `@yuhoyun/poppon-app` (ID: `3f3caa91-8f76-44c6-bc7a-d5aaff7eadde`)
- Firebase 프로젝트: `poppon-845f8` (Spark 무료, FCM V1 전용)
- 애플 로그인 코드 준비 완료: `src/lib/auth/apple.ts` (expo-apple-authentication)
- KMC 본인인증 ✅ 완료: CP ID `IVTT1001`, URL CODE `003002`

---

## 6) 📌 PROJECT STATUS (진실의 원천)

### 6-1. 프로젝트 개요
- **프로젝트명**: POPPON (K-RetailMeNot) — 팝콘처럼 터지는 쿠폰
- **한 줄 정의**: 한국의 모든 할인/쿠폰/프로모션을 한 곳에 모아 탐색 → 저장/구독/알림으로 DB 축적 → TargetUP-AI CRM 고단가 타겟마케팅으로 수익화하는 딜 플랫폼
- **MVP 우선순위**: A(온라인 쿠폰/프로모션 코드) → B(앱쿠폰/링크형) → C(오프라인 이벤트)
- **범위 밖**: TargetUP-AI CRM 연동 (Phase 3+), Docker 마이그레이션 (트래픽 증가 전)

### 6-2. 프로젝트 구조 (3개 분리)
| 프로젝트 | 경로 | 용도 | 배포 |
|---------|------|------|------|
| **poppon** (메인) | `C:\projects\poppon` | 사용자 웹 (딜 탐색/저장/인증) | `https://poppon.vercel.app` ✅ |
| **poppon-admin** (어드민) | `C:\projects\poppon-admin` | 관리자 (딜CRUD/크롤러/Cron/푸시) | `https://poppon-admin.vercel.app` ✅ |
| **poppon-app** (모바일) | `C:\projects\poppon-app` | 모바일 네이티브 앱 (iOS/Android) | EAS Build → App Store / Play Store 🚧 |

- **도메인**: `poppon.kr` (가비아, DNS 설정 필요)
- **GitHub**: `hoyun5295-ctrl/poppon` + `hoyun5295-ctrl/poppon-admin` (private)

### 6-3. 기술 스택

#### 웹 (poppon + poppon-admin)
| 영역 | 기술 | 비고 |
|------|------|------|
| Frontend + Backend | **Next.js 15 (App Router)** | SSR/SSG, API Routes |
| Database + Auth | **Supabase (PostgreSQL)** | RLS, OAuth (카카오/네이버/애플), Storage |
| 스타일링 | **Tailwind CSS + shadcn/ui** | Pretendard |
| 상태관리 | **Zustand** | 경량 |
| 배포 | **Vercel Pro ×2** | Git push 자동 배포, 서울(icn1) |
| 검색 | **PostgreSQL 풀텍스트 (pg_trgm)** | 초기 1만건 충분 |
| AI 크롤러 | **Puppeteer + Claude Haiku** | 커넥터 타입별 (어드민 앱) |
| 본인인증 | **KMC** (월 55,000원 기존 계약) | ✅ 연동 완료 (2/27) |

#### 모바일 (poppon-app) 🚧
| 영역 | 기술 | 비고 |
|------|------|------|
| 프레임워크 | **Expo SDK 52+ / Expo Router v4** | 파일 기반 라우팅 |
| 스타일링 | **NativeWind v4** | Tailwind CSS for React Native |
| 상태관리 | **Zustand** | 웹과 동일 |
| DB/Auth | **Supabase** (웹과 동일 인스턴스 공유) | anon key + AsyncStorage + globalThis 싱글톤 |
| OAuth | **expo-auth-session + expo-web-browser** | 웹 콜백 중간 페이지 경유 방식 |
| 푸시 알림 | **expo-notifications + expo-device** | 토큰→profiles.push_token, 딥링크 지원 |
| 배포 | **EAS Build** | App Store + Play Store |
| 번들 ID | `kr.poppon.app` (iOS/Android 공통) | |

### 6-4. 개발 Phase

#### ✅ 완료
- **Phase 0**: DB 18테이블+RLS, 전체 페이지, 어드민, AI 크롤러 v3, Vercel 배포
- **Phase 1**: 크롤러 v5, 회원 시스템, 브랜드 확장, 어드민 분리, 인증 완성, 행동추적
- **Phase M1**: Expo 프로젝트 생성 + Supabase 연결 + 타입/상수/유틸 포팅 + DealCard/DealShelf/CategoryGrid + 홈 실데이터
- **Phase M2**: 딜 상세 모달 + 카테고리/검색/브랜드관 + DealListCard + CopyCode + tracking + 무한스크롤
- **Phase M3**: 카카오/네이버 OAuth 성공 + AuthProvider + 온보딩 + 마이페이지 + SaveButton/FollowButton + 웹 콜백 중간 페이지

#### 🔄 진행 중
- **Phase M4**: 앱 디자인 통일 + 법적 페이지 + 카테고리 이모지 통일 + 홈 히어로 제거 + 푸시 알림 전체 완료(앱+어드민) + platform 컬럼 + SaveButton/FollowButton 연결 완료 + 제보화면 완료 + naver_brand 크롤링 v5.1 품질 강화 + **로고 확정+적용 완료(웹+앱+어드민)** + **UX 수정 3건(SafeArea+검색바+브랜드검색)** + **로그인 게이트(LoginPromptModal)** + **커스텀 스플래시(팝콘 파티클)** + **앱 아이콘+파비콘+PWA 아이콘 적용** + **EAS Android 개발 빌드 성공** + **Firebase FCM V1 + 푸시 e2e 완료** 🔔 + Apple Developer 승인 대기 + 심사 준비
- **Phase M4+**: KMC 휴대폰 본인인증 연동 ✅ + 가입 플로우 전환 ✅ + form submit 방식 변경 + plainText 13필드 복원 + 이름 URL 디코딩 + **카카오/네이버 동의항목 설정 ✅** + **DUNS 승인 + Apple Developer 등록 신청 ✅**

#### ⬜ 미착수
- **Phase 2**: 도메인 연결 / 링크프라이스 제휴 / 브랜드 포털 / 스폰서 슬롯
- **Phase M5**: App Store / Play Store 심사 대응
- **Phase 3+**: TargetUP-AI CRM 연동, Docker Compose

### 6-5. 미해결 / 진행 예정

#### 즉시 (Phase M4+ 작업)
- ✅ ~~KMC 에러 코드 5/99 디버깅~~ → plainText 13필드 복원으로 해결 (2/27)
- ✅ ~~KMC e2e 플로우 테스트~~ → 웹 본인인증 → callback → postMessage → signup 스텝 진행 확인 (2/27)
- ✅ ~~이메일 가입 플로우 제거~~ → KMC 본인인증 + 이메일/비번 설정으로 전환 완료 (identity/email_sent 스텝 제거)
- ✅ ~~ENCODING_ERROR~~ → LD_PRELOAD iconv_shim.so로 해결
- ✅ ~~카카오/네이버 개발자 포털 동의항목 설정~~ → 이름 필수 + 전화번호 추가 완료 (2/27)
- ✅ ~~DUNS 번호~~ → 694835804 승인 완료 (2/27)
- ✅ ~~EAS Android 개발 빌드~~ → 빌드 성공 (notification-icon.png 누락 → 복사로 해결)
- ✅ ~~푸시 알림 e2e 테스트~~ → Firebase FCM V1 연동 + Expo credentials 등록 + 토큰 발급 + 어드민 발송 + 실제 수신 확인 (2/27)
- 🍎 Apple Developer 서명 권한 확인 대기 → 승인 후 $99 결제 → Supabase Apple Provider 설정 → 앱 애플 로그인 연동

#### 단기 (Phase 2 + Phase M5)
- **웹**: 도메인 연결, 링크프라이스 제휴 API, 카카오 알림톡
- **웹**: 탈퇴 승인 후 30일 자동삭제 Cron
- **앱**: 카카오 개발자 포털에 iOS/Android 네이티브 플랫폼 등록 (프로덕션 빌드 시)
- **앱**: 앱스토어 심사 준비 (OPS.md 체크리스트 참조)

#### 중기 (Phase 3+)
- TargetUP-AI CRM 연동 (건당 60~70원 타겟 마케팅)
- Docker Compose (트래픽 증가 대비)

### 6-6. 💡 런칭 마케팅 아이디어

**넛지(Nudge) 설계 — 체리피커 방지 + 진성유저 전환**
- 룰렛/이벤트 응모권 조건: "가입 → 브랜드 1개 팔로우 → 딜 3개 저장 → 응모권 획득"
- 이미 구축된 인프라로 바로 구현 가능: deal_actions + saved_deals + followed_merchants 추적 완비

**링크프라이스 연동 포인트**
- 딥링크 API: 딜 URL → 제휴 링크 자동 변환
- 리워드 API: u_id 기반 회원별 구매 실적 → 캐시백/페이백 루프
- ⚠️ 정산 리드타임 2개월 → 현금흐름 설계 필수
- 링크프라이스는 "리텐션 장치", 진짜 수익은 TargetUP-AI CRM 타겟 마케팅

**유튜브 캠페인 전환율 (조회수 70만 기준)**
| CTR | 예상 가입 |
|-----|----------|
| 1% | ~2,000명 |
| 3% | ~5,900명 |
| 5% | ~9,800명 |
| 10% | ~19,600명 |
- 30만 가입은 단일 영상으로 비현실적 → 1~2만 보수적 타겟

**이벤트 경품 주의사항**
- 5만원 이상 경품: 제세공과금 22% 처리 필요
- 실 집행 전 세무사 1회 자문 권장

---

## 7) 📁 참조 파일 목록

### 🔵 poppon (메인 앱)

#### 컴포넌트 / UI
| 파일 | 경로 |
|------|------|
| DealCard.tsx | `src/components/deal/DealCard.tsx` |
| DealShelf.tsx | `src/components/deal/DealShelf.tsx` |
| DealGrid.tsx | `src/components/deal/DealGrid.tsx` |
| DealDetail.tsx | `src/components/deal/DealDetail.tsx` |
| DealModal.tsx | `src/components/deal/DealModal.tsx` |
| CopyCodeButton.tsx | `src/components/deal/CopyCodeButton.tsx` |
| DealActionBar.tsx | `src/components/deal/DealActionBar.tsx` |
| DealDetailClient.tsx | `src/components/deal/DealDetailClient.tsx` ⚠️ 레거시 |
| TopNav.tsx | `src/components/layout/TopNav.tsx` |
| Footer.tsx | `src/components/layout/Footer.tsx` |
| SourceProtection.tsx | `src/components/layout/SourceProtection.tsx` |
| TopProgressBar.tsx | `src/components/layout/TopProgressBar.tsx` |
| Toast.tsx | `src/components/common/Toast.tsx` |
| Pagination.tsx | `src/components/common/Pagination.tsx` |
| SortDropdown.tsx | `src/components/common/SortDropdown.tsx` |
| AuthSheet.tsx | `src/components/auth/AuthSheet.tsx` ← **KMC 본인인증 + kmc_verify 스텝 (2/26 전환)** |
| MobileFilterSheet.tsx | `src/components/search/MobileFilterSheet.tsx` |
| SearchBar.tsx | `src/components/search/SearchBar.tsx` |
| SearchFilters.tsx | `src/components/search/SearchFilters.tsx` |
| SearchInput.tsx | `src/components/search/SearchInput.tsx` |
| CategoryGrid.tsx | `src/components/category/CategoryGrid.tsx` |
| SubCategoryChips.tsx | `src/components/category/SubCategoryChips.tsx` |
| CategoryTabBar.tsx | `src/components/category/CategoryTabBar.tsx` |
| CategoryIcon.tsx | `src/components/category/CategoryIcon.tsx` |
| MerchantDealTabs.tsx | `src/components/merchant/MerchantDealTabs.tsx` |
| FollowButton.tsx | `src/components/merchant/FollowButton.tsx` |

#### 페이지
| 파일 | 경로 |
|------|------|
| 루트 레이아웃 | `src/app/layout.tsx` |
| 글로벌 CSS | `src/app/globals.css` |
| 미들웨어 | `src/middleware.ts` |
| 홈 | `src/app/page.tsx` |
| 검색 | `src/app/search/page.tsx` + `loading.tsx` |
| 카테고리 | `src/app/c/[categorySlug]/page.tsx` + `loading.tsx` |
| 브랜드관 | `src/app/m/[merchantSlug]/page.tsx` + `loading.tsx` |
| 딜 상세 (모달) | `src/app/@modal/(.)d/[slug]/page.tsx` |
| 딜 상세 (풀페이지) | `src/app/d/[slug]/page.tsx` |
| 제보 | `src/app/submit/page.tsx` |
| 마이페이지 | `src/app/me/page.tsx` + `loading.tsx` |
| 로그인 | `src/app/auth/page.tsx` + `callback/route.ts` + `callback/naver/route.ts` |
| 모바일 OAuth 콜백 (카카오) | `src/app/auth/callback/mobile/page.tsx` |
| 모바일 OAuth 콜백 (네이버) | `src/app/auth/callback/naver/mobile/page.tsx` |
| 법적 페이지 | `src/app/legal/privacy/`, `terms/`, `marketing/` |

#### 데이터 / 타입 / 유틸 / 인증
| 파일 | 경로 |
|------|------|
| database.ts (타입) | `src/types/database.ts` |
| index.ts (re-export) | `src/types/index.ts` |
| deals.ts (데이터) | `src/lib/deals.ts` |
| tracking.ts (행동추적) | `src/lib/tracking.ts` |
| format.ts (유틸) | `src/lib/utils/format.ts` |
| constants.ts | `src/lib/constants.ts` |
| AuthProvider.tsx | `src/lib/auth/AuthProvider.tsx` |
| Supabase 서버 | `src/lib/supabase/server.ts` (createServerSupabaseClient + createServiceClient) |
| Supabase 브라우저 | `src/lib/supabase/client.ts` (싱글톤) |

#### API (메인 앱)
| 파일 | 경로 |
|------|------|
| 제보 API | `src/app/api/submit/route.ts` |
| 행동추적 API | `src/app/api/actions/route.ts` |
| 검색 로그 API | `src/app/api/actions/search/route.ts` |
| 클릭 트래킹 | `src/app/out/[dealId]/route.ts` |
| 딜 저장 API | `src/app/api/me/saved-deals/route.ts` |
| 브랜드 구독 API | `src/app/api/me/follows/merchants/route.ts` |
| 계정 탈퇴 API | `src/app/api/me/delete-account/route.ts` |
| 프로필 조회 API | `src/app/api/me/profile/route.ts` |
| 로그아웃 API | `src/app/api/auth/signout/route.ts` |
| 네이버 OAuth | `src/app/api/auth/naver/route.ts` |
| 네이버 OAuth (모바일) | `src/app/api/auth/naver/mobile/route.ts` |
| KMC 인증 요청 | `src/app/api/kmc/request/route.ts` ✅ | tr_cert JSON API (AuthSheet에서 fetch) |
| KMC 인증 팝업 | `src/app/api/kmc/verify/route.ts` | 레거시 (request가 대체) |
| KMC 인증 콜백 | `src/app/api/kmc/callback/route.ts` ✅ (CI 중복체크 + postMessage) |
| KMC 디버그 | `src/app/api/kmc/debug/route.ts` ✅ |
| KMC 암호화 래퍼 | `src/lib/kmc/crypto.ts` ✅ (LD_PRELOAD iconv_shim) |

#### 바이너리 / 설정
| 파일 | 경로 |
|------|------|
| KmcCrypto 바이너리 | `bin/KmcCrypto` (39080 bytes) |
| iconv_shim.so | `bin/iconv_shim.so` (145KB) ✅ 🆕 — LD_PRELOAD 방식 EUC-KR 변환 |
| gconv EUC-KR 모듈 | `bin/gconv/EUC-KR.so` (18640 bytes) ← 레거시, iconv_shim이 대체 |
| gconv 설정 | `bin/gconv/gconv-modules` ← 레거시 |

### 🔴 poppon-admin (어드민 앱)

#### 컴포넌트
| 파일 | 경로 |
|------|------|
| MerchantForm.tsx | `src/components/admin/MerchantForm.tsx` |

#### 페이지
| 파일 | 경로 |
|------|------|
| 루트 레이아웃 | `src/app/layout.tsx` |
| 미들웨어 | `src/middleware.ts` (비밀번호 보호) |
| 대시보드 | `src/app/(dashboard)/page.tsx` + `layout.tsx` |
| 딜 목록/생성/수정 | `src/app/(dashboard)/deals/` |
| 머천트 목록/생성/수정 | `src/app/(dashboard)/merchants/` |
| 회원 목록/상세 | `src/app/(dashboard)/members/page.tsx` + `[id]/page.tsx` |
| 제보 관리 | `src/app/(dashboard)/submissions/page.tsx` |
| 크롤 모니터링/이력 | `src/app/(dashboard)/crawls/page.tsx` + `crawl-history/page.tsx` |
| 푸시 알림 | `src/app/(dashboard)/push/page.tsx` ✅ |

#### API (어드민 앱)
| 파일 | 경로 |
|------|------|
| 어드민 인증 | `src/app/api/auth/route.ts` |
| 딜 CRUD | `src/app/api/deals/route.ts` + `[id]/route.ts` |
| 머천트 | `src/app/api/merchants/route.ts` + `[id]/route.ts` |
| 커넥터 관리 | `src/app/api/connectors/[id]/route.ts` |
| 대시보드 | `src/app/api/dashboard/route.ts` |
| 로고 업로드 | `src/app/api/upload-logo/route.ts` |
| 회원 | `src/app/api/members/route.ts` + `[id]/route.ts` |
| 제보 | `src/app/api/submissions/route.ts` + `[id]/route.ts` |
| AI 크롤 | `src/app/api/ai-crawl/route.ts` + `[connectorId]/route.ts` |
| Cron | `src/app/api/cron/crawl/route.ts` + `cron/expire/route.ts` + `cron/push-expiring/route.ts` ✅ |
| 크롤 이력 | `src/app/api/crawl-history/route.ts` |
| 푸시 발송 | `src/app/api/push/route.ts` ✅ |
| 푸시 이력 | `src/app/api/push/history/route.ts` ✅ |
| 푸시 옵션 | `src/app/api/push/options/route.ts` ✅ |

#### 크롤러 / 스크립트
| 파일 | 경로 |
|------|------|
| AI 크롤러 엔진 (v5.1) | `src/lib/crawl/ai-engine.ts` |
| 딜 저장 (v2.4) | `src/lib/crawl/save-deals.ts` |
| 기타 스크립트 | `scripts/` |

### 🟢 poppon-app (모바일 앱) 🚧

#### 설정 파일
| 파일 | 경로 |
|------|------|
| app.json | `app.json` |
| tailwind.config.js | `tailwind.config.js` |
| global.css | `src/global.css` |
| .env | `.env` |

#### 라우트 (Expo Router)
| 파일 | 경로 | 비고 |
|------|------|------|
| 루트 레이아웃 | `app/_layout.tsx` | AuthProvider + 커스텀 스플래시 + 푸시 알림 핸들러 + 딥링크 리스너 |
| 탭 레이아웃 | `app/(tabs)/_layout.tsx` | Ionicons + SafeArea bottom 동적 패딩 |
| 홈 | `app/(tabs)/index.tsx` | 로고이미지좌측+알림종우측 + 가짜검색바 ✅ |
| 카테고리 | `app/(tabs)/categories.tsx` | 6개 그리드(원형+filled) + 인기딜 DealShelf + 가짜검색바 ✅ |
| 검색 | `app/(tabs)/search.tsx` | 딜/브랜드 토글 탭 + autoFocus + 무한스크롤 ✅ |
| 마이페이지 | `app/(tabs)/me.tsx` | 프로필+저장딜+구독브랜드+법적페이지링크 + 가짜검색바 ✅ |
| 딜 상세 모달 | `app/d/[slug].tsx` | transparentModal + maxHeight 85% |
| 브랜드관 | `app/m/[merchantSlug].tsx` | 프로필헤더 + 진행중/종료 탭 + 무한스크롤 |
| 카테고리 상세 | `app/c/[categorySlug].tsx` | 서브카테고리칩 + FlatList 무한스크롤 |
| 로그인 | `app/auth/index.tsx` + `_layout.tsx` | 카카오/네이버/애플 + **이메일은 웹으로 이동** ✅ |
| ~~이메일 가입/로그인~~ | ~~`app/auth/email.tsx`~~ | ⚠️ **제거 대상** (웹 KMC 플로우로 대체) |
| 온보딩 | `app/auth/onboarding.tsx` | **4단계: [profile_info→]카테고리→마케팅→완료** ✅ |
| 제보 | `app/submit.tsx` | 웹 API 호출 + 인라인 style ✅ |
| 법적 페이지 | `app/legal/*.tsx` + `_layout.tsx` | WebView로 웹 URL 로딩 |

#### 컴포넌트
| 파일 | 경로 | 비고 |
|------|------|------|
| DealCard.tsx | `src/components/deal/DealCard.tsx` | 그리드 카드 + resolveLogoUrl + **로그인 게이트** ✅ |
| DealShelf.tsx | `src/components/deal/DealShelf.tsx` | 수평 스크롤 + 동적 카드폭(÷2.3) |
| DealDetailView.tsx | `src/components/deal/DealDetailView.tsx` | 딜 상세 + safeOpenURL + resolveLogoUrl |
| DealListCard.tsx | `src/components/deal/DealListCard.tsx` | 수평 리스트 카드 (56px 로고) + **로그인 게이트** ✅ |
| CopyCodeButton.tsx | `src/components/deal/CopyCodeButton.tsx` | expo-clipboard + expo-haptics |
| SaveButton.tsx | `src/components/deal/SaveButton.tsx` | 딜 저장/해제 + haptics |
| FollowButton.tsx | `src/components/merchant/FollowButton.tsx` | 브랜드 구독/해제 + compact/default |
| CategoryGrid.tsx | `src/components/category/CategoryGrid.tsx` | 원형 배경 + filled 아이콘 |
| SubCategoryChips.tsx | `src/components/common/SubCategoryChips.tsx` | 수평 ScrollView 칩 |
| SortPicker.tsx | `src/components/common/SortPicker.tsx` | 바텀시트 정렬 모달 |
| LoginPromptModal.tsx | `src/components/common/LoginPromptModal.tsx` | 비로그인 딜 탭 시 바텀시트 로그인 유도 ✅ |
| CustomSplash.tsx | `src/components/common/CustomSplash.tsx` | 다크 스플래시 + 팝콘 파티클 + DB 숫자 ✅ |

#### 라이브러리
| 파일 | 경로 | 비고 |
|------|------|------|
| Supabase 클라이언트 | `src/lib/supabase/client.ts` | AsyncStorage + globalThis 싱글톤 + implicit flow |
| 딜 쿼리 | `src/lib/deals.ts` | 웹 포팅 + offset 페이지네이션 + dedupeDeals + **searchMerchants()** ✅ |
| 행동 추적 | `src/lib/tracking.ts` | Supabase 직접 insert (fire-and-forget) + platform:'app' |
| 포맷 유틸 | `src/lib/utils/format.ts` | 웹에서 100% 복사 |
| 타입 정의 | `src/types/database.ts` + `index.ts` | 웹에서 100% 복사 |
| 상수 | `src/constants/index.ts` | 웹에서 포팅 (EXPO_PUBLIC 변환) |
| AuthProvider | `src/lib/auth/AuthProvider.tsx` | v10: 세션관리 + 온보딩 + 푸시토큰 자동등록/삭제 |
| 푸시 알림 | `src/lib/push/notifications.ts` | 토큰등록/삭제/딥링크/핸들러 설정 |
| 카카오 OAuth | `src/lib/auth/kakao.ts` | 웹 콜백 중간 페이지 경유 + Linking.addEventListener |
| 네이버 OAuth | `src/lib/auth/naver.ts` | v2 웹 중간 페이지 경유 (카카오 동일 패턴) |
| 애플 로그인 | `src/lib/auth/apple.ts` | expo-apple-authentication 코드 준비 |
| 프로필 헬퍼 | `src/lib/auth/profile.ts` | **v3**: saveOnboarding/toggleSave/toggleFollow/saveProviderProfile + **SNS 메타데이터 자동 추출(phone/gender/birth_date)** ✅ |

---

## 8) AI 응답 포맷 (항상 동일하게)

AI는 매 응답을 아래 순서로 작성한다.
1) **상태 스냅샷**: 현재 SoT 기준으로 "무엇이 확정/미확정인지" 5줄 이내
2) **다음 단계 제안**: 지금 단계(INTAKE/DISCOVERY/...)와 다음 산출물
3) **리스크 & 질문**: 가정/불확실성/결정 필요한 포인트
4) **산출물**: (설계안/체크리스트/파일 전체/테스트 플랜 등)

---

## 9) DECISION LOG (ADR Index)
> 10개 초과 시 오래된 항목은 `ARCHIVE.md`로 이동, 본 문서에 1줄 요약만 남긴다.

- ADR-20260222-01: merchants DELETE cascade 추가 (v4.4) — FK 연관 데이터 순서 삭제
- ADR-20260224-01: 앱 로그인 게이트 전략 — 웹은 SEO 유지(열람 허용), 앱은 딜 카드 탭 시 로그인 필수 (LoginPromptModal 바텀시트)
- ADR-20260224-02: ~~이메일 인증 플로우~~ → **ADR-20260226-01로 대체됨**
- ADR-20260225-01: 앱 아이콘/파비콘 전략 — 앱 아이콘: 빨간 배경(홈 화면 가시성), 파비콘: 흰 배경(브라우저 탭 깔끔). PDF 벡터에서 600dpi 렌더링→1024×1024 추출.
- ADR-20260225-02: 인증 체계 전환 — 이메일 가입 제거 + 이메일 인증(확인 메일) 제거 → KMC 휴대폰 본인인증으로 통일. 실명+폰번호+CI/DI 한방 확보. TargetUP-AI 타겟 메시징 기반.
- ADR-20260226-01: **가입 플로우 전환 구현** — 웹: main→kmc_verify→signup→categories→marketing→signUp→complete (identity/email_sent 제거). 앱 SNS: OAuth→[profile_info if 폰없음]→categories→marketing→완료. 앱 이메일: WebBrowser로 웹 가입 페이지 이동. callback에 CI 중복체크 추가. profile.ts v3 SNS 메타데이터 자동 추출.
- ADR-20260227-01: **KMC 에러 5→99 해결** — 원인: plainText를 7필드로 축소한 것이 IndexOutOfRange 유발. 해결: 13필드 복원 (`certMet`~`plusInfo` 사이 슬래시 7개). form submit을 AuthSheet에서 직접 실행(Referer 일치). URL CODE `003002`.

---

## 10) ASSUMPTION LEDGER (가정 목록)
- ~~A1: event_page_url이 merchants 테이블 컬럼이다~~ → **거짓 확인 (2/22). 커넥터 자동 생성 트리거용 필드일 뿐, merchants 컬럼 아님.**
- ~~A2: KMC API 업체코드 + 암호화 키 발급 완료 상태인지 미확인~~ → **확인됨 (2/26). CP ID: IVTT1001, URL CODE: 003001, 바이너리 정상 작동**
- ~~A3: Ubuntu 24 glibc 2.39의 EUC-KR.so가 Vercel Lambda(Amazon Linux 2, glibc 2.26~2.34)에서 호환되는지 미확인~~ → **우회됨 (2/26). LD_PRELOAD iconv_shim.so 방식으로 gconv 의존성 자체를 제거. enc 성공 확인.**
- ~~A4: KMC verify route의 tr_cert plainText 포맷이 KMC 규격과 일치하는지 미확인~~ → **해결 (2/27). 13필드 포맷(certMet~plusInfo 사이 슬래시 7개)으로 복원하여 정상 작동 확인. KMC 개발자와 통화로 IndexOutOfRange 원인 확인.**

---

## 11) RISK REGISTER (리스크 목록)
| ID | 리스크 | 확률 | 영향 | 점수 | 대응 |
|----|--------|------|------|------|------|
| R1 | Apple Developer 서명 권한 확인 지연으로 애플 로그인/앱스토어 일정 지연 | 2 | 4 | 8 | DUNS 승인 완료. 웹+Android 우선 출시 |
| R2 | ~~EAS 빌드 후 푸시 알림 미작동~~ | - | - | - | **해결: Firebase FCM V1 + Expo credentials 등록 + e2e 성공 (2/27)** |
| R3 | KMC 연동 시 팝업 차단/웹뷰 호환 이슈 | 2 | 3 | 6 | 웹+앱 별도 플로우 설계 |
| ~~R4~~ | ~~gconv EUC-KR.so glibc 버전 불일치~~ | - | - | - | **해결: LD_PRELOAD iconv_shim.so로 대체** |
| ~~R5~~ | ~~KMC 에러 코드 5/99 — tr_cert 규격 불일치~~ | - | - | - | **해결: plainText 13필드 복원 (2/27)** |

---

## 12) DONE LOG (완료 기록)
> 10개 초과 시 오래된 항목은 `ARCHIVE.md`로 이동.
> 아카이브: 2/20 Phase M3 OAuth(카카오), 2/20 디자인수정+로고시안, 2/20 세션버그수정+네이버, 2/20 법적페이지+홈리디자인, 2/21 UI통일+에러핸들링, 2/21 푸시알림+platform, 2/21 SaveButton+FollowButton, 2/21 푸시 발송 시스템, 2/21 제보화면+naver_brand, 2/22 머천트DELETE+PUT, 2/23 로고확정+적용 → `ARCHIVE.md` 참조

| 날짜 | 세션 | 플랫폼 | 주요 완료 내용 | 핵심 교훈 |
|------|------|--------|--------------|----------|
| 2/24 | UX수정+로그인게이트 | 앱 | SafeArea bottom + 전탭 검색바 + 브랜드검색 + LoginPromptModal | 웹 SEO 유지 vs 앱 가입률 극대화 전략 분리 |
| 2/24 | 커스텀 스플래시 | 앱 | 다크 테마 + 팝콘 파티클 + DB 실시간 숫자 + _layout 통합 | "팝콘처럼 터지는 쿠폰" 브랜드 컨셉 반영 |
| 2/24 | 이메일인증+어드민로고 | 웹+앱+어드민 | 어드민 로고 적용 + 앱 로고 교체 + 이메일 가입/인증 플로우(웹+앱) | RLS 때문에 미인증 상태에서 profiles 업데이트 불가 → localStorage 임시 저장 패턴 |
| 2/25 | 제보버그+인증전략 | DB+기획 | submissions.user_id nullable 수정 + 인증 전략 전환 결정(이메일→KMC) | 가입 허들 최소화, 인증은 KMC 한방으로 |
| 2/25 | 버그수정 2건 | 웹+어드민 | 어드민 브랜드 수정 후 페이지 유지 + 웹 딜 모달 스크롤 점프 근본 수정 | **버그 수정 시 effect 내부가 아닌 트리거 지점(Link scroll)부터 역추적** |
| 2/26 | KMC 암호화 모듈 연동 | 웹 | crypto.ts + request/callback/debug 라우트 + ENCODING_ERROR → **LD_PRELOAD iconv_shim.so로 해결** | KmcCrypto가 iconv_open("EUC-KR") 호출 → gconv 대신 LD_PRELOAD shim 주입 |
| 2/26 | 가입 플로우 전환 | 웹+앱 | AuthSheet kmc_verify 스텝 + verify/callback 라우트 + 앱 onboarding profile_info + profile.ts v3 + 앱 이메일→웹 이동 | identity/email_sent 제거, signUp 후 session null 대응(자동 signIn), CI 중복체크 |
| 2/26 | KMC 에러 코드 5 | 웹 | KMC 팝업에서 에러 코드 5 발생. 암호화는 성공(Vercel 로그 확인). **tr_cert plainText 포맷 규격 불일치** | plainText 포맷 변경 시 KMC 가이드 정독 필수 |
| 2/27 | **KMC 본인인증 완료** 🎉 | 웹 | plainText 13필드 복원(에러5→99→성공) + form submit AuthSheet 직접 실행 + URL CODE 003002 + 이름 URL 디코딩 | **KMC plainText는 반드시 13필드(certMet~plusInfo 사이 슬래시 7개). 가이드 매뉴얼 정독 필수** |
| 2/27 | **Apple Developer + EAS 빌드** | 앱+인프라 | DUNS 승인(694835804) + Apple Developer 등록 신청 + 카카오/네이버 동의항목 완료 + EAS Android 개발 빌드 성공 (notification-icon 누락 해결) | EAS prebuild 시 notification-icon.png 필수. monochrome 아이콘 재활용 가능 |
| 2/27 | **푸시 알림 e2e 완료** 🔔 | 앱+인프라 | Firebase 프로젝트 생성 + FCM V1 서비스 계정 키 → Expo credentials 등록 + 토큰 발급 성공 + 어드민 발송 → 실제 수신 확인 | FCM V1 필수(Legacy 아님). `eas credentials -p android` → Google Service Account → FCM V1. app.json에 `googleServicesFile` 필수. **app.json scheme과 네이티브 빌드 스킴 불일치 주의** |

---

*마지막 업데이트: 2026-02-27 (Firebase FCM V1 연동 + 푸시 알림 e2e 완료 🔔)*
