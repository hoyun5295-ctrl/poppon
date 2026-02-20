# POPPON 프로젝트 STATUS

## 프로젝트 개요
- **제품명**: POPPON (K-RetailMeNot)
- **한줄 정의**: 한국의 모든 할인/쿠폰/프로모션을 한 곳에 모아 탐색 → 저장/구독/알림으로 DB 축적 → TargetUP-AI CRM 고단가 타겟마케팅으로 수익화하는 딜 플랫폼
- **MVP 우선순위**: A(온라인 쿠폰/프로모션 코드) → B(앱쿠폰/링크형) → C(오프라인 이벤트)

### 프로젝트 구조 (3개 분리)
| 프로젝트 | 경로 | 용도 | 배포 |
|---------|------|------|------|
| **poppon** (메인) | `C:\projects\poppon` | 사용자 웹 (딜 탐색/저장/인증) | `https://poppon.vercel.app` ✅ |
| **poppon-admin** (어드민) | `C:\projects\poppon-admin` | 관리자 (딜CRUD/크롤러/Cron) | `https://poppon-admin.vercel.app` ✅ |
| **poppon-app** (모바일) | `C:\projects\poppon-app` | 모바일 네이티브 앱 (iOS/Android) | EAS Build → App Store / Play Store 🚧 |

- **도메인**: `poppon.kr` (가비아, DNS 설정 필요)
- **GitHub**: `hoyun5295-ctrl/poppon` + `hoyun5295-ctrl/poppon-admin` (둘 다 private)

---

## ⚠️ 개발 원칙
> **절대 원칙**: 시키기 전에 코드/파일 만들지 않는다.
> 반드시 **기존 파일 파악 → 설계 의논 → 합의 후 구현** 순서.

---

## 기술 스택

### 웹 (poppon + poppon-admin)
| 영역 | 기술 | 비고 |
|------|------|------|
| Frontend + Backend | **Next.js 15 (App Router)** | SSR/SSG, API Routes |
| Database + Auth | **Supabase (PostgreSQL)** | RLS, OAuth (카카오/네이버/애플), Storage |
| 스타일링 | **Tailwind CSS + shadcn/ui** | Pretendard |
| 상태관리 | **Zustand** | 경량 |
| 배포 | **Vercel Pro ×2** | Git push 자동 배포, 서울(icn1) |
| 검색 | **PostgreSQL 풀텍스트 (pg_trgm)** | 초기 1만건 충분 |
| AI 크롤러 | **Puppeteer + Claude Haiku** | 커넥터 타입별 (어드민 앱) |
| 본인인증 | **KMC** (월 55,000원 기존 계약) | 연동 대기 |

### 모바일 (poppon-app) 🚧
| 영역 | 기술 | 비고 |
|------|------|------|
| 프레임워크 | **Expo SDK 52+ / Expo Router v4** | 파일 기반 라우팅 |
| 스타일링 | **NativeWind v4** | Tailwind CSS for React Native |
| 상태관리 | **Zustand** | 웹과 동일 |
| DB/Auth | **Supabase** (웹과 동일 인스턴스 공유) | anon key + AsyncStorage + globalThis 싱글톤 |
| OAuth | **expo-auth-session + expo-web-browser** | 웹 콜백 중간 페이지 경유 방식 |
| 배포 | **EAS Build** | App Store + Play Store |
| 번들 ID | `kr.poppon.app` (iOS/Android 공통) | |

---

## 📁 참조 파일 목록

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
| DealDetailClient.tsx | `src/components/deal/DealDetailClient.tsx` ⚠️ 레거시 (빌드 호환용) |
| TopNav.tsx | `src/components/layout/TopNav.tsx` |
| Footer.tsx | `src/components/layout/Footer.tsx` |
| SourceProtection.tsx | `src/components/layout/SourceProtection.tsx` |
| TopProgressBar.tsx | `src/components/layout/TopProgressBar.tsx` |
| Toast.tsx | `src/components/common/Toast.tsx` |
| Pagination.tsx | `src/components/common/Pagination.tsx` |
| SortDropdown.tsx | `src/components/common/SortDropdown.tsx` |
| AuthSheet.tsx | `src/components/auth/AuthSheet.tsx` |
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
| Cron | `src/app/api/cron/crawl/route.ts` + `cron/expire/route.ts` |
| 크롤 이력 | `src/app/api/crawl-history/route.ts` |

#### 크롤러 / 스크립트
| 파일 | 경로 |
|------|------|
| AI 크롤 엔진 (v5) | `src/lib/crawl/ai-engine.ts` |
| 딜 저장 (v2.3) | `src/lib/crawl/save-deals.ts` |
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
| 루트 레이아웃 | `app/_layout.tsx` | AuthProvider 래핑 + auth 모달 + legal 스크린 |
| 탭 레이아웃 | `app/(tabs)/_layout.tsx` | Ionicons + iOS safeArea |
| 홈 | `app/(tabs)/index.tsx` | POPPON좌측+알림종우측+히어로중앙정렬 |
| 카테고리 | `app/(tabs)/categories.tsx` | 6개 그리드(원형+filled) + 인기딜 DealShelf |
| 검색 | `app/(tabs)/search.tsx` | TextInput + 원형아이콘 카테고리필터 + 무한스크롤 |
| 마이페이지 | `app/(tabs)/me.tsx` | 프로필+저장딜+구독브랜드+법적페이지링크 |
| 딜 상세 모달 | `app/d/[slug].tsx` | transparentModal + maxHeight 85% |
| 브랜드관 | `app/m/[merchantSlug].tsx` | 프로필헤더 + 진행중/종료 탭 + 무한스크롤 |
| 카테고리 상세 | `app/c/[categorySlug].tsx` | 서브카테고리칩 + FlatList 무한스크롤 |
| 로그인 | `app/auth/index.tsx` + `_layout.tsx` | 카카오/네이버/애플 버튼 |
| 온보딩 | `app/auth/onboarding.tsx` | 3단계: 카테고리→마케팅→완료 |
| 제보 | `app/submit.tsx` | 미구현 (Phase M4) |
| 법적 페이지 | `app/legal/*.tsx` + `_layout.tsx` | WebView로 웹 URL 로딩 |

#### 컴포넌트
| 파일 | 경로 | 비고 |
|------|------|------|
| DealCard.tsx | `src/components/deal/DealCard.tsx` | 그리드 카드 + resolveLogoUrl |
| DealShelf.tsx | `src/components/deal/DealShelf.tsx` | 수평 스크롤 + 동적 카드폭(÷2.3) |
| DealDetailView.tsx | `src/components/deal/DealDetailView.tsx` | 딜 상세 + safeOpenURL + resolveLogoUrl |
| DealListCard.tsx | `src/components/deal/DealListCard.tsx` | 수평 리스트 카드 (56px 로고) |
| CopyCodeButton.tsx | `src/components/deal/CopyCodeButton.tsx` | expo-clipboard + expo-haptics |
| SaveButton.tsx | `src/components/deal/SaveButton.tsx` | 딜 저장/해제 + haptics |
| FollowButton.tsx | `src/components/merchant/FollowButton.tsx` | 브랜드 구독/해제 + compact/default |
| CategoryGrid.tsx | `src/components/category/CategoryGrid.tsx` | 원형 배경 + filled 아이콘 |
| SubCategoryChips.tsx | `src/components/common/SubCategoryChips.tsx` | 수평 ScrollView 칩 |
| SortPicker.tsx | `src/components/common/SortPicker.tsx` | 바텀시트 정렬 모달 |

#### 라이브러리
| 파일 | 경로 | 비고 |
|------|------|------|
| Supabase 클라이언트 | `src/lib/supabase/client.ts` | AsyncStorage + globalThis 싱글톤 + implicit flow |
| 딜 쿼리 | `src/lib/deals.ts` | 웹 포팅 + offset 페이지네이션 + dedupeDeals |
| 행동 추적 | `src/lib/tracking.ts` | Supabase 직접 insert (fire-and-forget) |
| 포맷 유틸 | `src/lib/utils/format.ts` | 웹에서 100% 복사 |
| 타입 정의 | `src/types/database.ts` + `index.ts` | 웹에서 100% 복사 |
| 상수 | `src/constants/index.ts` | 웹에서 포팅 (EXPO_PUBLIC 변환) |
| AuthProvider | `src/lib/auth/AuthProvider.tsx` | 세션관리 + onboarding_completed 기반 신규유저감지 |
| 카카오 OAuth | `src/lib/auth/kakao.ts` | 웹 콜백 중간 페이지 경유 + Linking.addEventListener |
| 네이버 OAuth | `src/lib/auth/naver.ts` | v2 웹 중간 페이지 경유 (카카오 동일 패턴) |
| 애플 로그인 | `src/lib/auth/apple.ts` | expo-apple-authentication 코드 준비 |
| 프로필 헬퍼 | `src/lib/auth/profile.ts` | saveOnboarding/toggleSave/toggleFollow/saveProviderProfile |

---

## 딜 타입 / 태그 체계

| 타입 | 설명 | CTA |
|------|------|-----|
| A1 | 쿠폰/프로모션 코드형 | CopyCodeButton + GoToSource |
| A2 | 가격딜/핫딜 | GoToSource |
| B | 앱쿠폰/링크형 | GetCouponButton + GoToSource |
| C | 오프라인 이벤트 | StoreInfoPanel + GoToSource |

- **혜택 (benefit_tags)**: percent_off, amount_off, bogo, free_shipping, gift_with_purchase, bundle_deal, clearance, member_only, new_user, app_only, limited_time
- **채널**: online_only, offline_only, hybrid
- **긴급**: ending_soon_24h, ending_soon_3d, new_today, updated_today

## 카테고리 (6개 활성)
패션(fashion), 뷰티(beauty), 식품/배달(food), 생활/리빙(living), 여행/레저(travel), 문화/콘텐츠(culture)

---

## DB 스키마

### 데이터 현황 (2/21 기준)
| 항목 | 수치 |
|------|------|
| 브랜드 (merchants) | ~340개 (전원 로고+brand_color) |
| 딜 (deals) | ~1,070 전체 (active ~875 / expired ~195) |
| 커넥터 (crawl_connectors) | ~257 active / ~171 disabled |
| 카테고리 (depth 0) | 6개 active |
| 회원 (profiles) | 4명 |

### deals 테이블
```
id, merchant_id(FK), category_id(FK), subcategory_id, title, description,
deal_type(A1/A2/B/C), status(pending/active/hidden/expired), channel,
benefit_tags(text[]), benefit_summary, coupon_code, discount_value/type,
price, original_price, discount_rate, conditions(jsonb),
starts_at, ends_at, is_evergreen,
source_type(crawl/brand/user_submit/affiliate/admin), source_url, landing_url, affiliate_url,
thumbnail_url, og_image_url, quality_score, trending_score,
view_count, click_out_count, save_count, feedback_work/fail_count,
slug, meta_title, meta_description, created_at, updated_at, expired_at
```

### merchants 테이블
```
id, name, slug, logo_url, brand_color(#hex), description, official_url,
category_ids(uuid[]), is_verified, follower_count, active_deal_count,
created_at, updated_at
```

### categories 테이블
```
id, parent_id(셀프조인), name, slug, description, icon,
sort_order, is_active, deal_count, depth(0=대/1=중/2=소), created_at
```

### profiles 테이블
```
id(FK→auth.users), phone(nullable), name, nickname, avatar_url,
gender, birth_date(varchar), ci, di,
interest_categories(uuid[], DEFAULT '{}'), marketing_agreed(boolean, DEFAULT false),
marketing_agreed_at, marketing_channel(text[]),
onboarding_completed(boolean, DEFAULT false),
provider(DEFAULT 'email'), linked_providers(text[]),
role(user/admin/super_admin), status(active/pending_withdrawal/withdrawn/banned),
withdrawn_at, withdraw_reason, last_login_at, created_at, updated_at
```

⚠️ **코드↔DB 컬럼명**: `interest_categories` (NOT interested_), `marketing_agreed` (NOT marketing_opt_in)

### 기타 테이블
- **saved_deals**: id, user_id, deal_id, created_at — UNIQUE(user_id, deal_id)
- **followed_merchants**: id, user_id, merchant_id, created_at — UNIQUE(user_id, merchant_id)
- **crawl_connectors**: id, name, merchant_id, source_url, config, status, fail_count, last_run_at, content_hash(MD5), hash_updated_at, connector_type(list/single/naver_brand, DEFAULT 'list')
- **crawl_runs**: id, connector_id, status, new/updated/expired_count, error_message, started_at, completed_at, tokens_used
- **deal_actions**: id, deal_id, user_id(nullable), session_id(ppn_sid), action_type, created_at — ⚠️ metadata 컬럼 없음
- **search_logs**: id, user_id(nullable), session_id, query, category_slug, result_count, created_at
- **submissions**: id(uuid), user_id, url, comment, parsed_preview(jsonb), status(pending/approved/rejected), admin_note, created_at
- **outbound_clicks**: deal_id(FK→deals.id)

### 조인 관계
```
deals.merchant_id → merchants.id
deals.category_id → categories.id (FK: deals_category_id_fkey)
deals.subcategory_id → categories.id (FK: deals_subcategory_id_fkey)
profiles.id → auth.users.id
saved_deals → auth.users + deals
followed_merchants → auth.users + merchants
outbound_clicks.deal_id → deals.id (FK: outbound_clicks_deal_id_fkey)
```
⚠️ Supabase 조인 FK 명시 필수: `categories!deals_category_id_fkey (name)`
⚠️ deals 삭제 시 outbound_clicks → deal_actions → saved_deals FK 먼저 삭제

### RLS 정책
- deals: SELECT status='active'|'expired', ALL: admin/super_admin
- merchants/categories: SELECT 전체
- profiles: SELECT/UPDATE auth.uid()=id
- saved_deals/followed_merchants: ALL auth.uid()=user_id
- 기타 (crawl_connectors, crawl_runs, outbound_clicks 등): 정책 없이 RLS ON (service_role 전용)
- ⚠️ **앱 전용**: deal_actions에 anon INSERT 정책 추가 필요

---

## 회원가입/인증 시스템

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
[로그아웃] supabase.auth.signOut() → router.replace('/(tabs)')
```

### 환경변수 (이름만)
- **메인**: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
- **어드민**: 위 + ADMIN_SECRET, ANTHROPIC_API_KEY, CRON_SECRET, NEXT_PUBLIC_MAIN_URL
- **모바일**: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_NAVER_CLIENT_ID, EXPO_PUBLIC_APP_SCHEME (⚠️ SERVICE_ROLE_KEY 절대 넣지 않음)
- **카카오**: Supabase Provider에 REST API Key 설정

### Supabase Redirect URLs
```
exp://192.168.219.116:8081/--/auth/callback   ← Expo Go 개발용
https://poppon.vercel.app/auth/callback/mobile ← 앱 OAuth 웹 콜백 중간 페이지
poppon://auth/callback                         ← 프로덕션 빌드용
```

### Supabase 설정
- Site URL: `https://poppon.vercel.app` (localhost 아님)
- saveProviderProfile v2: `app_metadata.providers` 기반 linked_providers 동기화

---

## AI 크롤러 v5

### 아키텍처
```
커넥터 URL → Puppeteer (이미지 차단, 15s) → MD5 해시 비교
  → 변경 없음 → 스킵 | 변경 있음 → Claude Haiku 파싱 → save-deals v2.3
  → 카테고리: merchants.category_ids 직접 조회
  → 딜 변동 시: 해당 머천트 active_deal_count 자동 재계산
```

### 커넥터 타입
| 타입 | 설명 | Cron | 성공 후 | 해시 |
|------|------|------|--------|------|
| `list` | 이벤트 목록 | ✅ 매일 | active 유지 | ✅ |
| `single` | 개별 이벤트 | ❌ 제외 | auto disabled | ❌ |
| `naver_brand` | 네이버 브랜드스토어 | ✅ 매일 | active 유지 | ✅ |

---

## 푸시 알림 설계 (미구현, Phase M4~M5)

### 아키텍처
```
[앱 설치/로그인]
  → expo-notifications로 ExpoPushToken 발급
  → profiles.push_token에 저장
  → 서버(Supabase Edge Function)에서 토큰 기반 푸시 발송

[알림 유형]
  1. 구독 브랜드 새 딜 알림   ← followed_merchants + 새 딜 감지
  2. 관심 카테고리 인기 딜     ← interest_categories + trending_score
  3. 저장한 딜 만료 임박 알림  ← saved_deals + ends_at 24시간 전
  4. 마케팅 알림              ← marketing_agreed=true인 유저만
```

### DB 스키마 변경 (필요)
```sql
-- profiles 테이블에 추가
ALTER TABLE profiles ADD COLUMN push_token text;
ALTER TABLE profiles ADD COLUMN push_token_updated_at timestamptz;
ALTER TABLE profiles ADD COLUMN push_enabled boolean DEFAULT true;

-- 디바이스 정보 (선택, 분석용)
ALTER TABLE profiles ADD COLUMN device_os text;        -- 'ios' | 'android'
ALTER TABLE profiles ADD COLUMN app_version text;

-- deal_actions에 platform 구분 (웹/앱 행동 분리 분석)
ALTER TABLE deal_actions ADD COLUMN platform text DEFAULT 'web';
```

### 토큰 등록 코드 (참고)
```tsx
// src/lib/push/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true,
  }),
});

export async function registerPushToken(userId: string) {
  if (!Device.isDevice) return null;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('deals', {
      name: '딜 알림',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250],
      lightColor: '#FF6B35',
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await supabase.from('profiles').update({
    push_token: token,
    push_token_updated_at: new Date().toISOString(),
  }).eq('id', userId);
  return token;
}
```

### 알림 탭 → 딥링크 처리 (app/_layout.tsx에 추가)
```tsx
useEffect(() => {
  const sub = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    if (data.dealSlug) router.push(`/d/${data.dealSlug}`);
    else if (data.merchantSlug) router.push(`/m/${data.merchantSlug}`);
  });
  return () => sub.remove();
}, []);
```

---

## 앱스토어 심사 체크리스트 (Phase M5)

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

## TargetUP-AI 연동 / 운영 정책

- **TargetUP-AI**: phone_hash, marketing_agreed, 관심카테고리/브랜드, 최근 행동 → segments_daily 배치
- **운영 정책**: 출처 표시, robots 존중, 실패 3회→비활성, 만료 자동 전환
- **분석 이벤트**: deal_view/click_out/copy_code/save, merchant_follow, search_performed, signup_complete, marketing_opt_in

---

## 개발 Phase

### 완료
- **Phase 0** ✅: DB 18테이블+RLS, 전체 페이지, 어드민, AI 크롤러 v3, Vercel 배포
- **Phase 1** ✅: 크롤러 v5, 회원 시스템, 브랜드 확장, 어드민 분리, 인증 완성, 행동추적
- **Phase M1** ✅: Expo 프로젝트 생성 + Supabase 연결 + 타입/상수/유틸 포팅 + DealCard/DealShelf/CategoryGrid + 홈 실데이터
- **Phase M2** ✅: 딜 상세 모달 + 카테고리/검색/브랜드관 + DealListCard + CopyCode + tracking + 무한스크롤
- **Phase M3** ✅: 카카오/네이버 OAuth 성공 + AuthProvider + 온보딩 + 마이페이지 + SaveButton/FollowButton + 웹 콜백 중간 페이지

### 진행 중
- **Phase M4** 🔄: 앱 디자인 통일 완료 + 법적 페이지 완료 + 로고 확정 대기 + 애플 DUNS 대기 + 푸시 알림 + 제보화면 + 심사 준비

### 미착수
- **Phase 2**: 도메인 연결 / 링크프라이스 제휴 / 브랜드 포털 / 스폰서 슬롯
- **Phase M5**: App Store / Play Store 심사 대응
- **Phase 3+**: TargetUP-AI CRM 연동, Docker Compose, 앱 푸시 발송 서버

---

## 🖥️ 인프라
- **현재**: Vercel Pro ($20×2) + Supabase Pro ($25) = **$65/월**
  - 메인+어드민: Vercel 서울(icn1), DB: Supabase Pro (서울, Storage: merchant-logos 버킷)
- **이관 트리거**: Supabase 비용 월 $100+ 시 자체 서버 검토
- **모바일**: EAS Build (Expo 무료 티어, 빌드 30회/월)

## 배치 스케줄 (어드민 Vercel Cron)
- 23:00/23:20/23:40 KST: 3-batch 크롤 (커넥터 1/3씩, single 제외)
- 23:50 KST: 만료 딜 자동 처리
- 250초 타임아웃 (Vercel 300초 제한 전 중단)

---

## 🔴 미해결 / 진행 예정

### 즉시 (Phase M4 남은 작업)
- **앱**: 🎨 로고 확정 대기 → 확정 후 앱 전체 컬러/히어로/배경색 통일
- **앱**: 애플 로그인 (DUNS 번호 대기 → Apple Developer $99 → Supabase Apple Provider)
- **앱**: 푸시 알림 (expo-notifications + profiles.push_token)
- **앱**: 제보 화면 (submit.tsx)
- **앱**: SaveButton/FollowButton 딜 상세·브랜드관에 연결
- ⚠️ 라네즈 naver_brand 잘못된 딜 hidden + 재크롤 필요

### 단기 (Phase 2 + Phase M5)
- **웹**: 도메인 연결, 링크프라이스 제휴 API, KMC 본인인증, 카카오 알림톡
- **웹**: 탈퇴 승인 후 30일 자동삭제 Cron
- **앱**: 카카오 개발자 포털에 iOS/Android 네이티브 플랫폼 등록 (프로덕션 빌드 시)
- **앱**: 앱스토어 심사 준비 (위 체크리스트 참조)

### 중기 (Phase 3+)
- TargetUP-AI CRM 연동 (건당 60~70원 타겟 마케팅)
- Docker Compose (트래픽 증가 대비)
- 앱 푸시 알림 발송 서버 (Supabase Edge Function)

---

## 주의사항 / 트러블슈팅

### DB / Supabase
- Supabase 조인 FK 명시 필수: `categories!deals_category_id_fkey`
- deals 삭제 시 FK 순서: outbound_clicks → deal_actions → saved_deals
- saved_deals.user_id FK: `auth.users(id)` 참조 (public.users 아님)
- followed_merchants.user_id FK: `public.profiles(id)` 참조
- profiles.phone: UNIQUE 해제됨 (KMC 연동 시 재적용)
- deal_actions: `metadata` 컬럼 없음
- server.ts exports: `createServerSupabaseClient` (anon) + `createServiceClient` (service role)

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

### 크롤러
- naver_brand: fullPage 모드 + /products/ URL 후처리 차단
- 프롬프트 v5: 이벤트성 판단 원칙, confidence 75+
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

### 어드민
- 회원 목록 `auth.admin.listUsers()` 배치 필수
- 머천트 PUT: event_page_url/connector_type 필드 분리 (merchants 컬럼 오염 방지)
- edit 페이지 null 처리: 필드별 타입 맞춤 (배열→[], boolean→false), 일괄 `null→''` 금지
- 브랜드 수정 후 필터 유지: URL param `?category=xxx`

---

## 최근 채팅 히스토리
| 채팅 | 날짜 | 주요 내용 |
|------|------|-----------|
| 팝폰-앱 Phase M3 OAuth | 2/20 | 카카오OAuth 성공+AuthProvider+웹콜백중간페이지+네이버모바일API |
| 팝폰-앱 디자인수정+로고시안 | 2/20 | 히어로+카테고리 디자인수정+쿠폰티켓 로고시안 6종 |
| 팝폰-앱 세션버그수정+네이버OAuth | 2/20 | AsyncStorage 세션수정+onboarding루프수정+네이버OAuth완료 |
| 팝폰-앱 법적페이지+홈리디자인 | 2/20 | 법적페이지3종(WebView)+홈히어로리디자인 |
| 팝폰-앱 UI통일+로고수정+에러핸들링 | 2/21 | 카테고리/검색 아이콘통일+로고절대URL+DealShelf동적폭+safeOpenURL |

---

*마지막 업데이트: 2026-02-21*
