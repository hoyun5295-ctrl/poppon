# POPPON 크롤러 엔진 설치 가이드

## 패키지 설치 (필수!)
```bash
cd C:\projects\poppon
npm install cheerio
```

## 파일 구조 (총 8개)
프로젝트 루트에 그대로 덮어쓰세요.

```
src/
├── lib/
│   └── crawler/
│       ├── index.ts        ← 모듈 내보내기
│       ├── fetcher.ts      ← HTTP 페처 (retry, UA, 한국어 헤더)
│       ├── parser.ts       ← HTML 파서 (cheerio, 한국어 딜 패턴)
│       └── engine.ts       ← 메인 엔진 (오케스트레이터)
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   └── crawl/
│   │   │       ├── route.ts          ← GET(현황), POST(전체 크롤)
│   │   │       └── [connectorId]/
│   │   │           └── route.ts      ← POST(단일 크롤)
│   │   └── cron/
│   │       └── crawl/
│   │           └── route.ts          ← Vercel Cron 엔드포인트
│   └── admin/
│       └── crawls/
│           └── page.tsx              ← 크롤 모니터링 대시보드
```

## 크롤링 작동 원리

### 전체 흐름
```
crawl_connectors (118개 URL)
  ↓ schedule 확인 (6h/24h/168h)
  ↓ HTTP Fetch (한국어 헤더, retry)
  ↓ HTML Parse (cheerio + 키워드 패턴)
  ↓ Deal Candidates 추출
  ↓ 중복 체크 (merchant + title 유사도)
  ↓ deals 테이블 INSERT (status='pending')
  ↓ crawl_runs 로그 기록
  ↓ 어드민에서 검수 → active로 변경
```

### 파싱 전략 (3단계)
1. **카드 요소 탐색** — `.event-list li`, `[class*="promotion"]` 등 일반적인 이벤트 리스트 패턴
2. **딜 키워드 링크** — 할인/쿠폰/세일 키워드가 포함된 `<a>` 태그
3. **OG 메타 태그** — 페이지 레벨 딜 정보 (fallback)

### 한국어 딜 키워드 패턴
- `XX% 할인`, `X,XXX원 할인`
- `1+1`, `무료배송`, `한정`, `선착순`
- `세일`, `특가`, `핫딜`, `타임딜`
- `쿠폰 코드: XXXX`
- 날짜: `2025.02.14 ~ 2025.02.28`

## 사용법

### 1. 어드민 대시보드
http://localhost:3000/admin/crawls

- "크롤 5개 실행" → 스케줄 도래한 커넥터 5개 실행
- "크롤 20개 실행" → 20개 배치
- "전체 강제 실행" → 스케줄 무시하고 전부 실행
- 각 커넥터 옆 "▶ 실행" → 단일 커넥터 테스트

### 2. API 직접 호출
```bash
# 전체 (5개 배치)
curl -X POST http://localhost:3000/api/admin/crawl \
  -H "Content-Type: application/json" \
  -d '{"limit": 5}'

# 단일 커넥터
curl -X POST http://localhost:3000/api/admin/crawl/{connectorId}

# 현황 조회
curl http://localhost:3000/api/admin/crawl
```

### 3. Cron 자동 실행 (Vercel 배포 후)
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/crawl",
    "schedule": "0 */6 * * *"
  }]
}
```

## 참고

### page_type별 처리
| page_type | 처리 방식 |
|-----------|----------|
| static_html | ✅ 직접 fetch + cheerio 파싱 |
| dynamic_js | ⚠️ fetch 시도 (SSR 안 되면 빈 결과) |
| app_only | ❌ 스킵 (웹 크롤링 불가) |
| login_required | ❌ 스킵 |

### dynamic_js 한계
- 87개 커넥터가 dynamic_js (SPA/React/Vue)
- 단순 fetch로는 JS 렌더링된 콘텐츠 못 가져올 수 있음
- Phase 1에서 Playwright/Puppeteer 또는 ScrapingBee 연동 예정
- 그래도 일부 사이트는 SSR을 지원해서 fetch로도 가능

### 크롤링된 딜 흐름
1. 크롤러가 `status='pending'`으로 INSERT
2. 어드민이 `/admin/deals`에서 검수
3. 좋은 딜 → status를 `active`로 변경 → 홈에 노출
