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
| Database + Auth | **Supabase (PostgreSQL)** | RLS, OAuth (카카오/네이버/애플) |
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
| DealDetailClient.tsx | `src/components/deal/DealDetailClient.tsx` |
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
| 딜 상세 (모달) | `src/app/@modal/(.)d/[slug]/page.tsx` |
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
| MerchantForm.tsx | `src/components/admin/MerchantForm.tsx` ✅ v4 (커넥터 자동생성) |

#### 페이지
| 파일 | 경로 |
|------|------|
| 루트 레이아웃 | `src/app/layout.tsx` |
| 미들웨어 | `src/middleware.ts` (비밀번호 보호) |
| 로그인 | `src/app/login/page.tsx` |
| 대시보드 | `src/app/(dashboard)/page.tsx` |
| 대시보드 레이아웃 | `src/app/(dashboard)/layout.tsx` |
| 딜 목록/생성/수정 | `src/app/(dashboard)/deals/` |
| 머천트 목록/생성/수정 | `src/app/(dashboard)/merchants/` |
| 회원 목록 | `src/app/(dashboard)/members/page.tsx` |
| 회원 상세 | `src/app/(dashboard)/members/[id]/page.tsx` |
| 크롤 모니터링 | `src/app/(dashboard)/crawls/page.tsx` ✅ v4 (타입 필터) |
| 크롤 이력 | `src/app/(dashboard)/crawl-history/page.tsx` |

#### API (어드민 앱)
| 파일 | 경로 |
|------|------|
| 어드민 인증 | `src/app/api/auth/route.ts` |
| 딜 CRUD | `src/app/api/deals/route.ts` + `[id]/route.ts` ✅ FK 명시 |
| 머천트 CRUD | `src/app/api/merchants/route.ts` + `[id]/route.ts` ✅ v4 (커넥터 자동생성) |
| 대시보드 경량 | `src/app/api/dashboard/route.ts` ✅ active/expired/pending 분리 |
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
| AI 크롤 엔진 (v4) | `src/lib/crawl/ai-engine.ts` ✅ 타입별 프롬프트 |
| 딜 저장 (v2.1) | `src/lib/crawl/save-deals.ts` ✅ tokens_used 저장 |
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
`POST /api/auth`, CRUD: `/api/deals`, `/api/merchants` (커넥터 자동생성), `GET /api/dashboard` (경량 count), `GET|PATCH /api/members` + `GET /api/members/:id`, `GET|POST /api/ai-crawl`, `GET /api/crawl-history`, `GET /api/cron/crawl` (3-batch, single 제외), `GET /api/cron/expire`

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

### 데이터 현황 (2/17 야간 기준)
| 항목 | 수치 |
|------|------|
| 브랜드 (merchants) | 339개 (전원 로고+brand_color) |
| 딜 (deals) | 1,064 전체 (active 871 / expired 193 / hidden 0) |
| 커넥터 (crawl_connectors) | 256 active / 171 disabled / 0 error |
| 커넥터 타입 | list 413 / naver_brand 1 / single 0 |
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

### merchants 테이블 (~339개)
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
- **crawl_runs**: id, connector_id, status(running/success/partial/failed), new/updated/expired_count, error_message, started_at, completed_at, tokens_used(2/17 추가)
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

## AI 크롤러 v4 (커넥터 타입 시스템)

### 아키텍처
```
커넥터 URL → Puppeteer (이미지 차단, 15s) → MD5 해시 비교
  → 변경 없음 → 스킵 | 변경 있음 → Claude Haiku 파싱 → save-deals v2.1 (URL+title 중복체크) → hash 저장
  → single 타입: 해시 스킵, 성공 후 자동 disabled
```

### 커넥터 타입 체계 (v4 신규)
| 타입 | 설명 | Cron | 성공 후 | 해시체크 | 프롬프트 |
|------|------|------|--------|---------|---------|
| `list` | 이벤트 목록 페이지 | ✅ 매일 | active 유지 | ✅ | 여러 딜 추출 |
| `single` | 개별 이벤트 URL | ❌ 제외 | **auto disabled** | ❌ (1회성) | 딜 1개만 분석 |
| `naver_brand` | 네이버 브랜드스토어 | ✅ 매일 | active 유지 | ✅ | 여러 딜 추출 (향후 전용 파서) |

### 브랜드 등록 → 커넥터 자동생성
```
MerchantForm에서 이벤트 URL 입력
  → brand.naver.com 감지 → naver_brand 자동선택
  → 그 외 → list/single 라디오 선택
  → merchants API POST → 머천트 생성 + crawl_connectors INSERT
  → 중복 URL 체크 (이미 있으면 스킵)
```

### 비용/성과
- 전략 변천: static_html(실패) → API 직접(부분성공) → **Puppeteer+AI** ✅ 최종
- 비용: 현재 ~150개 첫 크롤 ~$3, 이후 월 ~$15 (해시 스킵)
- 로고: v2(HTTP)+v3.1(Puppeteer)+구글이미지 수집, 수동 34종 교체 완료

---

## TargetUP-AI 연동 / 운영 정책 / 분석

- **TargetUP-AI**: phone_hash, marketing_opt_in, 관심카테고리/브랜드, 최근 행동 요약 → segments_daily 배치 동기화
- **운영 정책**: 출처 항상 표시, robots 존중, 실패 3회→비활성, 만료 자동 전환, 광고 스폰서 라벨 필수
- **분석 이벤트**: deal_view/click_out/copy_code/save, merchant_follow, search_performed, signup_start/complete, marketing_opt_in

---

## 개발 Phase
- **Phase 0** ✅ 완료: DB 18테이블+RLS, 전체 페이지, 어드민, AI 크롤러 v3, Vercel 배포
- **Phase 1** ✅ 거의 완료: 크롤러 v4(타입시스템)+만료+디자인+회원+브랜드 확장+어드민 분리+딜 정리
- **Phase 2** 미착수: 도메인 연결 / 링크프라이스 제휴 / 브랜드 포털 / 스폰서 슬롯 / 성과 정산

---

## 🖥️ 인프라 설계 (확정 2/17)
- **현재**: Vercel Pro ($20/월 × 2) + Supabase Pro ($25/월) = **$65/월 (약 9만원)**
  - 메인+어드민: Vercel (서울 icn1)
  - DB: Supabase Pro (200 동시커넥션, 8GB, 일 7회 백업, **서울 ap-northeast-2**)
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
- ⚠️ 일부 구글 이미지 로고 품질 낮음 (34개 교체 완료, 나머지 진행 중)

### 즉시 (Phase 1 마무리)
- **도메인**: 가비아 DNS 설정 (A: @→76.76.21.21, CNAME: www→cname.vercel-dns.com, admin→별도)
- **크롤 테스트**: v4 엔진 단일 커넥터 실행 확인
- **어드민**: 딜 관리 수정 링크 경로 확인 (`/deals/${id}/edit`)

### 단기 (Phase 2)
- **링크프라이스**: 제휴 API 연동 → `source_type: 'affiliate'` + `affiliate_url` 필드 활용
- **회원**: 애플 OAuth, KMC 본인인증, 카카오 알림톡, 검색 trackSearch 연동
- **어드민**: 탈퇴 30일 자동 삭제 Cron
- **크롤러**: naver_brand 전용 파서 (구조 통일, API 비용 0원 가능)
- **크롤러**: single 타입 처리 로직 검증 + 유저 제보(/submit) → single 커넥터 자동 생성

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
- 로고 수동교체: `public/logos/` + DB logo_url 동시 업데이트 필요
- CategoryGrid/CategoryTabBar: 'use client', CategoryIcon은 color prop만
- **PowerShell**: Set-Content 인코딩 → node 스크립트 권장, [id] 폴더 → `-LiteralPath` 필수
- **어드민 tsconfig.json**: `"exclude": ["node_modules", "scripts"]`
- **Supabase API Keys**: 레거시 Disabled → sb_publishable_/sb_secret_ 사용. 양쪽 .env.local + Vercel 모두 신규 키
- **Supabase client.ts 싱글톤**: `createClient()` 함수 사용 필수. `createBrowserClient()` 직접 호출 금지
- **Vercel Function Region**: 메인+어드민 둘 다 서울(icn1) 설정 완료. 리전 변경 후 Redeploy 필요
- **DealDetailClient 캐시**: 메모리(클라이언트) 한정, 새로고침 시 초기화
- **AuthProvider TOKEN_REFRESHED**: fetchProfile 절대 금지 → 무한루프. `profileLoadedForRef`로 방지
- **로그아웃**: 서버 사이드 API(`/api/auth/signout`) 필수. `<a>` 태그 사용
- **설정 탭 public 데이터**: Supabase REST API 직접 호출 (`fetch + apikey 헤더`)
- **Toast 시스템**: sessionStorage('poppon_pending_toast') → layout mount 시 표시
- **Puppeteer 서버리스**: `puppeteer-core` + `@sparticuz/chromium` 필수
- **Vercel 배치 크롤 타임아웃**: 3-batch 분할 + 250초 타임아웃으로 해결
- **카카오 OAuth**: REST API Key `83c8e501803f831f075f7c955d91a000`, 도메인 변경 시 카카오 포털 동기화
- **openAuthSheet 타입**: `(initialStepOrEvent?: AuthSheetStep | unknown) => void`
- **profiles.phone**: UNIQUE 해제됨. KMC 연동 시 재적용 검토
- **Cron 3-batch**: 커넥터 이름순 정렬 → 3등분, 250초 초과 시 스킵. **v4: single 타입 자동 제외**
- **DealModal 스크롤**: `position: fixed` + `top: -scrollY` 패턴 필수
- **crawl_runs.tokens_used**: 2/17 추가. save-deals.ts completeCrawlRunLog에서 저장
- **어드민 Supabase 타입 추론**: Generated Types 없이 `let _supabase: any` + `createClient<any>()` 사용. server.ts는 기존 `createServerClient` 유지
- **어드민 N+1 쿼리**: 회원 목록 개별 `getUserById()` 금지 → `auth.admin.listUsers()` 배치 필수
- **네이버 OAuth**: 수동 플로우 `/api/auth/naver` + `/auth/callback/naver`. `updateUserById` 사용 필수 (updateUser 아님). 환경변수 `NAVER_CLIENT_ID/SECRET` — poppon만
- **어드민 딜 목록 0개 버그**: `/api/deals` categories 조인 FK 미명시 → `categories!deals_category_id_fkey` 필수 (2/17 수정)
- **어드민 대시보드 marketing_opt_in**: 실제 컬럼명 `marketing_agreed`로 수정 (2/17)
- **deals 삭제 시 FK**: outbound_clicks → deal_actions → saved_deals 순서로 먼저 삭제 필요
- **hidden 딜 대정리**: 931개 중 금융 제외 849개 active 전환, 나머지 삭제 (2/17). 최종 active 871개
- **커넥터 타입 컬럼**: `crawl_connectors.connector_type` DEFAULT 'list'. 기존 전부 list, naver URL은 naver_brand로 자동 분류
- **single 커넥터**: 크롤 성공 시 자동 `status: 'disabled'`. Cron에서 제외. 해시 체크 안 함

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
| **팝폰-딜버그수정+커넥터타입v4+딜정리** | **2/17** | **딜 목록 FK 수정, 대시보드 active/expired 분리, 커넥터 타입 시스템(list/single/naver_brand), hidden 931개 정리→active 871개, 브랜드 등록 커넥터 자동생성** |

---

### 딜 버그 수정 + 커넥터 타입 v4 + 딜 정리 (2/17 야간)
- [x] 딜 목록 0개 버그 — `/api/deals` categories 조인 FK 명시 (`categories!deals_category_id_fkey`)
- [x] 대시보드 지표 개선 — active/expired/pending 분리, `marketing_opt_in` → `marketing_agreed` 수정
- [x] 딜 관리 수정 링크 경로 — `/admin/deals/${id}/edit` → `/deals/${id}/edit`
- [x] pending 327개 → active 전환 + 만료 57개 → expired + 파싱 오류 10개 → hidden
- [x] 커넥터 타입 시스템 v4 — `connector_type` 컬럼 추가 (list/single/naver_brand)
- [x] AI 엔진 v4 — single 전용 프롬프트, single 해시 스킵, single 성공 후 auto disabled
- [x] Cron v4 — `.in('connector_type', ['list', 'naver_brand'])` single 자동 제외
- [x] 브랜드 등록 폼 — 이벤트 URL 입력 → 커넥터 자동 생성 (naver 자동감지)
- [x] 크롤 모니터링 — 타입 컬럼 + 타입별 필터 드롭다운
- [x] hidden 931개 대정리 — 금융 7브랜드 제외 → 849개 active 전환 → 나머지 삭제 (FK 제약 해결)
- [x] 최종 상태: active 871 / expired 193 / hidden 0 / 전체 1,064

---

*마지막 업데이트: 2026-02-17 야간 (커넥터 타입 v4 + 딜 대정리 + 브랜드 등록 커넥터 자동생성)*
