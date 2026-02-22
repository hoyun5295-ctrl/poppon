# 🤖 [AI AGENT HARNESS] 시스템 통제 및 역할 부여

> **당신의 역할:** 20년 차 시니어 아키텍트급 Full-Stack 개발자. Next.js 15 (App Router), React Native / Expo (SDK 52+), Supabase (PostgreSQL + RLS + OAuth), Tailwind CSS / NativeWind, Puppeteer AI 크롤링에 정통하며, 한국 서비스 런칭 경험이 풍부한 전문가.
> **당신의 목표:** CEO의 기획 의도를 정확히 파악하고, 오류가 없으며, 유지보수가 쉬운 코드를 작성하는 것.
> **코드 스타일:** 불필요한 주석은 생략하고 간결하게 작성할 것. 웹은 Tailwind CSS + shadcn/ui, 앱은 NativeWind로 통일. any 타입 남발 금지, src/types/database.ts 적극 활용. Supabase 조인 시 FK 명시 필수.
## ⚠️ 절대 개발 원칙 (CRITICAL RULES)

1. **묻기 전엔 절대 코드를 짜지 마라:** 반드시 **기존 파일 파악 → 설계 의논 → 합의 후 구현** 순서로 진행한다.
2. **에러 발생 시 행동 지침 (Self-Correction):**
   - 에러가 발생하면 임의로 코드를 덧붙이거나 추측성 해결책을 바로 적용하지 마라.
   - 1단계: 발생한 에러 로그를 나에게 먼저 요구할 것.
   - 2단계: 에러 로그를 분석하여 원인을 3줄 이내로 명확히 요약할 것.
   - 3단계: 2가지 이상의 해결 옵션(장단점 포함)을 제시하고 나의 선택을 기다릴 것.
3. **코드/UI 작업은 항상 모바일 퍼스트 반응형 기본.** 별도 요청 없어도 모바일 최적화 필수.
4. **수정파일 제공:** 코드 조각이 아닌 완성된 파일로 제공. 설계 설명 후 "진행해도될까요?" → "진행해" 응답 시 수정파일 생성.

---

## 🎯 CURRENT_TASK (현재 집중 작업)

> **다음 세션에서 집중할 작업**

_(현재 집중 작업 없음 — 다음 세션에서 브랜드 조사 매칭 + 미등록 브랜드 정리 예정)_

---

## 📌 POPPON 프로젝트 STATUS (진실의 원천)

### 프로젝트 개요
- **제품명**: POPPON (K-RetailMeNot)
- **한줄 정의**: 한국의 모든 할인/쿠폰/프로모션을 한 곳에 모아 탐색 → 저장/구독/알림으로 DB 축적 → TargetUP-AI CRM 고단가 타겟마케팅으로 수익화하는 딜 플랫폼
- **MVP 우선순위**: A(온라인 쿠폰/프로모션 코드) → B(앱쿠폰/링크형) → C(오프라인 이벤트)

### 프로젝트 구조 (3개 분리)
| 프로젝트 | 경로 | 용도 | 배포 |
|---------|------|------|------|
| **poppon** (메인) | `C:\projects\poppon` | 사용자 웹 (딜 탐색/저장/인증) | `https://poppon.vercel.app` ✅ |
| **poppon-admin** (어드민) | `C:\projects\poppon-admin` | 관리자 (딜CRUD/크롤러/Cron/푸시) | `https://poppon-admin.vercel.app` ✅ |
| **poppon-app** (모바일) | `C:\projects\poppon-app` | 모바일 네이티브 앱 (iOS/Android) | EAS Build → App Store / Play Store 🚧 |

- **도메인**: `poppon.kr` (가비아, DNS 설정 필요)
- **GitHub**: `hoyun5295-ctrl/poppon` + `hoyun5295-ctrl/poppon-admin` (둘 다 private)

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
| 푸시 알림 | **expo-notifications + expo-device** | 토큰→profiles.push_token, 딥링크 지원 |
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
| 푸시 알림 | `src/app/(dashboard)/push/page.tsx` ✅ |
| 푸시 발송 | `src/app/api/push/route.ts` ✅ |
| 푸시 이력 | `src/app/api/push/history/route.ts` ✅ |
| 푸시 옵션 | `src/app/api/push/options/route.ts` ✅ |

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
| 루트 레이아웃 | `app/_layout.tsx` | AuthProvider + 푸시 알림 핸들러 + 딥링크 리스너 |
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
| 제보 | `app/submit.tsx` | 웹 API 호출 + 인라인 style ✅ |
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
| 행동 추적 | `src/lib/tracking.ts` | Supabase 직접 insert (fire-and-forget) + platform:'app' |
| 포맷 유틸 | `src/lib/utils/format.ts` | 웹에서 100% 복사 |
| 타입 정의 | `src/types/database.ts` + `index.ts` | 웹에서 100% 복사 |
| 상수 | `src/constants/index.ts` | 웹에서 포팅 (EXPO_PUBLIC 변환) |
| AuthProvider | `src/lib/auth/AuthProvider.tsx` | v10: 세션관리 + 온보딩 + 푸시토큰 자동등록/삭제 |
| 푸시 알림 | `src/lib/push/notifications.ts` | 토큰등록/삭제/딥링크/핸들러 설정 |
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
withdrawn_at, withdraw_reason, last_login_at, created_at, updated_at,
push_token(text), push_token_updated_at(timestamptz), push_enabled(boolean, DEFAULT true),
device_os(text), app_version(text)
```

⚠️ **코드↔DB 컬럼명**: `interest_categories` (NOT interested_), `marketing_agreed` (NOT marketing_opt_in)

### deal_actions 테이블
```
id, deal_id, user_id(nullable), session_id(ppn_sid), action_type,
platform(text, DEFAULT 'web'), created_at
```
⚠️ metadata 컬럼 없음. platform: 'web' | 'app' 구분

### 기타 테이블
- **saved_deals**: id, user_id, deal_id, created_at — UNIQUE(user_id, deal_id)
- **followed_merchants**: id, user_id, merchant_id, created_at — UNIQUE(user_id, merchant_id)
- **crawl_connectors**: id, name, merchant_id, source_url, config, status, fail_count, last_run_at, content_hash(MD5), hash_updated_at, connector_type(list/single/naver_brand, DEFAULT 'list')
- **crawl_runs**: id, connector_id, status, new/updated/expired_count, error_message, started_at, completed_at, tokens_used
- **search_logs**: id, user_id(nullable), session_id, query, category_slug, result_count, created_at
- **submissions**: id(uuid), user_id, url, comment, parsed_preview(jsonb), status(pending/approved/rejected), admin_note, created_at
- **outbound_clicks**: deal_id(FK→deals.id)

### 푸시 알림 테이블 (✅ 생성 완료)
```
push_notifications (
  id, title, body, type(service/marketing),
  target_filter(jsonb), deep_link_type, deep_link_slug,
  total_target, total_sent, total_failed,
  sent_by, sent_at, created_at
)

push_logs (
  id, notification_id(FK→push_notifications.id ON DELETE CASCADE),
  user_id(FK→auth.users), push_token,
  status(sent/failed/delivered), error_message, created_at
)
```

### 조인 관계
```
deals.merchant_id → merchants.id
deals.category_id → categories.id (FK: deals_category_id_fkey)
deals.subcategory_id → categories.id (FK: deals_subcategory_id_fkey)
profiles.id → auth.users.id
saved_deals → auth.users + deals
followed_merchants → auth.users + merchants
outbound_clicks.deal_id → deals.id (FK: outbound_clicks_deal_id_fkey)
push_logs.notification_id → push_notifications.id (ON DELETE CASCADE)
push_logs.user_id → auth.users.id (ON DELETE SET NULL)
```
⚠️ Supabase 조인 FK 명시 필수: `categories!deals_category_id_fkey (name)`
⚠️ deals 삭제 시 outbound_clicks → deal_actions → saved_deals FK 먼저 삭제

### RLS 정책
- deals: SELECT status='active'|'expired', ALL: admin/super_admin
- merchants/categories: SELECT 전체
- profiles: SELECT/UPDATE auth.uid()=id
- saved_deals/followed_merchants: ALL auth.uid()=user_id
- 기타 (crawl_connectors, crawl_runs, outbound_clicks, push_notifications, push_logs 등): 정책 없이 RLS ON (service_role 전용)
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
[로그아웃] supabase.auth.signOut() → clearPushToken() → router.replace('/(tabs)')
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

---

## 푸시 알림 시스템

### 앱 인프라 (✅ 구현 완료)
- `expo-notifications` + `expo-device` 설치 완료
- `app.json`: notifications 플러그인 + Android 채널(deals/marketing) 설정
- `src/lib/push/notifications.ts`: 토큰 등록/삭제/딥링크 처리/핸들러
- `AuthProvider v10`: 로그인 시 자동 토큰 등록, 로그아웃 시 토큰 삭제
- `app/_layout.tsx`: 알림 탭 딥링크 리스너 (deal/merchant)
- `profiles` 테이블: push_token, push_token_updated_at, push_enabled, device_os, app_version

### 어드민 발송 시스템 (✅ 구현 완료 — ⚠️ EAS 빌드 후 end-to-end 테스트 필수)
- 수동 발송 UI + API (`/push` 페이지, `/api/push` POST/GET)
- 대상 필터: 전체/마케팅동의/관심카테고리/구독브랜드/딜저장자/플랫폼(iOS·Android)/가입일
- 보조 API: `/api/push/history` (이력 조회) + `/api/push/options` (카테고리/브랜드 목록)
- 자동 발송 Cron: 만료 임박 24h (`/api/cron/push-expiring`, 매일 10:00 KST)
- 새 딜 자동 푸시: save-deals v2.4에서 구독자 자동 발송
- 발송 이력 + 통계: push_notifications + push_logs 테이블

### 푸시 타입 구분 (한국 정보통신망법)
| 타입 | 설명 | 마케팅 동의 필요 | 예시 |
|------|------|:---:|------|
| `service` | 서비스 알림 | ❌ | 저장한 딜 만료 임박, 구독 브랜드 새 딜 |
| `marketing` | 광고/프로모션 | ✅ | 이벤트, 추천 딜, 프로모션 |

⚠️ **expo-notifications는 Expo Go에서 제한적.** 토큰 발급은 EAS 빌드(개발 빌드)에서만 정상 작동.

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

### ✅ 완료
- **Phase 0**: DB 18테이블+RLS, 전체 페이지, 어드민, AI 크롤러 v3, Vercel 배포
- **Phase 1**: 크롤러 v5, 회원 시스템, 브랜드 확장, 어드민 분리, 인증 완성, 행동추적
- **Phase M1**: Expo 프로젝트 생성 + Supabase 연결 + 타입/상수/유틸 포팅 + DealCard/DealShelf/CategoryGrid + 홈 실데이터
- **Phase M2**: 딜 상세 모달 + 카테고리/검색/브랜드관 + DealListCard + CopyCode + tracking + 무한스크롤
- **Phase M3**: 카카오/네이버 OAuth 성공 + AuthProvider + 온보딩 + 마이페이지 + SaveButton/FollowButton + 웹 콜백 중간 페이지

### 🔄 진행 중
- **Phase M4**: 앱 디자인 통일 + 법적 페이지 + 카테고리 이모지 통일 + 홈 히어로 제거 + 푸시 알림 전체 완료(앱+어드민) + platform 컬럼 + SaveButton/FollowButton 연결 완료 + 제보화면 완료 + naver_brand 크롤링 v5.1 품질 강화 + 로고 확정 대기 + 애플 DUNS 대기 + 스플래시 + 심사 준비

### ⬜ 미착수
- **Phase 2**: 도메인 연결 / 링크프라이스 제휴 / 브랜드 포털 / 스폰서 슬롯
- **Phase M5**: App Store / Play Store 심사 대응
- **Phase 3+**: TargetUP-AI CRM 연동, Docker Compose

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
- ✅ 10:00 KST: 만료 임박 딜 푸시 발송 (push-expiring Cron)

---

## 🔴 미해결 / 진행 예정

### 즉시 (Phase M4 남은 작업)
- **앱**: ✅ ~~제보 화면 (submit.tsx)~~ 완료
- **앱**: 🎨 로고 확정 대기 → 확정 후 앱 전체 컬러/히어로/배경색 통일
- **앱**: 🍎 애플 로그인 (DUNS 번호 대기 → Apple Developer $99 → Supabase Apple Provider)
- **앱**: 🚀 스플래시 스크린 — "한국의 모든 할인&행사를 한곳에서" + 브랜드/딜 카운트 (로고 확정 후)
- ✅ ~~naver_brand 크롤링 품질~~ ai-engine v5.1 프롬프트+후처리 강화 배포 완료 → Cron 결과 모니터링 필요
- ⚠️ 푸시 알림 EAS 개발 빌드 후 end-to-end 테스트 필수 (토큰 발급 → 실제 수신 확인)
- 📋 브랜드 조사 매칭: 조사 완료된 브랜드 목록 vs 현재 POPPON 등록 브랜드 비교 → 미등록 브랜드 정리

### 단기 (Phase 2 + Phase M5)
- **웹**: 도메인 연결, 링크프라이스 제휴 API, KMC 본인인증, 카카오 알림톡
- **웹**: 탈퇴 승인 후 30일 자동삭제 Cron
- **앱**: 카카오 개발자 포털에 iOS/Android 네이티브 플랫폼 등록 (프로덕션 빌드 시)
- **앱**: 앱스토어 심사 준비 (위 체크리스트 참조)

### 중기 (Phase 3+)
- TargetUP-AI CRM 연동 (건당 60~70원 타겟 마케팅)
- Docker Compose (트래픽 증가 대비)

### 💡 런칭 마케팅 아이디어 (GPT/Gemini 토론 → 비토 검토)

**넛지(Nudge) 설계 — 체리피커 방지 + 진성유저 전환**
- 룰렛/이벤트 응모권 조건: "가입 → 브랜드 1개 팔로우 → 딜 3개 저장 → 응모권 획득"
- 목적: 경품 목적 가입자도 앱 내 가치 경험(딜 탐색/저장/팔로우)을 강제로 경험시켜 진성유저 전환
- 이미 구축된 인프라로 바로 구현 가능: deal_actions + saved_deals + followed_merchants 추적 완비

**링크프라이스 연동 포인트**
- 딥링크 API: 딜 URL → 제휴 링크 자동 변환
- 리워드 API: u_id 기반 회원별 구매 실적 → 캐시백/페이백 루프
- ⚠️ 정산 리드타임 2개월 (전전월 확정 기준) → 현금흐름 설계 필수
- 링크프라이스는 "리텐션 장치", 진짜 수익은 TargetUP-AI CRM 타겟 마케팅

**유튜브 캠페인 현실적 전환율 (조회수 70만 기준)**
| CTR | 예상 가입 |
|-----|----------|
| 1% | ~2,000명 |
| 3% | ~5,900명 |
| 5% | ~9,800명 |
| 10% | ~19,600명 |
- 30만 가입은 단일 영상으로 비현실적 → 1~2만 보수적 타겟
- 여러 채널/영상 동시 집행 시 확장 가능

**이벤트 경품 주의사항**
- 5만원 이상 경품: 제세공과금 22% 처리 필요 (유저부담 or 회사대납)
- 고가 1등 + 중간 티어 보상(상품권/포인트) 촘촘히 배치
- 실 집행 전 세무사 1회 자문 권장

---

## 🐛 주의사항 / 트러블슈팅

> AI는 과거의 실수를 반복하지 않기 위해 아래 내용을 반드시 숙지할 것.

### DB / Supabase
- Supabase 조인 FK 명시 필수: `categories!deals_category_id_fkey`
- deals 삭제 시 FK 순서: outbound_clicks → deal_actions → saved_deals
- saved_deals.user_id FK: `auth.users(id)` 참조 (public.users 아님)
- followed_merchants.user_id FK: `public.profiles(id)` 참조
- profiles.phone: UNIQUE 해제됨 (KMC 연동 시 재적용)
- deal_actions: `metadata` 컬럼 없음, `platform` 컬럼 있음 (DEFAULT 'web')
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

## 📝 세션 완료 히스토리

> 각 세션에서 완료된 작업을 기록. AI는 이전 세션의 결과물과 해결책을 참조하여 동일 실수를 반복하지 않는다.

| 날짜 | 세션 | 플랫폼 | 주요 완료 내용 | 핵심 해결책/교훈 |
|------|------|--------|--------------|----------------|
| 2/20 | Phase M3 OAuth | 앱 | 카카오 OAuth 성공 | 웹 콜백 중간 페이지 패턴 (Expo Go openAuthSessionAsync 미작동) |
| 2/20 | 디자인수정+로고시안 | 앱 | 히어로+카테고리 디자인수정 | 쿠폰티켓 로고시안 6종 |
| 2/20 | 세션버그수정+네이버 | 앱 | AsyncStorage 세션수정+네이버OAuth | onboarding_completed boolean 기반으로 변경 (길이 기반→무한루프) |
| 2/20 | 법적페이지+홈리디자인 | 앱 | 법적페이지 3종(WebView) | 웹 URL 로딩 방식 |
| 2/21 | UI통일+에러핸들링 | 앱 | 아이콘통일+resolveLogoUrl+safeOpenURL | DealShelf 동적 카드폭(÷2.3) |
| 2/21 | 홈히어로제거+이모지 | 앱 | 히어로 제거+카테고리 이모지 통일 | 홈/카테고리탭/검색 3곳 이모지 통일 |
| 2/21 | 푸시알림+platform | 앱+DB | 앱 푸시 인프라 완료 + platform 컬럼 | AuthProvider v10 (토큰 자동등록/삭제), deal_actions platform:'web'|'app' |
| 2/21 | SaveButton+FollowButton | 앱 | 딜상세·브랜드관에 저장/구독 버튼 연결 완료 | 컨텍스트 초과로 STATUS 미업데이트 (이번 세션에서 반영) |
| 2/21 | 푸시 발송 시스템 | 어드민 | Step 1~4 전체 완료 (DB+API+수동발송+만료임박Cron+새딜자동푸시+이력) | save-deals v2.4, EAS 빌드 후 e2e 테스트 필수 |
| 2/21 | 제보화면+naver_brand | 앱+어드민 | 앱 제보화면 포팅 완료 + ai-engine v5.1 naver_brand 품질 강화 | 인라인 style 패턴 필수 (NativeWind className 미작동), 제목+혜택 조합 판단 (제목만으로 차단 금지) |

---

*마지막 업데이트: 2026-02-21 (제보화면 완료, ai-engine v5.1 naver_brand 품질 강화, CURRENT_TASK 비움)*
