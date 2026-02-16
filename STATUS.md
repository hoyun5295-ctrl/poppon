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

## 수급 트랙 (D' = A + B + C + F)
| 트랙 | 설명 | Phase |
|------|------|-------|
| A) 크롤링 | 커넥터 기반 자동 수급 | Phase 1 |
| B) 브랜드 포털 | 브랜드 셀프 업로드 | Phase 2 |
| C) 유저 제보 | 링크 제출 → 파싱 → 승인 | Phase 1 |
| F) 제휴 네트워크 API | 링크프라이스 등 핫딜/딥링크 | Phase 0 병행 |

---

## 🚨 새 채팅 시작 시 확인

### SQL 체크 (문제 있을 때만 실행)
```sql
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

-- 커넥터 현황
SELECT status, COUNT(*) FROM crawl_connectors GROUP BY status;

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
| **TopProgressBar.tsx** | `src/components/layout/TopProgressBar.tsx` ✅ 신규 |
| **Toast.tsx** | `src/components/common/Toast.tsx` ✅ 신규 |
| **AuthSheet.tsx** | `src/components/auth/AuthSheet.tsx` ✅ 신규 |
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
| 글로벌 CSS | `src/app/globals.css` (fade-in + toast 애니메이션 추가) |
| 미들웨어 | `src/middleware.ts` |
| 홈 | `src/app/page.tsx` |
| **홈 로딩** | `src/app/loading.tsx` ✅ 신규 |
| 검색 | `src/app/search/page.tsx` |
| **검색 로딩** | `src/app/search/loading.tsx` ✅ 신규 |
| 카테고리 | `src/app/c/[categorySlug]/page.tsx` |
| **카테고리 로딩** | `src/app/c/[categorySlug]/loading.tsx` ✅ 신규 |
| 브랜드관 | `src/app/m/[merchantSlug]/page.tsx` |
| **브랜드관 로딩** | `src/app/m/[merchantSlug]/loading.tsx` ✅ 신규 |
| 딜 상세 (모달) | `src/app/@modal/(.)d/[slug]/page.tsx` |
| 딜 상세 (풀페이지) | `src/app/d/[slug]/page.tsx` |
| 제보 | `src/app/submit/page.tsx` |
| 마이페이지 | `src/app/me/page.tsx` ✅ 데이터 연동 + 관심카테고리/추천브랜드 설정 |
| **마이 로딩** | `src/app/me/loading.tsx` ✅ 신규 |
| 로그인 | `src/app/auth/page.tsx` ✅ 바텀시트 연동 |
| OAuth 콜백 | `src/app/auth/callback/route.ts` ✅ 신규 |

#### 데이터 / 타입 / 유틸 / 인증
| 파일 | 경로 |
|------|------|
| database.ts (타입) | `src/types/database.ts` ✅ Profile, SavedDeal 등 추가 |
| index.ts (re-export) | `src/types/index.ts` |
| deals.ts (데이터) | `src/lib/deals.ts` |
| tracking.ts (행동추적) | `src/lib/tracking.ts` |
| format.ts (유틸) | `src/lib/utils/format.ts` |
| constants.ts | `src/lib/constants.ts` |
| **AuthProvider.tsx** | `src/lib/auth/AuthProvider.tsx` ✅ 신규 |
| Supabase 서버 | `src/lib/supabase/server.ts` |
| Supabase 브라우저 | `src/lib/supabase/client.ts` ✅ 싱글톤 패턴 적용 |

#### API (메인 앱)
| 파일 | 경로 |
|------|------|
| 제보 API | `src/app/api/submit/route.ts` |
| 행동추적 API | `src/app/api/actions/route.ts` |
| 클릭 트래킹 | `src/app/out/[dealId]/route.ts` |
| **딜 저장 API** | `src/app/api/me/saved-deals/route.ts` ✅ 신규 |
| **브랜드 구독 API** | `src/app/api/me/follows/merchants/route.ts` ✅ 신규 |
| **계정 탈퇴 API** | `src/app/api/me/delete-account/route.ts` ✅ 신규 |
| **검색 로그 API** | `src/app/api/actions/search/route.ts` ✅ 신규 |

### 🔴 poppon-admin (어드민 앱)

#### 페이지
| 파일 | 경로 |
|------|------|
| 루트 레이아웃 | `src/app/layout.tsx` |
| 글로벌 CSS | `src/app/globals.css` |
| 미들웨어 | `src/middleware.ts` (비밀번호 보호) |
| 로그인 | `src/app/login/page.tsx` |
| 대시보드 | `src/app/(dashboard)/page.tsx` |
| 대시보드 레이아웃 | `src/app/(dashboard)/layout.tsx` ✅ 경로 수정 완료 |
| 딜 목록 | `src/app/(dashboard)/deals/page.tsx` |
| 딜 생성 | `src/app/(dashboard)/deals/new/page.tsx` |
| 딜 수정 | `src/app/(dashboard)/deals/[id]/edit/page.tsx` |
| 머천트 목록 | `src/app/(dashboard)/merchants/page.tsx` |
| 머천트 생성 | `src/app/(dashboard)/merchants/new/page.tsx` |
| 머천트 수정 | `src/app/(dashboard)/merchants/[id]/edit/page.tsx` |
| 크롤 모니터링 | `src/app/(dashboard)/crawls/page.tsx` |
| **회원 목록** | `src/app/(dashboard)/members/page.tsx` ✅ 신규 |
| **회원 상세** | `src/app/(dashboard)/members/[id]/page.tsx` ✅ 신규 |

#### API (어드민 앱)
| 파일 | 경로 |
|------|------|
| 어드민 인증 | `src/app/api/auth/route.ts` |
| 딜 CRUD | `src/app/api/deals/route.ts` |
| 딜 단일 | `src/app/api/deals/[id]/route.ts` |
| 머천트 CRUD | `src/app/api/merchants/route.ts` |
| 머천트 단일 | `src/app/api/merchants/[id]/route.ts` |
| AI 크롤 (배치) | `src/app/api/ai-crawl/route.ts` |
| AI 크롤 (단일) | `src/app/api/ai-crawl/[connectorId]/route.ts` |
| Cron 크롤 | `src/app/api/cron/crawl/route.ts` |
| Cron 만료 | `src/app/api/cron/expire/route.ts` |
| **회원 목록 API** | `src/app/api/members/route.ts` ✅ 신규 |
| **회원 상세 API** | `src/app/api/members/[id]/route.ts` ✅ 신규 |

#### 크롤러 / 스크립트 (어드민에만 존재)
| 파일 | 경로 | 설명 |
|------|------|------|
| AI 크롤 엔진 (v3) | `src/lib/crawl/ai-engine.ts` | Puppeteer + Claude Haiku |
| 딜 저장 (v2) | `src/lib/crawl/save-deals.ts` | URL+title 중복체크 |
| 크롤러 테스트 | `scripts/test-ai-crawl.ts` | 변경 감지 포함 v2 |
| 이벤트 페이지 탐지 | `scripts/detect-event-pages.ts` | 홈페이지→이벤트URL 자동 찾기 |
| 머천트 로고 v2 | `scripts/fetch-merchant-logos.ts` | HTTP apple-touch-icon 수집 |
| 머천트 로고 v3.1 | `scripts/fetch-merchant-logos-v3.ts` | Puppeteer 사이트 접속 수집 |
| 구글 이미지 로고 | `scripts/fetch-logos-google.ts` | `"[브랜드명] CI"` 검색 크롤링 |
| OG 이미지 수집 | `scripts/fetch-og-images.ts` | landing_url에서 og:image 추출 |

#### 공유 파일 (양쪽 동일)
| 파일 | 경로 |
|------|------|
| database.ts (타입) | `src/types/database.ts` |
| Supabase 서버 | `src/lib/supabase/server.ts` |
| Supabase 브라우저 | `src/lib/supabase/client.ts` |

### 데이터 파일
| 파일 | 설명 |
|------|------|
| `poppon_brands_filtered.csv` | 브랜드 494개 (원본) |
| `crawl-targets-final.csv` | 최종 크롤링 대상 187개 |
| `poppon-brand-master.csv` | **✅ 6개 카테고리 230개 브랜드 마스터 리스트** |
| `debug-ai-crawl/event-pages-detected.csv` | 이벤트 페이지 탐지 결과 494개 |
| `debug-ai-crawl/crawl-targets.csv` | 이벤트 URL 확보 223개 |

---

## 기술 스택

### 메인 앱 (poppon)
| 영역 | 기술 | 비고 |
|------|------|------|
| Frontend + Backend | **Next.js 15 (App Router)** | SSR/SSG, API Routes |
| Database + Auth | **Supabase (PostgreSQL)** | RLS, OAuth (카카오/네이버/애플) |
| 스타일링 | **Tailwind CSS + shadcn/ui** | Pretendard |
| 상태관리 | **Zustand** | 경량 |
| 배포 | **Vercel** | Git push 자동 배포 |
| 검색 | **PostgreSQL 풀텍스트 (pg_trgm)** | 초기 1만건 수준 충분 |
| 본인인증 | **KMC** (월 55,000원 기존 계약) | 가입 시 본인인증 |
| 알림 | **카카오 알림톡** | 채널 개설 필요 |

### 어드민 앱 (poppon-admin)
| 영역 | 기술 | 비고 |
|------|------|------|
| Frontend + Backend | **Next.js 15 (App Router)** | SSR/SSG, API Routes |
| Database | **Supabase (동일 DB)** | 메인과 공유 |
| AI 크롤러 | **Puppeteer + Claude Haiku** | 커넥터 기반 |
| 배포 | **Vercel** ✅ | `poppon-admin.vercel.app` |
| 인증 | **비밀번호 (ADMIN_SECRET)** | 쿠키 기반 |

---

## 프론트엔드 라우팅 구조

### 메인 앱 (poppon)
```
src/app/
├── layout.tsx               — AuthProvider + TopProgressBar + Toast + AuthSheet 래핑
├── loading.tsx              — 홈 스켈레톤 ✅ 신규
├── @modal/
│   ├── default.tsx          — 모달 없을 때 null
│   └── (.)d/[slug]/
│       └── page.tsx         — 인터셉팅 모달
├── d/[slug]/
│   └── page.tsx             — SEO 풀 페이지
├── m/[merchantSlug]/
│   ├── page.tsx             — 브랜드관
│   └── loading.tsx          — 브랜드관 스켈레톤 ✅ 신규
├── c/[categorySlug]/
│   ├── page.tsx             — 카테고리 허브
│   └── loading.tsx          — 카테고리 스켈레톤 ✅ 신규
├── search/
│   ├── page.tsx             — 검색 결과
│   └── loading.tsx          — 검색 스켈레톤 ✅ 신규
├── submit/
│   └── page.tsx             — 유저 제보
├── me/
│   ├── page.tsx             — 마이페이지 (저장딜/구독/설정 탭 + 관심카테고리/추천브랜드)
│   └── loading.tsx          — 마이 스켈레톤 ✅ 신규
├── auth/
│   ├── page.tsx             — 로그인/가입 (바텀시트 연동)
│   └── callback/
│       └── route.ts         — SNS OAuth 콜백
├── api/
│   ├── submit/route.ts
│   ├── actions/route.ts
│   ├── actions/search/route.ts  — 검색 로그 ✅ 신규
│   └── me/
│       ├── saved-deals/route.ts
│       ├── follows/merchants/route.ts
│       └── delete-account/route.ts  — 계정 탈퇴 ✅ 신규
└── out/[dealId]/route.ts    — 클릭 트래킹
```

### 어드민 앱 (poppon-admin)
```
src/app/
├── layout.tsx               — 루트 레이아웃
├── login/
│   └── page.tsx             — 비밀번호 로그인
├── (dashboard)/
│   ├── layout.tsx           — 사이드바 네비게이션 (경로 수정 완료)
│   ├── page.tsx             — 대시보드
│   ├── deals/               — 딜 CRUD
│   ├── merchants/           — 머천트 CRUD
│   ├── members/             — 회원 관리 ✅ 신규
│   │   ├── page.tsx         — 회원 목록
│   │   └── [id]/page.tsx    — 회원 상세
│   └── crawls/              — 크롤 모니터링
├── api/
│   ├── auth/route.ts
│   ├── deals/route.ts
│   ├── merchants/route.ts
│   ├── members/             — 회원 관리 API ✅ 신규
│   │   ├── route.ts         — 목록 GET + 상태변경 PATCH
│   │   └── [id]/route.ts   — 상세 GET
│   ├── ai-crawl/route.ts
│   └── cron/
│       ├── crawl/route.ts
│       └── expire/route.ts
```

### 미들웨어 보호 경로
- **메인**: `/brand/*` → 로그인 필수
- **어드민**: 전체 → ADMIN_SECRET 쿠키 필수 (login 제외)

---

## API 구조 요약

### 메인 앱 — Public (비로그인)
- `GET /deals` — 딜 목록/검색 (q, category, merchant, benefit_tag, channel, date, sort)
- `GET /deals/:id` — 딜 상세
- `GET /categories` — 카테고리 트리
- `GET /merchants` / `GET /merchants/:id`
- `GET /home` — 홈 섹션 (sponsored, trending, new, ending_soon, categories)
- `POST /api/submit` — 유저 제보 ✅

### 메인 앱 — Member (로그인)
- `GET /auth/callback` — SNS OAuth 콜백 ✅
- `GET|POST|DELETE /api/me/saved-deals` — 딜 저장/해제 ✅
- `GET|POST|DELETE /api/me/follows/merchants` — 브랜드 구독/해제 ✅
- `DELETE /api/me/delete-account` — 계정 탈퇴 (soft delete) ✅ 신규
- `POST /api/actions/search` — 검색 로그 기록 ✅ 신규
- 알림: `PUT /me/notification-preferences` (kakao/sms/email/push)
- 동의: `PUT /me/consents`
- 액션: `POST /deals/:id/actions` (view, click_out, copy_code, save, share)
- 피드백: `POST /deals/:id/feedback` (work/fail)

### 어드민 앱
- `POST /api/auth` — 비밀번호 인증 ✅
- `GET|POST /api/deals` + `GET|PUT|DELETE /api/deals/:id` ✅
- `GET|POST /api/merchants` + `GET|PUT|DELETE /api/merchants/:id` ✅
- `GET|PATCH /api/members` — 회원 목록+통계+상태변경 ✅ 신규
- `GET /api/members/:id` — 회원 상세+행동로그+검색로그 ✅ 신규
- `GET|POST /api/ai-crawl` — AI 크롤 현황/실행 ✅
- `POST /api/ai-crawl/:connectorId` — 단일 AI 크롤 ✅
- `GET /api/cron/crawl` — 일일 자동 크롤 배치 ✅
- `GET /api/cron/expire` — 만료 딜 자동 처리 ✅

### Brand Portal (미착수)
- `POST /brand/auth/login`
- `GET|PUT /brand/profile`
- `GET|POST|PUT /brand/deals` + `POST /brand/deals/:id/submit`
- `GET /brand/stats`

### 트래킹 (메인 앱)
- `GET /out/:dealId` — 아웃바운드 리다이렉트 (클릭로그 + 302) ✅

---

## 딜 타입 분류
| 타입 | 설명 | CTA |
|------|------|-----|
| A1 | 쿠폰/프로모션 코드형 | CopyCodeButton + GoToSource |
| A2 | 가격딜/핫딜 (최저가/특가) | GoToSource (제휴링크) |
| B | 앱쿠폰/링크형 | GetCouponButton + GoToSource |
| C | 오프라인 이벤트 | StoreInfoPanel + GoToSource |

---

## 태그 체계
- **혜택 (benefit_tags)**: percent_off, amount_off, bogo, free_shipping, gift_with_purchase, bundle_deal, clearance, member_only, new_user, app_only, limited_time
- **조건**: 구조화 conditions[] = { type, value, text }
- **긴급**: ending_soon_24h, ending_soon_3d, new_today, updated_today
- **채널**: online_only, offline_only, hybrid

---

## 카테고리 (6개 활성)
| name | slug | 상태 |
|------|------|------|
| 패션 | fashion | ✅ active |
| 뷰티 | beauty | ✅ active |
| 식품/배달 | food | ✅ active |
| 생활/리빙 | living | ✅ active (디지털/가전 흡수) |
| 여행/레저 | travel | ✅ active |
| 문화/콘텐츠 | culture | ✅ active |

### 비활성화된 카테고리 (6개)
| name | slug | 사유 |
|------|------|------|
| 디지털/가전 | digital | → 생활/리빙으로 딜 이동 |
| 건강/헬스 | health | 볼륨 부족, 추후 재활성화 가능 |
| 키즈/교육 | kids | 볼륨 부족, 추후 재활성화 가능 |
| 반려동물 | pets | 볼륨 부족, 추후 재활성화 가능 |
| 자동차/주유 | auto | 딜 플랫폼 부적합 |
| 금융/통신 | finance | 딜 플랫폼 부적합 |

---

## DB 테이블 (주요)
| 테이블 | 상태 | 데이터 |
|--------|------|--------|
| deals | ✅ | **~639 active** |
| merchants | ✅ | **~339개** (전원 로고+brand_color 보유) |
| categories | ✅ | **6개 active** / 6개 비활성 |
| crawl_connectors | ✅ | **256 active** / 157 disabled / 0 error |
| deal_actions | ✅ | 72건+ (트래킹 작동중) |
| submissions | ✅ | 0 |
| **profiles** | ✅ | 0 (신규 테이블) |
| **user_consents** | ✅ | 0 (신규 테이블) |
| **saved_deals** | ✅ | 0 (신규 테이블) |
| **followed_merchants** | ✅ | 0 (신규 테이블) |
| **followed_categories** | ✅ | 0 (신규 테이블) |
| **notification_preferences** | ✅ | 0 (신규 테이블) |
| **search_logs** | ✅ | 0 (신규 테이블 — 검색어/user_id/session_id/결과수) |

### 카테고리별 머천트/딜 현황 (2/16 풀크롤 후 — SQL 재조회 필요)
| 카테고리 | 머천트 | active 딜 (추정) |
|---------|--------|-----------|
| 뷰티 | 60+ | ~150+ |
| 식품/배달 | 45+ | ~140+ |
| 문화/콘텐츠 | 33+ | ~130+ |
| 생활/리빙 | 49+ | ~130+ |
| 패션 | 40+ | ~90+ |
| 여행/레저 | 29+ | ~50+ |
| **합계** | **256+** | **~639** |

### deals 테이블 (전체 스키마)
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | uuid | PK |
| merchant_id | uuid | FK → merchants |
| category_id | uuid | FK → categories |
| subcategory_id | uuid | nullable, FK → categories |
| title | varchar | |
| description | text | nullable |
| deal_type | varchar | A1/A2/B/C |
| status | varchar | pending/active/hidden/expired |
| channel | varchar | online/offline/hybrid |
| benefit_tags | text[] | percent_off, amount_off 등 11종 |
| benefit_summary | varchar | "최대 50% 할인" |
| coupon_code | varchar | A1 타입용 |
| discount_value | numeric | % 또는 원 |
| discount_type | varchar | percent/amount |
| price | numeric | A2 가격딜용 |
| original_price | numeric | |
| discount_rate | numeric | |
| conditions | jsonb | [{type, value, text}] |
| how_to_use | text | |
| starts_at | timestamptz | |
| ends_at | timestamptz | |
| is_evergreen | boolean | 상시 진행 여부 |
| source_type | varchar | crawl/brand/user_submit/affiliate/admin |
| source_url | text | 원본 링크 |
| landing_url | text | 이동 링크 |
| affiliate_url | text | 제휴 링크 |
| affiliate_disclosure | boolean | |
| thumbnail_url | text | |
| og_image_url | text | |
| quality_score | integer | 0~100 |
| trending_score | integer | |
| view_count | integer | |
| click_out_count | integer | |
| save_count | integer | |
| feedback_work_count | integer | |
| feedback_fail_count | integer | |
| slug | varchar | SEO URL (한글 포함) |
| meta_title | varchar | |
| meta_description | varchar | |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| expired_at | timestamptz | 실제 만료 처리 시각 |

### merchants 테이블 (~339개)
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | uuid | PK |
| name | varchar | |
| slug | varchar | SEO URL (영문: oliveyoung, innisfree 등) |
| logo_url | text | Puppeteer/구글 이미지 수집 |
| brand_color | varchar | 브랜드 고유 색상 (#hex), 339개 적용 |
| description | text | |
| official_url | text | |
| category_ids | uuid[] | **✅ 6개 카테고리 매핑 완료** |
| is_verified | boolean | |
| follower_count | integer | |
| active_deal_count | integer | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### categories 테이블
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | uuid | PK |
| parent_id | uuid | nullable, 셀프조인 |
| name | varchar | 한글 (패션, 뷰티 등) |
| slug | varchar | 영문 (fashion, beauty 등) |
| description | text | |
| icon | varchar | |
| sort_order | integer | |
| is_active | boolean | **6개 true / 6개 false** |
| deal_count | integer | |
| depth | integer | 0=대, 1=중, 2=소 |
| created_at | timestamptz | |

### profiles 테이블 ✅ 신규
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | uuid | PK, FK → auth.users |
| phone | varchar | 전화번호 |
| name | varchar | 이름 |
| nickname | varchar | 닉네임 |
| avatar_url | text | |
| gender | varchar | |
| birth_year | integer | |
| interested_categories | uuid[] | 관심 카테고리 |
| marketing_opt_in | boolean | 마케팅 동의 |
| marketing_opt_in_at | timestamptz | |
| role | varchar | user/admin/super_admin |
| **status** | varchar | ✅ active/withdrawn/banned (신규) |
| **withdrawn_at** | timestamptz | ✅ 탈퇴 요청 시각 (신규) |
| **withdraw_reason** | text | ✅ 탈퇴 사유 (신규) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### saved_deals 테이블 ✅ 신규
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| deal_id | uuid | FK → deals |
| created_at | timestamptz | |
| UNIQUE(user_id, deal_id) | | |

### followed_merchants 테이블 ✅ 신규
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| merchant_id | uuid | FK → merchants |
| created_at | timestamptz | |
| UNIQUE(user_id, merchant_id) | | |

### crawl_connectors 테이블 (v3 컬럼 추가)
```
id, name, merchant_id, source_url, config, status, fail_count,
last_run_at, created_at, updated_at,
content_hash VARCHAR(32),       -- ✅ v3 추가: MD5 해시
hash_updated_at TIMESTAMPTZ     -- ✅ v3 추가: 해시 저장 시점
```

### deal_actions 테이블
id, deal_id, user_id(nullable), session_id(ppn_sid), action_type(view/click_out/copy_code/save/share), metadata(jsonb), created_at

### search_logs 테이블 ✅ 신규
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | uuid | PK |
| user_id | uuid | nullable, FK → auth.users |
| session_id | varchar | 비로그인 세션 |
| query | text | 검색어 |
| category_slug | varchar | 카테고리 필터 |
| result_count | integer | 검색 결과 수 |
| created_at | timestamptz | |

### 조인 관계
```
deals.merchant_id → merchants.id
deals.category_id → categories.id (FK: deals_category_id_fkey)
deals.subcategory_id → categories.id (FK: deals_subcategory_id_fkey)
categories.parent_id → categories.id (셀프조인)
profiles.id → auth.users.id
saved_deals.user_id → auth.users.id
saved_deals.deal_id → deals.id
followed_merchants.user_id → auth.users.id
followed_merchants.merchant_id → merchants.id
```
**⚠️ Supabase 조인 시 주의**: deals → categories 조인 시 FK 명시 필요
```
categories!deals_category_id_fkey (name)
```

### RLS 정책
| 테이블 | 정책 | 조건 |
|--------|------|------|
| deals | Active deals are viewable by everyone | SELECT: status = 'active' OR 'expired' |
| deals | Admins can do everything | ALL: users.role IN ('admin', 'super_admin') |
| merchants | Merchants are viewable by everyone | SELECT: 전체 |
| categories | Categories are viewable by everyone | SELECT: 전체 |
| submissions | Anyone can insert | INSERT: true |
| submissions | Users can view own | SELECT: auth.uid() = user_id |
| profiles | Users can view/update own | SELECT/UPDATE: auth.uid() = id |
| saved_deals | Users can manage own | ALL: auth.uid() = user_id |
| followed_merchants | Users can manage own | ALL: auth.uid() = user_id |

---

## 회원가입/인증 시스템 ✅ 신규

### 아키텍처
```
가입 트리거 (로그인 버튼, 딜 저장, 브랜드 구독 등)
  → AuthSheet 바텀시트(모바일)/센터모달(데스크톱) 노출
    → 이메일 회원가입 또는 SNS 로그인 (카카오/네이버/애플 — 준비 중)
      → Supabase Auth → profiles 자동 생성 (트리거)
        → 본인인증 KMC/PASS (placeholder, 연휴 후 연동)
          → 관심 카테고리 선택 (혜택 강조형, 선택)
            → 마케팅 동의 (알림톡/푸시/이메일)

탈퇴 플로우:
  마이페이지 → 설정 탭 → 회원 탈퇴 (사유 선택)
    → profiles.status = 'withdrawn' (soft delete)
      → 30일 후 어드민 Cron에서 완전 삭제
      → 어드민에서 복구 가능
```

### 구현 현황
- ✅ DB 마이그레이션 완료 (profiles, user_consents, saved_deals, followed_merchants, followed_categories, notification_preferences + RLS + 트리거)
- ✅ profiles에 status/withdrawn_at/withdraw_reason/role 컬럼 추가
- ✅ search_logs 테이블 생성
- ✅ AuthProvider (전역 인증 상태 관리 + withdrawn/banned 체크 + tracking userId 연동)
- ✅ AuthSheet 6단계 가입 플로우 (main→signup→login→identity→categories→marketing)
- ✅ auth/page.tsx (비로그인 시 AuthSheet 자동 열기)
- ✅ auth/callback/route.ts (OAuth 콜백)
- ✅ me/page.tsx (데이터 연동 + 비밀번호 변경 + 계정 탈퇴 soft delete)
- ✅ saved-deals API (GET/POST/DELETE)
- ✅ follows/merchants API (GET/POST/DELETE)
- ✅ delete-account API (soft delete → status: withdrawn)
- ✅ TopNav 프로필 드롭다운 (데스크톱) + 로그아웃 리다이렉트
- ✅ Toast 알림 시스템 (가입/로그인/로그아웃 피드백)
- ✅ 로그인 이메일 기억하기 (localStorage)
- ✅ 로그인/회원가입 Enter 키 submit 지원
- ✅ tracking.ts user_id 연동 (로그인 시 자동 포함)
- ✅ actions API user_id 저장 + metadata 저장
- ✅ search_logs API (검색어 기록)
- ⬜ Supabase Auth Provider 설정 (카카오/네이버/애플)
- ⬜ KMC 본인인증 연동 (placeholder 상태, 연휴 후)
- ⬜ 카카오 알림톡 (채널 개설 필요)

### 환경변수

#### 메인 앱 (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_... (✅ 신규 키 시스템)
SUPABASE_SERVICE_ROLE_KEY=sb_secret_... (✅ 신규 키 시스템)
```

#### 어드민 앱 (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=... (동일)
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_... (동일)
SUPABASE_SERVICE_ROLE_KEY=sb_secret_... (동일)
ADMIN_SECRET=... (✅ 2/16 변경됨)
ANTHROPIC_API_KEY=sk-ant-api03-... (✅ 2/16 재발급)
CRON_SECRET=...
NEXT_PUBLIC_MAIN_URL=https://poppon.kr
```

---

## AI 크롤러 v3 (어드민 앱에서 관리)

### 전략 전환 히스토리
1. **static_html 파싱** → 실패 (한국 사이트 대부분 JS 렌더링 + AJAX)
2. **API 직접 호출** → 성공 (스타벅스 36개, 클리오 14개) 단, 162개 사이트별 API 찾는 건 비현실적
3. **Puppeteer + Claude AI** → ✅ 최종 채택. URL만 등록하면 자동 추출

### 아키텍처
```
브랜드 URL (커넥터)
  → Puppeteer (이미지 차단, 15s 타임아웃)
    → MD5 해시 vs DB content_hash 비교
      → 변경 없음 → 스킵 (AI 호출 안 함)
      → 변경 있음 → Claude Haiku 파싱 + 후처리 필터
        → save-deals v2 (URL+title 중복체크)
        → content_hash DB에 저장
```

### 비용 예측
| 브랜드 수 | 첫 크롤 | 이후 월간 (일1회, 해시적용) |
|----------|--------|----------------------|
| 현재 ~150개 | ~$3 | ~$15 |
| 목표 300개+ | ~$7 | ~$20 (2만원) |

---

## 머천트 로고 수집 히스토리

### 전략 변천
| 버전 | 방식 | 결과 |
|------|------|------|
| v2 | HTTP로 apple-touch-icon 경로 추측 | 108 고품질 + 168 저품질(Google Favicon) + 7 실패 |
| v3.1 | Puppeteer 사이트 접속 + DOM 파싱 | 59개 교체 (SVG 13 + apple-touch 37 + header-logo 9) |
| 구글 이미지 검색 | Puppeteer `"[브랜드명] CI"` 검색 | 테스트 10/10 성공, 전체 ~102개 실행 |

### 수동 교체 로고 (public/logos/)
| 파일명 | 머천트 |
|--------|--------|
| samsung.svg | 삼성닷컴 |
| oliveyoung.png | 올리브영 (여백 크롭) |
| kyobobook.png | 교보문고 |
| lottecinema.jpg | 롯데시네마 |
| baskinrobbins.png | 배스킨라빈스 |
| innisfree.png | 이니스프리 |
| nintendo.jpg | 닌텐도 |
| doubleheart.png | 더블하트 |
| upang.jpg | 유팡 |
| coupang.png | 쿠팡 (여백 크롭) |
| nongshim.jpg | 농심 (여백 크롭, 신라면→농심 이름변경) |
| 29cm.png | 29CM (여백 크롭) |

### ⚠️ 로고 미해결
- 기존 저품질 ~100개: 교체 필요

---

## 브랜드 확장 히스토리

### 카테고리 구조조정 (2/16)
- **12개 → 6개**: 자동차/주유, 금융/통신 제거 (딜 플랫폼 부적합), 디지털/가전 → 생활/리빙 흡수, 건강/키즈/반려동물 보류
- **사유**: 적은 카테고리에 딜이 빽빽한 게 사용자 신뢰감 높음

### 브랜드 마스터 리스트 (poppon-brand-master.csv)
| 카테고리 | 브랜드 수 |
|---------|----------|
| 뷰티 | 50 |
| 식품/배달 | 44 |
| 생활/리빙 | 40 |
| 패션 | 36 |
| 여행/레저 | 30 |
| 문화/콘텐츠 | 30 |
| **합계** | **230** |

### 브랜드 확장 파이프라인
```
[1] 브랜드 마스터 리스트 (완료: 230개)
    ↓
[2] 이벤트 페이지 자동 탐지 (detect-event-pages.ts)
    → 공식 URL → /event, /promotion 자동 발견
    ↓
[3] 커넥터 등록 → AI 크롤
    → 첫 회만 풀크롤, 이후 해시로 스킵
```

---

## 👤 회원가입 & 행동추적

### 가입 트리거
딜 저장, 브랜드 구독, 쿠폰 3회~, 피드백 → AuthSheet 바텀시트

### 플로우
SNS 간편 로그인 (카카오/네이버/애플) → 관심 카테고리(선택) → 마케팅 동의 → 완료

### 구현 현황
- ✅ 회원 DB 6개 테이블 + RLS + 트리거 (Supabase 실행 완료)
- ✅ AuthProvider + AuthSheet + 바텀시트 UI
- ✅ 딜 저장/브랜드 구독 API
- ✅ 마이페이지 데이터 연동
- ✅ deal_actions 테이블 + tracking.ts + API 연동
- ⬜ Supabase OAuth Provider 설정 (카카오/네이버/애플)
- ⬜ KMC 본인인증
- ⬜ 카카오 알림톡

---

## TargetUP-AI 연동 (수익화)
- **최소 세그먼트 데이터**: phone_hash, marketing_opt_in, 관심 카테고리/브랜드, 최근 30/60/90일 행동 요약
- **연동 방식**: v1에서는 옵션 B(일 배치) 권장 — segments_daily 테이블 동기화
- **예시 세그먼트**: beauty_skin_30d_active, food_delivery_high_intent 등

---

## 운영 정책 핵심
- 출처/공식링크 항상 표시, 이미지는 썸네일/OG 수준
- 크롤링: robots 존중, 실패 3회 → 자동 비활성화
- 만료: 자동 expired 전환, SEO 7~30일 유지 후 noindex
- 품질: 안됨 10건+/30%↑ → 검수, 30건+/50%↑ → 숨김
- 광고: 스폰서 라벨 필수, 품질 규칙 동일 적용
- 개인정보: 마케팅 동의 기록, 철회 즉시 반영+이력 보관

---

## 분석 이벤트 (필수 수집)
deal_view, deal_click_out, deal_copy_code, deal_save, merchant_follow, category_follow, deal_feedback_work/fail, search_performed, signup_start/complete, marketing_opt_in_on/off, digest_sent

---

## 개발 Phase

### Phase 0 — ✅ 완료
DB 18개 테이블 + RLS, 전체 페이지 (홈/검색/카테고리/브랜드관/딜상세/제보/로그인/마이페이지), 어드민 대시보드, AI 크롤러 v3, Vercel 배포

### Phase 1 — 진행중
크롤러 운영 + 만료 자동화 + 디자인 보강 + 회원 기능 + **브랜드 확장** + **어드민 분리** ✅

### Phase 2 — 미착수
브랜드 포털 / 스폰서 슬롯 / 성과 정산

---

## ✅ 완료된 작업 (날짜순)

### DB / 인프라 (2/14)
- [x] Supabase 프로젝트 생성 + 18개 테이블 + RLS + 함수 + 트리거
- [x] 12대 카테고리 시드 + 11종 benefit_tags 정의
- [x] 283개 머천트 시드 + brand_color 264개 적용
- [x] 제휴 네트워크 테이블 (affiliate_networks, affiliate_offers, affiliate_merchant_map)

### AI 크롤러 (2/14)
- [x] Puppeteer + Claude Haiku 크롤러 구축
- [x] 이벤트 페이지 자동 탐지 스크립트
- [x] 1차 크롤링 완료 (272/349 성공, 신규 773 + 업데이트 807, $4.32)

### 사용자 웹 (2/14~15)
- [x] / 홈 — 트렌딩/신규/마감임박 3개 섹션
- [x] /search — 풀텍스트 검색 + 카테고리/혜택/채널 필터 + 정렬 4종 + 페이지네이션
- [x] /c/:slug — 카테고리 허브 + 서브카테고리 칩 + 정렬 + 페이지네이션
- [x] /d/:slug — 하이브리드 모달 (리스트 클릭=모달, 직접접속=풀페이지 SEO)
- [x] /m/:slug — 브랜드관 + 구독버튼 + 진행중/종료 탭
- [x] /submit — 유저 제보 (URL+코멘트, 중복체크, 비로그인 가능)
- [x] /auth — 로그인/가입 UI shell (Supabase OTP 미연결)
- [x] /me — 마이페이지 UI shell

### 어드민 (2/14~15)
- [x] 대시보드 + 딜 CRUD + 머천트 CRUD + 크롤 관리

### 머천트 로고 (2/15~16)
- [x] v2 HTTP apple-touch-icon 수집 (108 고품질)
- [x] v3.1 Puppeteer DOM 파싱 (59개 교체)
- [x] 구글 이미지 검색 (~102개)
- [x] 수동 교체 9종 (삼성, 올리브영, 교보문고, 롯데시네마, 배스킨라빈스, 이니스프리, 닌텐도, 더블하트, 유팡)

### DealCard 리디자인 (2/15~16)
- [x] DealCard v4.2 (흰색 배경, brand_color 액센트, 로고 비율 동적, 쿠폰 점선)

### 만료 자동화 (2/16)
- [x] filterActiveDeals 함수 (status='active' AND ends_at 필터)
- [x] 홈/검색/카테고리/브랜드관 전 페이지 적용
- [x] Cron 일괄 전환 설정 (매일 06:00 KST)

### 행동추적 (2/16)
- [x] deal_actions 테이블 + 인덱스 + RLS (Supabase 실행 완료, 72건+ 데이터)
- [x] increment_view_count / increment_click_out_count 함수
- [x] tracking.ts + API + DealDetail/CopyCodeButton/out 연동

### 배포 (2/16)
- [x] Vercel Pro 전환 + Git push 자동 배포 라이브
- [x] Vercel Cron 설정 (DNS 후 활성화)
- [x] 클릭 트래킹 (/out/:dealId) + 어드민 인증 보호

### 모바일 반응형 (2/16)
- [x] 12파일 수정, 모바일 퍼스트, 44px 터치 타겟, safe-area, 바텀시트

### 크롤러 v3 최적화 (2/16)
- [x] DB 해시 변경감지 (content_hash, hash_updated_at)
- [x] save-deals v2 (title 기반 중복체크 + 배치내 중복방지)
- [x] 커넥터 정리 (349→243→**256 active**, 157 disabled, 0 error)
- [x] 삼성 머천트 병합 (삼성닷컴+삼성전자가전)

### 카테고리 페이지 리디자인 (2/16)
- [x] 그라디언트 헤더 제거 → 탭바(12개 가로스크롤) + Lucide 아이콘 + 컴팩트 헤더

### 홈 디자인 개선 (2/16)
- [x] 히어로 중복 검색창 제거 (TopNav만 유지)
- [x] 카테고리 이모지 → Lucide 아이콘 통일 (컬러 배경 원 포함)
- [x] 모바일 카테고리: 그리드 3줄 → 가로 스크롤 1줄
- [x] 섹션 이모지 제거 (🔥/✨/⏰ → 텍스트만)
- [x] 간격 축소 + 서브카피 변경

### 딜 모달 속도 개선 (2/16)
- [x] 모달 서버→클라이언트 fetch 전환 (DealDetailClient.tsx)
- [x] 스켈레톤 로딩 (클릭 즉시 모달 표시 → 300ms 데이터 로드)
- [x] SEO 풀페이지(/d/:slug)는 기존 서버 렌더 유지

### 카테고리 구조조정 + 머천트 대정리 (2/16)
- [x] 카테고리 12→6개 (자동차/금융/통신 제거, 디지털→생활 흡수, 건강/키즈/반려 보류)
- [x] 디지털/가전 64개 딜 → 생활/리빙 이동
- [x] 5개 카테고리 147개 딜 hidden 처리
- [x] 6개 카테고리 머천트 category_ids 일괄 매핑
- [x] 불필요 커넥터 disabled (자동차/금융/통신/기타)
- [x] 신규 75개 머천트 등록 (6개 카테고리 포함)
- [x] 브랜드 마스터 리스트 230개 작성 (poppon-brand-master.csv)

### 브랜드 확장 + 풀크롤 (2/16)
- [x] 커넥터 중복 정리 (14개 disabled, 머천트당 1개만 유지)
- [x] 이벤트 URL 자동 탐지 (detect-event-pages.ts, 83개 대상 → 33개 자동 발견)
- [x] 수동 이벤트 URL 확인 (55개 실패분 → 38개 추가 확인)
- [x] 신규 커넥터 65개 등록 (자동 28 + 수동 37)
- [x] merchants official_url 7개 수정 (스킨푸드, 오휘, 정샘물, 노스페이스, 탑텐, 코웨이, 스킨1004)
- [x] 카테고리 탭바 6개 반영 (constants.ts MAIN_CATEGORIES 12→6)
- [x] 신규 75개 머천트 brand_color 일괄 설정
- [x] 신규 75개 머천트 로고 수집 (apple-touch-icon 36 + 구글이미지 39, 실패 0)
- [x] 풀크롤 실행 (243개 active, 성공 78 + 스킵 134 + 실패 31, 신규 173딜 + 업데이트 115, $1.41)

### 카테고리 UI 통일 + 언더라인 탭 (2/16)
- [x] CategoryGrid: 컬러 배경 박스 → 언더라인 탭 스타일(Style D)로 변경
- [x] CategoryTabBar: 카테고리 페이지도 홈과 동일한 언더라인 탭 통일
- [x] 아이콘 20px→32px (1.5배), 간격 px-4→px-8 (2배)
- [x] 모바일 Android 스크롤 수정 (justify-center → sm:justify-center)
- [x] constants.ts 6개 카테고리 Vercel 배포 반영

### 로고 여백 크롭 + 머천트 수정 (2/16)
- [x] 쿠팡, 올리브영, 농심, 29CM 로고 여백 자동 크롭 (numpy 기반)
- [x] 신라면 → 농심 머천트 이름 변경 (slug: nongshim 유지)

### 소스 보호 강화 (2/16)
- [x] SourceProtection: 텍스트 선택/드래그/복사 방지 추가 (input/textarea 제외)
- [x] SourceProtection: Ctrl+S 저장 방지, 단축키 대소문자 모두 처리
- [x] next.config: productionBrowserSourceMaps: false (프로덕션 소스맵 제거)
- [x] next.config: poweredByHeader: false (X-Powered-By 헤더 제거)

### 크롤 커넥터 대정리 (2/16)
- [x] 비활성 카테고리 브랜드 10개 disabled (자동차/금융/통신)
- [x] 보류 카테고리 브랜드 11개 disabled (반려/키즈/건강)
- [x] 중복 커넥터 8개 disabled (야놀자×3, 버거킹×2, GS25×3 등)
- [x] 앱 전용/SPA 차단 11개 disabled (무신사/지그재그/배민/야놀자 등)
- [x] URL 재시도 가능 24개 fail_count 리셋 (유니클로/아디다스/도미노 등)
- [x] 최종 현황: 256 active / 157 disabled / 0 error

### 어드민 분리 + 회원 인증 시스템 (2/16)
- [x] 회원 DB 마이그레이션 (profiles, user_consents, saved_deals, followed_merchants, followed_categories, notification_preferences + RLS + 트리거 + 자동 증감 함수)
- [x] 어드민 앱 분리 (poppon-admin 프로젝트 생성)
- [x] 메인 앱에서 크롤러/어드민 코드 제거 (puppeteer, cheerio 등 의존성 제거)
- [x] 어드민 페이지/API 이동 (deals, merchants, crawls, ai-crawl, cron)
- [x] AuthProvider (전역 인증 상태 관리 Context)
- [x] AuthSheet (가입/로그인 바텀시트 — 카카오/네이버/애플/전화번호)
- [x] auth/callback/route.ts (SNS OAuth 콜백)
- [x] me/page.tsx (저장딜/구독/설정 탭 — 실제 데이터 연동)
- [x] saved-deals API (GET/POST/DELETE)
- [x] follows/merchants API (GET/POST/DELETE)
- [x] TopNav 로그인 상태 반영 + Footer 카테고리 6개 정리
- [x] poppon 빌드 ✅ (15 페이지)
- [x] poppon-admin 빌드 ✅ (19 라우트)

### 키 로테이션 + 어드민 배포 (2/16)
- [x] Supabase 신규 API Keys 전환 (sb_publishable_ / sb_secret_)
- [x] 레거시 JWT 키 Disable (eyJhbGci... → 무효화)
- [x] Anthropic API Key 재발급 (console.anthropic.com)
- [x] ADMIN_SECRET 변경
- [x] poppon + poppon-admin 양쪽 .env.local 새 키 적용 + 빌드 성공
- [x] poppon Vercel 환경변수 업데이트 + Redeploy 확인
- [x] 어드민 사이드바 경로 수정 (`/admin/deals` → `/deals`, 미착수 메뉴 제거, Phase 1, 사이트보기 외부링크)
- [x] poppon-admin .gitignore 생성 (node_modules/.next/.env.local 제외)
- [x] poppon-admin GitHub 레포 생성 (private) + push
- [x] poppon-admin Vercel 배포 성공 (`poppon-admin.vercel.app`, 환경변수 9개)

### 회원가입 시스템 + 행동추적 고도화 + 어드민 회원관리 (2/16)
- [x] AuthSheet 전면 재작성 — 6단계 플로우 (main→signup→login→identity→categories→marketing)
- [x] 이메일/비밀번호 회원가입+로그인 (Supabase Auth, Confirm email OFF)
- [x] 본인인증 KMC placeholder + 테스트용 스킵 버튼
- [x] 관심 카테고리 선택 — DB에서 6개 로드, 혜택 강조 UX ("알림 받기")
- [x] 마케팅 동의 — 전체동의 + 개별(알림톡/푸시/이메일)
- [x] AuthSheet Portal (createPortal → body 직접 렌더링, fixed 포지셔닝 문제 해결)
- [x] AuthSheet 반응형 (모바일: 바텀시트, 데스크톱: 센터 모달)
- [x] AuthProvider 수정 — SIGNED_IN 자동닫힘 제거 (온보딩 유지), withdrawn/banned 체크, setTrackingUserId 연동
- [x] auth/page.tsx 인코딩 수정 + AuthSheet 자동 열기 + isAuthSheetOpen 리다이렉트 방지
- [x] TopNav 데스크톱 프로필 드롭다운 (마이페이지/설정/로그아웃) + 바깥 클릭 감지
- [x] TopNav/마이페이지 signOut 후 window.location.href='/' 강제 리다이렉트
- [x] 마이페이지 설정 탭 — 비밀번호 변경(이메일 재설정), 계정 탈퇴(확인 다이얼로그+사유 선택)
- [x] delete-account API — soft delete (status→withdrawn, withdrawn_at, withdraw_reason)
- [x] profiles 테이블 컬럼 추가 (status, withdrawn_at, withdraw_reason, role)
- [x] search_logs 테이블 생성 (검색어/user_id/session_id/카테고리/결과수 + RLS + 인덱스)
- [x] tracking.ts — setTrackingUserId/getTrackingUserId 추가, trackAction에 user_id 자동 포함, trackSearch 함수 신규
- [x] actions API — user_id body에서 수신+저장, metadata 저장, click_out count 증가
- [x] search_logs API — 검색 로그 기록 (POST /api/actions/search)
- [x] deal_actions 인덱스 추가 (user_id, session_id)
- [x] 어드민 사이드바 — "👥 회원 관리" 메뉴 추가
- [x] 어드민 대시보드 — 회원 현황 카드 (전체/오늘가입/마케팅동의/탈퇴요청) + 인코딩 수정
- [x] 어드민 회원 목록 페이지 (/members) — 검색/필터/페이지네이션 + 상태뱃지 + 행동요약 + 복구/차단
- [x] 어드민 회원 상세 페이지 (/members/[id]) — 프로필 + 행동요약 6카드 + 4탭(행동로그/저장딜/구독/검색)
- [x] 어드민 회원 API (GET/PATCH /api/members) — 목록+통계+상태변경
- [x] 어드민 회원 상세 API (GET /api/members/[id]) — 프로필+이메일+행동로그+검색로그+요약

### 성능 최적화 + UX 부드러움 개선 (2/17)
- [x] Supabase client.ts 싱글톤 패턴 적용 — 매번 새 인스턴스 생성 → 단일 인스턴스 공유 (전체 성능 병목 근본 해결)
- [x] Vercel Function Region 변경 — 북미(iad1) → 서울(icn1), 사용자↔서버 왕복 ~300ms→~10ms
- [x] DealModal 부드러운 열림/닫힘 애니메이션 — 데스크톱: fade+scale(0.2s), 모바일: slide-up(0.3s), 닫힘 역애니메이션 후 router.back()
- [x] DealDetailClient 메모리 캐시 — dealCache Map으로 같은 딜 재클릭 시 즉시 표시, fetchedRef 중복 fetch 방지, mounted 플래그
- [x] TopProgressBar 신규 — 모든 내부 링크 클릭 시 상단 빨간 프로그레스 바 (네이버/쿠팡 스타일), Suspense 래핑
- [x] loading.tsx 5개 신규 — 홈/카테고리/검색/브랜드관/마이페이지 스켈레톤 (서버 데이터 로딩 중 즉시 레이아웃 표시)
- [x] 페이지 fade-in 트랜지션 — globals.css에 animate-fade-in 추가, layout.tsx main에 적용
- [x] layout.tsx 수정 — TopProgressBar 추가 + main에 animate-fade-in 클래스

### 인증 UX 개선 + 토스트 + 로그아웃 수정 (2/17)
- [x] Toast 알림 시스템 신규 — Toast.tsx 글로벌 컴포넌트 (다크 배경, 컬러 아이콘, 2.7s 자동 닫힘, slide-down 애니메이션)
- [x] AuthProvider에 showToast/hideToast 컨텍스트 추가, sessionStorage 기반 setPendingToast (리다이렉트 후 토스트 표시)
- [x] 회원가입 완료 "회원가입이 완료되었습니다" / 로그인 "로그인되었습니다" / 로그아웃 "로그아웃되었습니다" 토스트
- [x] globals.css에 toast-slide-down 키프레임 + toast-container 스타일 추가
- [x] layout.tsx에 Toast 컴포넌트 래핑 추가
- [x] AuthSheet 로그인 폼 "이메일 기억하기" 체크박스 — localStorage(poppon_remember_email) 저장, 재방문 시 자동 입력
- [x] 홈 CTA 모던화 — 이모지 제거 → Lucide 아이콘(Lightbulb, BellRing), 화살표 hover 애니메이션, 깔끔한 그라디언트
- [x] 마이페이지 설정 탭 — 관심 카테고리 수정 섹션 (6개 카테고리 토글 칩, profiles.interested_categories DB 저장)
- [x] 마이페이지 설정 탭 — 추천 브랜드 구독 섹션 (인기 12개 머천트, 팔로우/언팔로우 토글, 검색 링크)
- [x] TopNav 로그아웃 버그 수정 — document.addEventListener 충돌 제거, 투명 오버레이(z-59) 패턴으로 바깥클릭 감지, 드롭다운 z-60
- [x] handleSignOut 개선 — `await Promise.race([signOut(), timeout(3s)])` 패턴, 쿠키/localStorage 강제삭제 코드 제거 (Supabase SSR 쿠키 방식 존중)
- [x] AuthProvider signOut 정리 — 불필요한 localStorage/쿠키 강제삭제 제거, 순수 supabase.auth.signOut() + 상태 초기화만 유지
- [x] AuthProvider initAuth 안정화 — try-finally로 setIsLoading(false) 보장, fetchProfile try-catch 래핑
- [x] AuthSheet 로그인/회원가입 Enter 키 submit 지원 — 비밀번호 입력 후 Enter 시 바로 제출 (onKeyDown 핸들러)

---

## 🔴 미해결 버그 / 즉시 처리 필요

- ⚠️ **Supabase 리전 us-east-1 (미국 동부)** — Free 플랜 기본값. Vercel 서울→Supabase 미국 왕복 ~150ms 잔존. Pro 플랜 전환 시 아시아 리전 이전 검토
- ⚠️ 홈 서브카피 "283개 브랜드" → 머천트 수 동적 표시 또는 업데이트 필요
- ⚠️ 일부 구글 이미지 로고 품질 낮음 → 수동 교체 검토
- ⚠️ poppon-admin에 layout.tsx 수정 커밋 아직 미반영 (로컬 파일 교체 + git push 필요)

---

## 🔲 진행 예정 작업

**도메인 연결**
- [ ] 가비아 DNS 설정 — poppon.kr: A: `@`→Vercel IP, CNAME: `www`→Vercel DNS
- [ ] Vercel poppon 프로젝트에 poppon.kr 도메인 추가
- [ ] admin.poppon.kr CNAME 추가 → poppon-admin Vercel 도메인 연결
- [ ] HTTPS/SSL 자동 발급 확인

**회원 기능 연동**
- [ ] Supabase Auth Provider 설정 (카카오 OAuth)
- [ ] Supabase Auth Provider 설정 (네이버 — 커스텀 OIDC)
- [ ] Supabase Auth Provider 설정 (애플 — 앱 출시 전)
- [ ] KMC 본인인증 연동 (연휴 후)
- [ ] 가입 플로우 E2E 테스트
- [ ] 카카오 알림톡 (채널 개설 필요)
- [ ] 검색 페이지에서 trackSearch 호출 연동

**어드민 마무리**
- [ ] 어드민 대시보드 인코딩 수정 커밋 확인
- [ ] 탈퇴 30일 경과 자동 삭제 Cron 추가

**크롤러 운영 안정화**
- [ ] 리셋한 24개 커넥터 재크롤 결과 확인
- [ ] 일부 머천트 official_url 추가 수정 (까사미아→guud.com 등)

**UI 반영**
- [ ] 홈 서브카피 머천트 수 반영

**인프라**
- [ ] Supabase Pro 전환 + 아시아 리전 이전 검토 (현재 us-east-1)
- [ ] poppon-admin Vercel Function Region 서울 변경
- [ ] NCP 이관 (s2-g3 4vCPU/16GB, 월 ~13만원)
- [ ] Docker 구성 → 상용서버 이관 대비

---

## 배치 스케줄 (어드민 앱에서 관리)
- **현재**: Vercel Cron — 매일 06:00 KST (21:00 UTC)
- **추후**: 06:00 / 12:00 / 18:00 / 23:00
- **순서**: ① Affiliate Ingest → ② Crawl Ingest → ③ Expire/Quality 재계산 → ④ 리포트 생성

---

## 🖥️ 인프라 설계 (합의, 미착수)
- **현재**: Vercel Pro ($20/월 × 2) — 메인(서울 icn1) + 어드민 각각
- **Supabase**: Free 플랜, us-east-1 (미국 동부) — Pro 전환 시 아시아 리전 이전 검토
- **이관 계획**: NCP s2-g3 (4vCPU/16GB) ~8만 + Supabase Pro ~3.4만 + Haiku ~1.4만 = **월 ~13만원**
- Docker 구성 → 상용서버 이관 대비

---

## 알려진 이슈
- 한글 slug → decodeURIComponent 필수
- Supabase 조인 FK 명시 필수
- 모달 내부 링크 → `<a>` hard navigation
- categories.deal_count DB 값 0 → active 딜 실제 집계로 대체
- 병렬 크롤 concurrency 기본 3 (API body에서 조절, 최대 5)
- brand_color: **339개 전원 적용 완료**
- 딜 이미지: thumbnail_url은 DealCard에서 사용 안 함 (로고 중심 디자인)
- Puppeteer waitForTimeout: 신버전에서 제거됨 → `new Promise(r => setTimeout(r, ms))` 사용
- Vercel 빌드: Supabase `.rpc()` 반환 PromiseLike에 `.catch()` 불가 → `.then(() => {}, () => {})` 사용
- Vercel 빌드: 타입 체크 로컬보다 엄격 — SaveResult 등 인터페이스 필수 필드 누락 주의
- 로고 수동교체: `public/logos/` + DB logo_url 동시 업데이트 필요
- CategoryGrid/CategoryTabBar: 'use client' (usePathname 사용), CategoryIcon에 style prop 지원 안 함 → color prop만 사용
- **PowerShell Set-Content 인코딩 주의**: 한글 파일 치환 시 UTF-8 BOM 없이 저장 → node 스크립트 사용 권장
- **어드민 앱 tsconfig.json**: `"exclude": ["node_modules", "scripts"]` (빌드에서 스크립트 제외)
- **Supabase API Keys**: 레거시(eyJhbGci...) Disabled → 신규 sb_publishable_ / sb_secret_ 사용 중. 양쪽 .env.local + Vercel 환경변수 모두 신규 키로 설정 필수
- **Supabase client.ts 싱글톤**: 반드시 `createClient()` 함수를 사용할 것. 직접 `createBrowserClient()` 호출 금지 — 새 인스턴스 생성 시 인증 세션 분리로 전체 성능 저하+깜빡임 발생
- **Vercel Function Region**: 메인 앱 서울(icn1) 설정 완료. 어드민도 서울 설정 권장. 리전 변경 후 Redeploy 필요
- **DealDetailClient 캐시**: dealCache는 메모리(클라이언트) 한정. 새로고침 시 초기화됨. 문제 시 캐시 무효화 로직 추가 필요
- **PowerShell [id] 폴더**: `Remove-Item`/`ls` 시 `-LiteralPath` 사용 필수 (대괄호를 특수문자로 인식)
- **TopNav 드롭다운 클릭 감지**: document.addEventListener('click') 패턴은 이벤트 버블링으로 버튼 onClick보다 먼저 실행되어 드롭다운이 닫힘 → 투명 오버레이(z-59) + 드롭다운(z-60) 패턴 사용 필수
- **Supabase SSR 로그아웃**: Supabase SSR(@supabase/ssr)은 쿠키 기반 세션 관리 → localStorage/쿠키 강제삭제 불필요, supabase.auth.signOut()만 호출하면 됨. 강제삭제 시 오히려 세션 꼬임 발생
- **Toast 시스템**: AuthProvider의 showToast/setPendingToast 사용. 리다이렉트 후 토스트는 sessionStorage('poppon_pending_toast')에 저장 → layout mount 시 표시

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
| 팝폰-디자인개선+모달속도+만료필터 | 2/16 | 홈 검색창 제거, 카테고리 Lucide 통일, 이모지 제거, filterActiveDeals 전페이지, 딜 모달 클라이언트 fetch 전환 |
| 팝폰-카테고리구조조정+머천트대정리 | 2/16 | 카테고리 12→6, 디지털→생활 흡수, 머천트 category_ids 매핑, 신규 75개 등록, 브랜드 마스터 230개, 불필요 커넥터 disabled |
| 팝폰-브랜드확장+풀크롤 | 2/16 | 커넥터 중복정리 14개, 이벤트URL 탐지+커넥터 65개 등록, 로고 75개 수집, brand_color 75개, 카테고리 탭바 6개, 풀크롤 243개(신규 173딜, $1.41) |
| 팝폰-카테고리언더라인+소스보호+커넥터정리 | 2/16 | 카테고리 언더라인 탭 통일(Style D), 아이콘 1.5배+간격 2배, 로고 여백 크롭 4종, 신라면→농심, 소스보호 강화(선택/드래그/복사/소스맵), 커넥터 대정리(error 35→0, 256 active) |
| 팝폰-인증시스템+어드민분리 | 2/16 | 회원 DB 6개 테이블 마이그레이션, AuthProvider+AuthSheet+OAuth콜백, 딜저장/브랜드구독 API, 마이페이지 데이터연동, 어드민 별도 프로젝트(poppon-admin) 분리, 크롤러/Cron 이동, 양쪽 빌드 성공 |
| **팝폰-키로테이션+어드민배포** | **2/16** | **Supabase 신규 키 전환(sb_publishable/sb_secret) + 레거시 Disable, Anthropic 키 재발급, ADMIN_SECRET 변경, 어드민 사이드바 경로 수정, poppon-admin GitHub 생성 + Vercel 배포 완료** |
| **팝폰-회원가입+행동추적+어드민회원관리** | **2/16** | **AuthSheet 6단계(이메일가입/로그인/본인인증placeholder/카테고리/마케팅동의), soft delete 탈퇴, tracking user_id 연동, search_logs, 어드민 회원목록/상세/행동로그, Vercel 로딩 버그 미해결** |
| **팝폰-성능최적화+UX부드러움** | **2/17** | **Supabase client.ts 싱글톤, Vercel 리전 북미→서울, DealModal 애니메이션, DealDetailClient 캐시, TopProgressBar, loading.tsx 5개, fade-in 트랜지션** |
| **팝폰-인증UX+토스트+로그아웃수정** | **2/17** | **Toast 알림 시스템, 이메일 기억하기, 홈 CTA Lucide 아이콘, 마이페이지 관심카테고리/추천브랜드, TopNav 로그아웃 오버레이 패턴 수정, signOut await+타임아웃, Enter키 submit** |

---

*마지막 업데이트: 2026-02-17 (인증 UX: Toast 알림 + 이메일 기억하기 + 홈 CTA 모던화 + 마이페이지 관심카테고리/추천브랜드 + TopNav 로그아웃 오버레이 패턴 + Enter키 submit)*
