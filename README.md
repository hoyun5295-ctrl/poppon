# POPPON — K-RetailMeNot

한국의 모든 할인/쿠폰/프로모션을 한 곳에서.

## 초기 세팅

### 1. 의존성 설치
```bash
cd C:\projects\poppon
npm install
```

### 2. 환경 변수 설정
```bash
cp .env.local.example .env.local
# .env.local 파일에 Supabase 키 입력
```

### 3. Supabase 프로젝트 생성
1. https://supabase.com 접속 → 새 프로젝트 생성
2. Settings → API에서 URL과 anon key 복사 → .env.local에 입력
3. SQL Editor에서 `supabase/migrations/001_initial_schema.sql` 실행

### 4. 개발 서버 실행
```bash
npm run dev
```
→ http://localhost:3000 접속

### 5. shadcn/ui 컴포넌트 추가 (필요 시)
```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add input
# ...
```

## 프로젝트 구조
```
src/
├── app/                    # Next.js App Router 페이지
│   ├── layout.tsx          # 루트 레이아웃
│   ├── page.tsx            # 홈 (/)
│   ├── search/             # 검색 결과
│   ├── c/[categorySlug]/   # 카테고리 허브
│   ├── d/[dealId]/         # 딜 상세 (SEO 핵심)
│   ├── m/[merchantId]/     # 브랜드관
│   ├── submit/             # 딜 제보
│   ├── auth/               # 로그인/가입
│   ├── me/                 # 마이페이지
│   ├── admin/              # 어드민
│   ├── brand/              # 브랜드 포털
│   └── api/v1/             # API Routes
├── components/
│   ├── ui/                 # shadcn/ui 컴포넌트
│   ├── layout/             # TopNav, Footer
│   ├── deal/               # DealCard, DealShelf
│   ├── search/             # SearchBar
│   └── category/           # CategoryGrid
├── lib/
│   ├── supabase/           # Supabase 클라이언트 (client, server)
│   ├── utils/              # cn, format 유틸
│   └── constants.ts        # 상수 (카테고리, 태그, SEO)
├── types/                  # TypeScript 타입 정의
├── hooks/                  # 커스텀 훅
└── middleware.ts            # Auth 미들웨어

supabase/
└── migrations/
    └── 001_initial_schema.sql  # DB 스키마
```

## 기술 스택
- **Next.js 15** (App Router, SSR/SSG)
- **Supabase** (PostgreSQL, Auth, Storage)
- **Tailwind CSS** + **shadcn/ui**
- **Zustand** (상태관리)
- **Vercel** (배포)
