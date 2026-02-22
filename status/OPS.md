# 🔧 POPPON OPS.md — 인프라·운영·트러블슈팅

> **규칙:** 에러 발생 시 먼저 이 문서의 트러블슈팅 섹션을 확인한다. 과거 실수를 반복하지 않는다.

---

## 🖥️ 인프라

### 현재 구성
- **Vercel Pro ×2** ($20×2) + **Supabase Pro** ($25) = **$65/월**
- 메인+어드민: Vercel 서울(icn1)
- DB: Supabase Pro (서울, Storage: merchant-logos 버킷)
- **이관 트리거**: Supabase 비용 월 $100+ 시 자체 서버 검토
- **모바일**: EAS Build (Expo 무료 티어, 빌드 30회/월)

### 환경변수 (이름만)
- **메인(poppon)**: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
- **어드민(poppon-admin)**: 위 + ADMIN_SECRET, ANTHROPIC_API_KEY, CRON_SECRET, NEXT_PUBLIC_MAIN_URL
- **모바일(poppon-app)**: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_NAVER_CLIENT_ID, EXPO_PUBLIC_APP_SCHEME (⚠️ SERVICE_ROLE_KEY 절대 넣지 않음)
- **카카오**: Supabase Provider에 REST API Key 설정

### Supabase Redirect URLs
```
exp://192.168.219.116:8081/--/auth/callback   ← Expo Go 개발용
https://poppon.vercel.app/auth/callback/mobile ← 앱 OAuth 웹 콜백 중간 페이지
poppon://auth/callback                         ← 프로덕션 빌드용
```
- Site URL: `https://poppon.vercel.app` (localhost 아님)

---

## 🕷️ AI 크롤러 v5

### 아키텍처
```
커넥터 URL → Puppeteer (이미지 차단, 15s) → MD5 해시 비교
  → 변경 없음 → 스킵 | 변경 있음 → Claude Haiku 파싱 → save-deals v2.4
  → 카테고리: merchants.category_ids 직접 조회
  → 딜 변동 시: 해당 머천트 active_deal_count 자동 재계산
  → 신규 딜 시: 구독자에게 자동 푸시 알림 (v2.4)
```

### 커넥터 타입
| 타입 | 설명 | Cron | 성공 후 | 해시 |
|------|------|------|--------|------|
| `list` | 이벤트 목록 | ✅ 매일 | active 유지 | ✅ |
| `single` | 개별 이벤트 | ❌ 제외 | auto disabled | ❌ |
| `naver_brand` | 네이버 브랜드스토어 | ✅ 매일 | active 유지 | ✅ |

### 배치 스케줄 (어드민 Vercel Cron)
- 23:00/23:20/23:40 KST: 3-batch 크롤 (커넥터 이름순 정렬 → 3등분, single 자동 제외)
- 23:50 KST: 만료 딜 자동 처리
- 10:00 KST: 만료 임박 딜 푸시 발송 (push-expiring Cron) ✅
- 250초 타임아웃 (Vercel 300초 제한 전 중단)

---

## 🔐 회원가입/인증 시스템

### 웹 인증 플로우
```
[이메일] AuthSheet: signup(검증만) → identity(프로필) → categories → marketing → 최종 signUp + profile 일괄 저장
[카카오] signInWithOAuth → Supabase 콜백 → saveProviderProfile v2 → 신규? → 온보딩
[네이버] 수동 OAuth → admin.createUser+generateLink+verifyOtp → 프로필 저장
[탈퇴] 마이페이지 → pending_withdrawal → 어드민 승인(withdrawn) / 거부(active)
[로그아웃] <a href="/api/auth/signout"> → sb- 쿠키 삭제 + 302
```

### 앱 인증 플로우 ✅
```
[카카오] ✅ 동작 확인
  앱 → Linking.openURL(Supabase OAuth URL) → 카카오 로그인 → 웹 콜백 페이지(/auth/callback/mobile)
  → "앱으로 돌아가기" 버튼 → 딥링크 → Linking.addEventListener로 토큰 수신 → setSession
[네이버] ✅ 동작 확인
  앱 → Linking.openURL(네이버 로그인) → 웹 콜백 페이지(/auth/callback/naver/mobile)
  → /api/auth/naver/mobile 호출(토큰 교환) → 앱으로 딥링크 → setSession
[애플] 코드 준비 완료 (Apple Developer DUNS 대기 중)
[로그아웃] supabase.auth.signOut() → clearPushToken() → router.replace('/(tabs)')
```

- saveProviderProfile v2: `app_metadata.providers` 기반 linked_providers 동기화

---

## 📱 푸시 알림 시스템

### 앱 인프라 (✅ 구현 완료)
- `expo-notifications` + `expo-device` 설치 완료
- `app.json`: notifications 플러그인 + Android 채널(deals/marketing) 설정
- `src/lib/push/notifications.ts`: 토큰 등록/삭제/딥링크 처리/핸들러
- `AuthProvider v10`: 로그인 시 자동 토큰 등록, 로그아웃 시 토큰 삭제
- `app/_layout.tsx`: 알림 탭 딥링크 리스너 (deal/merchant)
- profiles 테이블: push_token, push_token_updated_at, push_enabled, device_os, app_version

### 어드민 발송 시스템 (✅ 구현 완료 — ⚠️ EAS 빌드 후 e2e 테스트 필수)
- 수동 발송 UI + API (`/push` 페이지, `/api/push` POST/GET)
- 대상 필터: 전체/마케팅동의/관심카테고리/구독브랜드/딜저장자/플랫폼(iOS·Android)/가입일
- 자동 발송 Cron: 만료 임박 24h (`/api/cron/push-expiring`, 매일 10:00 KST)
- 새 딜 자동 푸시: save-deals v2.4에서 구독자 자동 발송

### 푸시 타입 구분 (한국 정보통신망법)
| 타입 | 설명 | 마케팅 동의 필요 | 예시 |
|------|------|:---:|------|
| `service` | 서비스 알림 | ❌ | 저장한 딜 만료 임박, 구독 브랜드 새 딜 |
| `marketing` | 광고/프로모션 | ✅ | 이벤트, 추천 딜, 프로모션 |

⚠️ expo-notifications는 Expo Go에서 제한적. 토큰 발급은 EAS 빌드(개발 빌드)에서만 정상 작동.

---

## TargetUP-AI 연동 / 운영 정책

- **TargetUP-AI**: phone_hash, marketing_agreed, 관심카테고리/브랜드, 최근 행동 → segments_daily 배치
- **운영 정책**: 출처 표시, robots 존중, 실패 3회→비활성, 만료 자동 전환
- **분석 이벤트**: deal_view/click_out/copy_code/save, merchant_follow, search_performed, signup_complete, marketing_opt_in

---

## 📋 앱스토어 심사 체크리스트 (Phase M5)

### iOS (Apple)
- [ ] 애플 로그인 필수 포함 (소셜 로그인 제공 시)
- [ ] 개인정보처리방침 URL (앱 내 + App Store Connect)
- [ ] 이용약관 URL
- [ ] 스크린샷 6.7" + 6.5" + 5.5" (최소)
- [ ] 앱 설명 한국어
- [ ] 데이터 수집 항목 정확히 기재 (App Privacy)
- [ ] 심사용 테스트 계정 제공

### Android (Google)
- [ ] 개인정보처리방침 URL
- [ ] 콘텐츠 등급 설문
- [ ] 데이터 안전 섹션 (Data Safety)
- [ ] 타겟 연령 설정
- [ ] 스크린샷 + 기능 그래픽

---

## 🐛 트러블슈팅 / 주의사항

> AI는 과거의 실수를 반복하지 않기 위해 아래 내용을 반드시 숙지할 것.

### DB / Supabase
- Supabase 조인 FK 명시 필수: `categories!deals_category_id_fkey`
- deals 삭제 시 FK 순서: outbound_clicks → deal_actions → saved_deals
- merchants 삭제 시 FK 순서: deals(+하위FK) → crawl_runs → crawl_connectors → followed_merchants → merchants
- saved_deals.user_id FK: `auth.users(id)` 참조 (public.users 아님)
- followed_merchants.user_id FK: `public.profiles(id)` 참조
- profiles.phone: UNIQUE 해제됨 (KMC 연동 시 재적용)
- deal_actions: `metadata` 컬럼 없음, `platform` 컬럼 있음 (DEFAULT 'web')
- server.ts exports: `createServerSupabaseClient` (anon) + `createServiceClient` (service role)
- **event_page_url은 merchants 컬럼이 아님** — 커넥터 자동 생성 트리거용 필드 (edit 페이지에서 빈칸 초기화가 정상)
- **DB 컬럼 수정/추가 전 반드시 SCHEMA.md에서 컬럼 존재 확인. 추측 금지.**

### 보안
- SourceProtection: 우클릭/F12/Ctrl+U 차단 (1차 방어)
- RLS 전체 활성화 완료 (2차 방어)
- anon key는 프론트엔드 노출됨 → RLS가 실제 보안 방벽

### 인증 / 회원
- AuthSheet signUp 지연: marketing 스텝에서 signUp + profile 한꺼번에 저장
- AuthProvider TOKEN_REFRESHED: fetchProfile 절대 금지 → 무한루프
- 로그아웃(웹): 서버 사이드 API 필수, `<a>` 태그 사용
- Toast: sessionStorage('poppon_pending_toast') → layout mount 시 표시
- 네이버 OAuth: 수동 플로우, `updateUserById` 필수 (updateUser 아님), 환경변수 poppon만
- 회원탈퇴: pending_withdrawal → 어드민 승인(withdrawn) / 거부(active)
- FollowButton: 클라이언트 컴포넌트 분리 필수
- 카카오 OAuth 검수 승인 완료

### 행동추적
- actions API(웹): `createServiceClient` 사용 (RLS 우회, 비로그인도 insert)
- actions API: body user_id null이면 서버 세션에서 자동 추출
- 앱 tracking.ts: platform:'app' 자동 기록

### 크롤러
- naver_brand: fullPage 모드 + /products/ URL 후처리 차단 + /category/ 및 /shoppingstory/ URL만 허용
- 프롬프트 v5.1: "제목+혜택 조합" 판단 원칙 + benefitSummary 실질 혜택 검증 (hasRealBenefit 후처리)
- naver_brand 후처리: 혜택 키워드(할인/특가/증정/쿠폰 등) 있으면 통과, 제목 반복·제품 모음은 차단
- Puppeteer 서버리스: `puppeteer-core` + `@sparticuz/chromium`
- Cron 3-batch: 커넥터 이름순 정렬 → 3등분, single 자동 제외

### Next.js / Vercel
- 한글 slug → decodeURIComponent 필수
- useSearchParams + Suspense: Next.js 15 필수
- DealModal 스크롤: `position: fixed` + `top: -scrollY` 패턴
- 모달 내부 링크 → `<a>` hard navigation
- Vercel 빌드: `.rpc()` → `.then(() => {}, () => {})`

### 모바일 앱 (Expo)
- `detectSessionInUrl: false` 반드시 설정
- 웹의 `createServerSupabaseClient` / `createServiceClient` → 앱에서 사용 불가
- `<Image>`에 width/height 필수, `<Text>` 안에만 텍스트
- 한글 slug: `decodeURIComponent` 필요
- `expo-image` 권장 (캐싱/성능 우수)
- 웹 Pagination → FlatList `onEndReached` 무한스크롤
- `app/_layout.tsx`에서 Supabase 직접 import 금지 → 중복 초기화 에러
- Supabase: AsyncStorage + globalThis 싱글톤 (LargeSecureStore aes-js race condition 해결)
- 온보딩: `onboarding_completed` boolean 기반 (interest_categories 길이 기반 → 무한루프)
- Expo Go OAuth: `openAuthSessionAsync` 미작동 → 웹 콜백 중간 페이지 패턴으로 해결
- Expo Go `exp://` 스킴: iOS Safari 자동 리다이렉트 차단 → 유저 버튼 탭 필요 (프로덕션은 `poppon://`)
- WebCrypto API 미지원: PKCE 불가 → implicit flow 사용 중
- 로고 상대경로: `resolveLogoUrl()` 헬퍼로 절대 URL 변환
- 외부 URL 열기: `safeOpenURL()` 헬퍼 (try-catch + Alert)
- 카테고리 아이콘: 이모지 `<Text>` (👕패션/💄뷰티/🍔식품/🏠생활/✈️여행/🎬문화) — 홈·카테고리탭·검색 3곳 통일
- expo-notifications: Expo Go 제한적 → EAS 빌드에서만 토큰 발급 정상 작동
- 앱 스타일링: 인라인 `style={{}}` 사용 (NativeWind className은 라우트 파일에서 미작동 확인됨)

### 어드민
- 회원 목록 `auth.admin.listUsers()` 배치 필수
- 머천트 PUT: event_page_url/connector_type 필드 분리 (merchants 컬럼 오염 방지)
- edit 페이지 null 처리: 필드별 타입 맞춤 (배열→[], boolean→false), 일괄 `null→''` 금지
- 브랜드 수정 후 필터 유지: URL param `?category=xxx`

---

*마지막 업데이트: 2026-02-22 (STATUS.md에서 분리)*
