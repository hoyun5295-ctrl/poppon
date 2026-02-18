# POPPON 프로젝트 STATUS

## 프로젝트 개요
- **제품명**: POPPON (K-RetailMeNot)
- **기획서 버전**: v1.2.1
- **한줄 정의**: 한국의 모든 할인/쿠폰/프로모션을 한 곳에 모아, 검색·필터·카테고리·캘린더·큐레이션으로 탐색 → 저장/구독/알림으로 DB 축적 → TargetUP-AI CRM-Outside 고단가 타겟마케팅으로 수익화하는 딜 플랫폼
- **MVP 우선순위**: A(온라인 쿠폰/프로모션 코드) → B(앱쿠폰/링크형) → C(오프라인 이벤트)
- **핵심 방향**: 할인정보를 보기 쉽게 모아서 DB 축적 → 수익화 (RetailMeNot 코드복사/캐시백 모델과 다름)

### 프로젝트 구조 (2개 분리)
| 프로젝트 | 경로 | 용도 | 배포 |
|---------|------|------|------|
| **poppon** (메인) | `C:\projects\poppon` | 사용자 웹 (딜 탐색/저장/인증) | `https://poppon.vercel.app` ✅ |
| **poppon-admin** (어드민) | `C:\projects\poppon-admin` | 관리자 (딜CRUD/크롤러/Cron) | `https://poppon-admin.vercel.app` ✅ |

- **도메인**: `poppon.kr` (가비아, DNS 설정 필요)
- **GitHub (메인)**: `https://github.com/hoyun5295-ctrl/poppon` (private)
- **GitHub (어드민)**: `https://github.com/hoyun5295-ctrl/poppon-admin` (private) ✅

---

## ⚠️ 개발 원칙
> **절대 원칙**: 시키기 전에 코드/파일 만들지 않는다.
> 반드시 **기존 파일 파악 → 설계 의논 → 합의 후 구현** 순서.
> 기존 코드 망가뜨리지 않도록 현재 구조부터 확인한다.

---

## 핵심 사용자 흐름 (Top 5)
1. 홈 → 검색/카테고리 탐색 → 딜 상세(모달) → 코드복사/사이트이동
2. 딜 상세 → "저장/알림" → 가입 바텀시트 → SNS 로그인 → 저장 완료
3. 카테고리 허브 → 마감임박/이번주 탐색 → 트렌딩 딜 소비
4. 브랜드관 → 구독 → 신규 딜 알림 수신
5. 유저 제보(링크 제출) → 자동 파싱 → 운영자 승인 → 인벤토리 확장

---

## 기술 스택
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

---

## 🚨 새 채팅 시작 시 확인

### SQL 체크 (문제 있을 때만 실행)
```sql
-- 딜 상태별 현황
SELECT status, COUNT(*) FROM deals GROUP BY status ORDER BY count DESC;

-- 카테고리별 머천트/딜 현황
SELECT c.name, c.slug,
  COUNT(DISTINCT m.id) as merchants,
  COUNT(DISTINCT d.id) as active_deals
FROM categories c
LEFT JOIN merchants m ON c.id = ANY(m.category_ids)
LEFT JOIN deals d ON d.merchant_id = m.id AND d.status = 'active'
WHERE c.depth = 0 AND c.is_active = true
GROUP BY c.id, c.name, c.slug
ORDER BY active_deals DESC;

-- 커넥터 현황 (타입별)
SELECT connector_type, status, COUNT(*) FROM crawl_connectors GROUP BY connector_type, status ORDER BY connector_type;

-- 회원 테이블 확인
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM saved_deals;
SELECT COUNT(*) FROM followed_merchants;
```

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
| DealDetailClient.tsx | `src/components/deal/DealDetailClient.tsx` ⚠️ 레거시 (사용 안 함, 빌드 호환용) |
| TopNav.tsx | `src/components/layout/TopNav.tsx` |
| Footer.tsx | `src/components/layout/Footer.tsx` |
| SourceProtection.tsx | `src/components/layout/SourceProtection.tsx` |
| TopProgressBar.tsx | `src/components/layout/TopProgressBar.tsx` |
| Toast.tsx | `src/components/common/Toast.tsx` |
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
| Pagination.tsx | `src/components/common/Pagination.tsx` |
| SortDropdown.tsx | `src/components/common/SortDropdown.tsx` |

#### 페이지
| 파일 | 경로 |
|------|------|
| 루트 레이아웃 | `src/app/layout.tsx` (AuthProvider + TopProgressBar + Toast 래핑) |
| 글로벌 CSS | `src/app/globals.css` (fade-in + toast 애니메이션) |
| 미들웨어 | `src/middleware.ts` |
| 홈 | `src/app/page.tsx` |
| 홈 로딩 | `src/app/loading.tsx` |
| 검색 | `src/app/search/page.tsx` |
| 검색 로딩 | `src/app/search/loading.tsx` |
| 카테고리 | `src/app/c/[categorySlug]/page.tsx` |
| 카테고리 로딩 | `src/app/c/[categorySlug]/loading.tsx` |
| 브랜드관 | `src/app/m/[merchantSlug]/page.tsx` |
| 브랜드관 로딩 | `src/app/m/[merchantSlug]/loading.tsx` |
| 딜 상세 (모달) | `src/app/@modal/(.)d/[slug]/page.tsx` ✅ 서버사이드 (getDealBySlug) |
| 딜 상세 (풀페이지) | `src/app/d/[slug]/page.tsx` |
| 제보 | `src/app/submit/page.tsx` |
| 마이페이지 | `src/app/me/page.tsx` |
| 마이 로딩 | `src/app/me/loading.tsx` |
| 로그인 | `src/app/auth/page.tsx` (바텀시트 연동) |
| OAuth 콜백 | `src/app/auth/callback/route.ts` |

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
| Supabase 서버 | `src/lib/supabase/server.ts` |
| Supabase 브라우저 | `src/lib/supabase/client.ts` (싱글톤) |

#### API (메인 앱)
| 파일 | 경로 |
|------|------|
| 제보 API | `src/app/api/submit/route.ts` |
| 행동추적 API | `src/app/api/actions/route.ts` |
| 클릭 트래킹 | `src/app/out/[dealId]/route.ts` |
| 딜 저장 API | `src/app/api/me/saved-deals/route.ts` |
| 브랜드 구독 API | `src/app/api/me/follows/merchants/route.ts` |
| 계정 탈퇴 API | `src/app/api/me/delete-account/route.ts` |
| 검색 로그 API | `src/app/api/actions/search/route.ts` |
| 로그아웃 API | `src/app/api/auth/signout/route.ts` |
| 네이버 OAuth 시작 | `src/app/api/auth/naver/route.ts` |
| 네이버 OAuth 콜백 | `src/app/auth/callback/naver/route.ts` |

### 🔴 poppon-admin (어드민 앱)

#### 컴포넌트
| 파일 | 경로 |
|------|------|
| MerchantForm.tsx | `src/components/admin/MerchantForm.tsx` ✅ v5 (slug+카테고리선택+커넥터자동생성+로고업로드+커넥터관리UI) |

#### 페이지
| 파일 | 경로 |
|------|------|
| 루트 레이아웃 | `src/app/layout.tsx` |
| 미들웨어 | `src/middleware.ts` (비밀번호 보호) |
| 로그인 | `src/app/login/page.tsx` |
| 대시보드 | `src/app/(dashboard)/page.tsx` |
| 대시보드 레이아웃 | `src/app/(dashboard)/layout.tsx` |
| 딜 목록/생성/수정 | `src/app/(dashboard)/deals/` |
| 머천트 목록 | `src/app/(dashboard)/merchants/page.tsx` ✅ 디바운스검색+카테고리필터+URL필터유지 |
| 머천트 생성/수정 | `src/app/(dashboard)/merchants/new/`, `[id]/edit/` ✅ 커넥터관리UI+Suspense |
| 회원 목록 | `src/app/(dashboard)/members/page.tsx` |
| 회원 상세 | `src/app/(dashboard)/members/[id]/page.tsx` |
| 크롤 모니터링 | `src/app/(dashboard)/crawls/page.tsx` ✅ v4 (타입 필터) |
| 크롤 이력 | `src/app/(dashboard)/crawl-history/page.tsx` |

#### API (어드민 앱)
| 파일 | 경로 |
|------|------|
| 어드민 인증 | `src/app/api/auth/route.ts` |
| 딜 CRUD | `src/app/api/deals/route.ts` + `[id]/route.ts` ✅ FK 명시 |
| 머천트 목록+생성 | `src/app/api/merchants/route.ts` ✅ v4.3 (q검색+카테고리필터+커넥터자동생성) |
| 머천트 개별 | `src/app/api/merchants/[id]/route.ts` ✅ v5 (GET에 커넥터목록 포함+PUT 필드분리) |
| 커넥터 관리 | `src/app/api/connectors/[id]/route.ts` ✅ v5 (PATCH URL/타입/상태/해시리셋, DELETE) |
| 대시보드 경량 | `src/app/api/dashboard/route.ts` ✅ active/expired/pending 분리 |
| 로고 업로드 | `src/app/api/upload-logo/route.ts` ✅ Supabase Storage (merchant-logos 버킷) |
| 회원 목록 | `src/app/api/members/route.ts` (N+1 제거) |
| 회원 상세 | `src/app/api/members/[id]/route.ts` |
| AI 크롤 (배치/단일) | `src/app/api/ai-crawl/route.ts` + `[connectorId]/route.ts` ✅ v4 (타입 시스템) |
| Cron 크롤 | `src/app/api/cron/crawl/route.ts` (3-batch, single 제외) ✅ v4 |
| Cron 만료 | `src/app/api/cron/expire/route.ts` |
| 크롤 이력 API | `src/app/api/crawl-history/route.ts` |

#### 크롤러 / 스크립트 (어드민에만 존재)
| 파일 | 경로 |
|------|------|
| vercel.json | 루트 — Cron 스케줄 (3-batch + expire) |
| AI 크롤 엔진 (v5) | `src/lib/crawl/ai-engine.ts` ✅ 프롬프트 전면개선+fullPage+이벤트성 판단원칙 |
| 딜 저장 (v2.2) | `src/lib/crawl/save-deals.ts` ✅ merchants.category_ids 직접 조회 |
| 크롤러 테스트 | `scripts/test-ai-crawl.ts` |
| 이벤트 페이지 탐지 | `scripts/detect-event-pages.ts` |
| 로고 수집 v2/v3.1 | `scripts/fetch-merchant-logos.ts` / `fetch-merchant-logos-v3.ts` |
| 구글 이미지 로고 | `scripts/fetch-logos-google.ts` |
| OG 이미지 수집 | `scripts/fetch-og-images.ts` |

#### 데이터 파일
| 파일 | 설명 |
|------|------|
| `poppon_brands_filtered.csv` | 브랜드 494개 (원본) |
| `crawl-targets-final.csv` | 최종 크롤링 대상 187개 |
| `poppon-brand-master.csv` | 6개 카테고리 230개 브랜드 마스터 |

---

## 라우팅 구조

### 메인 앱
```
src/app/
├── layout.tsx               — AuthProvider + TopProgressBar + AuthSheet 래핑
├── loading.tsx              — 홈 스켈레톤
├── @modal/(.)d/[slug]/      — 인터셉팅 모달
├── d/[slug]/                — SEO 풀 페이지
├── m/[merchantSlug]/        — 브랜드관 + loading.tsx
├── c/[categorySlug]/        — 카테고리 허브 + loading.tsx
├── search/                  — 검색 결과 + loading.tsx
├── submit/                  — 유저 제보
├── me/                      — 마이페이지 + loading.tsx
├── auth/                    — 로그인 + callback/ (카카오) + callback/naver/
├── api/
│   ├── submit/, actions/, actions/search/
│   ├── auth/signout/, auth/naver/
│   └── me/saved-deals/, me/follows/merchants/, me/delete-account/
└── out/[dealId]/            — 클릭 트래킹
```

### 어드민 앱
```
src/app/
├── login/                   — 비밀번호 로그인
├── (dashboard)/
│   ├── layout.tsx           — 사이드바
│   ├── page.tsx             — 대시보드
│   ├── deals/, merchants/   — CRUD
│   ├── members/             — 회원 관리 (목록 + [id] 상세)
│   ├── crawls/              — 크롤 모니터링 (타입 필터)
│   └── crawl-history/       — 크롤 이력
├── api/
│   ├── auth/, deals/, merchants/, dashboard/
│   ├── members/ + [id]/     — 회원 API
│   ├── connectors/[id]/     — 커넥터 PATCH/DELETE (v5)
│   ├── ai-crawl/ + [connectorId]/
│   ├── crawl-history/
│   └── cron/crawl/, cron/expire/
```

### 미들웨어 보호
- **메인**: `/brand/*` → 로그인 필수
- **어드민**: 전체 → ADMIN_SECRET 쿠키 필수 (login 제외)

---

## API 구조 요약

### 메인 — Public
`GET /deals` (목록/검색), `GET /deals/:id`, `GET /categories`, `GET /merchants`, `POST /api/submit`

### 메인 — Member (로그인)
`GET /auth/callback` (OAuth), `GET /api/auth/signout` (서버 로그아웃), `GET|POST|DELETE /api/me/saved-deals`, `GET|POST|DELETE /api/me/follows/merchants`, `DELETE /api/me/delete-account` (soft delete), `POST /api/actions/search`, `POST /deals/:id/actions` (view/click_out/copy_code/save/share)

### 어드민
`POST /api/auth`, CRUD: `/api/deals`, `/api/merchants` (q검색+카테고리필터+커넥터자동생성), `POST /api/upload-logo` (Supabase Storage), `GET /api/dashboard` (경량 count), `GET|PATCH /api/members` + `GET /api/members/:id`, `PATCH|DELETE /api/connectors/:id` (커넥터 URL/타입/상태 수정+삭제), `GET|POST /api/ai-crawl`, `GET /api/crawl-history`, `GET /api/cron/crawl` (3-batch, single 제외), `GET /api/cron/expire`

### 트래킹
`GET /out/:dealId` — 아웃바운드 리다이렉트 (클릭로그 + 302)

---

## 딜 타입 / 태그 체계

| 타입 | 설명 | CTA |
|------|------|-----|
| A1 | 쿠폰/프로모션 코드형 | CopyCodeButton + GoToSource |
| A2 | 가격딜/핫딜 (최저가/특가) | GoToSource (제휴링크) |
| B | 앱쿠폰/링크형 | GetCouponButton + GoToSource |
| C | 오프라인 이벤트 | StoreInfoPanel + GoToSource |

- **혜택 (benefit_tags)**: percent_off, amount_off, bogo, free_shipping, gift_with_purchase, bundle_deal, clearance, member_only, new_user, app_only, limited_time
- **채널**: online_only, offline_only, hybrid
- **긴급**: ending_soon_24h, ending_soon_3d, new_today, updated_today

---

## 카테고리 (6개 활성)
| name | slug | 비고 |
|------|------|------|
| 패션 | fashion | ✅ active |
| 뷰티 | beauty | ✅ active |
| 식품/배달 | food | ✅ active |
| 생활/리빙 | living | ✅ active (디지털/가전 흡수) |
| 여행/레저 | travel | ✅ active |
| 문화/콘텐츠 | culture | ✅ active |

비활성 6개: 디지털/가전(→생활 흡수), 건강/키즈/반려동물(볼륨 부족), 자동차/금융(부적합)

---

## DB 스키마

### 데이터 현황 (2/17 기준)
| 항목 | 수치 |
|------|------|
| 브랜드 (merchants) | ~340개 (전원 로고+brand_color) |
| 딜 (deals) | ~1,070 전체 (active ~875 / expired ~195) |
| 커넥터 (crawl_connectors) | ~257 active / ~171 disabled |
| 커넥터 타입 | list ~414 / naver_brand 1 / single 0 |
| 카테고리 (depth 0) | 6개 active / 6개 비활성 |

### deals 테이블 (주요 컬럼)
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

### merchants 테이블 (~340개)
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
role(user/admin/super_admin), status(active/withdrawn/banned),
withdrawn_at, withdraw_reason, last_login_at, created_at, updated_at
```

⚠️ **코드↔DB 컬럼명 매핑** (✅ 전수 수정 완료 2/17)
| 코드 기존 명칭 | 실제 DB 컬럼명 |
|---|---|
| `interested_categories` | `interest_categories` |
| `marketing_opt_in` | `marketing_agreed` |

### 기타 테이블
- **saved_deals**: id, user_id, deal_id, created_at — UNIQUE(user_id, deal_id)
- **followed_merchants**: id, user_id, merchant_id, created_at — UNIQUE(user_id, merchant_id)
- **crawl_connectors**: id, name, merchant_id, source_url, config, status, fail_count, last_run_at, content_hash(MD5), hash_updated_at, **connector_type**(list/single/naver_brand, DEFAULT 'list') ✅ v4
- **crawl_runs**: id, connector_id, status(running/success/partial/failed), new/updated/expired_count, error_message, started_at, completed_at, tokens_used
- **deal_actions**: id, deal_id, user_id(nullable), session_id(ppn_sid), action_type, metadata(jsonb), created_at
- **search_logs**: id, user_id(nullable), session_id, query, category_slug, result_count, created_at
- **outbound_clicks**: deal_id(FK→deals.id) — hidden 딜 삭제 시 FK 제약 주의

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
⚠️ deals 삭제 시 outbound_clicks, deal_actions, saved_deals FK 먼저 삭제 필요

### RLS 정책
- deals: SELECT status='active'|'expired', ALL: admin/super_admin
- merchants/categories: SELECT 전체
- profiles: SELECT/UPDATE auth.uid()=id
- saved_deals/followed_merchants: ALL auth.uid()=user_id
- submissions: INSERT true, SELECT own

---

## 회원가입/인증 시스템

### 아키텍처
```
[이메일 가입] AuthSheet 6단계 → Supabase Auth → profiles 트리거 → 본인인증(placeholder) → 관심카테고리 → 마케팅동의
[카카오 로그인] signInWithOAuth → 카카오 동의 → Supabase 콜백 → 신규? → /?onboarding=sns → AuthSheet(categories)
[탈퇴] 마이페이지 → soft delete (status='withdrawn') → 30일 후 완전 삭제
[로그아웃] <a href="/api/auth/signout"> → sb- 쿠키 삭제 + 302 → sessionStorage 토스트
```

### 구현 현황
- ✅ DB 6테이블 + RLS + 트리거, AuthProvider + AuthSheet, 카카오 OAuth, SNS 온보딩
- ✅ 서버 사이드 로그아웃, Toast 시스템, TOKEN_REFRESHED 무한루프 방지
- ✅ 네이버 OAuth (수동 플로우 — admin.createUser+generateLink+verifyOtp)
- ⬜ 애플 OAuth (앱 출시 후), KMC 본인인증, 카카오 알림톡

### 환경변수

#### 메인 앱 (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
NAVER_CLIENT_ID=...
NAVER_CLIENT_SECRET=...
```

#### 카카오 OAuth (Supabase Provider에 설정)
```
REST API Key: 83c8e501803f831f075f7c955d91a000
앱 도메인: https://poppon.vercel.app
Redirect URI: https://beniaypzlnygtoqmbvnx.supabase.co/auth/v1/callback
동의항목: 닉네임(필수), 프로필사진/이메일(선택)
```

#### 어드민 앱 (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=... (동일)
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_... (동일)
SUPABASE_SERVICE_ROLE_KEY=sb_secret_... (동일)
ADMIN_SECRET=... (2/16 변경)
ANTHROPIC_API_KEY=sk-ant-api03-... (2/16 재발급)
CRON_SECRET=...
NEXT_PUBLIC_MAIN_URL=https://poppon.kr
```

---

## AI 크롤러 v5 (프롬프트 전면 개선)

### 아키텍처
```
커넥터 URL → Puppeteer (이미지 차단, 15s) → MD5 해시 비교
  → 변경 없음 → 스킵 | 변경 있음 → Claude Haiku 파싱 → save-deals v2.2 → hash 저장
  → 카테고리: merchants.category_ids 직접 조회 (config fallback은 최종 수단)
  → single 타입: 해시 스킵, 성공 후 자동 disabled
  → naver_brand 타입: fullPage 모드 (DOM 전체 수집) + 전용 프롬프트
```

### 프롬프트 v5 핵심 판단 원칙
```
모든 타입 공통:
"이것은 기간 한정이거나 이벤트성 혜택인가, 아니면 상시 판매/상시 할인인가?"
→ 이벤트성이면 수집, 상시이면 제외

naver_brand 추가 판단:
"이 탭 이름에 소비자가 금전적 혜택을 기대할 수 있는 정보가 있는가?"
✅ 할인율/증정/기간한정/혜택 키워드 → 기획전
❌ 제품라인/성분/효능 분류 → 일반 카테고리 → 제외
```

### 커넥터 타입 체계 (v5)
| 타입 | 설명 | Cron | 성공 후 | 해시체크 | DOM수집 | 프롬프트 |
|------|------|------|--------|---------|--------|---------|
| `list` | 이벤트 목록 페이지 | ✅ 매일 | active 유지 | ✅ | main 영역 | 이벤트성 딜 추출 |
| `single` | 개별 이벤트 URL | ❌ 제외 | **auto disabled** | ❌ (1회성) | main 영역 | 딜 1개만 분석 |
| `naver_brand` | 네이버 브랜드스토어 | ✅ 매일 | active 유지 | ✅ | **fullPage** (body 전체) | 기획전 탭만 추출 |

### renderPage fullPage 모드 (v4.1~)
```
일반 모드 (list/single):
  nav, header, footer 등 제거 → main/#content/#container 내부에서만 링크 수집

fullPage 모드 (naver_brand):
  script/style만 제거 → document.body 전체에서 링크 수집
  이유: 네이버 브랜드스토어 기획전 탭이 main 영역 밖에 위치
```

### naver_brand 후처리 필터
```
/products/ URL 포함 딜 → 강제 차단 (console.warn 로그)
이유: 네이버 상품 URL은 수시로 삭제되어 링크 깨짐
```

### 딜 카테고리 배정 로직 (v2.2 수정)
```
1순위: merchants.category_ids[0] → categories 테이블에서 ID 직접 조회
2순위: connector.config.top_category → CATEGORY_SLUG_MAP 매핑 (fallback)
3순위: 생활/리빙 (최종 fallback)
```
⚠️ **v2.1까지 버그**: `config.top_category || '생활'` 하드코딩으로 카테고리 엉뚱하게 배정 → v2.2에서 근본 수정

### 브랜드 등록/수정 → 커넥터 자동생성
```
MerchantForm에서 이벤트 URL 입력
  → brand.naver.com 감지 → naver_brand 자동선택
  → 그 외 → list/single 라디오 선택
  → merchants API POST/PUT → 머천트 생성/수정 + crawl_connectors INSERT
  → 중복 URL 체크 (이미 있으면 스킵)
  → PUT: event_page_url/connector_type 필드 분리 (merchants 컬럼 오염 방지)
```

### 비용/성과
- 전략 변천: static_html(실패) → API 직접(부분성공) → **Puppeteer+AI** ✅ 최종
- 비용: 현재 ~150개 첫 크롤 ~$3, 이후 월 ~$15 (해시 스킵)
- 로고: v2(HTTP)+v3.1(Puppeteer)+구글이미지 수집, 수동 34종 교체 완료, **v4.3: Supabase Storage 파일 업로드 도입**

---

## TargetUP-AI 연동 / 운영 정책 / 분석

- **TargetUP-AI**: phone_hash, marketing_opt_in, 관심카테고리/브랜드, 최근 행동 요약 → segments_daily 배치 동기화
- **운영 정책**: 출처 항상 표시, robots 존중, 실패 3회→비활성, 만료 자동 전환, 광고 스폰서 라벨 필수
- **분석 이벤트**: deal_view/click_out/copy_code/save, merchant_follow, search_performed, signup_start/complete, marketing_opt_in

---

## 개발 Phase
- **Phase 0** ✅ 완료: DB 18테이블+RLS, 전체 페이지, 어드민, AI 크롤러 v3, Vercel 배포
- **Phase 1** ✅ 거의 완료: 크롤러 v5(프롬프트개선+fullPage)+만료+디자인+회원+브랜드 확장+어드민 분리+딜 정리+어드민 브랜드관리+커넥터관리
- **Phase 2** 미착수: 도메인 연결 / 링크프라이스 제휴 / 브랜드 포털 / 스폰서 슬롯 / 성과 정산

---

## 🖥️ 인프라 설계 (확정 2/17)
- **현재**: Vercel Pro ($20/월 × 2) + Supabase Pro ($25/월) = **$65/월 (약 9만원)**
  - 메인+어드민: Vercel (서울 icn1)
  - DB: Supabase Pro (200 동시커넥션, 8GB, 일 7회 백업, **서울 ap-northeast-2**, Storage: merchant-logos 버킷)
- **향후 이관 트리거**: Supabase 비용 월 $100+ 또는 크롤 수천 건 시 자체 서버 검토

---

## 배치 스케줄 (어드민 Vercel Cron)
- 23:00 KST (14:00 UTC): batch=1 (커넥터 1/3, ~85개, **single 제외**)
- 23:20 KST (14:20 UTC): batch=2 (커넥터 2/3, ~85개)
- 23:40 KST (14:40 UTC): batch=3 (커넥터 3/3, ~84개)
- 23:50 KST (14:50 UTC): expire (만료 딜 자동 처리)
- **안전장치**: 250초 타임아웃 (Vercel 300초 제한 전 중단)
- **v4 변경**: Cron에서 `connector_type IN ('list', 'naver_brand')` — single 자동 제외

---

## 🔴 미해결 / 진행 예정

### 미해결
- ⚠️ 카카오 로그인 후 온보딩 테스트 필요
- ⚠️ 일부 구글 이미지 로고 품질 낮음 (34개 교체 완료, 나머지는 어드민 파일 업로드로 교체 가능)
- ⚠️ 기존 딜 카테고리 불일치 — 크롤러 v2.1까지 엉뚱한 카테고리로 배정된 딜 존재 (v2.2로 신규 딜은 해결, 기존 딜 일괄 수정 필요)
- ⚠️ 기존 naver_brand 잘못된 딜 정리 필요 — 달바(23개 상품→hidden 완료, 7개 기획전 재크롤), 라네즈(7개 카테고리명 딜 → hidden 필요 후 naver_brand 재크롤)
- ⚠️ deal_actions 테이블에 `metadata` 컬럼 추가 필요 (또는 tracking.ts에서 metadata 전송 제거) — 현재 API에서 metadata INSERT 제거로 임시 해결

### 즉시 (Phase 1 마무리)
- **도메인**: 가비아 DNS 설정 (A: @→76.76.21.21, CNAME: www→cname.vercel-dns.com, admin→별도)
- **기존 딜 카테고리 일괄 수정**: merchants.category_ids 기준으로 deals.category_id UPDATE 쿼리

### 단기 (Phase 2)
- **링크프라이스**: 제휴 API 연동 → `source_type: 'affiliate'` + `affiliate_url` 필드 활용
- **회원**: 애플 OAuth, KMC 본인인증, 카카오 알림톡, 검색 trackSearch 연동
- **어드민**: 탈퇴 30일 자동 삭제 Cron
- **크롤러**: ~~naver_brand 전용 파서~~ ✅ v5에서 전용 프롬프트+fullPage 완성
- **크롤러**: single 타입 처리 로직 검증 + 유저 제보(/submit) → single 커넥터 자동 생성
- **크롤러**: 기존 list 타입으로 잘못 크롤된 naver_brand 딜 일괄 정리

### 중기 (Phase 3)
- **수익화**: TargetUP-AI CRM 연동 (건당 60~70원 타겟 마케팅)
- **인프라**: Docker Compose (트래픽 증가 대비)
- **브랜드 포털**: 스폰서 슬롯, 성과 정산

---

## 주의사항 / 트러블슈팅
- 한글 slug → decodeURIComponent 필수
- Supabase 조인 FK 명시 필수: `categories!deals_category_id_fkey`
- 모달 내부 링크 → `<a>` hard navigation
- categories.deal_count DB 값 0 → active 딜 실제 집계로 대체
- 병렬 크롤 concurrency 기본 3 (최대 5)
- brand_color: **339개 전원 적용 완료**
- 딜 이미지: thumbnail_url은 DealCard에서 사용 안 함 (로고 중심 디자인)
- Puppeteer waitForTimeout 제거됨 → `new Promise(r => setTimeout(r, ms))`
- Vercel 빌드: `.rpc()` → `.then(() => {}, () => {})`, 타입 체크 엄격
- 로고 관리: 신규/교체 → 어드민 MerchantForm에서 파일 업로드 (Supabase Storage `merchant-logos` 버킷). 기존 외부 URL 로고는 그대로 유지됨
- **로고 업로드 원칙**: edit 모드에서 파일 안 건드리면 payload에서 logo_url 제외 → DB 기존 값 유지. 이벤트 URL만 추가해도 로고 안 바뀜
- CategoryGrid/CategoryTabBar: 'use client', CategoryIcon은 color prop만
- **PowerShell**: Set-Content 인코딩 → node 스크립트 권장, [id] 폴더 → `-LiteralPath` 필수
- **어드민 tsconfig.json**: `"exclude": ["node_modules", "scripts"]`
- **Supabase API Keys**: 레거시 Disabled → sb_publishable_/sb_secret_ 사용
- **Supabase client.ts 싱글톤**: `createClient()` 함수 사용 필수
- **Vercel Function Region**: 메인+어드민 둘 다 서울(icn1). 리전 변경 후 Redeploy 필요
- **AuthProvider TOKEN_REFRESHED**: fetchProfile 절대 금지 → 무한루프
- **로그아웃**: 서버 사이드 API(`/api/auth/signout`) 필수. `<a>` 태그 사용
- **Toast 시스템**: sessionStorage('poppon_pending_toast') → layout mount 시 표시
- **Puppeteer 서버리스**: `puppeteer-core` + `@sparticuz/chromium` 필수
- **Vercel 배치 크롤 타임아웃**: 3-batch 분할 + 250초 타임아웃
- **카카오 OAuth**: REST API Key `83c8e501803f831f075f7c955d91a000`, 도메인 변경 시 카카오 포털 동기화
- **profiles.phone**: UNIQUE 해제됨. KMC 연동 시 재적용 검토
- **Cron 3-batch**: 커넥터 이름순 정렬 → 3등분, 250초 초과 시 스킵. **v4: single 타입 자동 제외**
- **DealModal 스크롤**: `position: fixed` + `top: -scrollY` 패턴 필수
- **어드민 N+1 쿼리**: 회원 목록 개별 `getUserById()` 금지 → `auth.admin.listUsers()` 배치 필수
- **네이버 OAuth**: 수동 플로우. `updateUserById` 사용 필수 (updateUser 아님). 환경변수 `NAVER_CLIENT_ID/SECRET` — poppon만
- **어드민 딜 목록**: `/api/deals` categories 조인 FK 명시 필수 (`categories!deals_category_id_fkey`)
- **deals 삭제 시 FK**: outbound_clicks → deal_actions → saved_deals 순서로 먼저 삭제 필요
- **커넥터 타입 컬럼**: `crawl_connectors.connector_type` DEFAULT 'list'
- **single 커넥터**: 크롤 성공 시 자동 `status: 'disabled'`. Cron에서 제외. 해시 체크 안 함
- **어드민 edit 페이지 null 처리**: 필드별 타입 맞춤 변환 필수 (배열→[], boolean→false). 일괄 `null→''` 금지 (v4.3 수정)
- **머천트 PUT API**: event_page_url/connector_type 필드 분리 필수. merchants 컬럼에 없는 필드 update 시 에러 (v4.3 수정)
- **크롤러 카테고리 배정**: save-deals.ts v2.2에서 merchants.category_ids 직접 조회. config.top_category는 fallback만
- **크롤러 프롬프트 v5**: "이벤트성 판단 원칙" 기반 — 상시 할인/상시 판매가 제외, confidence 75 이상만 통과
- **naver_brand fullPage**: renderPage에 `{ fullPage: true }` 옵션 → body 전체에서 링크 수집 (기획전 탭이 main 밖에 있음)
- **naver_brand /products/ URL 차단**: 후처리 필터에서 강제 제거 (네이버 상품 URL 수시 삭제로 링크 깨짐)
- **커넥터 관리 API**: `/api/connectors/[id]` PATCH(URL/타입/상태/해시리셋) + DELETE(crawl_runs도 함께 삭제)
- **브랜드 수정 후 필터 유지**: edit 페이지 URL에 `?category=xxx` 포함, MerchantForm returnCategory prop으로 전달
- **useSearchParams + Suspense**: Next.js 15에서 useSearchParams() 사용하는 'use client' 페이지는 반드시 Suspense로 래핑 필수
- **딜 모달 렌더링**: 서버사이드 `getDealBySlug()` 사용 필수. 클라이언트 Supabase 싱글톤은 AuthProvider auth lock으로 fetch 멈춤 위험
- **DealDetailClient.tsx**: 레거시 파일 (사용 안 함). 모달/풀페이지 모두 서버사이드. 빌드 호환용 최소 코드만 유지
- **deal_actions 테이블**: `metadata` 컬럼 없음. actions API에서 metadata 필드 INSERT 시 스키마 캐시 에러 발생
- **Supabase 클라이언트 auth lock**: 싱글톤 createClient()로 AuthProvider가 getSession()+onAuthStateChange() 잡고 있으면, 같은 클라이언트로 다른 쿼리 시 블로킹 가능. 서버사이드 또는 REST 직접 호출로 우회

---

## 채팅 히스토리
| 채팅 | 날짜 | 주요 내용 |
|------|------|-----------|
| 팝폰-웹사이트개발시작 | 2/14 | DB, 어드민, 크롤러 기초 |
| 팝폰-크롤링에대한고민 | 2/14 | Puppeteer+AI 전략 |
| 팝폰-크롤링완료 | 2/14 | 1차 크롤링, 455개 딜 |
| 팝폰-상세 개발 페이지 등 | 2/15 | 홈, 딜상세, 로고 v2 |
| 팝폰-브랜드관 등 기타 | 2/15 | 브랜드관/검색/카테고리/Cron |
| 팝폰-중복제거 및 로고 | 2/15 | DealCard 리디자인 |
| 팝폰-스테이터스 정리 | 2/15 | STATUS.md 정리 |
| 팝폰-DealCard+로고 | 2/15 | brand_color, DealCard v3 |
| 팝폰-DealCard v4+로고v4 | 2/16 | DealCard v4.2, 로고 v4 |
| 팝폰-STATUS+만료+버그 | 2/16 | 만료 자동화 |
| 팝폰-클릭트래킹+어드민+배포 | 2/16 | 클릭트래킹, 어드민 보호 |
| 팝폰-모바일반응형+크롤러+배포 | 2/16 | 모바일 12파일, Vercel 배포 |
| 팝폰-크롤링최적화+회원설계+행동추적 | 2/16 | 크롤러 v3, 커넥터 정리, deal_actions, 회원설계 |
| 팝폰-STATUS복원+로고+카테고리리디자인 | 2/16 | STATUS 복원, 로고 9종, 카테고리 리디자인, Vercel Pro |
| 팝폰-디자인개선+모달속도+만료필터 | 2/16 | 홈 검색창 제거, Lucide 통일, 딜 모달 클라이언트 fetch |
| 팝폰-카테고리구조조정+머천트대정리 | 2/16 | 카테고리 12→6, 머천트 매핑, 신규 75개, 브랜드 마스터 230개 |
| 팝폰-브랜드확장+풀크롤 | 2/16 | 커넥터 65개 등록, 로고 75개, 풀크롤 243개(173딜/$1.41) |
| 팝폰-카테고리언더라인+소스보호+커넥터정리 | 2/16 | 언더라인 탭 통일, 소스보호 강화, 커넥터 대정리(256 active) |
| 팝폰-인증시스템+어드민분리 | 2/16 | 회원 DB 6테이블, AuthProvider+AuthSheet, 어드민 분리, 양쪽 빌드 |
| 팝폰-키로테이션+어드민배포 | 2/16 | Supabase 신규 키, Anthropic 재발급, 어드민 GitHub+Vercel 배포 |
| 팝폰-회원가입+행동추적+어드민회원관리 | 2/16 | AuthSheet 6단계, soft delete, tracking, 어드민 회원관리 |
| 팝폰-성능최적화+UX부드러움 | 2/17 | 싱글톤, 리전 서울, 모달 애니메이션, 캐시, TopProgressBar, loading.tsx |
| 팝폰-인증UX+토스트+로그아웃수정 | 2/17 | Toast, 이메일 기억, 마이페이지 관심카테고리/추천브랜드 |
| 팝폰-로그아웃+무한루프디버깅 | 2/17 | TOKEN_REFRESHED 차단, 서버 로그아웃, REST API 직접 호출 |
| 팝폰-카카오OAuth+SNS온보딩 | 2/17 | 카카오 연동, SNS 온보딩, phone UNIQUE 해제, 컬럼명 불일치 발견 |
| 팝폰-컬럼수정+크롤러서버리스+인프라논의 | 2/17 | 컬럼 전수 수정, Vercel Puppeteer, 배치 순차 호출, 풀크롤 실행 |
| 팝폰-네이버OAuth+인프라확정 | 2/17 | 인프라 $65/월 확정, Supabase Pro, 네이버 OAuth 수동 플로우 |
| 팝폰-STATUS+검색개선+로고교체 | 2/17 | 서브카피 동적, 풀크롤 256개(208성공/$2.92), 로고 5종, 검색 개선 |
| 팝폰-로고교체+푸터+홈그리드 | 2/17 | 로고 34종, 푸터 사업자 정보, 홈 limit 48 |
| 팝폰-Cron자동화+크롤이력 | 2/17 | 3-batch 분할, 크롤 이력 페이지+API, 모달 스크롤 수정 |
| 팝폰-어드민속도개선+회원상세+페이징 | 2/17 | 대시보드 경량API, 회원 N+1 제거, 브랜드/크롤 10개 페이징, 어드민 서울 설정 |
| 팝폰-딜버그수정+커넥터타입v4+딜정리 | 2/17 | 딜 목록 FK 수정, 커넥터 타입 시스템, hidden 931개 정리→active 871개 |
| **팝폰-어드민브랜드관리+크롤카테고리수정** | **2/17** | **브랜드 검색버그+카테고리필터+slug직접입력+edit null수정+크롤러 카테고리 근본수정(v2.2)** |
| **팝폰-로고파일업로드** | **2/17** | **Supabase Storage 연동, 어드민 MerchantForm 파일 업로드, 기존 로고 보존 로직** |
| **팝폰-네이버브랜드크롤수정+커넥터관리** | **2/18** | **naver_brand fullPage+프롬프트v5+커넥터관리UI+브랜드필터유지** |
| **팝폰-모달렌더링수정+actions수정** | **2/18** | **모달 서버사이드 전환(auth lock 해결)+actions API metadata 제거** |

---

### 로고 파일 업로드 (2/17)
- [x] Supabase Storage `merchant-logos` 버킷 생성 (Public)
- [x] 로고 업로드 API (`/api/upload-logo`) — 5MB 제한, PNG/JPG/WebP/SVG
- [x] MerchantForm v4.3 — "📁 파일에서 선택" 버튼 + 기존 URL 입력 유지
- [x] 로고 보존 로직 — edit 모드에서 로고 안 건드리면 payload에서 logo_url 제외
- [x] 업로드 상태 표시 (스피너) + 에러 핸들링 + 미리보기

### 어드민 브랜드 관리 개선 + 크롤러 카테고리 수정 (2/17)
- [x] 브랜드 검색 버그 — 파라미터 `search` → `q` 통일
- [x] 브랜드 카테고리 필터 — 탭 바 + 미분류 표시 + 활성 딜 0개 하이라이트
- [x] 브랜드 목록 디바운스 자동 검색 (300ms) — form submit 제거
- [x] slug 직접 입력 — 영문+숫자+하이픈, 중복 체크, 한글 브랜드 빈칸 유도
- [x] 카테고리 선택 UI — DB 실시간 로드 + 토글 버튼 (복수 선택)
- [x] brand_color 입력 필드 + 컬러 프리뷰
- [x] edit 페이지 null 처리 — `null→''` 일괄 변환 제거 → 필드별 타입 맞춤 (배열→[], boolean→false)
- [x] 머천트 PUT API — event_page_url/connector_type 분리 (merchants 컬럼 오염 방지)
- [x] 브랜드 수정 시 커넥터 자동 생성 — PUT에서도 이벤트 URL 있으면 커넥터 INSERT
- [x] **크롤러 카테고리 근본 수정 (save-deals v2.2)** — `config.top_category || '생활'` → merchants.category_ids 직접 조회
- [x] 스킨푸드 커넥터 — 자체 사이트 Prototype.js 충돌 → 네이버 브랜드스토어로 URL 변경
- [ ] 기존 딜 카테고리 일괄 수정 (merchants.category_ids 기준 UPDATE) — 미실행

---

### 네이버 브랜드스토어 크롤 수정 + 프롬프트 v5 + 커넥터 관리 (2/18)
- [x] **renderPage fullPage 모드** — naver_brand 타입일 때 body 전체에서 링크 수집 (기획전 탭이 main 영역 밖에 위치하는 문제 해결)
- [x] **naver_brand 전용 프롬프트** — 기획전 vs 일반 카테고리 구분 원칙 추가 ("금전적 혜택 기대 가능?" 판단)
- [x] **LIST 프롬프트 전면 개선** — "이벤트성 판단 원칙" 중심 재작성 (상시 할인/상시 판매가 제외)
- [x] **SINGLE 프롬프트 개선** — 이벤트성 판단 원칙 추가
- [x] **confidence 기준 상향** — 70→75 (후처리 필터 포함)
- [x] **naver_brand /products/ URL 차단** — 후처리 필터에서 강제 제거
- [x] 달바 잘못된 딜 23개 hidden + 해시 리셋 + naver_brand 재크롤 → 7개 기획전 추출 성공
- [x] **커넥터 관리 API** — `/api/connectors/[id]` PATCH(URL/타입/상태/해시리셋) + DELETE
- [x] **커넥터 관리 UI** — MerchantForm edit 모드에서 기존 커넥터 조회/URL수정/타입변경/상태토글/해시리셋/삭제
- [x] **머천트 GET API** — 커넥터 목록 포함 반환
- [x] **브랜드 수정 후 카테고리 필터 유지** — URL param으로 상태 유지 (`?category=xxx`)
- [x] **useSearchParams Suspense 래핑** — Next.js 15 빌드 에러 해결
- [ ] 라네즈 잘못된 딜 hidden + naver_brand 재크롤 — 미실행

---

### 딜 모달 렌더링 수정 + actions API 수정 (2/18)
- [x] **모달 서버사이드 전환** — `@modal/(.)d/[slug]/page.tsx`에서 DealDetailClient(클라이언트) → `getDealBySlug`(서버사이드)로 변경
  - 원인: AuthProvider 싱글톤 Supabase 클라이언트가 auth lock을 잡고 있어 클라이언트 fetch가 영원히 대기
  - 해결: 풀페이지(`/d/[slug]`)와 동일한 서버사이드 방식으로 통일
- [x] **actions API metadata 제거** — `deal_actions` 테이블에 `metadata` 컬럼 없음 → API에서 metadata 필드 제거 (500 에러 해결)
- [x] **DealDetailClient 비활성화** — 모달/풀페이지 모두 서버사이드로 전환되어 더 이상 사용 안 함 (빌드 호환용 최소 파일 유지)

---

*마지막 업데이트: 2026-02-18 (모달 서버사이드 전환 + actions API metadata 수정)*
