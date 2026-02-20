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
- **설계 참조**: `POPPON_MOBILE_DESIGN.md` (Expo Router 마이그레이션 설계도)

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
| 프레임워크 | **Expo SDK 52+ / Expo Router v4** | 파일 기반 라우팅 (Next.js와 동일 멘탈모델) |
| 스타일링 | **NativeWind v4** | Tailwind CSS for React Native |
| 상태관리 | **Zustand** | 웹과 동일 |
| DB/Auth | **Supabase** (웹과 동일 인스턴스 공유) | anon key + LargeSecureStore 암호화 |
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
| DealDetailClient.tsx | `src/components/deal/DealDetailClient.tsx` ⚠️ 레거시 (빌드 호환용) |
| TopNav.tsx | `src/components/layout/TopNav.tsx` |
| Footer.tsx | `src/components/layout/Footer.tsx` |
| SourceProtection.tsx | `src/components/layout/SourceProtection.tsx` |
| TopProgressBar.tsx | `src/components/layout/TopProgressBar.tsx` |
| Toast.tsx | `src/components/common/Toast.tsx` |
| AuthSheet.tsx | `src/components/auth/AuthSheet.tsx` ✅ signUp 마지막 스텝 지연 + 완료 화면 (2/18) |
| MobileFilterSheet.tsx | `src/components/search/MobileFilterSheet.tsx` |
| SearchBar.tsx | `src/components/search/SearchBar.tsx` |
| SearchFilters.tsx | `src/components/search/SearchFilters.tsx` |
| SearchInput.tsx | `src/components/search/SearchInput.tsx` |
| CategoryGrid.tsx | `src/components/category/CategoryGrid.tsx` |
| SubCategoryChips.tsx | `src/components/category/SubCategoryChips.tsx` |
| CategoryTabBar.tsx | `src/components/category/CategoryTabBar.tsx` |
| CategoryIcon.tsx | `src/components/category/CategoryIcon.tsx` |
| MerchantDealTabs.tsx | `src/components/merchant/MerchantDealTabs.tsx` |
| DealActionBar.tsx | `src/components/deal/DealActionBar.tsx` ✅ 딜 상세 저장/브랜드관/구독 액션 |
| FollowButton.tsx | `src/components/merchant/FollowButton.tsx` ✅ 구독/해제 클라이언트 컴포넌트 |
| Pagination.tsx | `src/components/common/Pagination.tsx` |
| SortDropdown.tsx | `src/components/common/SortDropdown.tsx` |

#### 페이지
| 파일 | 경로 |
|------|------|
| 루트 레이아웃 | `src/app/layout.tsx` (AuthProvider + TopProgressBar + Toast 래핑) |
| 글로벌 CSS | `src/app/globals.css` (fade-in + toast 애니메이션) |
| 미들웨어 | `src/middleware.ts` |
| 홈 | `src/app/page.tsx` ✅ 실시간 브랜드/딜 정확한 수치 + 새딜알림 CTA (2/18) |
| 홈 로딩 | `src/app/loading.tsx` |
| 검색 | `src/app/search/page.tsx` + `loading.tsx` |
| 카테고리 | `src/app/c/[categorySlug]/page.tsx` + `loading.tsx` |
| 브랜드관 | `src/app/m/[merchantSlug]/page.tsx` + `loading.tsx` |
| 딜 상세 (모달) | `src/app/@modal/(.)d/[slug]/page.tsx` ✅ 서버사이드 |
| 딜 상세 (풀페이지) | `src/app/d/[slug]/page.tsx` |
| 제보 | `src/app/submit/page.tsx` |
| 마이페이지 | `src/app/me/page.tsx` + `loading.tsx` ✅ 환영메시지+구독2열+추천브랜드 (2/18) |
| 로그인 | `src/app/auth/page.tsx` + `callback/route.ts` ✅ v2 linked_providers 동기화 (2/20) + `callback/naver/route.ts` |
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
| 행동추적 API | `src/app/api/actions/route.ts` ✅ createServiceClient + 서버 세션 user_id 자동감지 (2/18) |
| 클릭 트래킹 | `src/app/out/[dealId]/route.ts` |
| 딜 저장 API | `src/app/api/me/saved-deals/route.ts` ✅ try-catch 디버깅 로그 (2/18) |
| 브랜드 구독 API | `src/app/api/me/follows/merchants/route.ts` ✅ active_deal_count 포함 (2/18) |
| 계정 탈퇴 API | `src/app/api/me/delete-account/route.ts` (pending_withdrawal) |
| 프로필 조회 API | `src/app/api/me/profile/route.ts` ✅ 전체 프로필 반환 (설정탭용) |
| 검색 로그 API | `src/app/api/actions/search/route.ts` |
| 로그아웃 API | `src/app/api/auth/signout/route.ts` |
| 네이버 OAuth | `src/app/api/auth/naver/route.ts` |

### 🔴 poppon-admin (어드민 앱)

#### 컴포넌트
| 파일 | 경로 |
|------|------|
| MerchantForm.tsx | `src/components/admin/MerchantForm.tsx` ✅ v5 (slug+카테고리+커넥터+로고업로드+커넥터관리) |

#### 페이지
| 파일 | 경로 |
|------|------|
| 루트 레이아웃 | `src/app/layout.tsx` |
| 미들웨어 | `src/middleware.ts` (비밀번호 보호) |
| 대시보드 | `src/app/(dashboard)/page.tsx` + `layout.tsx` ✅ 제보관리 메뉴 추가 (2/18) |
| 딜 목록/생성/수정 | `src/app/(dashboard)/deals/` |
| 머천트 목록/생성/수정 | `src/app/(dashboard)/merchants/` |
| 회원 목록 | `src/app/(dashboard)/members/page.tsx` |
| 회원 상세 | `src/app/(dashboard)/members/[id]/page.tsx` ✅ 10개씩 페이징 (2/18) |
| 제보 관리 | `src/app/(dashboard)/submissions/page.tsx` ✅ 승인/거부+메모+탭필터+페이징 (2/18) |
| 크롤 모니터링 | `src/app/(dashboard)/crawls/page.tsx` |
| 크롤 이력 | `src/app/(dashboard)/crawl-history/page.tsx` |

#### API (어드민 앱)
| 파일 | 경로 |
|------|------|
| 어드민 인증 | `src/app/api/auth/route.ts` |
| 딜 CRUD | `src/app/api/deals/route.ts` + `[id]/route.ts` |
| 머천트 | `src/app/api/merchants/route.ts` + `[id]/route.ts` |
| 커넥터 관리 | `src/app/api/connectors/[id]/route.ts` (PATCH/DELETE) |
| 대시보드 | `src/app/api/dashboard/route.ts` |
| 로고 업로드 | `src/app/api/upload-logo/route.ts` |
| 회원 | `src/app/api/members/route.ts` + `[id]/route.ts` (GET+PATCH) |
| 제보 목록 | `src/app/api/submissions/route.ts` ✅ GET status필터+페이징 (2/18) |
| 제보 승인/거부 | `src/app/api/submissions/[id]/route.ts` ✅ PATCH status+admin_note (2/18) |
| AI 크롤 | `src/app/api/ai-crawl/route.ts` + `[connectorId]/route.ts` |
| Cron | `src/app/api/cron/crawl/route.ts` + `cron/expire/route.ts` |
| 크롤 이력 | `src/app/api/crawl-history/route.ts` |

#### 크롤러 / 스크립트
| 파일 | 경로 |
|------|------|
| AI 크롤 엔진 (v5) | `src/lib/crawl/ai-engine.ts` |
| 딜 저장 (v2.3) | `src/lib/crawl/save-deals.ts` ✅ active_deal_count 자동갱신 (2/18) |
| 기타 스크립트 | `scripts/` (테스트, 로고수집, OG이미지 등) |

### 🟢 poppon-app (모바일 앱) 🚧

#### 설정 파일
| 파일 | 경로 | 비고 |
|------|------|------|
| app.json | `app.json` | Expo 앱 설정 (번들ID, 스킴, 플러그인) |
| tailwind.config.js | `tailwind.config.js` | NativeWind 설정 |
| global.css | `src/global.css` | Tailwind 기본 import |
| .env | `.env` | EXPO_PUBLIC_ 접두사 환경변수 |

#### 라우트 (Expo Router)
| 파일 | 경로 | 비고 |
|------|------|------|
| 루트 레이아웃 | `app/_layout.tsx` | ✅ Stack Navigator 정리 완료 (2/20) |
| 탭 레이아웃 | `app/(tabs)/_layout.tsx` | ✅ Ionicons 아이콘 + iOS safeArea (2/20) |
| 홈 | `app/(tabs)/index.tsx` | ✅ Supabase 실데이터 + DealShelf 3섹션 + CTA (2/20) |
| 카테고리 | `app/(tabs)/categories.tsx` | ✅ 6개 그리드 + 카테고리별 인기딜 DealShelf (2/20) |
| 검색 | `app/(tabs)/search.tsx` | ✅ TextInput + 카테고리필터 + 정렬 + 무한스크롤 (2/20) |
| 마이페이지 | `app/(tabs)/me.tsx` | 스켈레톤 (Phase M3에서 구현) |
| 딜 상세 모달 | `app/d/[slug].tsx` | ✅ transparentModal + 콘텐츠 맞춤 높이(maxHeight 85%) (2/20) |
| 브랜드관 | `app/m/[merchantSlug].tsx` | ✅ 프로필헤더 + 진행중/종료 탭 + 무한스크롤 (2/20) |
| 카테고리 상세 | `app/c/[categorySlug].tsx` | ✅ 서브카테고리칩 + FlatList 무한스크롤 (2/20) |
| 로그인 | `app/auth/index.tsx` | 미구현 (Phase M3) |
| 제보 | `app/submit.tsx` | 미구현 (Phase M4) |
| 법적 페이지 | `app/legal/*.tsx` | 미구현 (Phase M4) |

#### 컴포넌트
| 파일 | 경로 | 비고 |
|------|------|------|
| DealCard.tsx | `src/components/deal/DealCard.tsx` | ✅ 그리드 카드 (쿠폰 점선 특색, brand_color 배지) (2/20) |
| DealShelf.tsx | `src/components/deal/DealShelf.tsx` | ✅ 수평 스크롤 셸프 (2/20) |
| DealDetailView.tsx | `src/components/deal/DealDetailView.tsx` | ✅ 딜 상세 콘텐츠 (로고+타이틀+혜택+날짜+조건+CTA) (2/20) |
| DealListCard.tsx | `src/components/deal/DealListCard.tsx` | ✅ 수평 리스트 카드 (56px 로고+정보) (2/20) |
| CopyCodeButton.tsx | `src/components/deal/CopyCodeButton.tsx` | ✅ 쿠폰복사 (expo-clipboard + expo-haptics) (2/20) |
| CategoryGrid.tsx | `src/components/category/CategoryGrid.tsx` | ✅ 3×2 그리드 + Ionicons 카테고리 아이콘 (2/20) |
| SubCategoryChips.tsx | `src/components/common/SubCategoryChips.tsx` | ✅ 수평 ScrollView 칩 버튼 (2/20) |
| SortPicker.tsx | `src/components/common/SortPicker.tsx` | ✅ 바텀시트 정렬 모달 (추천/최신/마감임박/인기) (2/20) |

#### 라이브러리 (Supabase/인증/유틸)
| 파일 | 경로 | 비고 |
|------|------|------|
| Supabase 클라이언트 | `src/lib/supabase/client.ts` | ✅ LargeSecureStore + Proxy 지연 초기화 (2/20) |
| 딜 쿼리 | `src/lib/deals.ts` | ✅ 웹 포팅 + offset 페이지네이션 + dedupeDeals (2/20) |
| 행동 추적 | `src/lib/tracking.ts` | ✅ Supabase 직접 insert (deal_view/click_out/copy_code/search) (2/20) |
| 포맷 유틸 | `src/lib/utils/format.ts` | ✅ 웹에서 100% 복사 (2/20) |
| 타입 정의 | `src/types/database.ts` | ✅ 웹에서 100% 복사 (2/20) |
| 타입 re-export | `src/types/index.ts` | ✅ (2/20) |
| 상수 | `src/constants/index.ts` | ✅ 웹에서 포팅 (EXPO_PUBLIC 변환) (2/20) |

#### 코드 재사용 (웹에서 복사)
| 웹 원본 | 앱 대상 | 재사용율 | 상태 |
|---------|---------|---------|------|
| `src/types/database.ts` | `src/types/database.ts` | 100% | ✅ 완료 |
| `src/lib/utils/format.ts` | `src/lib/utils/format.ts` | 100% | ✅ 완료 |
| `src/lib/constants.ts` | `src/constants/index.ts` | 95% | ✅ 완료 |
| `src/lib/deals.ts` | `src/lib/deals.ts` | 80% | ✅ 완료 (6개 함수 추가) |
| `src/lib/tracking.ts` | `src/lib/tracking.ts` | 80% | ✅ 완료 (Supabase 직접 insert, fire-and-forget) |

---

## 라우팅 구조

### 메인 앱
```
src/app/
├── layout.tsx               — AuthProvider + TopProgressBar + AuthSheet 래핑
├── @modal/(.)d/[slug]/      — 인터셉팅 모달 (서버사이드)
├── d/[slug]/                — SEO 풀 페이지
├── m/[merchantSlug]/        — 브랜드관
├── c/[categorySlug]/        — 카테고리 허브
├── search/                  — 검색 결과
├── submit/                  — 유저 제보
├── me/                      — 마이페이지
├── auth/                    — 로그인 + callback/ (카카오) + callback/naver/
├── legal/                   — 개인정보처리방침, 이용약관, 마케팅수신동의
├── api/
│   ├── submit/, actions/, actions/search/
│   ├── auth/signout/, auth/naver/
│   └── me/saved-deals/, me/follows/merchants/, me/delete-account/, me/profile/
└── out/[dealId]/            — 클릭 트래킹
```

### 어드민 앱
```
src/app/
├── login/
├── (dashboard)/
│   ├── deals/, merchants/, members/, submissions/, crawls/, crawl-history/
├── api/
│   ├── auth/, deals/, merchants/, dashboard/, members/+[id]/
│   ├── submissions/+[id]/
│   ├── connectors/[id]/, ai-crawl/+[connectorId]/
│   └── cron/crawl/, cron/expire/, crawl-history/, upload-logo/
```

### 모바일 앱 (Expo Router) 🚧
```
app/
├── _layout.tsx              — Root Stack (AuthProvider 래핑 예정)
├── (tabs)/
│   ├── _layout.tsx          — 하단 4탭 (홈/카테고리/검색/마이)
│   ├── index.tsx            — 홈 ✅
│   ├── categories.tsx       — 카테고리 ✅
│   ├── search.tsx           — 검색 ✅
│   └── me.tsx               — 마이페이지 ✅
├── d/[slug].tsx             — 딜 상세 모달 (transparentModal)
├── m/[merchantSlug].tsx     — 브랜드관
├── c/[categorySlug].tsx     — 카테고리 상세
├── auth/                    — 로그인/회원가입/OAuth콜백
├── submit.tsx               — 제보
└── legal/                   — 법적 페이지 3종
```

### 미들웨어 보호
- **메인**: `/brand/*` → 로그인 필수
- **어드민**: 전체 → ADMIN_SECRET 쿠키 필수 (login 제외)

---

## API 구조 요약

### 메인 — Public
`GET /deals`, `GET /deals/:id`, `GET /categories`, `GET /merchants`, `POST /api/submit`

### 메인 — Member (로그인)
`GET /auth/callback`, `GET /api/auth/signout`, `GET|POST|DELETE /api/me/saved-deals`, `GET|POST|DELETE /api/me/follows/merchants`, `DELETE /api/me/delete-account`, `GET /api/me/profile`, `POST /api/actions`, `POST /api/actions/search`

### 어드민
CRUD: `/api/deals`, `/api/merchants`, `POST /api/upload-logo`, `GET /api/dashboard`, `GET|PATCH /api/members/[id]`, `PATCH|DELETE /api/connectors/:id`, `GET|POST /api/ai-crawl`, `GET /api/cron/crawl`, `GET /api/cron/expire`, `GET /api/submissions`, `PATCH /api/submissions/[id]`

### 트래킹
`GET /out/:dealId` — 아웃바운드 리다이렉트 (클릭로그 + 302)

### 모바일 앱 🚧
앱에서는 Next.js API Route를 거치지 않고 **Supabase Client 직접 호출**.
웹 API 대응: `/api/me/*` → `supabase.from().select/insert/delete`, `/api/actions` → `supabase.from('deal_actions').insert()`, `/out/[dealId]` → `Linking.openURL()` + Supabase insert

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

---

## 카테고리 (6개 활성)
패션(fashion), 뷰티(beauty), 식품/배달(food), 생활/리빙(living), 여행/레저(travel), 문화/콘텐츠(culture)

---

## DB 스키마

### 데이터 현황 (2/20 기준)
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
⚠️ Supabase 조인 시 FK 명시 필수: `categories!deals_category_id_fkey (name)`
⚠️ deals 삭제 시 outbound_clicks → deal_actions → saved_deals FK 먼저 삭제

### RLS 정책
- deals: SELECT status='active'|'expired', ALL: admin/super_admin
- merchants/categories: SELECT 전체
- profiles: SELECT/UPDATE auth.uid()=id
- saved_deals/followed_merchants: ALL auth.uid()=user_id
- ✅ RLS 전체 활성화 완료 (2/20): crawl_connectors, crawl_runs, outbound_clicks, deal_feedbacks, ad_campaigns, affiliate_merchant_map, affiliate_networks, affiliate_offers, batch_reports, consent_logs, users — 정책 없이 RLS만 ON (service_role 전용, anon 차단)
- ⚠️ **앱 전용**: deal_actions에 anon INSERT 정책 추가 필요 (웹은 createServiceClient로 RLS 우회, 앱은 anon key 사용)

---

## 회원가입/인증 시스템

### 아키텍처
```
[이메일 가입] AuthSheet: signup(검증만) → identity(프로필) → categories → marketing → 최종 signUp + profile 일괄 저장 → complete 화면
[카카오 로그인] signInWithOAuth → 카카오 동의 → Supabase 콜백 → saveProviderProfile v2 → 신규? → /?onboarding=sns → categories → marketing
[네이버 로그인] 수동 OAuth → admin.createUser+generateLink+verifyOtp → 프로필 저장
[탈퇴] 마이페이지 → pending_withdrawal → 어드민 승인(withdrawn) / 거부(active 복원)
[로그아웃] <a href="/api/auth/signout"> → sb- 쿠키 삭제 + 302 → sessionStorage 토스트
```

### 앱 인증 플로우 (예정) 🚧
```
[카카오] Supabase signInWithOAuth + expo-web-browser → poppon://auth/callback → setSession
[네이버] expo-web-browser → 웹 API(/api/auth/naver/mobile) 경유 → setSession
[애플] expo-apple-authentication → signInWithIdToken (앱스토어 필수)
[로그아웃] supabase.auth.signOut() → router.replace('/(tabs)')
```

### 환경변수 (이름만)
**메인**: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
**어드민**: 위 + ADMIN_SECRET, ANTHROPIC_API_KEY, CRON_SECRET, NEXT_PUBLIC_MAIN_URL
**모바일**: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_APP_SCHEME (⚠️ SERVICE_ROLE_KEY 절대 넣지 않음)
**카카오**: Supabase Provider에 REST API Key 설정, 도메인 변경 시 카카오 포털 동기화

---

## AI 크롤러 v5

### 아키텍처
```
커넥터 URL → Puppeteer (이미지 차단, 15s) → MD5 해시 비교
  → 변경 없음 → 스킵 | 변경 있음 → Claude Haiku 파싱 → save-deals v2.3 → hash 저장
  → 카테고리: merchants.category_ids 직접 조회 (config fallback은 최종 수단)
  → 딜 변동 시: 해당 머천트 active_deal_count 자동 재계산
```

### 커넥터 타입
| 타입 | 설명 | Cron | 성공 후 | 해시 | DOM | 프롬프트 |
|------|------|------|--------|------|-----|---------|
| `list` | 이벤트 목록 | ✅ 매일 | active 유지 | ✅ | main 영역 | 이벤트성 딜 추출 |
| `single` | 개별 이벤트 | ❌ 제외 | auto disabled | ❌ | main 영역 | 딜 1개 분석 |
| `naver_brand` | 네이버 브랜드스토어 | ✅ 매일 | active 유지 | ✅ | fullPage(body) | 기획전 탭만 |

핵심 판단: "이벤트성 혜택인가, 상시 판매인가?" → 이벤트성만 수집, confidence 75+

---

## TargetUP-AI 연동 / 운영 정책

- **TargetUP-AI**: phone_hash, marketing_agreed, 관심카테고리/브랜드, 최근 행동 → segments_daily 배치
- **운영 정책**: 출처 표시, robots 존중, 실패 3회→비활성, 만료 자동 전환
- **분석 이벤트**: deal_view/click_out/copy_code/save, merchant_follow, search_performed, signup_complete, marketing_opt_in

---

## 개발 Phase
- **Phase 0** ✅: DB 18테이블+RLS, 전체 페이지, 어드민, AI 크롤러 v3, Vercel 배포
- **Phase 1** ✅: 크롤러 v5, 회원 시스템, 브랜드 확장, 어드민 분리, 딜 정리, 커넥터 관리, 인증 완성, 행동추적
- **Phase 2** 미착수: 도메인 연결 / 링크프라이스 제휴 / 브랜드 포털 / 스폰서 슬롯 / 성과 정산

### 모바일 앱 Phase 🚧
- **Phase M1** ✅: Expo 프로젝트 생성 + Supabase 연결 + 홈 화면 실데이터 + DealCard/DealShelf/CategoryGrid
- **Phase M2** ✅: 딜 상세 모달 + 카테고리 상세 + 검색 + 브랜드관 + 행동추적 + 무한스크롤
- **Phase M3** 🔄 다음: 카카오/네이버/애플 OAuth + 회원가입 온보딩 + 마이페이지
- **Phase M4** 미착수: 푸시 알림 + 행동추적 + 제보 + 법적 페이지 + 심사 준비
- **Phase M5** 미착수: App Store / Play Store 심사 대응

---

## 🖥️ 인프라 (확정 2/17)
- **현재**: Vercel Pro ($20×2) + Supabase Pro ($25) = **$65/월**
  - 메인+어드민: Vercel 서울(icn1), DB: Supabase Pro (서울 ap-northeast-2, Storage: merchant-logos 버킷)
- **이관 트리거**: Supabase 비용 월 $100+ 시 자체 서버 검토
- **모바일**: EAS Build (Expo 무료 티어로 시작, 빌드 30회/월)

## 배치 스케줄 (어드민 Vercel Cron)
- 23:00/23:20/23:40 KST: 3-batch 크롤 (커넥터 1/3씩, single 제외)
- 23:50 KST: 만료 딜 자동 처리
- 250초 타임아웃 (Vercel 300초 제한 전 중단)

---

## 🔴 미해결 / 진행 예정

### 미해결
- ⚠️ 라네즈 naver_brand 잘못된 딜 hidden + 재크롤 필요

### 즉시 (Phase M3)
- **모바일 앱**: 카카오/네이버/애플 OAuth 연동 + 회원가입 온보딩 + 마이페이지 실데이터

### 단기 (Phase 2 + Phase M3~M4)
- **웹**: 도메인 연결, 링크프라이스 제휴 API, KMC 본인인증, 카카오 알림톡
- **웹**: 탈퇴 승인 후 30일 자동 완전삭제 Cron, single 타입 검증
- **앱**: 푸시 알림 + 제보화면 + 법적페이지 + 앱스토어 심사 준비
- **앱**: 카카오 개발자 포털 + 네이버 개발자 포털에 앱 플랫폼 등록
- **앱**: Supabase Redirect URLs에 `poppon://auth/callback` 추가
- **앱**: Apple Developer 계정 ($99/년) 등록

### 중기 (Phase 3 + Phase M5)
- TargetUP-AI CRM 연동 (건당 60~70원 타겟 마케팅)
- Docker Compose (트래픽 증가 대비), 브랜드 포털
- 앱 푸시 알림 발송 서버 (Supabase Edge Function)

---

## 주의사항 / 트러블슈팅

### DB / Supabase
- Supabase 조인 FK 명시 필수: `categories!deals_category_id_fkey`
- deals 삭제 시 FK: outbound_clicks → deal_actions → saved_deals 순서로 먼저 삭제
- saved_deals.user_id FK: `auth.users(id)` 참조 (public.users 아님, 2/18 수정)
- followed_merchants.user_id FK: `public.profiles(id)` 참조
- merchants.active_deal_count: save-deals v2.3 + cron/expire에서 자동 갱신 ✅ (2/18)
- profiles.phone: UNIQUE 해제됨 (KMC 연동 시 재적용)
- deal_actions 테이블: `metadata` 컬럼 없음
- Supabase 클라이언트 auth lock: 싱글톤으로 AuthProvider가 잡고 있으면 블로킹 → 서버사이드 우회
- Supabase client.ts 싱글톤: `createClient()` 함수 사용 필수
- server.ts exports: `createServerSupabaseClient` (anon) + `createServiceClient` (service role)
- ✅ Supabase URL Configuration: Site URL = `https://poppon.vercel.app` (localhost 아님! OAuth 리다이렉트에 영향)

### 보안
- ✅ SourceProtection: 우클릭/F12/Ctrl+U 차단 (1차 방어)
- ✅ RLS 전체 활성화 (2/20): 정책 없는 테이블도 RLS ON → anon key로 접근 차단 (2차 방어)
- ⚠️ anon key는 프론트엔드에 노출됨 → RLS가 실제 보안 방벽. SourceProtection은 보조 수단

### 인증 / 회원
- AuthSheet signUp 지연: signup 스텝에서 signUp 안 함 → marketing 스텝 "가입 완료"에서 signUp + profile 한꺼번에 저장
- AuthProvider TOKEN_REFRESHED: fetchProfile 절대 금지 → 무한루프
- 로그아웃: 서버 사이드 API (`/api/auth/signout`) 필수. `<a>` 태그 사용
- Toast: sessionStorage('poppon_pending_toast') → layout mount 시 표시
- 네이버 OAuth: 수동 플로우. `updateUserById` 필수 (updateUser 아님). 환경변수 poppon만
- 회원탈퇴 2단계: 유저→pending_withdrawal → 어드민 승인→withdrawn / 거부→active
- FollowButton: 클라이언트 컴포넌트 분리 필수 (서버 컴포넌트에서 onClick 불가)
- ✅ 카카오 OAuth 검수 승인 완료 (2/20): 비즈니스 정보 + 개인정보 동의항목 승인
- ✅ saveProviderProfile v2 (2/20): `app_metadata.providers` (복수 배열) 기반 linked_providers 동기화 — 기존 DB값 + Supabase providers 합쳐서 중복 제거

### 행동추적
- actions API: `createServiceClient` 사용 (RLS 우회, 비로그인도 insert)
- actions API: body user_id null이면 서버 세션에서 자동 추출

### 크롤러
- 크롤러 카테고리: save-deals v2.3 — merchants.category_ids 직접 조회 + active_deal_count 자동갱신
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
- CategoryGrid/CategoryTabBar: 'use client', CategoryIcon은 color prop만

### 모바일 앱 (Expo) 🚧
- `detectSessionInUrl: false` 반드시 설정 (앱에서 URL 기반 세션 감지 불가)
- 웹의 `createServerSupabaseClient` / `createServiceClient` → 앱에서 사용 불가. 앱용 싱글톤만 사용
- `<Image>`에 width/height 필수 (웹과 달리 auto-sizing 안 됨)
- `<Text>`는 반드시 `<Text>` 안에만 텍스트 → `<View>` 안에 직접 문자열 불가
- 한글 slug: `decodeURIComponent` 웹과 동일하게 필요
- `expo-image` 권장 (기본 `<Image>`보다 캐싱/성능 우수)
- 웹 Pagination → FlatList `onEndReached` 무한스크롤로 전환
- 웹 sessionStorage → AsyncStorage로 전환
- 웹 navigator.clipboard → `expo-clipboard`으로 전환
- ✅ Supabase `window is not defined` 해결 (2/20): Proxy 기반 지연 초기화 (`getSupabase()`) — 모듈 로딩 시점에 AsyncStorage가 window 접근하는 문제 우회
- ✅ NativeWind className → style 객체 전환 (2/20): Expo Web에서 className 렌더링 불안정 → inline style로 통일
- ✅ 카테고리 그리드 3열 (2/20): `width: '31%'`가 Expo Web flex-wrap 미작동 → `Dimensions.get('window').width` 기반 픽셀 정확 계산
- `app/_layout.tsx`에서 Supabase 직접 import 금지 → 중복 초기화 에러 발생
- ✅ 딜 상세 모달 높이 (2/20): 고정 88% → `maxHeight: 85%` 콘텐츠 맞춤 (짧은 딜은 작게, 긴 딜은 스크롤)
- ✅ duplicate key 에러 (2/20): Supabase 쿼리가 동일 딜 중복 반환 → `dedupeDeals()` 유틸로 ID 기반 중복 제거
- ✅ offset 페이지네이션 (2/20): cursor(created_at) 방식은 DealCardType에 노출 안 됨 → `.range(offset, offset+limit-1)` offset 방식 채택
- ✅ 앱 행동추적 (2/20): 웹 `/api/actions` 대신 Supabase 직접 insert (fire-and-forget) — deal_actions RLS에 anon INSERT 정책 추가 필요
- expo-clipboard + expo-haptics: 쿠폰 복사 시 네이티브 클립보드 + 진동 피드백

### 어드민
- 어드민 N+1 쿼리: 회원 목록 `auth.admin.listUsers()` 배치 필수
- 머천트 PUT API: event_page_url/connector_type 필드 분리 (merchants 컬럼 오염 방지)
- edit 페이지 null 처리: 필드별 타입 맞춤 (배열→[], boolean→false). 일괄 `null→''` 금지
- 브랜드 수정 후 필터 유지: URL param `?category=xxx`

---

## 최근 채팅 히스토리
| 채팅 | 날짜 | 주요 내용 |
|------|------|-----------|
| 팝폰-모달렌더링수정+actions수정 | 2/18 | 모달 서버사이드 전환+actions metadata 제거 |
| 팝폰-네이버검수+법적페이지+탈퇴설계 | 2/18 | 네이버OAuth 프로필+법적페이지3종+이메일프로필+탈퇴설계 |
| 팝폰-회원탈퇴승인+구독+마케팅동의 | 2/18 | 회원탈퇴 어드민승인+구독버튼+마케팅동의+어드민 상세 확장 |
| 팝폰-회원가입수정+행동로그+페이징 | 2/18 | signUp 지연+완료화면+actions 서버user_id+구독API 복원+어드민 10개 페이징 |
| 팝폰-딜저장수정+마이페이지개선 | 2/18 | saved_deals FK수정+저장API 디버깅+마이페이지 환영메시지+구독2열+추천브랜드+홈CTA수정 |
| 팝폰-홈숫자수정+제보관리+카테고리수정 | 2/18 | 홈 실시간수치+save-deals v2.3 active_deal_count+제보관리UI+딜 카테고리 275개 일괄수정 |
| 팝폰-카카오검수+보안+연동수정 | 2/20 | 카카오OAuth 검수승인+Site URL수정+RLS 11테이블 활성화+linked_providers v2 동기화 |
| **팝폰-모바일앱설계+Phase M1 착수** | **2/20** | **Expo Router 설계도 작성+프로젝트 생성+Tab Navigator 스켈레톤 완성** |
| **팝폰-모바일앱 Phase M1 완료** | **2/20** | **Supabase 연결+타입/상수/유틸 포팅+DealCard/DealShelf/CategoryGrid+홈 실데이터+Expo Go 테스트** |
| **팝폰-모바일앱 Phase M2 완료** | **2/20** | **딜상세모달+카테고리상세+브랜드관+검색+DealListCard+CopyCode+tracking+무한스크롤+Expo Go 테스트** |

---

### 모바일 앱 Phase M1 완료 (2/20)
- [x] **Supabase 클라이언트 활성화** — LargeSecureStore + Proxy 지연 초기화 (`window is not defined` 해결)
- [x] **타입/상수/유틸 복사** — database.ts (100%), format.ts (100%), constants/index.ts (95%), types/index.ts
- [x] **deals.ts 포팅** — 웹 쿼리 로직 + 앱용 6개 함수 추가 (getTrendingDeals, getLatestDeals, getEndingSoonDeals 등)
- [x] **DealCard 컴포넌트** — expo-image 로고 + brand_color 배지 + 쿠폰 점선 컷아웃 + Ionicons
- [x] **DealShelf 컴포넌트** — 수평 ScrollView + 섹션 헤더
- [x] **CategoryGrid 컴포넌트** — 3×2 그리드 (Dimensions 기반 정확 계산) + Ionicons 카테고리 아이콘
- [x] **Tab Navigator** — Ionicons (filled/outline 토글) + iOS safeArea
- [x] **홈 화면 실데이터** — Supabase fetch (344개 브랜드, 937개 딜) + dedupeByMerchant + Pull-to-refresh
- [x] **Expo Go 테스트** — iPhone 실기기 확인 완료

### 모바일 앱 Phase M2 완료 (2/20)
- [x] **딜 상세 모달** — transparentModal + 콘텐츠 맞춤 높이(maxHeight 85%) + 드래그핸들 + 배경탭 닫기
- [x] **DealDetailView** — 브랜드 로고/이름 + 타이틀 + 혜택요약 + 날짜범위 + 이용조건 + 딜타입별 CTA (A1:쿠폰복사+이동 / A2:가격딜 / B:앱쿠폰)
- [x] **CopyCodeButton** — expo-clipboard 복사 + expo-haptics 진동 피드백 + 복사완료 상태
- [x] **카테고리 허브 (탭)** — 6개 카테고리 그리드 + 카테고리별 인기딜 DealShelf 미리보기
- [x] **카테고리 상세** — 서브카테고리 칩 필터 + FlatList offset 무한스크롤 + 정렬(SortPicker)
- [x] **브랜드관** — 프로필 헤더(로고+이름+카테고리+딜수) + 진행중/종료 탭 + FlatList 무한스크롤
- [x] **검색** — TextInput + 6개 카테고리 필터칩 + 정렬 + 트렌딩 초기표시 + 무한스크롤
- [x] **DealListCard** — 수평 리스트 카드 (56px 로고 + 브랜드/타이틀/할인/마감일)
- [x] **tracking.ts** — Supabase 직접 insert (deal_view, click_out, copy_code, search) + AsyncStorage 세션ID
- [x] **dedupeDeals** — FlatList duplicate key 에러 방지용 ID 기반 중복 제거
- [x] **Expo Go 테스트** — iPhone 실기기 전체 동선 확인 완료
- [ ] **다음**: Phase M3 — 카카오/네이버/애플 OAuth + 회원가입 온보딩 + 마이페이지

---

*마지막 업데이트: 2026-02-20 (모바일 앱 Phase M2 완료 — 딜상세모달+카테고리+브랜드관+검색+행동추적+Expo Go 테스트)*
