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
```

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
| DealDetailClient.tsx | `src/components/deal/DealDetailClient.tsx` |
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
| `poppon-brand-master.csv` | **✅ 6개 카테고리 230개 브랜드 마스터 리스트** |
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
| AI 크롤러 | **Puppeteer + Claude Haiku** | 커넥터 기반 |
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
| deals | ✅ | **~639 active** (풀크롤 후 +173 신규, +115 업데이트) |
| merchants | ✅ | **~339개** (기존 264 + 신규 75, 전원 로고+brand_color 보유) |
| categories | ✅ | **6개 active** / 6개 비활성 |
| crawl_connectors | ✅ | **243 active** / 136 disabled / 35 error |
| deal_actions | ✅ | 72건+ (트래킹 작동중) |
| submissions | ✅ | 0 |

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
| brand_color | varchar | 브랜드 고유 색상 (#hex), 264개 적용 |
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

### 환경변수 (.env.local)
```
ANTHROPIC_API_KEY=sk-ant-api03-... (poppon 전용 키, console.anthropic.com에서 발급)
CRON_SECRET=... (Vercel Cron 인증용, 선택)
```

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
| oliveyoung.png | 올리브영 |
| kyobobook.png | 교보문고 |
| lottecinema.jpg | 롯데시네마 |
| baskinrobbins.png | 배스킨라빈스 |
| innisfree.png | 이니스프리 |
| nintendo.jpg | 닌텐도 |
| doubleheart.png | 더블하트 |
| upang.jpg | 유팡 |

### ⚠️ 로고 미해결
- 신규 75개 머천트: 로고 없음 → 수집 필요
- 기존 저품질 ~100개: 교체 필요

---

## 브랜드 확장 히스토리

### 카테고리 구조조정 (2/16)
- **12개 → 6개**: 자동차/주유, 금융/통신 제거 (딜 플랫폼 부적합), 디지털/가전 → 생활/리빙 흡수, 건강/키즈/반려동물 보류
- **사유**: 적은 카테고리에 딜이 빽빽한 게 사용자 신뢰감 높음
- 디지털/가전 64개 딜 → 생활/리빙으로 이동, 나머지 5개 카테고리 147개 딜 hidden 처리

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

### 머천트 대정리 (2/16)
- 기존 264개 vs 마스터 230개 대조
- category_ids 일괄 매핑 (~170개)
- 신규 75개 머천트 INSERT (카테고리 포함)
- 불필요 커넥터 disabled (자동차/금융/통신/기타)

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

## 👤 회원가입 & 행동추적 (설계 완료)

### 가입 트리거
딜 저장, 브랜드 구독, 쿠폰 3회~, 피드백 → 가입 바텀시트

### 플로우
PASS 본인인증 → 관심 카테고리(3개+) → 마케팅 동의 → 완료

### 구현 현황
- ✅ deal_actions 테이블 + 인덱스 + RLS + increment 함수 (Supabase 실행 완료)
- ✅ tracking.ts + API (session_id 기반)
- ✅ DealDetail/CopyCodeButton/out 연동
- ⬜ PASS 본인인증, 가입 UI, 딜 저장, 구독, 알림톡

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
크롤러 운영 + 만료 자동화 + 디자인 보강 + 회원 기능 + **브랜드 확장**

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
- [x] 커넥터 정리 (349→243 active, 136 disabled, 35 error)
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

---

## 🔴 미해결 버그 / 즉시 처리 필요

- ⚠️ 홈 서브카피 "283개 브랜드" → 머천트 수 동적 표시 또는 업데이트 필요
- ⚠️ 크롤 실패 31개 커넥터 원인 분석 필요 (타임아웃/차단 등)
- ⚠️ 일부 구글 이미지 로고 품질 낮음 → 수동 교체 검토 (나무위키 SVG 등 외부 이미지)

---

## 🔲 진행 예정 작업

**크롤러 운영 안정화**
- [ ] 크롤 실패 31개 커넥터 원인 분석 + 수정
- [ ] 크롤 error 상태 35개 커넥터 재점검
- [ ] 일부 머천트 official_url 추가 수정 (까사미아→guud.com 등)

**DNS & 배포**
- [ ] 가비아 DNS — A: `@`→`216.198.79.1`, CNAME: `www`→`12a1927535fa4753.vercel-dns-017.com.`
- [ ] constants.ts 6개 카테고리 배포 반영 (git push)

**UI 반영**
- [ ] 홈 서브카피 머천트 수 반영

**회원 기능**
- [ ] PASS 본인인증
- [ ] 가입 UI + 딜 저장 + 브랜드 구독
- [ ] 마이페이지 기능 연결
- [ ] 카카오 알림톡 (채널 개설 필요)

**인프라**
- [ ] NCP 이관 (s2-g3 4vCPU/16GB, 월 ~13만원)
- [ ] Docker 구성 → 상용서버 이관 대비

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
| **팝폰-카테고리구조조정+머천트대정리** | **2/16** | **카테고리 12→6, 디지털→생활 흡수, 머천트 category_ids 매핑, 신규 75개 등록, 브랜드 마스터 230개, 불필요 커넥터 disabled** |
| **팝폰-브랜드확장+풀크롤** | **2/16** | **커넥터 중복정리 14개, 이벤트URL 탐지+커넥터 65개 등록, 로고 75개 수집, brand_color 75개, 카테고리 탭바 6개, 풀크롤 243개(신규 173딜, $1.41)** |

---

*마지막 업데이트: 2026-02-16 (브랜드 확장 완료 + 커넥터 65개 등록 + 로고/컬러 75개 + 풀크롤 639 active 딜)*
