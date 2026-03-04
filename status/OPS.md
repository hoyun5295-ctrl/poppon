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

### EAS Build 정보
- **Expo 계정**: yuhoyun (ceo@invitocorp.com)
- **EAS 프로젝트**: `@yuhoyun/poppon-app` (ID: `3f3caa91-8f76-44c6-bc7a-d5aaff7eadde`)
- **Android application id**: `kr.poppon.app`
- **iOS bundle id**: `kr.poppon.app`
- **Android 키스토어**: Expo 클라우드 관리 (자동 생성)
- **notification-icon.png**: `assets/images/notification-icon.png` (monochrome 아이콘 복사본, EAS prebuild 필수)
- **google-services.json**: 프로젝트 루트에 위치 + `app.json`에 `android.googleServicesFile` 설정 필수

### Firebase (FCM 전용)
- **Firebase 프로젝트**: `poppon-845f8` (Spark 무료 요금제)
- **용도**: Android 푸시 알림(FCM V1)만 사용. 다른 Firebase 서비스 미사용
- **FCM V1 서비스 계정 키**: Expo credentials에 등록 완료 (`eas credentials -p android` → Google Service Account → FCM V1)
- **주의**: Legacy FCM API Key가 아닌 **FCM V1 Service Account Key** 사용해야 함
- **google-services.json**: `C:\projects\poppon-app\google-services.json` (EAS 빌드 시 번들에 포함)

### 이메일 발송 (Resend SMTP) ✅ 3/4 연동
- **서비스**: Resend (무료 100통/일)
- **도메인**: `poppon.kr` (Verified, Tokyo ap-northeast-1)
- **발신**: `POPPON <poppon@poppon.kr>`
- **Supabase SMTP 설정**: Host `smtp.resend.com` / Port `465` / Username `resend` / Password: Resend API Key
- **DNS 레코드** (가비아): DKIM TXT(`resend._domainkey`), SPF TXT(`send`), MX(`send` → `feedback-smtp.ap-northeast-1.amazonses.com.`)
- **이메일 템플릿**: Supabase Authentication → Email Templates → Reset Password 한국어화 완료
- **⚠️ 가비아 하이웍스 SMTP 외부 연동 불가**: `smtps.hiworks.com:465` 인증 실패 → Resend로 전환
- **가비아 메일 계정**: `poppon@poppon.kr` (하이웍스, 수신 전용으로 유지)

### ⚠️ 앱 스킴(Scheme) 관리 주의사항
- **프로덕션 스킴**: `poppon` (app.json `"scheme": "poppon"`)
- **딥링크 URL**: `poppon://auth/callback`, `poppon://kmc/callback` 등
- **웹 콜백 페이지**: `poppon/src/app/auth/callback/mobile/page.tsx`에 `poppon://` 하드코딩
- ⚠️ **app.json scheme은 빌드 시 네이티브에 박힘** — JS에서 scheme 변경해도 이미 설치된 앱은 변경 안 됨
- ⚠️ **개발 빌드 시 scheme과 Supabase redirect URL, 웹 콜백 딥링크 3곳 모두 일치해야 OAuth 작동**
- 개발 빌드 scheme 변경 시 반드시 **재빌드 필요** (JS 핫리로드로 반영 불가)

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
  → 변경 없음 → 스킵 | 변경 있음 → Claude Haiku 파싱 → save-deals v2.6
  → 카테고리: merchants.category_ids 직접 조회
  → 딜 변동 시: 해당 머천트 active_deal_count 자동 재계산
  → ✅ 즉시 푸시 제거 (v2.6) — 아침 9시 Cron(/api/cron/push-new-deals)에서 일괄 발송
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
- 09:00 KST: 신규 딜 구독자 일괄 푸시 (push-new-deals Cron) ✅ — 지난 24시간 신규 딜 → 머천트별 그룹핑 → 구독자(followed_merchants)에게만 발송
- 10:00 KST: 만료 임박 딜 푸시 발송 (push-expiring Cron) ✅
- 250초 타임아웃 (Vercel 300초 제한 전 중단)

---

## 🔐 회원가입/인증 시스템

### 웹 인증 플로우 (2/27 KMC 완료)
```
[이메일] AuthSheet: main → kmc_verify(KMC 본인인증 팝업) → signup(이메일+비번 설정) → categories → marketing → signUp → 자동 로그인 → 홈
  → KMC 팝업: fetch('/api/kmc/request')로 tr_cert 수신 → hidden form target=팝업 submit
  → signUp 후 session null이면 signInWithPassword로 자동 로그인 (email confirmation 대응)
  → KMC에서 받은 phone/name/ci/di/gender/birthDay를 profiles에 저장
[카카오] signInWithOAuth → Supabase 콜백 → saveProviderProfile v2 → 신규? → 온보딩(categories→marketing)
[네이버] 수동 OAuth → admin.createUser+generateLink+verifyOtp → 프로필 저장 → 온보딩
[탈퇴] 마이페이지 → pending_withdrawal → 어드민 승인(withdrawn) / 거부(active)
[로그아웃] <a href="/api/auth/signout"> → sb- 쿠키 삭제 + 302
```
- ⚠️ 이전 플로우(identity 직접입력 + email_sent 인증메일)는 제거됨

### 앱 인증 플로우 ✅ (2/26 업데이트)
```
[카카오] ✅ 동작 확인
  앱 → Linking.openURL(Supabase OAuth URL) → 카카오 로그인 → 웹 콜백 페이지(/auth/callback/mobile)
  → "앱으로 돌아가기" 버튼 → 딥링크 → Linking.addEventListener로 토큰 수신 → setSession
  → saveProviderProfile v3 (phone/gender/birth_date 자동 추출) → 신규? → 온보딩
[네이버] ✅ 동작 확인
  앱 → Linking.openURL(네이버 로그인) → 웹 콜백 페이지(/auth/callback/naver/mobile)
  → /api/auth/naver/mobile 호출(토큰 교환) → 앱으로 딥링크 → setSession
  → saveProviderProfile v3 → 신규? → 온보딩
[이메일] 🆕 웹으로 이동
  앱 → WebBrowser.openBrowserAsync('https://poppon.vercel.app/auth?mode=signup')
  → 웹에서 KMC 본인인증 + 이메일/비번 가입 완료
[애플] 코드 준비 완료 (Apple Developer DUNS 대기 중)
[로그아웃] supabase.auth.signOut() → clearPushToken() → router.replace('/(tabs)')
```

### 앱 온보딩 플로우 (2/26 업데이트)
```
SNS 로그인 후 신규 유저:
  → [profile_info 스텝: 전화번호 없으면 전화번호+성별+생년월일 입력] → categories → marketing → 완료
```

- saveProviderProfile v3: `app_metadata.providers` 기반 linked_providers + **SNS 메타데이터에서 phone/gender/birth_date 자동 추출**
  - 카카오: phone_number("+82 10-..."), gender("male"/"female"), birthyear("1990"), birthday("0101")
  - 네이버: mobile("010-..."), gender("M"/"F"), birthyear("1990"), birthday("01-01")

---

## 🆔 KMC 본인인증 시스템 (✅ 연동 완료 2/27)

### 아키텍처 (2/27 최종)
```
[웹] AuthSheet "본인인증" 버튼
  → 빈 팝업 window.open('', 'KMCISWindow') 먼저 열기
  → fetch('/api/kmc/request')로 tr_cert JSON 수신
  → AuthSheet 페이지(/auth)에서 hidden form 생성 → form.target=팝업 → form.submit()
  → Referer: /auth (KMC 등록 URL과 일치)
  → 유저 인증 → KMC가 POST /api/kmc/callback에 apiToken+certNum 전송
  → 토큰 검증 API 호출 → rec_cert 복호화 → CI 중복체크
  → 로그인 상태: profiles 바로 업데이트 | 비로그인: postMessage로 데이터 전달
  → postMessage로 부모 창에 결과 전달(phone/name/ci/di/gender/birthDay) → 팝업 닫기
[앱] 동일 플로우 → 딥링크(poppon://kmc/callback)로 결과 전달
```

### 파일 구조
| 파일 | 경로 | 용도 |
|------|------|------|
| crypto.ts | `src/lib/kmc/crypto.ts` | KmcCrypto 바이너리 래퍼 (encrypt/decrypt/hash + **LD_PRELOAD iconv_shim**) |
| request | `src/app/api/kmc/request/route.ts` ✅ | tr_cert JSON API (AuthSheet에서 fetch) |
| verify | `src/app/api/kmc/verify/route.ts` | 레거시 (request가 대체) |
| callback | `src/app/api/kmc/callback/route.ts` ✅ | KMC 인증 결과 수신 + **CI 중복체크** + profiles 저장 + postMessage + **이름 decodeURIComponent** |
| debug | `src/app/api/kmc/debug/route.ts` | 바이너리/shim 번들 검증용 디버그 엔드포인트 |
| KmcCrypto | `bin/KmcCrypto` | KMC 암호화 바이너리 (39080 bytes) |
| iconv_shim.so | `bin/iconv_shim.so` | LD_PRELOAD EUC-KR 변환 shim (145KB) |
| ~~EUC-KR.so~~ | `bin/gconv/EUC-KR.so` | 레거시 (iconv_shim이 대체) |

### KMC 계정 정보
- CP ID: `IVTT1001`
- PW: `invito8517!`
- URL CODE: `003002` (등록 URL: `auth`)
- 월 비용: 55,000원
- 토큰 검증 API: `https://www.kmcert.com/kmcis/api/kmcisToken_api.jsp`
- 개발 담당자: 02-2033-8567 (김성재 매니저)

### plainText 규격 (✅ 확정 — 13필드, 12슬래시)
```
cpId/urlCode/certNum/date/certMet///////plusInfo/extendVar
                                  ↑ 슬래시 7개 (빈 예비필드 6개)
```
⚠️ **certMet과 plusInfo 사이에 반드시 슬래시 7개**. 줄이면 KMC 서버에서 IndexOutOfRange 발생 → 에러 99.

### ENCODING_ERROR 이슈 (✅ 해결 완료)
- **원인**: KmcCrypto 바이너리 내부에서 `iconv_open("EUC-KR")` 호출 → Vercel Lambda에 gconv 모듈 없음
- **증상**: `enc` 모드에서 `0:ENCODING_ERROR` 반환
- **해결 (1차 시도 실패)**: `GCONV_PATH=/tmp/gconv` + `bin/gconv/EUC-KR.so` 번들 → glibc 버전 불일치
- **해결 (최종)**: `LD_PRELOAD=iconv_shim.so` 방식 — C로 작성한 shim이 `iconv_open("EUC-KR")`을 인터셉트하여 내부적으로 변환 처리. gconv 의존성 완전 제거. Vercel 배포 검증 성공.
- **crypto.ts 구현**: `spawn` 호출 시 `env: { LD_PRELOAD: shimPath }` 설정

### 에러 코드 5 → 99 → 해결 (✅ 2/27)
- **에러 5**: plainText를 7필드로 축소한 것이 원인. 13필드로 복원하여 해결
- **에러 99**: form submit의 Referer 불일치 + plainText 필드 부족 → AuthSheet에서 직접 form submit + 13필드 복원으로 해결
- **KMC 개발자 확인**: 서버 로그상 **IndexOutOfRange** → plainText 필드 수 부족이 근본 원인
- **이름 URL 인코딩**: callback에서 받는 이름이 URL 인코딩 상태 → `decodeURIComponent` 처리 추가

---

## 📱 푸시 알림 시스템

### 앱 인프라 (✅ 구현 + e2e 검증 완료 2/27)
- `expo-notifications` + `expo-device` 설치 완료
- `app.json`: notifications 플러그인 + Android 채널(deals/marketing) 설정 + `googleServicesFile`
- `src/lib/push/notifications.ts`: 토큰 등록/삭제/딥링크 처리/핸들러
- `AuthProvider v10`: 로그인 시 자동 토큰 등록, 로그아웃 시 토큰 삭제
- `app/_layout.tsx`: 알림 탭 딥링크 리스너 (deal/merchant)
- profiles 테이블: push_token, push_token_updated_at, push_enabled, device_os, app_version
- **Firebase FCM V1**: `poppon-845f8` 프로젝트, Expo credentials에 서비스 계정 키 등록 완료

### 어드민 발송 시스템 (✅ 구현 + e2e 검증 완료 2/27)
- 수동 발송 UI + API (`/push` 페이지, `/api/push` POST/GET)
- 대상 필터: 전체/마케팅동의/관심카테고리/구독브랜드/딜저장자/플랫폼(iOS·Android)/가입일
- 자동 발송 Cron:
  - 만료 임박 24h (`/api/cron/push-expiring`, 매일 10:00 KST)
  - ✅ 신규 딜 구독자 일괄 발송 (`/api/cron/push-new-deals`, 매일 09:00 KST) — 3/4 추가
- ~~새 딜 즉시 푸시: save-deals v2.4에서 구독자 자동 발송~~ → **v2.6에서 제거, 아침 9시 Cron으로 이전**

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
- **`createServiceClient()`는 async 함수 — 반드시 `await` 필요** (빠뜨리면 `.from()` 타입 에러)
- **event_page_url은 merchants 컬럼이 아님** — 커넥터 자동 생성 트리거용 필드 (edit 페이지에서 빈칸 초기화가 정상)
- **DB 컬럼 수정/추가 전 반드시 SCHEMA.md에서 컬럼 존재 확인. 추측 금지.**

### 보안
- SourceProtection: 우클릭/F12/Ctrl+U 차단 (1차 방어)
- RLS 전체 활성화 완료 (2차 방어)
- anon key는 프론트엔드 노출됨 → RLS가 실제 보안 방벽

### 인증 / 회원
- **⚠️ createClient() auth lock**: 브라우저 Supabase 싱글톤이 토큰 갱신 중 lock 걸리면 `.update()` 프로미스 영원히 대기 → "저장 중..." 고착. **해결: 프로필 관련 DB 조작은 `/api/me/profile` 서버 API(PATCH)로 통일 (3/4)**. 마이페이지에서 `createClient()` 직접 DB 호출 금지.
- **⚠️⚠️⚠️ 비밀번호 재설정 — recovery 세션 근본 문제 (3/4 5회 실패)**:
  - `resetPasswordForEmail()` → 이메일 링크 → `/auth/callback?code=xxx` → `exchangeCodeForSession(code)` → **recovery 세션 쿠키가 기존 로그인 세션 쿠키를 덮어씌움** → 기존 로그인(카카오 등) 풀림
  - 새 탭에서 열리므로 클라이언트 AuthProvider가 recovery 세션을 감지 못함 → TopNav "로그인" 표시
  - 비밀번호 변경 후에도 recovery 세션 쿠키 찌꺼기가 남아 카카오/네이버 로그인 방해
  - **클라이언트에서 exchangeCodeForSession/getUser/getSession/updateUser 전부 auth lock 또는 세션 미인식**
  - **절대 금지**: `resetPasswordForEmail()` + PKCE callback 방식으로 비밀번호 재설정 구현
  - **해결 방향**: recovery 세션을 만들지 않는 방식 → (A) 마이페이지 직접 변경 (B) admin.generateLink 커스텀 이메일. 상세: STATUS.md CURRENT_TASK 참조
  - **현재 배포 코드 상태**: callback/route.ts에 password_reset_pending 쿠키 체크 삽입됨 + me/page.tsx에 쿠키 세팅 추가됨 → **롤백 필요**
- **웹 이메일 가입 (2/26 전환)**: main → kmc_verify → signup → categories → marketing → signUp → 자동 로그인
- **signUp 후 session null 대응**: `signInWithPassword`로 자동 로그인 (Supabase email confirmation 상태 무관하게 동작)
- **KMC postMessage**: 팝업에서 `window.opener.postMessage({ type: 'KMC_RESULT', payload })` → AuthSheet에서 `message` 이벤트 수신. **이름은 URL 인코딩 상태 → callback + AuthSheet 양쪽에서 `decodeURIComponent` 필수**
- **앱 이메일 가입**: WebBrowser로 웹 가입 페이지 이동 (KMC 본인인증은 웹에서만)
- **앱 온보딩 profile_info**: SNS 로그인 후 전화번호 미수집 시 전화번호+성별+생년월일 직접 입력 스텝 추가
- AuthProvider TOKEN_REFRESHED: fetchProfile 절대 금지 → 무한루프
- 로그아웃(웹): 서버 사이드 API 필수, `<a>` 태그 사용
- Toast: sessionStorage('poppon_pending_toast') → layout mount 시 표시
- 네이버 OAuth: 수동 플로우, `updateUserById` 필수 (updateUser 아님), 환경변수 poppon만
- 회원탈퇴: pending_withdrawal → 어드민 승인(withdrawn) / 거부(active)
- FollowButton: 클라이언트 컴포넌트 분리 필수
- 카카오 OAuth 검수 승인 완료

### KMC 본인인증
- **KmcCrypto 바이너리**: 39080 bytes, iconv_open("EUC-KR") 내부 호출. 바이너리 내 `KMC000002-...` 태그는 서비스ID가 아닌 모듈 태그 (CP ID와 무관)
- **ENCODING_ERROR 해결**: ~~GCONV_PATH~~ → **LD_PRELOAD iconv_shim.so** 방식으로 최종 해결. gconv 의존성 완전 제거.
- **crypto.ts**: `encrypt()`/`decrypt()`/`hash()` + `encryptTrCert()` + `LD_PRELOAD` env 설정
- **next.config.ts**: `outputFileTracingIncludes`에 `'./bin/**/*'` 필수 (KmcCrypto + iconv_shim.so)
- **enc vs msg**: enc는 인코딩 변환 필요(iconv_shim으로 해결), msg는 해시만(항상 성공)
- **dec 모드**: 결과에 한글(이름 등) 포함 → iconv-lite로 EUC-KR→UTF-8 디코딩 필요
- **plainText 13필드 필수**: `cpId/urlCode/certNum/date/certMet///////plusInfo/extendVar` — certMet~plusInfo 사이 슬래시 7개. **줄이면 IndexOutOfRange → 에러 99**
- **form submit**: AuthSheet에서 직접 hidden form 생성 → target=팝업 → submit. Referer가 등록 URL과 일치해야 함
- **request route**: JSON API (`/api/kmc/request`) → tr_cert + form_url 등 반환. verify route는 레거시
- **callback**: 이름이 URL 인코딩 상태로 올 수 있음 → `decodeURIComponent` 필수
- **callback CI 중복체크**: 같은 CI로 이미 가입된 유저 있으면 에러 반환
- **URL CODE**: `003002` (등록 URL: `auth`). KMC 관리자 페이지에서 확인/변경 가능
- **디버그**: `/api/kmc/debug` 엔드포인트로 바이너리/shim 상태 + enc 테스트 가능

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
- **DealModal 스크롤**: `useLayoutEffect`로 paint 전 body 고정 + `handleClose`에서 `router.back()` 전 직접 복원
- **intercepting route 모달 Link**: 반드시 `scroll={false}` 추가. 없으면 Next.js가 라우팅 시 `scrollTo(0,0)` 실행 → 모달 열릴 때 스크롤 점프 발생
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
- **앱은 Expo Go 개발 환경** — `npx expo start`로 확인, 배포는 EAS Build
- **EAS prebuild**: `assets/images/notification-icon.png` 없으면 Android 빌드 실패 (ENOENT). monochrome 아이콘 복사로 해결
- **EAS 빌드 명령**: `eas build --profile development --platform android` (iOS는 Apple Developer 필요)
- **expo-dev-client**: 개발 빌드 시 자동 설치 필요 (`eas build` 실행 시 프롬프트)
- **FCM 푸시 실패 "Unable to retrieve FCM server key"**: `eas credentials -p android` → Google Service Account → **FCM V1** (Legacy 아님) → 서비스 계정 키 JSON 업로드. 재빌드 불필요
- **⚠️ app.json scheme 변경 시 반드시 재빌드**: scheme은 네이티브에 박히므로 JS 수정만으로 반영 안 됨. scheme 변경 후 `eas build` 필수
- **⚠️ OAuth 딥링크 3곳 일치 필수**: (1) app.json scheme (2) Supabase redirect URL (3) 웹 콜백 페이지(`/auth/callback/mobile`)의 딥링크 URL — 하나라도 불일치하면 OAuth 콜백 실패

### 이메일 / SMTP
- **가비아 하이웍스 SMTP 외부 연동 불가**: POP3/SMTP 사용함 설정 + 메일 전용 비밀번호 생성해도 `535 5.7.8 Error: authentication failed` 발생. → **Resend SMTP로 전환하여 해결**
- **Supabase 비밀번호 재설정**: `resetPasswordForEmail()` → Supabase Auth 서버 직접 호출 (Vercel 로그에 안 찍힘) → Supabase Auth Logs에서 확인
- **❌ recovery 콜백 방식 폐기 (3/4)**: `resetPasswordForEmail()` + PKCE callback 방식은 recovery 세션이 기존 세션을 덮어씌우는 근본 문제로 **사용 불가**. 비밀번호 재설정은 recovery 세션을 만들지 않는 방식으로 전환 필요 (마이페이지 직접 변경 or admin.generateLink). 상세: STATUS.md CURRENT_TASK 참조

### 프로필 저장 (RLS)
- **anon key로 profiles update 시 RLS silent fail**: 에러 없이 200 반환하지만 실제 0 rows 업데이트됨. → **service_role 클라이언트로 변경 필수** (`/api/me/profile` route.ts)
- **AuthProvider profile vs fullProfile**: AuthProvider의 profile은 세션 변경 시에만 갱신됨. 마이페이지 설정 저장 후 다시 읽으면 옛날 값. → **서버 API(/api/me/profile GET)로 가져온 fullProfile 사용**

### 어드민
- 회원 목록 `auth.admin.listUsers()` 배치 필수
- 머천트 PUT: event_page_url/connector_type 필드 분리 (merchants 컬럼 오염 방지)
- edit 페이지 null 처리: 필드별 타입 맞춤 (배열→[], boolean→false), 일괄 `null→''` 금지
- 브랜드 수정 후 필터 유지: URL param `?category=xxx&page=N` (카테고리+페이지 양쪽 보존)

---

*마지막 업데이트: 2026-03-04 (비밀번호 재설정 recovery 세션 근본 문제 기록 + 롤백 필요 + resetPasswordForEmail 방식 폐기)*
