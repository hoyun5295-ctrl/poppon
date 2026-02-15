# POPPON 프로젝트 STATUS

## 프로젝트 개요
- **제품명**: POPPON (K-RetailMeNot)
- **기획서 버전**: v1.2.1
- **한줄 정의**: 한국의 모든 할인/쿠폰/프로모션을 한 곳에 모아, 검색·필터·카테고리·캘린더·큐레이션으로 탐색 → 저장/구독/알림으로 DB 축적 → TargetUP-AI CRM-Outside 고단가 타겟마케팅으로 수익화하는 딜 플랫폼
- **MVP 우선순위**: A(온라인 쿠폰/프로모션 코드) → B(앱쿠폰/링크형) → C(오프라인 이벤트)
- **핵심 방향**: 할인정보를 보기 쉽게 모아서 DB 축적 → 수익화 (RetailMeNot 코드복사/캐시백 모델과 다름)
- **프로젝트 경로**: `C:\projects\poppon`
- **도메인**: `poppon.kr` (가비아, DNS 설정 필요)
- **배포 URL**: `https://poppon.vercel.app` ✅ 라이브
- **GitHub**: `https://github.com/hoyun5295-ctrl/poppon` (private)

---

## ⚠️ 개발 원칙
> **절대 원칙**: 시키기 전에 코드/파일 만들지 않는다.
> 반드시 **기존 파일 파악 → 설계 의논 → 합의 후 구현** 순서.
> 기존 코드 망가뜨리지 않도록 현재 구조부터 확인한다.

---

## 핵심 사용자 흐름 (Top 5)
1. 홈 → 검색/카테고리 탐색 → 딜 상세(모달) → 코드복사/사이트이동
2. 딜 상세 → "저장/알림" → 휴대폰 가입/동의 → 저장 완료
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

## 🚨 다음 채팅 시작 시 즉시 확인사항

### 1. 크롤러 v3 파일 적용 확인
3개 파일 덮어쓰기 확인:
- `src/lib/crawl/ai-engine.ts` — v3 (병렬+**DB 해시 변경감지**+속도최적화)
- `src/app/api/admin/ai-crawl/route.ts` — v3 (content_hash DB 읽기/저장)
- `src/lib/crawl/save-deals.ts` — v2 (title 기반 중복체크+배치내 중복방지)

**확인 방법**: ai-engine.ts 상단에 "v3" / save-deals.ts 상단에 "v2"

### 2. DB 컬럼 추가 확인
```sql
SELECT content_hash, hash_updated_at FROM crawl_connectors LIMIT 1;
```
에러나면 실행:
```sql
ALTER TABLE crawl_connectors 
ADD COLUMN content_hash VARCHAR(32),
ADD COLUMN hash_updated_at TIMESTAMPTZ;
```

### 3. 재크롤링 결과 확인
```sql
SELECT COUNT(*) FROM deals WHERE status = 'active';
SELECT status, COUNT(*) FROM crawl_runs WHERE started_at > NOW() - INTERVAL '24 hours' GROUP BY status;
```

### 4. 중복 딜 잔존 확인
```sql
SELECT merchant_id, title, COUNT(*) as cnt FROM deals WHERE status = 'active' GROUP BY merchant_id, title HAVING COUNT(*) > 1 ORDER BY cnt DESC LIMIT 10;
```
있으면 정리:
```sql
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY merchant_id, title ORDER BY created_at ASC) as rn
  FROM deals WHERE status = 'active'
)
UPDATE deals SET status = 'hidden' WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
```

### 5. 커넥터 현황 확인
```sql
SELECT status, COUNT(*) FROM crawl_connectors GROUP BY status;
-- 기대값: active ~228, disabled ~96, error ~25
```

### 6. deal_actions 테이블 확인
```sql
SELECT COUNT(*) FROM deal_actions;
```
에러나면 아래 "회원가입 & 행동추적" 섹션의 SQL 실행

---

## 📁 참조 파일 목록

### 컴포넌트 / UI
| 파일 | 경로 |
|------|------|
| DealCard.tsx | `src/components/deal/DealCard.tsx` |
| DealShelf.tsx | `src/components/deal/DealShelf.tsx` |
| DealGrid.tsx | `src/components/deal/DealGrid.tsx` |
| DealDetail.tsx | `src/components/deal/DealDetail.tsx` |
| DealModal.tsx | `src/components/deal/DealModal.tsx` |
| CopyCodeButton.tsx | `src/components/deal/CopyCodeButton.tsx` |
| TopNav.tsx | `src/components/layout/TopNav.tsx` |
| Footer.tsx | `src/components/layout/Footer.tsx` |
| SourceProtection.tsx | `src/components/layout/SourceProtection.tsx` |
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

### 데이터 / 타입 / 유틸
| 파일 | 경로 |
|------|------|
| database.ts (타입) | `src/types/database.ts` |
| index.ts (re-export) | `src/types/index.ts` |
| deals.ts (데이터) | `src/lib/deals.ts` |
| tracking.ts (행동추적) | `src/lib/tracking.ts` |
| format.ts (유틸) | `src/lib/utils/format.ts` |
| constants.ts | `src/lib/constants.ts` |
| Supabase 서버 | `src/lib/supabase/server.ts` |
| Supabase 브라우저 | `src/lib/supabase/client.ts` |

### 크롤러 / API
| 파일 | 경로 |
|------|------|
| AI 크롤 엔진 (v3) | `src/lib/crawl/ai-engine.ts` |
| 딜 저장 (v2) | `src/lib/crawl/save-deals.ts` |
| Cron 배치 | `src/app/api/cron/crawl/route.ts` |
| AI 크롤 API (v3) | `src/app/api/admin/ai-crawl/route.ts` |
| AI 크롤 API (단일) | `src/app/api/admin/ai-crawl/[connectorId]/route.ts` |
| 제보 API | `src/app/api/submit/route.ts` |
| 행동추적 API | `src/app/api/actions/route.ts` |
| 클릭 트래킹 | `src/app/out/[dealId]/route.ts` |
| 어드민 인증 | `src/app/api/admin/auth/route.ts` |

### 스크립트 (크롤러/로고)
| 파일 | 경로 | 설명 |
|------|------|------|
| 크롤러 테스트 | `scripts/test-ai-crawl.ts` | 변경 감지 포함 v2 |
| 이벤트 페이지 탐지 | `scripts/detect-event-pages.ts` | 홈페이지→이벤트URL 자동 찾기 |
| 머천트 로고 v2 | `scripts/fetch-merchant-logos.ts` | HTTP apple-touch-icon 수집 |
| 머천트 로고 v3.1 | `scripts/fetch-merchant-logos-v3.ts` | Puppeteer 사이트 접속 수집 |
| 구글 이미지 로고 | `scripts/fetch-logos-google.ts` | `"[브랜드명] CI"` 검색 크롤링 |
| OG 이미지 수집 | `scripts/fetch-og-images.ts` | landing_url에서 og:image 추출 |

### 데이터 파일
| 파일 | 설명 |
|------|------|
| `poppon_brands_filtered.csv` | 브랜드 494개 (원본) |
| `crawl-targets-final.csv` | 최종 크롤링 대상 187개 |
| `debug-ai-crawl/event-pages-detected.csv` | 이벤트 페이지 탐지 결과 494개 |
| `debug-ai-crawl/crawl-targets.csv` | 이벤트 URL 확보 223개 |

---

## 기술 스택
| 영역 | 기술 | 비고 |
|------|------|------|
| Frontend + Backend | **Next.js 15 (App Router)** | SSR/SSG, API Routes |
| Database + Auth | **Supabase (PostgreSQL)** | RLS, Phone OTP |
| 스타일링 | **Tailwind CSS + shadcn/ui** | Pretendard |
| 상태관리 | **Zustand** | 경량 |
| 배포 | **Vercel** | Git push 자동 배포, Cron |
| 검색 | **PostgreSQL 풀텍스트 (pg_trgm)** | 초기 1만건 수준 충분, 추후 Elasticsearch |
| AI 크롤러 | **Puppeteer + Claude Haiku** | 228개 커넥터 |
| 본인인증 | **PASS** | 이관 예정 |
| 알림 | **카카오 알림톡** | 채널 개설 필요 |

---

## 프론트엔드 라우팅 구조

### 딜 상세 (하이브리드 모달)
```
src/app/
├── layout.tsx               — modal parallel route slot 포함
├── @modal/
│   ├── default.tsx          — 모달 없을 때 null
│   └── (.)d/[slug]/
│       └── page.tsx         — 인터셉팅 모달 (리스트에서 클릭 시)
├── d/[slug]/
│   └── page.tsx             — SEO 풀 페이지 (직접접속/구글봇)
├── m/[merchantSlug]/
│   └── page.tsx             — 브랜드관
├── c/[categorySlug]/
│   └── page.tsx             — 카테고리 허브
├── search/
│   └── page.tsx             — 검색 결과
├── submit/
│   └── page.tsx             — 유저 제보
├── me/
│   └── page.tsx             — 마이페이지
├── auth/
│   └── page.tsx             — 로그인/가입
```
- 홈에서 클릭 → 모달 (URL 변경, 뒤로가기=닫힘)
- `/d/:slug` 직접접속 → 풀 페이지 렌더링 (SSR, SEO)
- 한글 slug → decodeURIComponent 처리 필요 (deals.ts)
- 머천트/카테고리 slug는 영문 (merchants: innisfree, categories: beauty)

### 미들웨어 보호 경로
- `/brand/*` — 로그인 필수 (→ /auth 리다이렉트)
- `/submit`, `/me` — 비로그인 접근 허용 (페이지 내에서 유도)

---

## API 구조 요약

### Public (비로그인)
- `GET /deals` — 딜 목록/검색 (q, category, merchant, benefit_tag, channel, date, sort)
- `GET /deals/:id` — 딜 상세
- `GET /categories` — 카테고리 트리
- `GET /merchants` / `GET /merchants/:id`
- `GET /home` — 홈 섹션 (sponsored, trending, new, ending_soon, categories)
- `POST /api/submit` — 유저 제보 ✅

### Member (로그인)
- `POST /auth/phone/request` / `POST /auth/phone/verify` / `POST /auth/logout`
- `GET|PUT /me` — 내 정보
- 저장: `POST|DELETE|GET /me/saved-deals`
- 구독: `POST|DELETE|GET /me/follows/merchants|categories`
- 알림: `PUT /me/notification-preferences` (kakao/sms/email/push, 빈도, quiet hours)
- 동의: `PUT /me/consents`
- 액션: `POST /deals/:id/actions` (view, click_out, copy_code, save, share)
- 피드백: `POST /deals/:id/feedback` (work/fail)
- 제보: `POST /submissions` / `GET /submissions/my`

### Brand Portal
- `POST /brand/auth/login`
- `GET|PUT /brand/profile`
- `GET|POST|PUT /brand/deals` + `POST /brand/deals/:id/submit`
- `GET /brand/stats`

### Admin
- `GET|PATCH /admin/deals` (approve/reject/hide/merge)
- `GET|POST|PUT /admin/connectors` + test
- `GET|POST /admin/ai-crawl` — AI 크롤 현황/실행 ✅
- `POST /admin/ai-crawl/:connectorId` — 단일 AI 크롤 ✅
- `GET|POST|PUT /admin/ads/*`
- `GET /admin/affiliate/*` (runs, offers, sync, health)

### Cron
- `GET /api/cron/crawl` — 일일 자동 크롤 배치 ✅

### 트래킹
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

## 카테고리 (12 대카테고리)
| name | slug |
|------|------|
| 패션 | fashion |
| 뷰티 | beauty |
| 식품/배달 | food |
| 생활/리빙 | living |
| 디지털/가전 | digital |
| 여행/레저 | travel |
| 문화/콘텐츠 | culture |
| 키즈/교육 | kids |
| 건강/헬스 | health |
| 반려동물 | pets |
| 자동차/주유 | auto |
| 금융/통신 | finance |

---

## DB 테이블 (주요)
| 테이블 | 상태 | 데이터 |
|--------|------|--------|
| deals | ✅ | ~644 active (중복 정리 진행) |
| merchants | ✅ | 283개 |
| categories | ✅ | 12 대카테고리 |
| crawl_connectors | ✅ | **228 active** / 96 disabled / 25 error |
| deal_actions | ✅ 코드완료 | SQL 실행 필요 |
| submissions | ✅ | 0 |

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

### merchants 테이블 (283개)
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | uuid | PK |
| name | varchar | |
| slug | varchar | SEO URL (영문: oliveyoung, innisfree 등) |
| logo_url | text | Puppeteer/구글 이미지 수집 |
| brand_color | varchar | 브랜드 고유 색상 (#hex), 264개 적용 |
| description | text | |
| official_url | text | 283개 전부 있음 |
| category_ids | uuid[] | |
| is_verified | boolean | |
| follower_count | integer | |
| active_deal_count | integer | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### categories 테이블 (12 대카테고리)
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | uuid | PK |
| parent_id | uuid | nullable, 셀프조인 |
| name | varchar | 한글 (패션, 뷰티 등) |
| slug | varchar | 영문 (fashion, beauty 등) |
| description | text | |
| icon | varchar | |
| sort_order | integer | |
| is_active | boolean | |
| deal_count | integer | |
| depth | integer | 0=대, 1=중, 2=소 |
| created_at | timestamptz | |

### crawl_connectors 테이블 (v3 컬럼 추가)
```
id, name, merchant_id, source_url, config, status, fail_count,
last_run_at, created_at, updated_at,
content_hash VARCHAR(32),       -- ✅ v3 추가: MD5 해시
hash_updated_at TIMESTAMPTZ     -- ✅ v3 추가: 해시 저장 시점
```

### deal_actions 테이블
id, deal_id, user_id(nullable), session_id(ppn_sid), action_type(view/click_out/copy_code/save/share), metadata(jsonb), created_at

### 조인 관계
```
deals.merchant_id → merchants.id
deals.category_id → categories.id (FK: deals_category_id_fkey)
deals.subcategory_id → categories.id (FK: deals_subcategory_id_fkey)
categories.parent_id → categories.id (셀프조인)
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

---

## AI 크롤러 v3

### 전략 전환 히스토리
1. **static_html 파싱** → 실패 (한국 사이트 대부분 JS 렌더링 + AJAX)
2. **API 직접 호출** → 성공 (스타벅스 36개, 클리오 14개) 단, 162개 사이트별 API 찾는 건 비현실적
3. **Puppeteer + Claude AI** → ✅ 최종 채택. URL만 등록하면 자동 추출

### 아키텍처
```
브랜드 URL (228개 active)
  → Puppeteer (이미지 차단, 15s 타임아웃)
    → MD5 해시 vs DB content_hash 비교
      → 변경 없음 → 스킵 (AI 호출 안 함)
      → 변경 있음 → Claude Haiku 파싱 + 후처리 필터
        → save-deals v2 (URL+title 중복체크)
        → content_hash DB에 저장
```

### v1 → v2 → v3 변경 이력
| 항목 | v1 | v2 | v3 |
|------|----|----|-----|
| 타임아웃 | 30초 | 15초 | 15초 |
| 리소스 차단 | 폰트/미디어/CSS | + 이미지 | + 이미지 |
| 배치 | 순차 1개 | 병렬 3개 | 병렬 3개 |
| 변경감지 | 없음 | 메모리 해시 (재시작 시 초기화) | **DB 해시 (영구 유지)** |
| 중복 체크 | URL만 | URL + title | URL + title |
| 2회차 소요 | 40~50분 | 재시작하면 또 풀크롤 | **~5분 (서버 재시작해도)** |
| 2회차 비용 | $4.32 | 재시작하면 또 $4.32 | **~$0.50** |

### 전체 크롤링 실적
| 항목 | 수치 |
|------|------|
| 대상 | 349개 커넥터 (전체) |
| 성공 | 272/349 (78%) |
| 신규 딜 | **773개** |
| 업데이트 딜 | **807개** |
| 비용 | **$4.32** |

### 커넥터 정리 결과
| 상태 | 수량 | 설명 |
|------|------|------|
| **active** | **228개** | 실제 크롤 대상 |
| disabled | 96개 | URL 중복 27 + 브랜드 중복 69 |
| error | 25개 | 실패 5회 이상 |
| **합계** | **349개** | |

정리 내역: 올리브영 10개→1개, LG전자 4개→1개, YES24/오늘의집/G마켓/쿠팡/무신사/CGV 등 55개 브랜드 중복 제거

### 예상 성능
| 항목 | 첫 실행 | 2회차~ |
|------|---------|--------|
| 대상 | 228개 | 228개 (변경분만 AI) |
| 소요시간 | ~25분 | **~5분** |
| API 비용 | ~$3 | **~$0.50** |
| 배치 수 | 76 (÷3) | ~76 (대부분 스킵) |

### 비용 예측 (187개 브랜드 기준)
| 방식 | 월 비용 |
|------|--------|
| 매번 전부 AI 호출 | ~$35 (5만원) |
| 변경 감지 적용 (20% 변경) | ~$7 (1만원) |

### 환경변수 (.env.local)
```
ANTHROPIC_API_KEY=sk-ant-api03-... (poppon 전용 키, console.anthropic.com에서 발급)
CRON_SECRET=... (Vercel Cron 인증용, 선택)
```

### Anthropic API 키 관리
- `poppon` 키: POPPON 크롤러 전용 (Haiku 모델)
- `harold-onboardi...` 키: 한줄로AI 전용 (Sonnet 모델)
- 같은 계정, 키 분리로 비용 추적 가능

---

## 머천트 로고 수집 히스토리

### 전략 변천
| 버전 | 방식 | 결과 |
|------|------|------|
| v2 | HTTP로 apple-touch-icon 경로 추측 | 108 고품질 + 168 저품질(Google Favicon) + 7 실패 |
| v3.1 | Puppeteer 사이트 접속 + DOM 파싱 | 59개 교체 (SVG 13 + apple-touch 37 + header-logo 9) |
| 구글 이미지 검색 | Puppeteer `"[브랜드명] CI"` 검색 | 테스트 10/10 성공, 전체 ~102개 실행 |

### 현재 로고 품질 분포 (추정)
| 품질 | 수량 | 설명 |
|------|------|------|
| excellent (SVG) | ~15개 | 벡터, 무한 확대 가능 |
| good (apple-touch/manifest/구글) | ~150개 | 128px+ 래스터 |
| **수동 교체 (public/logos/)** | **9개** | 삼성, 올리브영, 교보문고, 롯데시네마, 배스킨라빈스, 이니스프리, 닌텐도, 더블하트, 유팡 |
| acceptable (header-logo) | ~20개 | 사이트에서 추출한 로고 img |
| 미수집/저품질 | ~90개 | 구글 검색으로 보완 |

### 수동 교체 로고 (public/logos/)
| 파일명 | 머천트 |
|--------|--------|
| samsung.svg | 삼성닷컴 |
| oliveyoung.png | 올리브영 |
| kyobobook.png | 교보문고 |
| lottecinema.jpg | 롯데시네마 |
| baskinrobbins.png | 배스킨라빈스 |
| innisfree.png | 이니스프리 |
| nintendo.jpg | 닌텐도 |
| doubleheart.png | 더블하트 |
| upang.jpg | 유팡 |

---

## 브랜드 리스트 현황
| 항목 | 수량 | 비고 |
|------|------|------|
| Gemini 조사 원본 | 601개 | 12개 카테고리 |
| 1차 필터링 (명품/K-pop 등 제거) | 494개 | 107개 제외 |
| 이벤트 URL 자동 탐지 | 223개 | detect-event-pages.ts |
| 2차 필터링 (게임사/하드웨어/중복 등) | -50개 | 쓸모없는 브랜드 제거 |
| 대형 수동 추가 | +14개 | 올리브영, CU, GS25, 쿠팡, 유니클로 등 |
| **최종 크롤링 대상** | **187개** | 1차 90 + 2차 97 |
| DB 시드 완료 (merchants) | 283개 | 기존 145 + 신규 병합 |
| DB 시드 완료 (connectors) | 349개 | 기존 162 + 신규 187 |

### 제외된 브랜드
- 명품 49개 (구찌, 샤넬, 루이비통 등 — 온라인 쿠폰 없음)
- K-pop 20개 (BTS, 뉴진스 등 — 딜 무관)
- 제약사/약 브랜드 27개 (셀트리온, 판콜 등 — 소비자 이벤트 없음)
- 해외 전용 서비스 11개 (디즈니+, 스포티파이 등)
- 게임사 (엔씨소프트, 넥슨, 크래프톤 — 인게임 이벤트)
- 하드웨어 (고프로, 레노버, 에이수스 — 소비자 쿠폰 없음)
- 중복 URL (같은 모회사 이벤트 페이지 공유)

---

## 👤 회원가입 & 행동추적 (설계 완료)

### 가입 트리거
딜 저장, 브랜드 구독, 쿠폰 3회~, 피드백 → 가입 바텀시트

### 플로우
PASS 본인인증 → 관심 카테고리(3개+) → 마케팅 동의 → 완료

### 구현 현황
- ✅ deal_actions + tracking.ts + API (session_id 기반)
- ✅ DealDetail/CopyCodeButton/out 연동
- ⬜ PASS 본인인증, 가입 UI, 딜 저장, 구독, 알림톡

### deal_actions SQL (Supabase 실행 필요)
```sql
CREATE TABLE IF NOT EXISTS deal_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id VARCHAR(64),
  action_type VARCHAR(30) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_deal_actions_deal_id ON deal_actions(deal_id);
CREATE INDEX idx_deal_actions_session_deal ON deal_actions(session_id, deal_id, action_type);
CREATE INDEX idx_deal_actions_user_id ON deal_actions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_deal_actions_created ON deal_actions(created_at);
CREATE INDEX idx_deal_actions_type ON deal_actions(action_type);
ALTER TABLE deal_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert actions" ON deal_actions FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can read actions" ON deal_actions FOR SELECT USING (auth.role() = 'service_role');
CREATE OR REPLACE FUNCTION increment_view_count(deal_id_input UUID) RETURNS void AS $$ BEGIN UPDATE deals SET view_count = COALESCE(view_count, 0) + 1 WHERE id = deal_id_input; END; $$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION increment_click_out_count(deal_id_input UUID) RETURNS void AS $$ BEGIN UPDATE deals SET click_out_count = COALESCE(click_out_count, 0) + 1 WHERE id = deal_id_input; END; $$ LANGUAGE plpgsql SECURITY DEFINER;
```

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

## 개발 Phase & 진행 상황

### Phase 0 — ✅ 완료
| 항목 | 비고 |
|------|------|
| **DB/스키마** | 18개 테이블 + RLS + 함수 + 트리거 |
| 카테고리 택소노미 | 12대 카테고리 시드 완료 |
| 태그 사전 | 11종 benefit_tags 정의 |
| 브랜드(Merchant) 테이블 | 283개 시드 + brand_color 264개 적용 |
| 제휴 네트워크 테이블 | affiliate_networks, affiliate_offers, affiliate_merchant_map |
| **사용자 웹 (SEO 우선)** | |
| / 홈 | 트렌딩/신규/마감임박 3개 섹션, 브랜드당 2개 중복제거 |
| /search 검색 결과 | 풀텍스트 검색(ilike) + 카테고리/혜택/채널 필터 + 정렬 4종 + 페이지네이션 |
| /c/:categorySlug 카테고리 허브 | 카테고리별 그라디언트 헤더 + 서브카테고리 칩 + 정렬 + 페이지네이션 |
| /d/:slug 딜 상세 | **하이브리드 모달** — 리스트 클릭=모달, 직접접속=풀페이지(SEO) |
| /m/:merchantSlug 브랜드관 | 프로필 + 구독버튼 + 진행중/종료 탭 + 정렬 + 페이지네이션 |
| /submit 제보하기 | URL+코멘트 폼, 중복체크, 비로그인 가능 |
| /auth 로그인/가입 | 휴대폰 인증 UI (Supabase OTP 미연결) |
| /me 마이페이지 | 비로그인→로그인유도 UI, 저장딜/구독/설정 3탭 (UI shell) |
| **어드민** | 대시보드 + 딜 CRUD + 머천트 CRUD + 크롤 관리 |
| **AI 크롤러** | Puppeteer + Claude Haiku, 변경 감지, 이벤트 페이지 자동 탐지 |
| **전체 크롤링** | 272/349 성공, 신규 773 + 업데이트 807, $4.32 |
| **머천트 로고** | v2 + v3.1 + 구글 이미지 검색 + 수동교체 9종, brand_color 264개 |
| **카테고리 페이지 리디자인** | 그라디언트 헤더 제거 → 탭바(12개 가로스크롤) + Lucide 아이콘 + 컴팩트 헤더 |
| **만료 자동화** | filterActiveDeals + Cron 일괄 전환 |
| **모바일 반응형** | 12파일 수정, 모바일 퍼스트 |
| **행동추적** | deal_actions + tracking.ts + API |
| **Vercel 배포** | Git push 자동 배포 라이브 |

### Phase 1 — 진행중
| 항목 | 상태 |
|------|------|
| 크롤러 v3 (병렬+DB해시+중복방지) | ✅ |
| 커넥터 정리 (349→228 active) | ✅ |
| deal_actions 로깅 | ✅ 코드 (SQL 필요) |
| Vercel Cron | ✅ 설정 (DNS 후 활성화) |
| PASS 본인인증 + 가입 | ⬜ |
| 딜 저장 / 브랜드 구독 | ⬜ |
| 카카오 알림톡 | ⬜ |

### Phase 2 — 미착수
브랜드 포털 / 스폰서 슬롯 / 성과 정산

---

## 🔥 다음 작업 (우선순위)

### 즉시
1. **"다음 채팅 시작 시 즉시 확인사항" 1~5 SQL 전부 실행**
2. **deal_actions SQL 실행**
3. **가비아 DNS** — A: `@`→`216.198.79.1`, CNAME: `www`→`12a1927535fa4753.vercel-dns-017.com.`
4. **v3로 첫 풀크롤 실행** → 해시 DB에 쌓임 → 2회차부터 5분

### 보강
5. filterActiveDeals 카테고리/브랜드관 적용
6. 로고 추가 교체 (나머지 저품질 ~100개)

### 회원
7. PASS 본인인증
8. 가입 UI + 딜 저장 + 구독
9. 마이페이지

---

## 만료 자동화
- filterActiveDeals: 홈/검색 ✅, 카테고리/브랜드관 ⬜
- Cron 일괄 전환: 매일 06:00 KST

---

## 배치 스케줄
- **현재**: Vercel Cron — 매일 06:00 KST (21:00 UTC)
- **추후**: 06:00 / 12:00 / 18:00 / 23:00
- **순서**: ① Affiliate Ingest → ② Crawl Ingest → ③ Expire/Quality 재계산 → ④ 리포트 생성

---

## 🖥️ 인프라 설계 (합의, 미착수)
- **현재**: Vercel Pro ($20/월) — 개발 중 사용, NCP 이관 전까지
- **이관 계획**: NCP s2-g3 (4vCPU/16GB) ~8만 + Supabase Pro ~3.4만 + Haiku ~1.4만 = **월 ~13만원**
- Docker 구성 → 상용서버 이관 대비

---

## 📱 모바일 반응형 (✅ 완료)
12파일 수정, 모바일 퍼스트, 44px 터치 타겟, safe-area, 바텀시트 패턴

---

## DealCard v4.2
흰색 배경, brand_color 액센트, 로고 비율 동적, 쿠폰 점선, 마감임박 7일 이내

---

## 알려진 이슈
- 한글 slug → decodeURIComponent 필수
- Supabase 조인 FK 명시 필수
- 중복 merchant: 삼성닷컴+삼성전자가전 병합 완료 / 올리브영은 1개만 남음 / 나머지 빈 껍데기(LG생활건강, 롯데카드 등) 추후 크롤러 추가용으로 유지
- 모달 내부 링크 → `<a>` hard navigation
- categories.deal_count DB 값 0 → active 딜 실제 집계로 대체
- 병렬 크롤 concurrency 기본 3 (API body에서 조절, 최대 5)
- brand_color: 264/283개 적용, 밝기 자동 판단 (W3C 휘도) → 흰/검 텍스트 자동 결정
- 딜 이미지: thumbnail_url은 DealCard에서 사용 안 함 (로고 중심 디자인)
- Puppeteer waitForTimeout: 신버전에서 제거됨 → `new Promise(r => setTimeout(r, ms))` 사용
- Vercel 빌드: Supabase `.rpc()` 반환 PromiseLike에 `.catch()` 불가 → `.then(() => {}, () => {})` 사용
- Vercel 빌드: 타입 체크 로컬보다 엄격 — SaveResult 등 인터페이스 필수 필드 누락 주의
- 로고 수동교체: `public/logos/` + DB logo_url 동시 업데이트 필요

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
| **팝폰-크롤링최적화+회원설계+행동추적** | **2/16** | **크롤러 v3 (DB해시), save-deals v2, 커넥터 349→228 정리, 중복딜 정리, deal_actions, 회원설계, NCP 인프라, 외주리뷰** |
| **팝폰-STATUS복원+로고+카테고리리디자인** | **2/16** | **STATUS.md 복원(355→750줄), 삼성 머천트 병합, 로고 9종 수동교체, 카테고리 페이지 리디자인(탭바+Lucide), Vercel 빌드 에러 3건 수정, Vercel Pro 전환** |

---

*마지막 업데이트: 2026-02-16 (STATUS 복원 + 로고 9종 + 삼성 병합 + 카테고리 리디자인 + Vercel Pro)*
