# POPPON 어드민 파일 설치 가이드

## 파일 구조 (총 14개)
이 zip 안의 파일들을 `C:\projects\poppon\` 루트에 그대로 덮어쓰세요.

```
src/
├── app/
│   ├── admin/
│   │   ├── layout.tsx              ← 어드민 레이아웃 (사이드바)
│   │   ├── page.tsx                ← 대시보드 (기존 파일 교체)
│   │   ├── deals/
│   │   │   ├── page.tsx            ← 딜 목록 (검색/필터/상태변경)
│   │   │   ├── new/
│   │   │   │   └── page.tsx        ← 새 딜 등록
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx    ← 딜 수정
│   │   └── merchants/
│   │       ├── page.tsx            ← 브랜드 목록
│   │       ├── new/
│   │       │   └── page.tsx        ← 새 브랜드 등록
│   │       └── [id]/
│   │           └── edit/
│   │               └── page.tsx    ← 브랜드 수정
│   └── api/
│       └── admin/
│           ├── deals/
│           │   ├── route.ts        ← GET(목록), POST(생성)
│           │   └── [id]/
│           │       └── route.ts    ← GET/PUT/DELETE
│           ├── merchants/
│           │   ├── route.ts        ← GET(목록), POST(생성)
│           │   └── [id]/
│           │       └── route.ts    ← GET/PUT/DELETE
│           └── categories/
│               └── route.ts        ← GET (드롭다운용)
├── components/
│   └── admin/
│       ├── DealForm.tsx            ← 딜 등록/수정 공용 폼
│       └── MerchantForm.tsx        ← 브랜드 등록/수정 공용 폼
supabase/
└── seed_categories.sql             ← 12대 카테고리 시드 (SQL Editor에서 실행)
```

## 설치 순서

1. **zip 파일을 프로젝트 루트에 풀기**
   ```
   # C:\projects\poppon\ 에서
   # zip 내용을 그대로 덮어씁니다
   ```

2. **카테고리 시드 데이터 실행**
   - Supabase Dashboard → SQL Editor
   - `seed_categories.sql` 내용 복사 → 실행
   - 이래야 딜 등록 시 카테고리 드롭다운이 나옵니다

3. **개발 서버 재시작**
   ```
   Ctrl+C → npm run dev
   ```

4. **확인**
   - http://localhost:3000/admin → 어드민 대시보드
   - http://localhost:3000/admin/merchants/new → 브랜드 등록
   - http://localhost:3000/admin/deals/new → 딜 등록

## 사용 흐름

1. 브랜드 먼저 등록 (예: 올리브영, 쿠팡, 무신사...)
2. 딜 등록 시 해당 브랜드 선택
3. 상태를 "active"로 하면 홈 화면에 바로 노출

## 참고
- 현재 어드민 접근 제한 없음 (Phase 0에서는 로컬 개발용)
- 이후 middleware.ts에서 user role 체크 추가 예정
- Service Role Key로 RLS 우회하여 DB 직접 접근
