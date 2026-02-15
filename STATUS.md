# POPPON 프로젝트 STATUS

## 프로젝트 개요
- **제품명**: POPPON (K-RetailMeNot)
- **기획서 버전**: v1.2.1
- **한줄 정의**: 한국의 모든 할인/쿠폰/프로모션을 한 곳에 모아 탐색 → 저장/구독/알림으로 DB 축적 → TargetUP-AI CRM 고단가 타겟마케팅으로 수익화
- **MVP 우선순위**: A(온라인 쿠폰/프로모션 코드) → B(앱쿠폰/링크형) → C(오프라인 이벤트)
- **핵심 방향**: 할인정보 모아서 DB 축적 → 수익화 (RetailMeNot 코드복사/캐시백 모델과 다름)
- **프로젝트 경로**: `C:\projects\poppon`
- **도메인**: `poppon.kr` (구매 완료, Vercel 연결 예정)

---

## ⚠️ 개발 원칙
> **절대 원칙**: 시키기 전에 코드/파일 만들지 않는다.
> 반드시 **기존 파일 파악 → 설계 의논 → 합의 후 구현** 순서.
> 기존 코드 망가뜨리지 않도록 현재 구조부터 확인한다.

---

## 📁 참조 파일 목록

### 컴포넌트 / UI
| 파일 | 경로 |
|------|------|
| DealCard.tsx | `src/components/deals/DealCard.tsx` |
| DealShelf.tsx | `src/components/deals/DealShelf.tsx` |
| DealGrid.tsx | `src/components/deals/DealGrid.tsx` |
| DealDetail.tsx | `src/components/deals/DealDetail.tsx` |
| DealModal.tsx | `src/components/deals/DealModal.tsx` |
| TopNav.tsx | `src/components/layout/TopNav.tsx` |
| Footer.tsx | `src/components/layout/Footer.tsx` |
| SourceProtection.tsx | `src/components/layout/SourceProtection.tsx` |

### 페이지
| 파일 | 경로 |
|------|------|
| 루트 레이아웃 | `src/app/layout.tsx` |
| 글로벌 CSS | `src/app/globals.css` |
| 미들웨어 | `src/middleware.ts` |
| 홈 | `src/app/page.tsx` |
| 검색 | `src/app/search/page.tsx` |
| 카테고리 | `src/app/c/[categorySlug]/page.tsx` |
| 브랜드관 | `src/app/m/[merchantSlug]/page.tsx` |
| 딜 상세 (모달) | `src/app/@modal/(.)d/[slug]/page.tsx` |
| 딜 상세 (풀페이지) | `src/app/d/[slug]/page.tsx` |
| 제보 | `src/app/submit/page.tsx` |
| 마이페이지 | `src/app/me/page.tsx` |
| 로그인 | `src/app/auth/page.tsx` |
| 어드민 로그인 | `src/app/admin/login/page.tsx` |
| 어드민 로그인 레이아웃 | `src/app/admin/login/layout.tsx` |

### 데이터 / 타입 / 유틸
| 파일 | 경로 |
|------|------|
| database.ts (타입) | `src/types/database.ts` |
| index.ts (re-export) | `src/types/index.ts` |
| deals.ts (데이터) | `src/lib/deals.ts` |
| format.ts (유틸) | `src/lib/utils/format.ts` |
| constants.ts | `src/lib/constants.ts` |
| Supabase 서버 | `src/lib/supabase/server.ts` |
| Supabase 브라우저 | `src/lib/supabase/client.ts` |

### 크롤러 / API
| 파일 | 경로 |
|------|------|
| AI 크롤 엔진 | `src/lib/crawl/ai-engine.ts` |
| 딜 저장 (upsert) | `src/lib/crawl/save-deals.ts` |
| Cron 배치 | `src/app/api/cron/crawl/route.ts` |
| AI 크롤 API (다중) | `src/app/api/admin/ai-crawl/route.ts` |
| AI 크롤 API (단일) | `src/app/api/admin/ai-crawl/[connectorId]/route.ts` |
| 제보 API | `src/app/api/submit/route.ts` |
| 클릭 트래킹 | `src/app/out/[dealId]/route.ts` |
| 어드민 인증 API | `src/app/api/admin/auth/route.ts` |

### 스크립트
| 파일 | 경로 | 설명 |
|------|------|------|
| 로고 수집 v4 (현용) | `scripts/fetch-logos-google-v4.ts` | 품질 기반 스마트 교체 + 백업/롤백 |
| 로고 수집 v3.1 | `scripts/fetch-merchant-logos-v3.ts` | Puppeteer DOM 파싱 |
| 로고 수집 v2 | `scripts/fetch-merchant-logos.ts` | HTTP apple-touch-icon |
| 구글 이미지 로고 (초기) | `scripts/fetch-logos-google.ts` | 구글 이미지 검색 |
| OG 이미지 수집 | `scripts/fetch-og-images.ts` | landing_url og:image 추출 |
| 크롤러 테스트 | `scripts/test-ai-crawl.ts` | 변경 감지 포함 v2 |
| 이벤트 페이지 탐지 | `scripts/detect-event-pages.ts` | 홈페이지→이벤트URL 자동 |

### 데이터 파일
| 파일 | 설명 |
|------|------|
| `poppon_brands_filtered.csv` | 브랜드 원본 494개 |
| `crawl-targets-final.csv` | 최종 크롤링 대상 187개 |
| `debug-ai-crawl/event-pages-detected.csv` | 이벤트 페이지 탐지 결과 |
| `debug-ai-crawl/crawl-targets.csv` | 이벤트 URL 확보 223개 |
| `debug-ai-crawl/logo-quality-check.csv` | 로고 품질 체크 264개 |
| `debug-ai-crawl/logo-results.csv` | 로고 교체 상세 93개 |
| `debug-ai-crawl/logo-backup.csv` | 로고 롤백용 백업 |

---

## 기술 스택
| 영역 | 기술 | 비고 |
|------|------|------|
| Frontend + Backend | **Next.js 15 (App Router)** | SSR/SSG, API Routes 통합 |
| Database + Auth | **Supabase (PostgreSQL)** | RLS, Phone OTP |
| 스타일링 | **Tailwind CSS + shadcn/ui** | Pretendard 폰트 |
| 상태관리 | **Zustand** | |
| 배포 | **Vercel** | Git push 자동, Cron Jobs |
| 검색 | **PostgreSQL ilike (pg_trgm)** | 추후 Elasticsearch |
| AI 크롤러 | **Puppeteer + Claude Haiku API** | 349개 커넥터, 월 1~5만원 |

---

## DB 스키마 (database.ts 기준)

### 테이블 전체 목록
| 테이블 | 구현 상태 | 데이터 | 설명 |
|--------|----------|--------|------|
| **deals** | ✅ 운영중 | ~1,500개+ | 딜 메인 테이블 |
| **merchants** | ✅ 운영중 | 283개 | 브랜드 (brand_color 264개) |
| **categories** | ✅ 운영중 | 12 대카테고리 | 셀프조인 (대/중/소) |
| **crawl_connectors** | ✅ 운영중 | 349개 | AI 크롤 대상 |
| **submissions** | ✅ 운영중 | 0개 | 유저 제보 (RLS 적용) |
| **outbound_clicks** | 🔸 테이블만 | 0개 | 클릭 트래킹 (**API 미구현**) |
| **affiliate_networks** | 🔸 테이블만 | 0개 | 제휴 네트워크 |
| **affiliate_offers** | 🔸 테이블만 | 0개 | 제휴 상품 |
| **affiliate_merchant_map** | 🔸 테이블만 | 0개 | 머천트↔제휴 매핑 |
| users | 🔸 스키마만 | 0개 | Supabase Auth 연동 예정 |
| saved_deals | 🔸 스키마만 | 0개 | 딜 저장 |
| follows | 🔸 스키마만 | 0개 | 머천트/카테고리 구독 |
| deal_feedbacks | 🔸 스키마만 | 0개 | 됨/안됨 피드백 |
| deal_actions | 🔸 스키마만 | 0개 | 뷰/클릭/복사/저장/공유 로그 |
| ad_campaigns | 🔸 스키마만 | 0개 | 광고 캠페인 |

### deals 테이블 상세
```
id                  uuid PK
merchant_id         uuid FK → merchants
category_id         uuid FK → categories (⚠️ !deals_category_id_fkey 명시 필요)
subcategory_id      uuid FK → categories (nullable, !deals_subcategory_id_fkey)

-- 기본 정보
title               varchar
description         text (nullable)
deal_type           'A1' | 'A2' | 'B' | 'C'
status              'pending' | 'active' | 'hidden' | 'expired'
channel             'online' | 'offline' | 'hybrid'

-- 혜택
benefit_tags        text[]  (percent_off, amount_off, bogo 등 11종)
benefit_summary     varchar ("최대 50% 할인")
coupon_code         varchar (nullable, A1 타입)
discount_value      numeric (nullable, % 또는 원)
discount_type       'percent' | 'amount' (nullable)

-- 가격 (A2 가격딜)
price               numeric (nullable)
original_price      numeric (nullable)
discount_rate       numeric (nullable)

-- 조건
conditions          jsonb   [{type, value, text}]
how_to_use          text (nullable)

-- 기간
starts_at           timestamptz (nullable)
ends_at             timestamptz (nullable)
is_evergreen        boolean

-- 출처/링크
source_type         'crawl' | 'brand' | 'user_submit' | 'affiliate' | 'admin'
source_url          text
landing_url         text
affiliate_url       text (nullable)
affiliate_disclosure boolean

-- 이미지
thumbnail_url       text (nullable)  ※ DealCard에서 미사용 (로고 중심)
og_image_url        text (nullable)

-- 점수/통계
quality_score       integer (0~100)
trending_score      integer
view_count          integer
click_out_count     integer
save_count          integer
feedback_work_count integer
feedback_fail_count integer

-- SEO
slug                varchar (한글 포함 → decodeURIComponent 필요)
meta_title          varchar (nullable)
meta_description    varchar (nullable)

-- 시간
created_at          timestamptz
updated_at          timestamptz
expired_at          timestamptz (nullable, 실제 만료 처리 시각)
```

### merchants 테이블 (283개)
```
id                  uuid PK
name                varchar
slug                varchar (영문: oliveyoung, innisfree)
logo_url            text (nullable) — 264개 고품질 확보
brand_color         varchar (nullable, #hex) — 264개 적용
description         text (nullable)
official_url        text (nullable) — 283개 전부 있음
category_ids        uuid[]
is_verified         boolean
follower_count      integer
active_deal_count   integer
created_at          timestamptz
updated_at          timestamptz
```

### categories 테이블 (12 대카테고리)
```
id                  uuid PK
parent_id           uuid (nullable, 셀프조인)
name                varchar (한글)
slug                varchar (영문)
description         text (nullable)
icon                varchar (nullable)
sort_order          integer
is_active           boolean
deal_count          integer
depth               integer (0=대, 1=중, 2=소)
created_at          timestamptz
```

**카테고리 slug 매핑**:
패션=fashion | 뷰티=beauty | 식품/배달=food | 생활/리빙=living | 디지털/가전=digital | 여행/레저=travel | 문화/콘텐츠=culture | 키즈/교육=kids | 건강/헬스=health | 반려동물=pets | 자동차/주유=auto | 금융/통신=finance

### DealCard 타입 (리스트용 경량)
```typescript
interface DealCard {
  id, title, benefit_summary, deal_type,
  merchant_name, merchant_logo_url, merchant_brand_color,
  category_name, thumbnail_url, coupon_code,
  discount_value, discount_type, price, original_price,
  ends_at, is_evergreen, benefit_tags, urgency_tags,
  quality_score, is_sponsored, affiliate_disclosure, slug
}
```
- `urgency_tags`: ending_soon_24h, ending_soon_3d, new_today, updated_today
- `is_sponsored`: 광고 딜 표시용 (ad_campaigns 연동 예정)

### 조인 관계
```
deals.merchant_id    → merchants.id
deals.category_id    → categories.id  (FK: deals_category_id_fkey)
deals.subcategory_id → categories.id  (FK: deals_subcategory_id_fkey)
categories.parent_id → categories.id  (셀프조인)
```
**⚠️ Supabase 조인 시**: `categories!deals_category_id_fkey(name)` FK 명시 필수

### RLS 정책
| 테이블 | SELECT | INSERT/UPDATE/DELETE |
|--------|--------|---------------------|
| deals | status = 'active' OR 'expired' | admin/super_admin만 |
| merchants | 전체 공개 | admin만 |
| categories | 전체 공개 | admin만 |
| submissions | auth.uid() = user_id | INSERT: 누구나 |

---

## 딜 만료 자동화

### 구현 방식 (2중 안전장치)
1. **쿼리 시점 필터링** (실시간 효과): `filterActiveDeals()` — `status='active' AND (ends_at IS NULL OR ends_at > now)`
   - 홈/검색 페이지에서 즉시 만료 딜 숨김 (DB status가 아직 active여도)
   - `src/lib/deals.ts`에서 export, 각 페이지에서 import
2. **Cron 일괄 전환** (상태 정합성): `expireOverdueDeals()` — 매일 06:00 KST 크롤 전 실행
   - `active` + `ends_at < now` → `status='expired'` + `expired_at=now` 기록
   - 브랜드관 "종료됨" 탭에 정확히 반영

### 비정상 날짜 방어
- `formatTimeRemaining()`: 1년+ 남은 ends_at → null 반환 (표시 안 함)
- `checkEndingSoon()`: 7일 이내만 "마감임박" 빨간 배지 표시

### 적용 현황
| 페이지 | filterActiveDeals 적용 | 비고 |
|--------|----------------------|------|
| 홈 (page.tsx) | ✅ | 트렌딩/신규 쿼리 |
| 검색 (search/page.tsx) | ✅ | 전체 검색 쿼리 |
| 카테고리 (c/page.tsx) | ⬜ 미적용 | 다음 작업에서 적용 |
| 브랜드관 (m/page.tsx) | ⬜ 미적용 | 다음 작업에서 적용 |

---

## 딜 타입 & 태그 체계

### 딜 타입
| 타입 | 설명 | CTA |
|------|------|-----|
| A1 | 쿠폰/프로모션 코드형 | CopyCodeButton + GoToSource |
| A2 | 가격딜/핫딜 (최저가/특가) | GoToSource (제휴링크) |
| B | 앱쿠폰/링크형 | GetCouponButton + GoToSource |
| C | 오프라인 이벤트 | StoreInfoPanel + GoToSource |

### 태그 체계
- **혜택 (benefit_tags)**: percent_off, amount_off, bogo, free_shipping, gift_with_purchase, bundle_deal, clearance, member_only, new_user, app_only, limited_time
- **긴급 (urgency_tags)**: ending_soon_24h, ending_soon_3d, new_today, updated_today
- **조건 (conditions)**: `[{type, value, text}]` — min_spend, excluded, max_qty 등
- **채널 (channel)**: online, offline, hybrid

---

## 프론트엔드 라우팅

```
src/app/
├── layout.tsx                          — modal parallel route slot
├── page.tsx                            — 홈
├── @modal/
│   ├── default.tsx                     — null
│   └── (.)d/[slug]/page.tsx            — 인터셉팅 모달
├── d/[slug]/page.tsx                   — SEO 풀페이지
├── m/[merchantSlug]/page.tsx           — 브랜드관
├── c/[categorySlug]/page.tsx           — 카테고리 허브
├── search/page.tsx                     — 검색 결과
├── submit/page.tsx                     — 유저 제보
├── me/page.tsx                         — 마이페이지
├── auth/page.tsx                       — 로그인/가입
├── admin/
│   ├── dashboard/                      — 통계
│   ├── deals/                          — 딜 CRUD
│   ├── merchants/                      — 머천트 CRUD
│   └── crawls/                         — AI 크롤 관리
```

- **딜 상세 하이브리드**: 리스트 클릭 → 모달 / 직접접속 → 풀페이지(SSR, SEO)
- **모달 내부 링크**: `isModal` prop → 모달일 때 `<a>` hard navigation (모달 확실히 닫힘), 풀페이지일 때 `<Link>` soft navigation
- **slug 규칙**: 딜=한글(decodeURIComponent 필요), 머천트/카테고리=영문
- **미들웨어**: `/brand/*` 로그인 필수, `/submit`·`/me`는 비로그인 허용

---

## API 구조

### ✅ 구현 완료
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET/POST | `/api/admin/ai-crawl` | AI 크롤 현황/다중 실행 |
| POST | `/api/admin/ai-crawl/[connectorId]` | 단일 AI 크롤 |
| GET | `/api/cron/crawl` | 일일 배치: ① 만료 전환 → ② 크롤링 (06:00 KST) |
| POST | `/api/submit` | 유저 제보 저장 |
| GET | `/out/[dealId]` | 클릭 트래킹 + 302 리다이렉트 |
| POST | `/api/admin/auth` | 어드민 비밀번호 인증 + 쿠키 |

### ⬜ 미구현 (설계만)
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/auth/phone/*` | 로그인 (Supabase OTP) |
| GET/PUT | `/me`, `/me/saved-deals`, `/me/follows/*` | 마이페이지 |
| POST | `/deals/:id/actions`, `/deals/:id/feedback` | 액션/피드백 로그 |
| * | `/brand/*` | 브랜드 포털 |
| * | `/admin/ads/*`, `/admin/affiliate/*` | 광고/제휴 관리 |

---

## 개발 Phase & 진행 상황

### Phase 0 — "딜이 쌓이고 검색이 되고 만료가 돈다"

**✅ 완료 요약**:
- DB 18개 테이블 + RLS + 12대 카테고리 시드 + 283 머천트 시드 (brand_color 264개)
- 사용자 웹 전체: 홈(DB연결) / 검색(ilike+필터+정렬) / 카테고리(그라디언트+서브칩) / 딜상세(하이브리드 모달) / 브랜드관(구독UI) / 제보 / 마이페이지(UI shell) / 로그인(UI only)
- 컴포넌트: DealCard v4.2 / DealShelf / DealGrid / DealDetail / DealModal / CopyCodeButton / Pagination / SortDropdown / SearchFilters / SearchInput / SubCategoryChips / MerchantDealTabs
- 어드민: dashboard / deals CRUD / merchants CRUD / crawls (배치+단일+로그)
- AI 크롤러: 272/349 성공, 1,500개+ 딜, Vercel Cron 설정 완료
- 머천트 로고: 264개 전체 고품질 확보 (v2→v3.1→v4 단계적 수집)
- **만료 자동 전환**: Cron 일괄 전환 + 쿼리 시점 filterActiveDeals 2중 구현
- **홈 toDealCard 중복 제거**: page.tsx 로컬 정의 → `deals.ts` 공용 함수 통합
- **홈 브랜드 다양성**: 브랜드당 최대 1개로 변경 (기존 2개 → 삼성닷컴/SSG 중복 해소)
- **검색 카테고리 카운트**: categories.deal_count(항상 0) → active 딜 실제 집계
- **마감임박 비정상 날짜 방어**: 1년+ 남은 딜 → 마감임박 배지/시간 표시 안 함
- **모달 내부 링크 수정**: 브랜드명 클릭 시 `<a>` hard navigation → 모달 확실히 닫힘
- **클릭 트래킹**: `/out/[dealId]` → outbound_clicks INSERT + click_out_count 증가 + 302 리다이렉트 (fire-and-forget)
- **DealCard title 메인 변경**: benefit_summary 메인 → `title || benefit_summary` 순서로 변경, 그리드=title만, 리스트=title+서브
- **어드민 비밀번호 보호**: middleware로 `/admin/*` 쿠키 체크 → `/admin/login` 리다이렉트 (7일 유효)
- **소스 보호**: SourceProtection 컴포넌트 — 우클릭/F12/Ctrl+U 차단 (프로덕션만 작동)

**⬜ 미완료**:
| 항목 | 우선순위 | 비고 |
|------|----------|------|
| **전체 모바일 반응형** | 🔴 높음 | 배포 전 필수, 아래 작업 가이드 참조 |
| filterActiveDeals 카테고리/브랜드관 적용 | 🟡 중간 | 홈/검색만 적용 완료 |
| 중복 merchant 정리 | 🟡 중간 | 올리브영 2개 등 (분석 완료, 실행 미착수) |
| /legal/* 약관/개인정보 | 🟠 낮음 | |
| 제휴 네트워크 API 연동 | 🟠 낮음 | |
| 유저 제보 자동 파싱 | 🟠 낮음 | |
| SEO: expired noindex 처리 | 🟠 낮음 | |

### Phase 1 — "수급 자동화 + 품질 루프"
| 항목 | 상태 |
|------|------|
| 크롤링 349개 커넥터 전체 실행 | ✅ 272/349 성공 |
| Vercel Cron 자동 배치 | ✅ 설정 완료 (배포 후 활성화) |
| 유저 제보 → 자동 파싱 → 승인 | 🔸 제보 저장만 완료 |
| 품질점수 반영 (실패율 기반) | ⬜ |
| DeepLink API | ⬜ |
| 하루 4회 배치 + 리포트 | ⬜ |

### Phase 2 — "브랜드 포털 + 광고"
전부 미착수: 브랜드 포털 / 스폰서 슬롯 / 성과 정산

---

## 🔥 다음 작업 (우선순위)

### 🎯 즉시 — 모바일 반응형 + 배포
1. **전체 모바일 반응형 정리** — 아래 작업 가이드 참조
2. **Vercel 배포** — `.vercel.app` 도메인으로 우선 배포, Cron 동작 확인
3. **poppon.kr 도메인 연결** — 도메인 구매 완료

### 우선순위 1: 배포 후 보강
4. **filterActiveDeals 나머지 적용** — 카테고리/브랜드관 페이지
5. **Supabase RPC 함수 생성** — `increment_click_out_count` (클릭 트래킹용, SQL 에디터에서 실행)
6. **중복 merchant 정리** — 올리브영 등 합치기

### 우선순위 2: 사용자 기능
7. **회원가입/로그인** — Supabase Phone OTP
8. **홈 섹션 확장** — 카테고리별 섹션, "더보기"

### 우선순위 3: 법률/정책
9. /legal/* 약관/개인정보
10. 제휴 라벨 표기 정책

---

## 📱 모바일 반응형 작업 가이드

### 필요 파일 (새 채팅에서 요청)
| # | 파일 | 경로 | 용도 |
|---|------|------|------|
| 1 | page.tsx | `src/app/page.tsx` | 홈 |
| 2 | search/page.tsx | `src/app/search/page.tsx` | 검색 |
| 3 | c/[categorySlug]/page.tsx | `src/app/c/[categorySlug]/page.tsx` | 카테고리 |
| 4 | m/[merchantSlug]/page.tsx | `src/app/m/[merchantSlug]/page.tsx` | 브랜드관 |
| 5 | d/[slug]/page.tsx | `src/app/d/[slug]/page.tsx` | 딜 상세 풀페이지 |
| 6 | @modal/(.)d/[slug]/page.tsx | `src/app/@modal/(.)d/[slug]/page.tsx` | 딜 상세 모달 |
| 7 | DealShelf.tsx | `src/components/deals/DealShelf.tsx` | 가로 스크롤 셸프 |
| 8 | DealGrid.tsx | `src/components/deals/DealGrid.tsx` | 그리드 레이아웃 |
| 9 | DealModal.tsx | `src/components/deals/DealModal.tsx` | 모달 래퍼 |
| 10 | TopNav.tsx | `src/components/layout/TopNav.tsx` | 상단 네비게이션 |
| 11 | globals.css | `src/app/globals.css` | Tailwind 커스텀 |

### 반응형 핵심 포인트
- 쿠폰/할인 앱 사용자 80%+ 모바일 → 모바일 퍼스트 필수
- DealCard.tsx는 이미 반응형 기본 대응 (v4.2)
- DealDetail.tsx도 기존에 받은 파일 있음
- 주요 작업: 페이지 레이아웃 + 그리드 컬럼 + 네비게이션 + 모달 크기 조정
- PWA/웹뷰 앱 전환 시 모바일 반응형이면 거의 그대로 앱이 됨

---

## AI 크롤러

### 아키텍처
```
브랜드 URL (187개 확정)
  → Puppeteer 렌더링 → 해시 비교 (변경분만)
    → Claude Haiku API 파싱 → 딜 JSON
      → save-deals.ts (upsert + 중복체크 + 슬러그 + 태그매핑)
```
전략 변천: static_html 파싱(실패) → API 직접(비현실적) → **Puppeteer+AI(채택)**

### 실적
| 항목 | 수치 |
|------|------|
| 대상 커넥터 | 349개 |
| 성공률 | 272/349 (78%) |
| 신규 딜 | 773개 |
| 업데이트 딜 | 807개 |
| 비용 | $4.32 (1회 전체) |
| 월 예상 (변경감지 적용) | ~$7 (1만원) |

### 배치 스케줄
- **현재**: Vercel Cron 하루 2회 (06:00, 18:00 KST) — ① 만료 전환 → ② 크롤링
- **추후**: 06:00 / 12:00 / 18:00 / 23:00
- **순서**: ① Expire → ② Affiliate Ingest → ③ Crawl → ④ Quality → ⑤ 리포트
- **비용**: 변경감지 적용 시 월 $10-12 (1.5만원) 예상

### 환경변수
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=POPPON
ANTHROPIC_API_KEY=sk-ant-api03-... (poppon 전용 Haiku 키)
ADMIN_SECRET=... (어드민 로그인 비밀번호)
CRON_SECRET=... (Vercel Cron 인증용)
```
※ `poppon` 키와 `harold-onboardi...` 키(한줄로AI용) 분리 관리

---

## 브랜드 리스트 현황
| 항목 | 수량 |
|------|------|
| 조사 원본 (Gemini) | 601개 |
| 1차 필터 (명품/K-pop 등 제거) | 494개 |
| 이벤트 URL 자동 탐지 | 223개 |
| **최종 크롤링 대상** | **187개** |
| DB merchants | 283개 |
| DB connectors | 349개 |

제외 기준: 명품(49), K-pop(20), 제약(27), 해외전용(11), 게임사, 하드웨어, 중복URL

---

## DealCard v4.2 (현재 적용)
- **배경**: 전부 흰색, brand_color는 호버/배지 액센트에만 사용
- **로고**: `onLoad` → `naturalWidth/naturalHeight` 비율 체크 → 동적 사이즈
  - wide (비율>2): 180×56px — 텍스트 로고
  - normal (0.8~2): 100×100px — 일반 로고
  - tall (<0.8): 72×100px — 세로 로고
  - fallback: 이니셜 + brand_color 15% 틴트 배경
- **호버**: brand_color 테두리 + shadow-md
- **쿠폰 점선**: 반원 노치, 호버 시 border 색상 동기화
- **할인 배지**: Flame 아이콘 + brand_color 배경
- **쿠폰 버튼**: `bg-surface-900 rounded-full`
- **마감임박 배지**: 7일 이내만 표시 (1년+ 비정상 날짜 방어)
- **시간 표시**: 1년+ → 숨김, 30일~1년 → 연도 포함, 7일 이내 → "N일 남음"

---

## 머천트 로고 현황
- **264개 전체 고품질 확보** (283개 중 19개는 딜 없는 머천트)
- 수집 경로: v2(HTTP) → v3.1(Puppeteer) → v4(품질체크+구글검색 교체 93개)
- **v4 스크립트 사용법**:
```bash
npx ts-node scripts/fetch-logos-google-v4.ts --check-only  # 품질 체크
npx ts-node scripts/fetch-logos-google-v4.ts --dry-run     # 미리보기
npx ts-node scripts/fetch-logos-google-v4.ts               # 실행
npx ts-node scripts/fetch-logos-google-v4.ts --rollback    # 롤백
```

---

## 수급 트랙
| 트랙 | 설명 | Phase | 상태 |
|------|------|-------|------|
| A) 크롤링 | Puppeteer+AI 자동 수급 | Phase 0~1 | ✅ 운영중 |
| B) 브랜드 포털 | 브랜드 셀프 업로드 | Phase 2 | ⬜ |
| C) 유저 제보 | URL 제출 → 파싱 → 승인 | Phase 1 | 🔸 저장만 |
| F) 제휴 API | 링크프라이스 등 핫딜 | Phase 0 | ⬜ |

---

## TargetUP-AI 연동 (수익화)
- **데이터**: phone_hash, marketing_opt_in, 관심 카테고리/브랜드, 최근 30/60/90일 행동
- **연동**: 일 배치 — segments_daily 테이블 동기화
- **세그먼트 예시**: beauty_skin_30d_active, food_delivery_high_intent

---

## 운영 정책
- 출처/공식링크 항상 표시, 이미지는 썸네일/OG 수준
- 크롤링: robots 존중, 실패 3회 → 자동 비활성화
- 만료: 자동 expired 전환 (Cron + 쿼리 필터 2중), SEO 7~30일 유지 후 noindex
- 품질: 안됨 30%↑ → 검수, 50%↑ → 숨김
- 광고: 스폰서 라벨 필수
- 개인정보: 마케팅 동의 기록, 철회 즉시 반영

---

## 알려진 이슈 / 기술 메모
- **한글 slug**: `decodeURIComponent()` 필수 (deals.ts 적용 완료)
- **Supabase 조인**: deals→categories FK 2개 → `!deals_category_id_fkey` 명시
- **PowerShell**: `[slug]` 폴더 → 백틱 이스케이프, UTF-8 → `[System.IO.File]::WriteAllText()` 사용
- **brand_color**: W3C 휘도 기준 흰/검 텍스트 자동 결정
- **thumbnail_url**: DealCard에서 미사용 (로고 중심 디자인)
- **머천트/카테고리 slug**: 전부 영문 (innisfree, beauty)
- **중복 merchant**: 올리브영/올리브영(건강식) 등 정리 필요
- **Puppeteer**: `waitForTimeout` 제거됨 → `new Promise(r => setTimeout(r, ms))`
- **모달 내부 링크**: Next.js intercepting route에서 `<Link>` soft navigation → 모달 slot 리셋 안 됨. 모달에서는 `<a>` hard navigation 사용
- **categories.deal_count**: DB 값이 항상 0 → 검색 페이지에서 active 딜 실제 집계로 대체
- **클릭 트래킹 RPC**: Supabase SQL Editor에서 `increment_click_out_count` 함수 생성 필요 (아직 미실행)
```sql
CREATE OR REPLACE FUNCTION increment_click_out_count(deal_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE deals SET click_out_count = click_out_count + 1 WHERE id = deal_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
- **어드민 보호**: middleware.ts에서 `/admin/*` 쿠키 체크, `/admin/login`은 예외 처리. 환경변수 변경 후 서버 재시작 필수
- **소스 보호 한계**: Next.js App Router의 RSC payload는 완전히 숨길 수 없음. 일반 사용자 99% 차단용
- **DealCard title 순서**: `deal.title || deal.benefit_summary` — title이 메인, benefit_summary가 fallback

---

## 분석 이벤트 (필수 수집)
deal_view, deal_click_out, deal_copy_code, deal_save, merchant_follow, category_follow, deal_feedback_work/fail, search_performed, signup_start/complete, marketing_opt_in_on/off, digest_sent

---

## 채팅 히스토리
| 채팅 | 날짜 | 주요 내용 |
|------|------|-----------|
| 팝폰-웹사이트개발시작 | 2/14 | DB 스키마, 어드민, 크롤러 엔진 기초 |
| 팝폰-크롤링에대한고민 | 2/14 | Puppeteer+AI 전략 확정, 이벤트 페이지 탐지 |
| 팝폰-크롤링완료 | 2/14 | 1차 90개 크롤링, 455개 딜, save-deals.ts |
| 팝폰-상세 개발 페이지 등 | 2/15 | 홈 DB연결, 딜상세 모달, 로고수집 v2, DealCard v1 |
| 팝폰-브랜드관 등 기타 | 2/15 | 브랜드관/검색/카테고리/크롤UI/Cron/제보/마이페이지 |
| 팝폰-중복제거 및 로고 | 2/15 | DealCard 리디자인, 중복 merchant 분석, 개발 원칙 |
| 팝폰-스테이터스 정리 | 2/15 | STATUS.md 전면 정리 |
| 팝폰-DealCard+로고 | 2/15 | brand_color, DealCard v3, 로고 v3.1, KEETSA 스타일 |
| 팝폰-DealCard v4+로고v4 | 2/16 | DealCard v4.2, 로고 v4 93/93 교체 |
| 팝폰-STATUS+만료+버그 | 2/16 | STATUS 재편, 만료 자동화, 버그 4건 수정 (마감임박/모달/중복/카운트) |
| 팝폰-클릭트래킹+어드민+배포준비 | 2/16 | 클릭트래킹 API, DealCard title 변경, 어드민 비번보호, 소스보호, 모바일 반응형 설계 |

---

*마지막 업데이트: 2026-02-16 (클릭트래킹 + 어드민 보호 + 소스보호 + DealCard title 변경 + 모바일 반응형 작업 가이드)*
