# mini-coupang UI

mini-coupang 백엔드 샌드박스의 구매자·판매자 포털 SPA.

## 스택

Vite 7 · React 19 · TypeScript strict · React Router v7 · TanStack Query v5 ·
React Hook Form + Zod · Tailwind v4 + shadcn/ui 스타일 · pnpm 9.15.

## 실행

```bash
# 1. 백엔드 기동 (터미널 1)
cd ../backend
./gradlew bootRun  # http://localhost:8080

# 2. 프론트엔드 기동 (터미널 2)
cd mini-coupang/ui
pnpm install
pnpm dev           # http://localhost:5173
```

Vite dev 서버가 `/api/*`, `/auth/*`를 `http://localhost:8080`으로 프록시해서 same-origin으로 `HttpSession` 쿠키가 동작합니다. 백엔드 CORS 설정 없이 돌아갑니다.

## 포털 구조

**구매자 포털** (`/`)
- `/` — 랜딩 (검색 바)
- `/signup` / `/login` — 구매자 가입 / 로그인
- `/search?q=...` — 하이브리드 검색 결과 + 카테고리·가격 필터
- `/me` — 간단 프로필 (read-only)

**판매자 포털** (`/seller`)
- `/seller/signup` / `/seller/login` — 판매자 가입 / 로그인
- `/seller/products` — 내 상품 목록 + "상품 등록" 버튼 → 모달 폼
- `/seller/me` — 판매자 프로필 (read-only)

같은 Account가 Member와 Seller 프로필 모두 가지면 한 세션으로 양쪽 포털 진입 가능합니다.

## 스크립트

- `pnpm dev` — dev 서버 (5173)
- `pnpm build` — 프로덕션 빌드 → `dist/`
- `pnpm preview` — `dist/` 서빙
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm lint` — ESLint
- `pnpm test` — Vitest (유틸 테스트)

## 구조

```
src/
├── main.tsx              # Entry: Router + QueryClientProvider + Toaster
├── App.tsx               # 라우트 트리
├── index.css             # Tailwind + CSS 토큰
├── lib/                  # api-client, query-client, cn
├── components/ui/        # shadcn-style primitives (Button, Input, Label, Dialog)
├── layouts/              # BuyerLayout, SellerLayout
├── guards/               # RequireBuyer, RequireSeller
└── features/
    ├── auth/             # 로그인·회원가입 (구매자·판매자)
    ├── me/               # 프로필 조회
    ├── search/           # 하이브리드 검색
    └── seller-products/  # 내 상품 + 등록 모달
```
