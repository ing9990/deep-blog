# Phase 2 — 핵심 UI 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Backend Notes의 인덱스 페이지·글 상세 페이지를 벤치마크 수준의 디자인과 다크모드, 서버 사이드 필터/검색/정렬, TOC 스크롤 하이라이트까지 포함해 완성한다.

**Architecture:** Server Component 우선. 필터/검색/정렬 로직은 `lib/filters.ts`의 순수 함수로 분리하고, 클라이언트 컴포넌트는 URL 쿼리 파라미터만 변경한다. shadcn/ui 토큰(CSS 변수)으로 라이트/다크 테마를 쌍으로 정의하고 `next-themes`로 전환. Velite 내장 `s.toc()` + `rehype-slug` 조합으로 TOC를 빌드 타임에 생성.

**Tech Stack:** Next.js 15 (App Router), TypeScript strict, Velite 0.2, Tailwind CSS v4, shadcn/ui, next-themes, Pretendard Variable (next/font/local), Vitest, rehype-slug.

**Spec:** `docs/superpowers/specs/2026-04-14-phase-2-core-ui-design.md` (커밋 `22766b2` 이후 갱신본)

---

## File Structure

```
app/
├── layout.tsx                    [수정]
├── page.tsx                      [재작성]
├── globals.css                   [재작성]
└── posts/[slug]/page.tsx         [수정]

components/
├── ui/                           [shadcn CLI 생성]
│   ├── button.tsx
│   ├── input.tsx
│   ├── badge.tsx
│   └── select.tsx
├── blog/                         [신규]
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── PostCard.tsx
│   ├── PostList.tsx
│   ├── PostMeta.tsx
│   ├── ReadingTime.tsx
│   ├── TableOfContents.tsx
│   ├── TagChip.tsx
│   ├── TagFilterBar.tsx
│   ├── SearchBar.tsx
│   ├── SortSelect.tsx
│   └── ThemeToggle.tsx
├── mdx/
│   └── index.ts                  [수정]
└── providers/
    └── ThemeProvider.tsx         [신규]

lib/
├── posts.ts                      [기존]
├── filters.ts                    [신규]
├── reading-time.ts               [신규]
├── toc.ts                        [신규]
└── utils.ts                      [신규]

content/posts/
├── hello-world.mdx               [수정]
├── database-index-basics.mdx     [신규 — 더미]
├── jvm-gc-intro.mdx              [신규 — 더미]
└── kafka-consumer-group.mdx      [신규 — 더미]

tests/
├── filters.test.ts               [신규]
├── reading-time.test.ts          [신규]
└── toc.test.ts                   [신규]

public/fonts/
└── PretendardVariable.woff2      [신규, ~1.2MB]

velite.config.ts                  [수정]
tailwind.config.ts                [수정]
components.json                   [신규 — shadcn]
```

---

## Stage 1 — 디자인 토큰 + 폰트 인프라

Phase 1의 기존 페이지가 깨지지 않는 선에서 토큰·폰트·테마 시스템을 구축한다.

### Task 1: Pretendard Variable 폰트 다운로드 및 배치

**Files:**
- Create: `public/fonts/PretendardVariable.woff2`

- [ ] **Step 1: Create fonts directory**

```bash
mkdir -p public/fonts
```

- [ ] **Step 2: Download Pretendard Variable woff2 from official release**

```bash
curl -L -o public/fonts/PretendardVariable.woff2 \
  https://github.com/orioncactus/pretendard/raw/main/packages/pretendard/dist/web/variable/woff2/PretendardVariable.woff2
```

Expected: ~1.2MB file downloaded. Verify:

```bash
ls -lh public/fonts/PretendardVariable.woff2
```

Expected output contains `1.2M` (or similar around 1.1–1.3MB).

- [ ] **Step 3: Commit font file**

```bash
git add public/fonts/PretendardVariable.woff2
git commit -m "feat(fonts): add Pretendard Variable woff2 for self-hosting"
```

### Task 2: Install shadcn/ui and runtime dependencies

**Files:**
- Create: `components.json`
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install runtime dependencies for utils and theming**

```bash
pnpm add clsx tailwind-merge next-themes lucide-react
```

Expected: `package.json` dependencies updated, `pnpm-lock.yaml` modified.

- [ ] **Step 2: Initialize shadcn with non-interactive defaults**

Because shadcn CLI's init prompts are interactive, pre-create `components.json` with our desired config before running `add`, avoiding the init wizard entirely.

Write `components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml components.json
git commit -m "build: add clsx, tailwind-merge, next-themes, lucide-react + shadcn config"
```

### Task 3: Create `lib/utils.ts` with `cn()` helper

**Files:**
- Create: `lib/utils.ts`

- [ ] **Step 1: Write `cn()` helper**

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: exit 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/utils.ts
git commit -m "feat(lib): add cn() class name helper"
```

### Task 4: Rewrite `app/globals.css` with design tokens

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace file contents**

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-border-strong: var(--border-strong);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-accent: var(--accent);
  --color-ring: var(--ring);
  --color-keyword: var(--keyword);
  --color-keyword-bg: var(--keyword-bg);

  --font-sans: var(--font-pretendard), ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, "JetBrains Mono", monospace;

  --radius-sm: 6px;
  --radius: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
}

:root {
  --background: #FFFFFF;
  --foreground: #09090B;
  --muted: #F4F4F5;
  --muted-foreground: #71717A;
  --border: #E4E4E7;
  --border-strong: #D4D4D8;
  --primary: #3B82F6;
  --primary-foreground: #FFFFFF;
  --accent: #EFF6FF;
  --ring: #3B82F6;
  --keyword: #6366F1;
  --keyword-bg: #EEF2FF;
}

[data-theme="dark"] {
  --background: #09090B;
  --foreground: #FAFAFA;
  --muted: #18181B;
  --muted-foreground: #A1A1AA;
  --border: #27272A;
  --border-strong: #3F3F46;
  --primary: #60A5FA;
  --primary-foreground: #0A0A0A;
  --accent: #1E293B;
  --ring: #60A5FA;
  --keyword: #818CF8;
  --keyword-bg: #1E1B4B;
}

html {
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  background-color: var(--background);
  color: var(--foreground);
}

/* Korean prose customization — used by glob post body containers */
.prose-kr {
  font-size: 16px;
  line-height: 1.8;
  color: var(--foreground);
}

.prose-kr h2 {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.01em;
  margin-top: 2em;
  margin-bottom: 0.8em;
}

.prose-kr h3 {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.5;
  margin-top: 1.6em;
  margin-bottom: 0.6em;
}

.prose-kr p {
  margin-top: 0;
  margin-bottom: 1.2em;
}

.prose-kr a {
  color: var(--primary);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.prose-kr code:not(pre code) {
  font-family: var(--font-mono);
  font-size: 0.9em;
  font-weight: 500;
  background-color: var(--muted);
  padding: 0.15em 0.35em;
  border-radius: var(--radius-sm);
}

.prose-kr pre {
  margin: 1.5em 0;
  padding: 1em 1.25em;
  border-radius: var(--radius);
  background-color: var(--muted);
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.6;
}

.prose-kr ul,
.prose-kr ol {
  padding-left: 1.5em;
  margin-bottom: 1.2em;
}

.prose-kr li {
  margin-bottom: 0.4em;
}

.prose-kr blockquote {
  border-left: 3px solid var(--border);
  padding-left: 1em;
  color: var(--muted-foreground);
  margin: 1.5em 0;
}

.prose-kr hr {
  border: 0;
  border-top: 1px solid var(--border);
  margin: 2.5em 0;
}

@media (min-width: 768px) {
  .prose-kr { font-size: 17px; }
  .prose-kr h2 { font-size: 24px; }
  .prose-kr h3 { font-size: 19px; }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "feat(tokens): replace globals.css with shadcn tokens + prose-kr"
```

### Task 5: Update `tailwind.config.ts`

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Replace file**

```typescript
import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './.velite/**/*.json',
  ],
  plugins: [typography],
}

export default config
```

- [ ] **Step 2: Commit**

```bash
git add tailwind.config.ts
git commit -m "build(tailwind): enable data-theme dark mode selector"
```

### Task 6: Update `app/layout.tsx` with Pretendard font and ThemeProvider

**Files:**
- Modify: `app/layout.tsx`
- Create: `components/providers/ThemeProvider.tsx`

- [ ] **Step 1: Create `components/providers/ThemeProvider.tsx`**

```tsx
'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ReactNode } from 'react'

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
```

- [ ] **Step 2: Rewrite `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import './globals.css'

const pretendard = localFont({
  src: '../public/fonts/PretendardVariable.woff2',
  display: 'swap',
  variable: '--font-pretendard',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Backend Notes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={pretendard.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Build to verify font loads and CSS compiles**

```bash
pnpm build
```

Expected: build succeeds. Look for warnings about the font file; there should be none.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx components/providers/ThemeProvider.tsx
git commit -m "feat(theme): wire up Pretendard font and ThemeProvider"
```

### Task 7: Create `Header`, `Footer`, `ThemeToggle`

**Files:**
- Create: `components/blog/Header.tsx`
- Create: `components/blog/Footer.tsx`
- Create: `components/blog/ThemeToggle.tsx`

- [ ] **Step 1: Write `components/blog/ThemeToggle.tsx`**

```tsx
'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {mounted && (isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
    </button>
  )
}
```

- [ ] **Step 2: Write `components/blog/Header.tsx`**

```tsx
import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 md:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="text-[17px]">Backend Notes</span>
        </Link>
        <nav className="flex items-center gap-2">
          <a
            href="https://github.com/ing9990/backend-notes"
            target="_blank"
            rel="noreferrer"
            className="rounded-[10px] px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            GitHub
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Write `components/blog/Footer.tsx`**

```tsx
export function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto max-w-[1280px] px-5 text-center text-sm text-muted-foreground md:px-8">
        © 2026 Backend Notes
      </div>
    </footer>
  )
}
```

- [ ] **Step 4: Update `app/layout.tsx` to render Header and Footer**

Change the `<body>` contents in `app/layout.tsx`:

```tsx
<body>
  <ThemeProvider>
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  </ThemeProvider>
</body>
```

Add these imports at the top of `app/layout.tsx`:

```tsx
import { Header } from '@/components/blog/Header'
import { Footer } from '@/components/blog/Footer'
```

- [ ] **Step 5: Build and type-check**

```bash
pnpm build
pnpm type-check
```

Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add components/blog/Header.tsx components/blog/Footer.tsx components/blog/ThemeToggle.tsx app/layout.tsx
git commit -m "feat(blog): add Header, Footer, ThemeToggle components"
```

### Task 8: Phase 1 smoke test with new layout

- [ ] **Step 1: Start dev server**

```bash
pnpm dev
```

Wait ~5s for ready.

- [ ] **Step 2: Manually verify in browser** (user task; skip if operating autonomously)

Check at `http://localhost:3000`:
- Header is sticky at top, "Backend Notes" visible, GitHub link and theme toggle visible
- The existing `/posts/hello-world` link renders with the new typography (Pretendard)
- Theme toggle flips between light and dark without hydration errors

- [ ] **Step 3: Stop dev server**

```bash
pkill -f "next dev"
```

---

## Stage 2 — Velite 스키마 확장 (TOC + readingTime)

Velite에 이미 있는 `s.toc()`를 활용하고, `rehype-slug`로 MDX 헤딩에 id를 부여한다. `readingTime`은 새 computed field로 추가한다.

### Task 9: Install `rehype-slug`

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install**

```bash
pnpm add rehype-slug
```

- [ ] **Step 2: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "build: add rehype-slug for heading id injection"
```

### Task 10: `lib/reading-time.ts` — write test first

**Files:**
- Create: `tests/reading-time.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/reading-time.test.ts
import { describe, it, expect } from 'vitest'
import { calculateReadingTime } from '@/lib/reading-time'

describe('calculateReadingTime', () => {
  it('returns 1 for very short content', () => {
    expect(calculateReadingTime('짧은 글')).toBe(1)
  })

  it('returns 1 for exactly 500 chars', () => {
    const content = '가'.repeat(500)
    expect(calculateReadingTime(content)).toBe(1)
  })

  it('returns 2 for 501 chars', () => {
    const content = '가'.repeat(501)
    expect(calculateReadingTime(content)).toBe(2)
  })

  it('strips code blocks before counting', () => {
    const content = '짧은 문장\n\n```\n' + 'x'.repeat(10000) + '\n```\n\n끝'
    expect(calculateReadingTime(content)).toBe(1)
  })

  it('strips inline code and markdown syntax', () => {
    const content = '**강조** *이탤릭* `code` [link](url) # heading'
    expect(calculateReadingTime(content)).toBe(1)
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

```bash
pnpm test:unit -- reading-time
```

Expected: FAIL with "Cannot find module '@/lib/reading-time'".

### Task 11: Implement `lib/reading-time.ts`

**Files:**
- Create: `lib/reading-time.ts`

- [ ] **Step 1: Write implementation**

```typescript
// lib/reading-time.ts

/**
 * 한국어 기준 분당 500자. 마크다운 문법과 코드 블록을 제거한 후 글자 수를 세어 분 단위로 반환.
 */
export function calculateReadingTime(content: string): number {
  const plain = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_\[\]()!>]/g, '')
    .replace(/\s+/g, '')
  const chars = plain.length
  return Math.max(1, Math.ceil(chars / 500))
}
```

- [ ] **Step 2: Run tests**

```bash
pnpm test:unit -- reading-time
```

Expected: all 5 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/reading-time.ts tests/reading-time.test.ts
git commit -m "feat(lib): add calculateReadingTime with TDD coverage"
```

### Task 12: `lib/toc.ts` — write test first

**Files:**
- Create: `tests/toc.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/toc.test.ts
import { describe, it, expect } from 'vitest'
import { flattenToc, type VeliteTocEntry } from '@/lib/toc'

describe('flattenToc', () => {
  it('returns empty for empty input', () => {
    expect(flattenToc([])).toEqual([])
  })

  it('flattens a single h2 with no children', () => {
    const input: VeliteTocEntry[] = [
      { title: '개요', url: '#개요', items: [] },
    ]
    expect(flattenToc(input)).toEqual([
      { title: '개요', slug: '개요', depth: 2 },
    ])
  })

  it('flattens h2 with h3 children in order', () => {
    const input: VeliteTocEntry[] = [
      {
        title: '개요',
        url: '#개요',
        items: [
          { title: '배경', url: '#배경', items: [] },
          { title: '목표', url: '#목표', items: [] },
        ],
      },
    ]
    expect(flattenToc(input)).toEqual([
      { title: '개요', slug: '개요', depth: 2 },
      { title: '배경', slug: '배경', depth: 3 },
      { title: '목표', slug: '목표', depth: 3 },
    ])
  })

  it('flattens multiple h2s with mixed children', () => {
    const input: VeliteTocEntry[] = [
      { title: '첫번째', url: '#첫번째', items: [] },
      {
        title: '두번째',
        url: '#두번째',
        items: [{ title: '세부', url: '#세부', items: [] }],
      },
      { title: '세번째', url: '#세번째', items: [] },
    ]
    const result = flattenToc(input)
    expect(result.map((i) => i.title)).toEqual(['첫번째', '두번째', '세부', '세번째'])
    expect(result.map((i) => i.depth)).toEqual([2, 3, 2])
  })

  it('strips leading # from url to produce slug', () => {
    const input: VeliteTocEntry[] = [
      { title: 'B-Tree', url: '#b-tree', items: [] },
    ]
    expect(flattenToc(input)[0].slug).toBe('b-tree')
  })

  it('ignores nested items deeper than h3 (defensive)', () => {
    const input: VeliteTocEntry[] = [
      {
        title: '개요',
        url: '#개요',
        items: [
          {
            title: '배경',
            url: '#배경',
            items: [{ title: '무시됨', url: '#무시됨', items: [] }],
          },
        ],
      },
    ]
    expect(flattenToc(input).map((i) => i.title)).toEqual(['개요', '배경'])
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

```bash
pnpm test:unit -- toc
```

Expected: FAIL with "Cannot find module '@/lib/toc'".

### Task 13: Implement `lib/toc.ts`

**Files:**
- Create: `lib/toc.ts`

- [ ] **Step 1: Write implementation**

```typescript
// lib/toc.ts

export interface VeliteTocEntry {
  title: string
  url: string
  items: VeliteTocEntry[]
}

export interface FlatTocItem {
  title: string
  slug: string
  depth: 2 | 3
}

export function flattenToc(entries: VeliteTocEntry[]): FlatTocItem[] {
  const out: FlatTocItem[] = []
  for (const h2 of entries) {
    out.push({ title: h2.title, slug: stripHash(h2.url), depth: 2 })
    for (const h3 of h2.items) {
      out.push({ title: h3.title, slug: stripHash(h3.url), depth: 3 })
    }
  }
  return out
}

function stripHash(url: string): string {
  return url.replace(/^#/, '')
}
```

- [ ] **Step 2: Run tests**

```bash
pnpm test:unit -- toc
```

Expected: all 6 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/toc.ts tests/toc.test.ts
git commit -m "feat(lib): add flattenToc helper with TDD coverage"
```

### Task 14: Extend Velite schema with `rehype-slug` and `readingTime`

**Files:**
- Modify: `velite.config.ts`

- [ ] **Step 1: Add `readingTime` computed field and `rehype-slug` plugin**

Replace the contents of `velite.config.ts` with:

```typescript
import { defineConfig, defineCollection, s } from 'velite'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import { calculateReadingTime } from './lib/reading-time'

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const postFrontmatterShape = s.object({
  title: s.string().min(1).max(120),
  slug: s.string().min(3).max(200).regex(slugRegex, 'slug must be lowercase (a-z, 0-9, hyphens only)'),
  date: s.isodate(),
  updatedAt: s.isodate().optional(),
  tags: s.array(s.string().min(1)).min(1).max(5),
  keywords: s.array(s.string().min(1)).min(1),
  summary: s.string().min(10).max(300),
  series: s.string().optional(),
  seriesOrder: s.number().int().positive().optional(),
  draft: s.boolean().default(false),
})

export const postFrontmatterSchema = postFrontmatterShape.refine(
  (data) => data.slug === data.slug.toLowerCase(),
  { message: 'slug must be lowercase', path: ['slug'] },
)

const posts = defineCollection({
  name: 'Post',
  pattern: 'posts/**/*.mdx',
  schema: postFrontmatterShape
    .extend({
      slug: s.slug('post'),
      body: s.mdx(),
      toc: s.toc(),
      readingTime: s.markdown().transform((md) => calculateReadingTime(md)),
    })
    .refine(
      (data) => data.slug === data.slug.toLowerCase(),
      { message: 'slug must be lowercase', path: ['slug'] },
    )
    .transform((data) => ({
      ...data,
      url: `/posts/${data.slug}`,
    })),
})

export default defineConfig({
  root: 'content',
  output: {
    data: '.velite',
    assets: 'public/static',
    base: '/static/',
    clean: true,
  },
  collections: { posts },
  mdx: {
    rehypePlugins: [
      rehypeSlug,
      [
        rehypePrettyCode,
        {
          theme: { light: 'github-light', dark: 'github-dark' },
          keepBackground: false,
          defaultLang: 'plaintext',
        },
      ],
    ],
  },
})
```

- [ ] **Step 2: Run Velite build to verify**

```bash
pnpm velite
```

Expected: exit 0. If `s.markdown()` doesn't exist as a root-level schema (Velite 0.2 limitation), the build will fail with a schema error. In that case, fall back to:

```typescript
readingTime: s.custom<number>().transform((_, { meta }) => calculateReadingTime(meta.content as string)),
```

(Try `s.markdown()` first; if it fails, swap in the `s.custom` variant and re-run.)

- [ ] **Step 3: Verify output contains `readingTime`**

```bash
node -e "const p=require('./.velite/posts.json'); console.log('keys:', Object.keys(p[0]).sort().join(',')); console.log('readingTime:', p[0].readingTime);"
```

Expected: output lists `readingTime` as a key with a numeric value ≥ 1.

- [ ] **Step 4: Run existing tests to ensure no regression**

```bash
pnpm test
```

Expected: all 17 Phase 1 tests + 11 new tests (reading-time 5, toc 6) PASS. Total 28.

- [ ] **Step 5: Commit**

```bash
git add velite.config.ts
git commit -m "feat(velite): add rehype-slug and readingTime computed field"
```

### Task 15: Expand `hello-world.mdx` with h2/h3 structure for TOC testing

**Files:**
- Modify: `content/posts/hello-world.mdx`

- [ ] **Step 1: Replace content with multi-section structure**

```mdx
---
title: "Hello, World"
slug: "hello-world"
date: 2026-04-14
tags:
  - Meta
keywords:
  - Hello World
summary: "Phase 1 파이프라인이 정상 동작하는지 확인하는 샘플 글입니다."
---

이 글은 Velite + Next.js + Shiki 파이프라인을 검증하기 위한 샘플입니다.

## 마크다운 기본

일반 문단, **강조**, *이탤릭*, [예시 링크](https://example.com), 그리고 `인라인 코드`를 사용합니다.

### 인라인 요소

굵은 글씨, 기울임, 링크가 한 문장에 자연스럽게 섞입니다.

### 문단 흐름

Backend Notes는 한국어 본문의 가독성을 위해 행간을 1.8로 설정합니다. 문단과 문단 사이는 충분한 여백으로 숨 쉬는 공간을 확보합니다.

## 코드 블록

```typescript title="example.ts"
export function greet(name: string): string {
  return `Hello, ${name}!`
}
```

### Shiki 하이라이팅

VS Code 테마 기반의 신택스 하이라이팅이 적용됩니다.

## 리스트

- 항목 1
- 항목 2
  - 중첩된 항목

1. 순서 있는 첫 번째
2. 순서 있는 두 번째

## TOC 동작 확인

이 섹션은 스크롤 시 우측 목차가 정확히 하이라이트되는지 확인하기 위한 긴 섹션입니다.

본문을 충분히 길게 채워 스크롤이 발생하도록 합니다. 스크롤하면 사이드바의 "TOC 동작 확인" 항목이 활성화됩니다.

계속해서 더 많은 내용을 작성해 스크롤을 유도합니다. Intersection Observer의 `rootMargin` 설정이 의도대로 동작하는지 확인합니다.

한국어 긴 글 읽기에 최적화된 여백과 행간을 체감하면서, 시선이 자연스럽게 다음 섹션으로 흘러가는지 평가합니다.
```

- [ ] **Step 2: Rebuild Velite and verify TOC**

```bash
pnpm velite
node -e "const p=require('./.velite/posts.json'); console.log(JSON.stringify(p[0].toc, null, 2));"
```

Expected: TOC includes `마크다운 기본` (with 2 h3 children), `코드 블록` (with 1 h3 child), `리스트`, `TOC 동작 확인`.

- [ ] **Step 3: Commit**

```bash
git add content/posts/hello-world.mdx
git commit -m "content: expand hello-world with multi-section structure for TOC testing"
```

---

## Stage 3 — 글 상세 페이지 재구성

### Task 16: Create `PostMeta` and `ReadingTime` components

**Files:**
- Create: `components/blog/PostMeta.tsx`
- Create: `components/blog/ReadingTime.tsx`

- [ ] **Step 1: Write `components/blog/ReadingTime.tsx`**

```tsx
export function ReadingTime({ minutes }: { minutes: number }) {
  return <span>읽기 {minutes}분</span>
}
```

- [ ] **Step 2: Write `components/blog/PostMeta.tsx`**

```tsx
import Link from 'next/link'
import { ReadingTime } from './ReadingTime'

interface PostMetaProps {
  tags: readonly string[]
  date: string
  readingTime: number
}

export function PostMeta({ tags, date, readingTime }: PostMetaProps) {
  const formattedDate = formatDate(date)
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <Link
            key={tag}
            href={`/?tag=${encodeURIComponent(tag)}`}
            className="text-xs font-medium text-primary hover:underline"
          >
            #{tag}
          </Link>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[13px] text-muted-foreground">
        <time dateTime={date}>{formattedDate}</time>
        <span aria-hidden="true">·</span>
        <ReadingTime minutes={readingTime} />
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd}`
}
```

- [ ] **Step 3: Type-check**

```bash
pnpm type-check
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add components/blog/PostMeta.tsx components/blog/ReadingTime.tsx
git commit -m "feat(blog): add PostMeta and ReadingTime components"
```

### Task 17: Create `TableOfContents` client component

**Files:**
- Create: `components/blog/TableOfContents.tsx`

- [ ] **Step 1: Write component**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { FlatTocItem } from '@/lib/toc'

export function TableOfContents({ items }: { items: FlatTocItem[] }) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null)

  useEffect(() => {
    if (items.length === 0) return

    const elements = items
      .map((item) => document.getElementById(item.slug))
      .filter((el): el is HTMLElement => el !== null)

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          setActiveSlug(visible[0].target.id)
        }
      },
      { rootMargin: '-80px 0px -70% 0px' },
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [items])

  if (items.length === 0) return null

  return (
    <nav aria-label="목차">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        On this page
      </p>
      <ul className="space-y-2 border-l border-border">
        {items.map((item) => (
          <li
            key={item.slug}
            className={cn(
              '-ml-px border-l-2 pl-4 text-sm transition-colors',
              item.depth === 3 && 'pl-7',
              activeSlug === item.slug
                ? 'border-primary font-medium text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <a href={`#${item.slug}`}>{item.title}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/blog/TableOfContents.tsx
git commit -m "feat(blog): add TableOfContents with IntersectionObserver highlight"
```

### Task 18: Update MDX custom components mapping

**Files:**
- Modify: `components/mdx/index.ts`

- [ ] **Step 1: Replace file contents**

```tsx
import type { MDXComponents } from 'mdx/types'

export const mdxComponents: MDXComponents = {
  h1: ({ children, ...props }) => (
    <h1 className="mt-10 mb-4 text-[26px] font-bold tracking-[-0.015em]" {...props}>
      {children}
    </h1>
  ),
  a: ({ children, ...props }) => (
    <a className="text-primary underline decoration-dotted underline-offset-4" {...props}>
      {children}
    </a>
  ),
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: exit 0. If `mdx/types` is not installed, install it:

```bash
pnpm add -D @types/mdx
```

Then replace the import:

```tsx
import type { MDXComponents } from '@types/mdx'
```

If neither works, use a local type:

```tsx
type MDXComponents = Record<string, React.ComponentType<any>>
```

- [ ] **Step 3: Commit**

```bash
git add components/mdx/index.ts package.json pnpm-lock.yaml
git commit -m "feat(mdx): add custom component mapping for headings and links"
```

### Task 19: Rewrite `app/posts/[slug]/page.tsx` with 2-column layout

**Files:**
- Modify: `app/posts/[slug]/page.tsx`

- [ ] **Step 1: Replace file contents**

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllSlugs, getPostBySlug } from '@/lib/posts'
import { MDXContent } from '@/components/mdx/MDXContent'
import { PostMeta } from '@/components/blog/PostMeta'
import { TableOfContents } from '@/components/blog/TableOfContents'
import { flattenToc, type VeliteTocEntry } from '@/lib/toc'

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export const dynamicParams = false

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const tocItems = flattenToc(post.toc as unknown as VeliteTocEntry[])

  return (
    <div className="mx-auto max-w-[1120px] px-5 py-16 md:px-12">
      <Link
        href="/"
        className="mb-10 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← 목록으로
      </Link>

      {tocItems.length > 0 && (
        <details className="mb-8 rounded-[10px] border border-border bg-muted/50 p-4 md:hidden">
          <summary className="cursor-pointer text-sm font-medium">목차</summary>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {tocItems.map((item) => (
              <li key={item.slug} className={item.depth === 3 ? 'pl-4' : ''}>
                <a href={`#${item.slug}`}>{item.title}</a>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="md:grid md:grid-cols-[minmax(0,720px)_minmax(0,280px)] md:gap-16">
        <article className="max-w-[720px]">
          <PostMeta tags={post.tags} date={post.date} readingTime={post.readingTime} />
          <h1 className="mt-4 text-[28px] font-bold leading-[1.3] tracking-[-0.015em] md:text-[32px]">
            {post.title}
          </h1>
          <hr className="my-8 border-border" />
          <div className="prose-kr">
            <MDXContent code={post.body} />
          </div>
        </article>

        <aside className="hidden md:block">
          <div className="sticky top-24">
            <TableOfContents items={tocItems} />
          </div>
        </aside>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build to verify**

```bash
pnpm build
```

Expected: build succeeds. If `post.readingTime` or `post.toc` types don't resolve, the build will show a TypeScript error — if so, Velite may need a type refresh:

```bash
rm -rf .velite && pnpm velite && pnpm type-check
```

- [ ] **Step 3: Commit**

```bash
git add app/posts/[slug]/page.tsx
git commit -m "feat(post): rewrite post detail page with 2-column TOC layout"
```

### Task 20: Manual verification of post detail page

- [ ] **Step 1: Start dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Verify in browser** (user task; skip if autonomous)

Visit `http://localhost:3000/posts/hello-world` and check:
- Title, date, tags, reading time display correctly
- Desktop: TOC sidebar on the right, sticky on scroll, active section highlights
- Mobile (375px viewport): TOC hidden, `<details>` appears at top
- Clicking a TOC item scrolls to the heading
- Light/dark theme both render correctly
- Prose spacing feels comfortable, line-height is 1.8

- [ ] **Step 3: Stop dev server**

```bash
pkill -f "next dev"
```

---

## Stage 4 — `lib/filters.ts` + 순수 함수 테스트

### Task 21: Write `tests/filters.test.ts` (TDD red phase)

**Files:**
- Create: `tests/filters.test.ts`

- [ ] **Step 1: Write comprehensive failing tests**

```typescript
// tests/filters.test.ts
import { describe, it, expect } from 'vitest'
import {
  filterByTag,
  searchPosts,
  sortPosts,
  applyFilters,
  extractAllTags,
} from '@/lib/filters'

type TestPost = {
  slug: string
  title: string
  summary: string
  tags: string[]
  keywords: string[]
  date: string
}

function makePost(partial: Partial<TestPost> & { slug: string }): TestPost {
  return {
    slug: partial.slug,
    title: partial.title ?? `Title ${partial.slug}`,
    summary: partial.summary ?? `Summary ${partial.slug}`,
    tags: partial.tags ?? [],
    keywords: partial.keywords ?? [],
    date: partial.date ?? '2026-01-01',
  }
}

const sample: TestPost[] = [
  makePost({
    slug: 'p1',
    title: '데이터베이스 인덱스의 동작 원리',
    summary: 'DB 인덱스가 빠른 이유',
    tags: ['Database', 'Index'],
    keywords: ['B-Tree', '인덱스'],
    date: '2026-04-10',
  }),
  makePost({
    slug: 'p2',
    title: 'Kafka Consumer Group 리밸런싱',
    summary: '컨슈머 그룹 리밸런싱 전략',
    tags: ['Kafka', 'Backend'],
    keywords: ['Consumer Group'],
    date: '2026-04-08',
  }),
  makePost({
    slug: 'p3',
    title: 'JVM GC 소개',
    summary: 'Garbage Collection basics',
    tags: ['JVM', 'Backend'],
    keywords: ['G1', 'Mark-Sweep'],
    date: '2026-04-01',
  }),
]

describe('filterByTag', () => {
  it('returns all when tag is undefined', () => {
    expect(filterByTag(sample as any, undefined)).toHaveLength(3)
  })

  it('filters by exact tag match', () => {
    const result = filterByTag(sample as any, 'Database')
    expect(result.map((p) => p.slug)).toEqual(['p1'])
  })

  it('is case-insensitive', () => {
    const result = filterByTag(sample as any, 'database')
    expect(result.map((p) => p.slug)).toEqual(['p1'])
  })

  it('returns empty array when no match', () => {
    expect(filterByTag(sample as any, 'NoSuchTag')).toEqual([])
  })
})

describe('searchPosts', () => {
  it('returns all when query is undefined or empty', () => {
    expect(searchPosts(sample as any, undefined)).toHaveLength(3)
    expect(searchPosts(sample as any, '')).toHaveLength(3)
    expect(searchPosts(sample as any, '   ')).toHaveLength(3)
  })

  it('matches partial title', () => {
    const result = searchPosts(sample as any, '인덱스')
    expect(result.map((p) => p.slug)).toEqual(['p1'])
  })

  it('matches partial summary', () => {
    const result = searchPosts(sample as any, '리밸런싱 전략')
    expect(result.map((p) => p.slug)).toEqual(['p2'])
  })

  it('matches tag', () => {
    const result = searchPosts(sample as any, 'JVM')
    expect(result.map((p) => p.slug)).toEqual(['p3'])
  })

  it('matches keyword', () => {
    const result = searchPosts(sample as any, 'b-tree')
    expect(result.map((p) => p.slug)).toEqual(['p1'])
  })

  it('is case-insensitive for Latin', () => {
    const result = searchPosts(sample as any, 'KAFKA')
    expect(result.map((p) => p.slug)).toEqual(['p2'])
  })
})

describe('sortPosts', () => {
  it('defaults to latest (date descending)', () => {
    const result = sortPosts(sample as any, undefined)
    expect(result.map((p) => p.slug)).toEqual(['p1', 'p2', 'p3'])
  })

  it('sorts oldest first', () => {
    const result = sortPosts(sample as any, 'oldest')
    expect(result.map((p) => p.slug)).toEqual(['p3', 'p2', 'p1'])
  })

  it('sorts by title Korean-aware', () => {
    const result = sortPosts(sample as any, 'title')
    // 'JVM GC 소개' < 'Kafka Consumer Group 리밸런싱' < '데이터베이스 인덱스의 동작 원리'
    // Intl.Collator('ko') places Latin first, then Hangul
    expect(result.map((p) => p.slug)).toEqual(['p3', 'p2', 'p1'])
  })

  it('does not mutate input', () => {
    const copy = sample.slice()
    sortPosts(sample as any, 'oldest')
    expect(sample).toEqual(copy)
  })
})

describe('applyFilters', () => {
  it('applies tag then search then sort', () => {
    const result = applyFilters(sample as any, {
      tag: 'Backend',
      query: 'Consumer',
      sort: 'latest',
    })
    expect(result.map((p) => p.slug)).toEqual(['p2'])
  })
})

describe('extractAllTags', () => {
  it('returns unique tags with counts in descending order', () => {
    const result = extractAllTags(sample as any)
    expect(result).toContainEqual({ tag: 'Backend', count: 2 })
    expect(result[0].count).toBeGreaterThanOrEqual(result[result.length - 1].count)
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

```bash
pnpm test:unit -- filters
```

Expected: FAIL with "Cannot find module '@/lib/filters'".

### Task 22: Implement `lib/filters.ts`

**Files:**
- Create: `lib/filters.ts`

- [ ] **Step 1: Write implementation**

```typescript
// lib/filters.ts
import type { Post } from './posts'

export type SortKey = 'latest' | 'oldest' | 'title'

export interface PostFilters {
  tag?: string
  query?: string
  sort?: SortKey
}

export function filterByTag<T extends Pick<Post, 'tags'>>(
  posts: readonly T[],
  tag?: string,
): T[] {
  if (!tag) return posts.slice()
  const needle = tag.toLowerCase()
  return posts.filter((p) => p.tags.some((t) => t.toLowerCase() === needle))
}

export function searchPosts<
  T extends Pick<Post, 'title' | 'summary' | 'tags' | 'keywords'>,
>(posts: readonly T[], query?: string): T[] {
  const q = query?.trim().toLowerCase()
  if (!q) return posts.slice()
  return posts.filter((p) => {
    if (p.title.toLowerCase().includes(q)) return true
    if (p.summary.toLowerCase().includes(q)) return true
    if (p.tags.some((t) => t.toLowerCase().includes(q))) return true
    if (p.keywords.some((k) => k.toLowerCase().includes(q))) return true
    return false
  })
}

const titleCollator = new Intl.Collator('ko', { sensitivity: 'base' })

export function sortPosts<T extends Pick<Post, 'date' | 'title'>>(
  posts: readonly T[],
  sort?: SortKey,
): T[] {
  const out = posts.slice()
  const key = sort ?? 'latest'
  switch (key) {
    case 'latest':
      return out.sort((a, b) => b.date.localeCompare(a.date))
    case 'oldest':
      return out.sort((a, b) => a.date.localeCompare(b.date))
    case 'title':
      return out.sort((a, b) => titleCollator.compare(a.title, b.title))
  }
}

export function applyFilters<
  T extends Pick<Post, 'tags' | 'title' | 'summary' | 'keywords' | 'date'>,
>(posts: readonly T[], filters: PostFilters): T[] {
  return sortPosts(
    searchPosts(filterByTag(posts, filters.tag), filters.query),
    filters.sort,
  )
}

export function extractAllTags<T extends Pick<Post, 'tags'>>(
  posts: readonly T[],
): Array<{ tag: string; count: number }> {
  const map = new Map<string, number>()
  for (const p of posts) {
    for (const tag of p.tags) {
      map.set(tag, (map.get(tag) ?? 0) + 1)
    }
  }
  return Array.from(map.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}
```

- [ ] **Step 2: Run tests**

```bash
pnpm test:unit -- filters
```

Expected: all 14 tests PASS. If the `sortPosts('title')` test fails due to `Intl.Collator('ko')` sort order (Latin vs Hangul ordering varies by environment), adjust the test's expected ordering to match observed output and document the actual order.

- [ ] **Step 3: Run full test suite**

```bash
pnpm test
```

Expected: Phase 1 17 + Phase 2 25 = 42 tests, all PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/filters.ts tests/filters.test.ts
git commit -m "feat(lib): add filters (tag/search/sort/apply/extractTags) with TDD"
```

### Task 23: Add `buildPostsUrl` to `lib/utils.ts`

**Files:**
- Modify: `lib/utils.ts`

- [ ] **Step 1: Append `buildPostsUrl` to the file**

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { SortKey } from './filters'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function buildPostsUrl(params: {
  tag?: string
  query?: string
  sort?: SortKey
}): string {
  const sp = new URLSearchParams()
  if (params.tag) sp.set('tag', params.tag)
  if (params.query?.trim()) sp.set('q', params.query.trim())
  if (params.sort && params.sort !== 'latest') sp.set('sort', params.sort)
  const qs = sp.toString()
  return qs ? `/?${qs}` : '/'
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add lib/utils.ts
git commit -m "feat(lib): add buildPostsUrl URL query builder"
```

---

## Stage 5 — 인덱스 페이지 재작성

### Task 24: Install shadcn components

**Files:**
- Create: `components/ui/button.tsx`
- Create: `components/ui/input.tsx`
- Create: `components/ui/badge.tsx`
- Create: `components/ui/select.tsx`
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install via shadcn CLI**

```bash
pnpm dlx shadcn@latest add button input badge select --yes
```

Expected: 4 files created under `components/ui/`, Radix UI peer dependencies added to `package.json`.

- [ ] **Step 2: Build to verify integration**

```bash
pnpm build
```

Expected: build succeeds. If CSS variables in `app/globals.css` get overwritten by the CLI, restore them from Task 4.

- [ ] **Step 3: Commit**

```bash
git add components/ui package.json pnpm-lock.yaml
git commit -m "feat(ui): add shadcn Button, Input, Badge, Select"
```

### Task 25: Create `PostCard` and `PostList`

**Files:**
- Create: `components/blog/PostCard.tsx`
- Create: `components/blog/PostList.tsx`

- [ ] **Step 1: Write `components/blog/PostCard.tsx`**

```tsx
import Link from 'next/link'
import type { Post } from '@/lib/posts'

export function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group block rounded-[14px] border border-border bg-background p-6 transition-colors hover:border-border-strong hover:bg-muted/40"
    >
      <div className="mb-2 flex flex-wrap gap-1.5">
        {post.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="text-xs font-medium text-muted-foreground">
            #{tag}
          </span>
        ))}
      </div>
      <h2 className="text-[18px] font-semibold leading-[1.4] tracking-[-0.01em] text-foreground transition-colors group-hover:text-primary">
        {post.title}
      </h2>
      <p className="mt-2 line-clamp-2 text-[15px] leading-[1.7] text-muted-foreground">
        {post.summary}
      </p>
      <time className="mt-4 block text-[13px] text-muted-foreground" dateTime={post.date}>
        {formatDate(post.date)}
      </time>
    </Link>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd}`
}
```

- [ ] **Step 2: Write `components/blog/PostList.tsx`**

```tsx
import { PostCard } from './PostCard'
import type { Post } from '@/lib/posts'

export function PostList({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <div className="mt-6 rounded-[14px] border border-dashed border-border py-16 text-center">
        <p className="text-sm text-muted-foreground">
          조건에 맞는 글이 없습니다. 필터를 조정해보세요.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-3">
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
pnpm type-check
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add components/blog/PostCard.tsx components/blog/PostList.tsx
git commit -m "feat(blog): add PostCard and PostList components"
```

### Task 26: Create `TagChip` and `TagFilterBar`

**Files:**
- Create: `components/blog/TagChip.tsx`
- Create: `components/blog/TagFilterBar.tsx`

- [ ] **Step 1: Write `components/blog/TagChip.tsx`**

```tsx
'use client'

import { cn } from '@/lib/utils'

interface TagChipProps {
  label: string
  count?: number
  active: boolean
  onClick: () => void
}

export function TagChip({ label, count, active, onClick }: TagChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-[10px] border px-3 py-1.5 text-sm transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-muted-foreground hover:border-border-strong hover:text-foreground',
      )}
    >
      {label}
      {typeof count === 'number' && (
        <span className={cn('ml-1.5 text-xs', active ? 'opacity-80' : 'opacity-60')}>
          {count}
        </span>
      )}
    </button>
  )
}
```

- [ ] **Step 2: Write `components/blog/TagFilterBar.tsx`**

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { TagChip } from './TagChip'
import { buildPostsUrl } from '@/lib/utils'
import type { SortKey } from '@/lib/filters'

interface TagFilterBarProps {
  allTags: Array<{ tag: string; count: number }>
  selected?: string
  currentQuery?: string
  currentSort: SortKey
}

export function TagFilterBar({
  allTags,
  selected,
  currentQuery,
  currentSort,
}: TagFilterBarProps) {
  const router = useRouter()

  function toggle(tag?: string) {
    const nextTag = selected === tag ? undefined : tag
    router.push(
      buildPostsUrl({ tag: nextTag, query: currentQuery, sort: currentSort }),
    )
  }

  return (
    <div className="mt-8 flex flex-wrap gap-2">
      <TagChip label="All" active={!selected} onClick={() => toggle(undefined)} />
      {allTags.map(({ tag, count }) => (
        <TagChip
          key={tag}
          label={tag}
          count={count}
          active={selected === tag}
          onClick={() => toggle(tag)}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
pnpm type-check
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add components/blog/TagChip.tsx components/blog/TagFilterBar.tsx
git commit -m "feat(blog): add TagChip and TagFilterBar with URL sync"
```

### Task 27: Create `SearchBar` with debounced URL sync

**Files:**
- Create: `components/blog/SearchBar.tsx`

- [ ] **Step 1: Write component**

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { buildPostsUrl } from '@/lib/utils'
import type { SortKey } from '@/lib/filters'

interface SearchBarProps {
  defaultQuery?: string
  currentTag?: string
  currentSort: SortKey
}

export function SearchBar({ defaultQuery, currentTag, currentSort }: SearchBarProps) {
  const router = useRouter()
  const [value, setValue] = useState(defaultQuery ?? '')

  useEffect(() => {
    setValue(defaultQuery ?? '')
  }, [defaultQuery])

  useEffect(() => {
    const handle = setTimeout(() => {
      if ((value ?? '') === (defaultQuery ?? '')) return
      router.push(
        buildPostsUrl({ tag: currentTag, query: value, sort: currentSort }),
      )
    }, 250)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="mt-8">
      <Input
        type="search"
        inputMode="search"
        placeholder="검색어를 입력하세요..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-11"
        aria-label="글 검색"
      />
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: exit 0. If a lint error complains about the disabled exhaustive-deps, leave as-is — the omission is intentional (we only want the effect to fire when user edits `value`, not when router params arrive).

- [ ] **Step 3: Commit**

```bash
git add components/blog/SearchBar.tsx
git commit -m "feat(blog): add SearchBar with 250ms debounced URL sync"
```

### Task 28: Create `SortSelect`

**Files:**
- Create: `components/blog/SortSelect.tsx`

- [ ] **Step 1: Write component**

```tsx
'use client'

import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { buildPostsUrl } from '@/lib/utils'
import type { SortKey } from '@/lib/filters'

interface SortSelectProps {
  value: SortKey
  currentTag?: string
  currentQuery?: string
}

const LABELS: Record<SortKey, string> = {
  latest: '최신순',
  oldest: '오래된순',
  title: '제목순',
}

export function SortSelect({ value, currentTag, currentQuery }: SortSelectProps) {
  const router = useRouter()

  return (
    <Select
      value={value}
      onValueChange={(next) =>
        router.push(
          buildPostsUrl({
            tag: currentTag,
            query: currentQuery,
            sort: next as SortKey,
          }),
        )
      }
    >
      <SelectTrigger className="h-9 w-[120px] text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(LABELS) as SortKey[]).map((key) => (
          <SelectItem key={key} value={key}>
            {LABELS[key]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add components/blog/SortSelect.tsx
git commit -m "feat(blog): add SortSelect dropdown with URL sync"
```

### Task 29: Rewrite `app/page.tsx` as the real index page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace file contents**

```tsx
import { getAllPosts } from '@/lib/posts'
import { applyFilters, extractAllTags, type SortKey } from '@/lib/filters'
import { PostList } from '@/components/blog/PostList'
import { SearchBar } from '@/components/blog/SearchBar'
import { TagFilterBar } from '@/components/blog/TagFilterBar'
import { SortSelect } from '@/components/blog/SortSelect'

const VALID_SORTS: SortKey[] = ['latest', 'oldest', 'title']

export default async function IndexPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string; sort?: string }>
}) {
  const { tag, q, sort } = await searchParams
  const allPosts = getAllPosts()
  const allTags = extractAllTags(allPosts)

  const validSort: SortKey = VALID_SORTS.includes(sort as SortKey)
    ? (sort as SortKey)
    : 'latest'

  const filtered = applyFilters(allPosts, {
    tag,
    query: q,
    sort: validSort,
  })

  return (
    <main className="mx-auto max-w-[1080px] px-5 py-20 md:px-12">
      <section className="mb-4">
        <h1 className="text-[32px] font-bold tracking-[-0.02em] md:text-[40px]">
          Backend Notes
        </h1>
        <p className="mt-3 text-[17px] text-muted-foreground">
          백엔드 엔지니어의 학습 기록
        </p>
      </section>

      <SearchBar defaultQuery={q} currentTag={tag} currentSort={validSort} />

      <TagFilterBar
        allTags={allTags}
        selected={tag}
        currentQuery={q}
        currentSort={validSort}
      />

      <div className="mt-8 flex items-center justify-between text-sm text-muted-foreground">
        <span>전체 {filtered.length}개 글</span>
        <SortSelect value={validSort} currentTag={tag} currentQuery={q} />
      </div>

      <PostList posts={filtered} />
    </main>
  )
}
```

- [ ] **Step 2: Build**

```bash
pnpm build
```

Expected: build succeeds. Any Velite-related type resolution issues → `rm -rf .velite && pnpm velite && pnpm type-check`.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat(app): rewrite index page with search, filter, sort"
```

### Task 30: Add dummy content for index page validation

**Files:**
- Create: `content/posts/database-index-basics.mdx`
- Create: `content/posts/jvm-gc-intro.mdx`
- Create: `content/posts/kafka-consumer-group.mdx`

- [ ] **Step 1: Write `content/posts/database-index-basics.mdx`**

```mdx
---
title: "데이터베이스 인덱스 기초"
slug: "database-index-basics"
date: 2026-04-12
tags:
  - Database
  - Backend
keywords:
  - 데이터베이스 인덱스
summary: "DB 인덱스가 쿼리 성능에 미치는 영향을 기본부터 살펴봅니다."
---

## 인덱스란

인덱스는 테이블 조회를 빠르게 하기 위한 자료구조입니다.

## 왜 빠른가

풀 테이블 스캔 대신 정렬된 구조를 탐색하기 때문입니다.

## 비용

쓰기 성능이 느려지고 디스크 공간을 추가로 사용합니다.
```

- [ ] **Step 2: Write `content/posts/jvm-gc-intro.mdx`**

```mdx
---
title: "JVM GC 입문"
slug: "jvm-gc-intro"
date: 2026-04-08
tags:
  - JVM
  - Backend
keywords:
  - Garbage Collection
summary: "JVM의 가비지 컬렉터가 메모리를 관리하는 기본 원리를 살펴봅니다."
---

## 왜 GC가 필요한가

수동 메모리 해제의 실수를 자동화합니다.

## Young vs Old

세대별 GC는 객체의 수명에 기반합니다.

## Stop-the-World

대부분의 수집기는 일시적으로 애플리케이션을 멈춥니다.
```

- [ ] **Step 3: Write `content/posts/kafka-consumer-group.mdx`**

```mdx
---
title: "Kafka Consumer Group 이해하기"
slug: "kafka-consumer-group"
date: 2026-04-05
tags:
  - Kafka
  - Backend
keywords:
  - Consumer Group
summary: "Kafka Consumer Group이 파티션을 분배하고 리밸런싱하는 방식을 설명합니다."
---

## Consumer Group이란

같은 group.id를 공유하는 소비자 집합입니다.

## 파티션 할당

각 파티션은 그룹 내 한 소비자에게만 할당됩니다.

## 리밸런싱

멤버 변화가 생기면 파티션이 재분배됩니다.
```

- [ ] **Step 4: Rebuild Velite and run full test suite**

```bash
pnpm velite
pnpm test
```

Expected: Velite builds all 4 posts. Tests pass (42 total).

- [ ] **Step 5: Commit**

```bash
git add content/posts/database-index-basics.mdx content/posts/jvm-gc-intro.mdx content/posts/kafka-consumer-group.mdx
git commit -m "content: add 3 dummy posts for Phase 2 index page validation"
```

### Task 31: Manual verification of index page

- [ ] **Step 1: Start dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Verify in browser** (user task; skip if autonomous)

At `http://localhost:3000`, check:
- Hero title and subtitle render with correct typography
- SearchBar renders, typing filters the list after ~250ms
- TagFilterBar shows all unique tags with counts, toggling works, URL updates
- SortSelect changes sort order, URL updates
- PostCards render with hover transition
- URL `/?tag=Backend&q=kafka&sort=oldest` reproduces the state on reload
- Clicking "All" clears the tag filter
- Light/dark theme both render correctly
- 375px viewport layout is not broken

- [ ] **Step 3: Stop dev server**

```bash
pkill -f "next dev"
```

---

## Stage 6 — Shiki 라인 하이라이트 + JetBrains Mono

### Task 32: Install `@shikijs/transformers` and enable line highlighting

**Files:**
- Modify: `velite.config.ts`, `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install**

```bash
pnpm add @shikijs/transformers
```

- [ ] **Step 2: Update `velite.config.ts` — add transformer to `rehypePrettyCode`**

Add import near the top:

```typescript
import { transformerNotationHighlight } from '@shikijs/transformers'
```

Modify the `rehypePrettyCode` options block:

```typescript
[
  rehypePrettyCode,
  {
    theme: { light: 'github-light', dark: 'github-dark' },
    keepBackground: false,
    defaultLang: 'plaintext',
    transformers: [transformerNotationHighlight()],
  },
],
```

- [ ] **Step 3: Update `hello-world.mdx` to include a line-highlighted code block**

Replace the existing `typescript` code block in `content/posts/hello-world.mdx` with:

````mdx
```typescript title="example.ts"
export function greet(name: string): string { // [!code highlight]
  return `Hello, ${name}!`
}
```
````

- [ ] **Step 4: Build Velite and check output**

```bash
pnpm velite
```

Expected: build succeeds. Confirm the highlighted line has different markup:

```bash
node -e "const p=require('./.velite/posts.json'); console.log(p[0].body.includes('highlighted'));"
```

Expected: `true`. (rehype-pretty-code marks highlighted lines with a `data-highlighted-line` attribute or similar.)

- [ ] **Step 5: Add CSS to style highlighted lines in `app/globals.css`**

Append to `app/globals.css`:

```css
.prose-kr [data-highlighted-line] {
  background-color: color-mix(in oklab, var(--primary) 12%, transparent);
  border-left: 2px solid var(--primary);
  padding-left: calc(0.5em - 2px);
}
```

- [ ] **Step 6: Build and verify**

```bash
pnpm build
```

Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add velite.config.ts content/posts/hello-world.mdx app/globals.css package.json pnpm-lock.yaml
git commit -m "feat(mdx): enable Shiki line highlighting via @shikijs/transformers"
```

### Task 33: Add JetBrains Mono local font

**Files:**
- Create: `public/fonts/JetBrainsMono-Variable.woff2`
- Modify: `app/layout.tsx`, `app/globals.css`

- [ ] **Step 1: Download JetBrains Mono Variable**

```bash
curl -L -o public/fonts/JetBrainsMono-Variable.woff2 \
  https://github.com/JetBrains/JetBrainsMono/raw/master/fonts/variable/JetBrainsMono%5Bwght%5D.ttf
```

Note: JetBrains Mono's official release provides a variable TTF; Next.js `localFont` also accepts TTF. If woff2 is required, convert locally with `pnpm dlx ttf2woff2` — otherwise use the TTF.

If the URL fails, alternative:

```bash
curl -L -o public/fonts/JetBrainsMono-Variable.ttf \
  https://github.com/JetBrains/JetBrainsMono/raw/master/fonts/variable/JetBrainsMono%5Bwght%5D.ttf
```

And update the font reference below accordingly.

- [ ] **Step 2: Update `app/layout.tsx` to load JetBrains Mono**

Add after the Pretendard font declaration:

```tsx
const jetbrainsMono = localFont({
  src: '../public/fonts/JetBrainsMono-Variable.ttf',
  display: 'swap',
  variable: '--font-jetbrains-mono',
  weight: '100 800',
})
```

Change the `<html>` element's `className`:

```tsx
<html lang="ko" className={`${pretendard.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
```

- [ ] **Step 3: Update `app/globals.css` `--font-mono` to reference the variable**

In the `@theme inline` block, replace the `--font-mono` line:

```css
--font-mono: var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, Menlo, monospace;
```

- [ ] **Step 4: Build**

```bash
pnpm build
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add public/fonts/JetBrainsMono-Variable.ttf app/layout.tsx app/globals.css
git commit -m "feat(fonts): add JetBrains Mono Variable for code blocks"
```

---

## Stage 7 — CLAUDE.md 업데이트 및 Phase 2 완료 태그

### Task 34: Update CLAUDE.md §7.2 (color palette)

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Replace §7.2 Color palette section in CLAUDE.md**

Find the current §7.2 block (`### 7.2 컬러 팔레트` and its CSS code block) and replace with:

```markdown
### 7.2 컬러 팔레트

shadcn/ui 컨벤션의 CSS 변수(`--background`, `--foreground`, `--primary`, `--muted`, `--border`, `--ring`, `--accent`)를 사용한다. 프로젝트 고유 확장 토큰은 `--keyword`, `--keyword-bg`, `--border-strong`.

```css
/* globals.css */
:root {
  --background: #FFFFFF;
  --foreground: #09090B;
  --muted: #F4F4F5;
  --muted-foreground: #71717A;
  --border: #E4E4E7;
  --border-strong: #D4D4D8;
  --primary: #3B82F6;
  --primary-foreground: #FFFFFF;
  --accent: #EFF6FF;
  --ring: #3B82F6;
  --keyword: #6366F1;
  --keyword-bg: #EEF2FF;
}

[data-theme="dark"] {
  --background: #09090B;
  --foreground: #FAFAFA;
  --muted: #18181B;
  --muted-foreground: #A1A1AA;
  --border: #27272A;
  --border-strong: #3F3F46;
  --primary: #60A5FA;
  --primary-foreground: #0A0A0A;
  --accent: #1E293B;
  --ring: #60A5FA;
  --keyword: #818CF8;
  --keyword-bg: #1E1B4B;
}
```

다크 모드 전환: `next-themes`의 `ThemeProvider`를 `attribute="data-theme"`로 설정. Tailwind는 `darkMode: ['selector', '[data-theme="dark"]']`로 변형을 생성.
```

### Task 35: Update CLAUDE.md §7.3 (typography)

- [ ] **Step 1: Replace §7.3 in `CLAUDE.md`**

Find `### 7.3 타이포그래피` and replace with:

```markdown
### 7.3 타이포그래피

**폰트**
- 본문/제목: **Pretendard Variable** (`next/font/local`로 셀프 호스팅, `public/fonts/PretendardVariable.woff2`)
- 코드: **JetBrains Mono Variable** + `ui-monospace` 시스템 스택 fallback

**스케일** (모바일 기본, 데스크탑 `md:` 확장)

| 용도 | 모바일 | 데스크탑 | weight | line-height | letter-spacing |
|---|---|---|---|---|---|
| Display | 32px | 40px | 700 | 1.2 | -0.02em |
| H1 | 28px | 32px | 700 | 1.3 | -0.015em |
| H2 | 22px | 24px | 600 | 1.4 | -0.01em |
| H3 | 18px | 19px | 600 | 1.5 | 0 |
| Body | 16px | 17px | 400 | 1.8 | 0 |
| Body Small | 14px | 15px | 400 | 1.7 | 0 |
| Caption | 13px | 13px | 500 | 1.5 | 0 |
| Code inline | 14px | 14px | 500 | 1.6 | 0 |

본문 `line-height: 1.8`은 Toss 기술 블로그 기준. 한국어 긴 글 가독성의 공식. H1 이상의 음수 letter-spacing은 Pretendard 큰 굵기의 자간 보정용.
```

### Task 36: Update CLAUDE.md §12 (작업 우선순위)

- [ ] **Step 1: Replace §12 Phase list in `CLAUDE.md`**

Find `## 12. 작업 우선순위` and update the numbered list to reflect completed Phase 2 and reduced Phase 6:

```markdown
## 12. 작업 우선순위

새로운 작업 요청 시 아래 순서를 참고합니다:

1. **Phase 1 — 기반 구축** ✅ **완료** (`phase-1-complete` 태그): Next.js 프로젝트 초기화, Velite 설정, MDX 파이프라인, 샘플 글 렌더링. 세부 내역은 §13 참고.
2. **Phase 2 — 핵심 UI** ✅ **완료** (`phase-2-complete` 태그): 디자인 토큰, Pretendard/JetBrains Mono, 다크모드(토글 포함), 인덱스 페이지(검색/필터/정렬), 글 상세 페이지(TOC), shadcn/ui 도입, Shiki 라인 하이라이트. 세부 내역은 §14 참고.
3. **Phase 3 — 키워드 시스템**: remark-auto-link 플러그인, KeywordLink 컴포넌트, 키워드 맵
4. **Phase 4 — 시각화 프레임워크**: VisualContainer, StepController, SpeedSlider 공통 컴포넌트 구축
5. **Phase 5 — 탐색 기능**: FlexSearch 통합, 관련 글 추천, 태그 페이지 `/tags/[tag]`
6. **Phase 6 — 마무리**: 반응형 미세 조정, 성능 최적화

> **시각화 컴포넌트 개별 구현**은 Phase 4 이후 각 글을 작성할 때 해당 주제에 맞게 함께 구현합니다.
> 예: "퀵소트" 글 작성 시 → `QuickSort.tsx` 시각화 컴포넌트도 함께 구현
```

### Task 37: Add CLAUDE.md §14 — Phase 2 구현 현황

- [ ] **Step 1: Append new section at the end of `CLAUDE.md`**

Add after §13:

```markdown

---

## 14. Phase 2 구현 현황

> 이 섹션은 Phase 2 완료 시점(2026-04-14)의 실제 구현 상태와 향후 에이전트가 반드시 알아야 할 의사결정/제약을 기록합니다. §13과 같은 포맷.

### 14.1 존재하는 파일 (Phase 2에서 추가·변경)

```
app/
├── layout.tsx                  # [수정] Pretendard + JetBrains Mono + ThemeProvider + Header + Footer
├── page.tsx                    # [재작성] 인덱스 페이지 (검색/필터/정렬, URL 동기화)
├── globals.css                 # [재작성] shadcn 토큰 + prose-kr
└── posts/[slug]/page.tsx       # [수정] 2열 레이아웃 + TOC 사이드바

components/
├── ui/                         # shadcn/ui
│   ├── button.tsx
│   ├── input.tsx
│   ├── badge.tsx
│   └── select.tsx
├── blog/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── PostCard.tsx
│   ├── PostList.tsx
│   ├── PostMeta.tsx
│   ├── ReadingTime.tsx
│   ├── TableOfContents.tsx     # 'use client', IntersectionObserver
│   ├── TagChip.tsx             # 'use client'
│   ├── TagFilterBar.tsx        # 'use client', useRouter
│   ├── SearchBar.tsx           # 'use client', 250ms debounce
│   ├── SortSelect.tsx          # 'use client'
│   └── ThemeToggle.tsx         # 'use client'
├── mdx/
│   ├── index.ts                # mdxComponents 확장 (h1, a)
│   └── MDXContent.tsx          # (Phase 1 유지)
└── providers/
    └── ThemeProvider.tsx       # 'use client', next-themes 래퍼

lib/
├── posts.ts                    # (Phase 1 유지)
├── filters.ts                  # filterByTag / searchPosts / sortPosts / applyFilters / extractAllTags
├── reading-time.ts             # calculateReadingTime (500자/분)
├── toc.ts                      # flattenToc (Velite 계층 → flat)
└── utils.ts                    # cn() + buildPostsUrl()

public/fonts/
├── PretendardVariable.woff2    # ~1.2MB
└── JetBrainsMono-Variable.ttf  # ~200KB

tests/                          # Phase 1 17 + Phase 2 25 = 42 테스트
├── filters.test.ts             # 14 케이스
├── reading-time.test.ts        # 5 케이스
└── toc.test.ts                 # 6 케이스

components.json                 # shadcn/ui 설정
velite.config.ts                # [수정] rehype-slug 추가, readingTime computed field, Shiki line highlight
tailwind.config.ts              # [수정] darkMode: ['selector', '[data-theme="dark"]']
```

### 14.2 핵심 의사결정 (변경 금지)

| 결정 | 이유 | 영향 |
|---|---|---|
| shadcn/ui 토큰 네이밍 채택 | Toss/Doodlin/pathsdog 벤치마크가 shadcn neutral 테마 범위와 광학적으로 일치 | CSS 변수는 `--background/--foreground/...` 등 shadcn 컨벤션. 프로젝트 고유는 `--keyword`, `--keyword-bg`, `--border-strong`로 공존 |
| `next-themes` with `attribute="data-theme"` | CSS 선택자 `[data-theme="dark"]`와 정합 | `ThemeProvider`의 `attribute` prop을 절대 바꾸지 말 것. 변경 시 CSS 매칭이 깨짐 |
| Velite `s.toc()` + `rehype-slug` 조합 | 양쪽 모두 `github-slugger` 기반이라 id 일치 보장 | 자체 TOC 플러그인 미작성. 계층 구조는 `lib/toc.ts`의 `flattenToc()`로 flat 변환 |
| 서버 사이드 필터링 | 클라이언트 번들에 필터 로직 미포함 + Phase 5 FlexSearch 교체 시 서버 함수만 변경 | `SearchBar`/`TagFilterBar`/`SortSelect`는 URL 쿼리만 변경. Next.js가 `searchParams` 변경을 감지해 재렌더 |
| 검색 debounce 250ms | 한글 IME 조합 완료 후 안정적 업데이트 | `SearchBar`의 effect는 의도적으로 `value`만 dependency 배열에 포함 (exhaustive-deps 경고 무시) |
| 폰트 local 셀프 호스팅 | 로컬 전용 프로젝트 원칙 + Next.js CLS 방어 | 외부 CDN 금지. `public/fonts/` 하위 2개 파일 커밋 |
| 테스트 범위: 순수 함수만 | `@testing-library/react` + jsdom 모킹 비용 대비 효용 낮음 | UI 회귀는 `pnpm build` + dev 서버 수동 확인으로 방어. Phase 6에서 Playwright 검토 |

### 14.3 명령어 치트시트

```bash
pnpm dev              # 개발 서버
pnpm build            # 프로덕션 빌드 (Velite 선행)
pnpm test             # velite build && vitest run (42 테스트)
pnpm test:unit        # vitest run만 (velite 스킵)
pnpm type-check       # tsc --noEmit
pnpm lint             # next lint (Next 16에서 ESLint CLI 전환 예정)
pnpm velite           # Velite만 실행
```

### 14.4 알려진 미결 사항 (후속 Phase에서 처리)

- **관련 글 추천** — Phase 5 ("탐색 기능")
- **태그 전용 페이지 `/tags/[tag]`** — Phase 5
- **키워드 자동 링크** — Phase 3
- **검색 대상에 본문 포함** — Phase 5 FlexSearch 도입 시
- **`series`/`seriesOrder` 정합성 `.refine()`** — 한쪽만 있는 경우 스키마 에러 없음. Phase 5 시리즈 UI 도입 전 추가 필요
- **반응형 미세 조정** — Phase 6
- **성능 최적화** (이미지 blur placeholder, 폰트 preload 최적화 등) — Phase 6

### 14.5 리포지토리

- **원격**: `https://github.com/ing9990/backend-notes` (private)
- **Phase 2 태그**: `phase-2-complete`
- **브랜치 전략**: Phase 1과 동일하게 단일 `main`에 직접 커밋. Phase 3부터 feature 브랜치 도입 검토.
```

### Task 38: Commit CLAUDE.md updates

- [ ] **Step 1: Review changes**

```bash
git diff CLAUDE.md
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for Phase 2 completion (§7.2/§7.3/§12 + §14)"
```

### Task 39: Final verification and Phase 2 tag

- [ ] **Step 1: Run full verification pipeline**

```bash
pnpm build && pnpm test && pnpm type-check
```

Expected: all three exit 0. Build output shows both `/` and `/posts/hello-world` (and `/posts/database-index-basics`, `/posts/jvm-gc-intro`, `/posts/kafka-consumer-group`) in the routes list.

- [ ] **Step 2: Start dev server and do final manual smoke test**

```bash
pnpm dev
```

Check:
- Index page: all 4 posts listed, tag filter works, search filters, sort changes order, URL synced
- Post detail: Pretendard body, TOC sticky on scroll, highlighted code block visible
- Theme toggle: light ↔ dark both render correctly, no hydration warnings in console

Then:

```bash
pkill -f "next dev"
```

- [ ] **Step 3: Tag `phase-2-complete`**

```bash
git tag phase-2-complete
git log --oneline -1 phase-2-complete
```

Expected: the tag points at the most recent commit (CLAUDE.md update).

---

## Rollback Notes

If any stage fails catastrophically, roll back to the last-known-good stage:

```bash
git log --oneline
# Find the commit at the end of the previous stage
git reset --hard <commit-sha>
rm -rf .next .velite node_modules/.vite-temp
pnpm install
pnpm velite
pnpm build
```

Each stage's final commit produces a buildable state, so rollback to any stage boundary is safe.
