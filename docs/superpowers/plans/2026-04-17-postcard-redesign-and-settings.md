# PostCard 3종 + 전역 설정 패널 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 인덱스 페이지의 게시글 카드를 3가지 레이아웃(Editorial / Timeline / Floating)으로 구현하고, 전역 설정 FAB + 패널로 전환할 수 있게 한다.

**Architecture:** `SettingsProvider`(React Context + localStorage)가 전역 설정을 관리. `SettingsFab`이 모든 페이지에 고정된 톱니바퀴 버튼을 렌더링하고, 클릭 시 `SettingsPanel`이 슬라이드업. `PostList`와 `RecentPostsSection`이 `useSettings().cardLayout` 값에 따라 3종 카드를 분기 렌더링.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Tailwind v4, Lucide React, localStorage

**Spec:** `docs/superpowers/specs/2026-04-17-postcard-redesign-and-settings.md`

---

### Task 1: 카테고리 컬러 맵

**Files:**
- Create: `lib/category-colors.ts`

- [ ] **Step 1: 카테고리별 컬러 맵 파일 생성**

```ts
// lib/category-colors.ts
import type { CategoryId } from './categories'

export interface CategoryColor {
  accent: string
  tint: string
  darkTint: string
}

export const CATEGORY_COLORS: Record<CategoryId, CategoryColor> = {
  'computer-science': { accent: '#7C3AED', tint: '#F5F3FF', darkTint: '#1E1147' },
  language:           { accent: '#2563EB', tint: '#EFF6FF', darkTint: '#0F1E3D' },
  database:           { accent: '#059669', tint: '#ECFDF5', darkTint: '#042F1F' },
  frameworks:         { accent: '#0891B2', tint: '#ECFEFF', darkTint: '#0C2D3D' },
  library:            { accent: '#DC2626', tint: '#FEF2F2', darkTint: '#2B0A0A' },
  knowledge:          { accent: '#D97706', tint: '#FFFBEB', darkTint: '#3B2D05' },
  etc:                { accent: '#DB2777', tint: '#FDF2F8', darkTint: '#2B0A1A' },
}
```

- [ ] **Step 2: type-check 확인**

Run: `pnpm type-check`
Expected: PASS — 새 파일은 타입만 export, 기존 코드 영향 없음

- [ ] **Step 3: 커밋**

```bash
git add lib/category-colors.ts
git commit -m "feat: add category color map for card accents"
```

---

### Task 2: SettingsProvider

**Files:**
- Create: `components/providers/SettingsProvider.tsx`

- [ ] **Step 1: SettingsProvider 구현**

```tsx
// components/providers/SettingsProvider.tsx
'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type CardLayout = 'editorial' | 'timeline' | 'floating'

export interface Settings {
  cardLayout: CardLayout
}

const DEFAULT_SETTINGS: Settings = {
  cardLayout: 'editorial',
}

const STORAGE_KEY = 'deep-settings'

interface SettingsContextValue {
  settings: Settings
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  updateSetting: () => {},
})

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext)
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<Settings>
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // quota exceeded — ignore silently
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setSettings(loadSettings())
    setHydrated(true)
  }, [])

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value }
        saveSettings(next)
        return next
      })
    },
    [],
  )

  const contextValue: SettingsContextValue = { settings, updateSetting }

  // hydrated 전에도 children을 렌더링 (default 값으로). Flash 최소화.
  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  )
}
```

- [ ] **Step 2: type-check 확인**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3: 커밋**

```bash
git add components/providers/SettingsProvider.tsx
git commit -m "feat: add SettingsProvider with localStorage persistence"
```

---

### Task 3: SettingsProvider를 app/layout.tsx에 연결

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: layout.tsx에 SettingsProvider import 및 래핑 추가**

`app/layout.tsx`에서 `MobileUIProvider` 안쪽, `<div className="flex min-h-screen ...">` 바깥을 `SettingsProvider`로 감싼다.

변경 전:
```tsx
<MobileUIProvider posts={clientPosts}>
  <div className="flex min-h-screen flex-col">
```

변경 후:
```tsx
<MobileUIProvider posts={clientPosts}>
  <SettingsProvider>
    <div className="flex min-h-screen flex-col">
```

닫는 태그도 대응 추가:
```tsx
    </div>
    <MobileOverlays />
  </SettingsProvider>
</MobileUIProvider>
```

import 추가:
```tsx
import { SettingsProvider } from '@/components/providers/SettingsProvider'
```

- [ ] **Step 2: type-check 확인**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3: 커밋**

```bash
git add app/layout.tsx
git commit -m "feat: wrap app in SettingsProvider"
```

---

### Task 4: SettingsPanel 컴포넌트

**Files:**
- Create: `components/layout/SettingsPanel.tsx`

- [ ] **Step 1: SettingsPanel 구현**

```tsx
// components/layout/SettingsPanel.tsx
'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useSettings, type CardLayout } from '@/components/providers/SettingsProvider'
import { cn } from '@/lib/utils'

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
}

const LAYOUT_OPTIONS: { value: CardLayout; label: string }[] = [
  { value: 'editorial', label: 'Editorial' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'floating', label: 'Floating' },
]

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { settings, updateSetting } = useSettings()
  const panelRef = useRef<HTMLDivElement>(null)

  // ESC 닫기
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // 외부 클릭 닫기
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // requestAnimationFrame으로 FAB 클릭 이벤트와 충돌 방지
    const id = requestAnimationFrame(() => {
      document.addEventListener('mousedown', handleClick)
    })
    return () => {
      cancelAnimationFrame(id)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="설정"
      className="fixed bottom-20 right-6 z-50 w-[300px] origin-bottom-right animate-[panel-in_0.25s_cubic-bezier(0.22,1,0.36,1)_both] rounded-2xl border border-border bg-background shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 pb-3 pt-4">
        <h3 className="text-[15px] font-bold tracking-tight">설정</h3>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
          aria-label="설정 닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="py-2">
        {/* Theme Section */}
        <div className="px-5 py-3">
          <div className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            테마
          </div>
          <div className="flex gap-2">
            {LAYOUT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateSetting('cardLayout', opt.value)}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1.5 rounded-xl border-[1.5px] px-2 py-2.5 transition-all',
                  settings.cardLayout === opt.value
                    ? 'border-primary bg-accent'
                    : 'border-border bg-background hover:border-border-strong hover:bg-muted',
                )}
              >
                <LayoutMiniIcon layout={opt.value} active={settings.cardLayout === opt.value} />
                <span className="text-[11px] font-semibold">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* 각 레이아웃의 특징을 추상화한 미니 와이어프레임 아이콘 */
function LayoutMiniIcon({ layout, active }: { layout: CardLayout; active: boolean }) {
  const barColor = active ? 'bg-primary' : 'bg-muted-foreground/30'
  const dotColor = active ? 'bg-primary' : 'bg-muted-foreground/30'

  if (layout === 'editorial') {
    return (
      <div className="flex h-7 w-9 items-stretch overflow-hidden rounded">
        <div className={cn('w-[3px] shrink-0 rounded-l', barColor)} />
        <div className="flex flex-1 flex-col justify-center gap-1 pl-1.5 pr-1">
          <div className={cn('h-[3px] w-full rounded-full', barColor)} />
          <div className={cn('h-[2px] w-3/4 rounded-full', barColor, 'opacity-50')} />
        </div>
      </div>
    )
  }

  if (layout === 'timeline') {
    return (
      <div className="flex h-7 w-9 items-center gap-1 rounded px-1">
        <div className={cn('h-2.5 w-2.5 shrink-0 rounded-full border-2', active ? 'border-primary' : 'border-muted-foreground/30')} />
        <div className="flex flex-1 flex-col justify-center gap-1">
          <div className={cn('h-[3px] w-full rounded-full', barColor)} />
          <div className={cn('h-[2px] w-3/4 rounded-full', barColor, 'opacity-50')} />
        </div>
      </div>
    )
  }

  // floating
  return (
    <div className="flex h-7 w-9 items-center gap-1.5 rounded px-1">
      <div className={cn('h-3 w-3 shrink-0 rounded', dotColor)} />
      <div className="flex flex-1 flex-col justify-center gap-1">
        <div className={cn('h-[3px] w-full rounded-full', barColor)} />
        <div className={cn('h-[2px] w-3/4 rounded-full', barColor, 'opacity-50')} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: globals.css에 panel-in 키프레임 추가**

`app/globals.css` 맨 끝에 추가:

```css
/* ================================================================
   Settings panel slide-up animation
   ================================================================ */

@keyframes panel-in {
  0% { opacity: 0; transform: scale(0.95) translateY(8px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
```

- [ ] **Step 3: type-check 확인**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 4: 커밋**

```bash
git add components/layout/SettingsPanel.tsx app/globals.css
git commit -m "feat: add SettingsPanel with theme section"
```

---

### Task 5: SettingsFab 컴포넌트

**Files:**
- Create: `components/layout/SettingsFab.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: SettingsFab 구현**

```tsx
// components/layout/SettingsFab.tsx
'use client'

import { useCallback, useState } from 'react'
import { Settings } from 'lucide-react'
import { SettingsPanel } from './SettingsPanel'

export function SettingsFab() {
  const [open, setOpen] = useState(false)

  const handleToggle = useCallback(() => setOpen((prev) => !prev), [])
  const handleClose = useCallback(() => setOpen(false), [])

  return (
    <>
      <SettingsPanel open={open} onClose={handleClose} />
      <button
        type="button"
        onClick={handleToggle}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-transform hover:scale-105"
        aria-label="설정 열기"
      >
        <Settings
          className="h-[22px] w-[22px] transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-[60deg]"
          style={{ transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </button>
    </>
  )
}
```

- [ ] **Step 2: layout.tsx에 SettingsFab 추가**

`app/layout.tsx`에서 `<SettingsProvider>` 안, `<div className="flex min-h-screen ...">` 밖에 `<SettingsFab />`을 추가:

```tsx
import { SettingsFab } from '@/components/layout/SettingsFab'
```

```tsx
<SettingsProvider>
  <div className="flex min-h-screen flex-col">
    <Header />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
  <MobileOverlays />
  <SettingsFab />
</SettingsProvider>
```

- [ ] **Step 3: type-check 확인**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 4: dev 서버에서 FAB 확인**

`http://blog.localhost:3010/`에서 우측 하단에 톱니바퀴 버튼이 보이는지, 클릭 시 설정 패널이 열리는지, ESC와 외부 클릭으로 닫히는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add components/layout/SettingsFab.tsx app/layout.tsx
git commit -m "feat: add global settings FAB button"
```

---

### Task 6: PostCardEditorial 컴포넌트

**Files:**
- Create: `components/blog/PostCardEditorial.tsx`

- [ ] **Step 1: PostCardEditorial 구현**

```tsx
// components/blog/PostCardEditorial.tsx
'use client'

import Link from 'next/link'
import type { Post } from '@/lib/posts'
import { getCategory } from '@/lib/categories'
import { CATEGORY_ICONS } from '@/lib/category-icons'
import { CATEGORY_COLORS } from '@/lib/category-colors'
import { formatDate } from '@/lib/utils'

export function PostCardEditorial({ post }: { post: Post }) {
  const meta = getCategory(post.category)
  const Icon = CATEGORY_ICONS[post.category]
  const colors = CATEGORY_COLORS[post.category]

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group relative block overflow-hidden rounded-xl border border-border bg-background px-6 py-5 transition-all hover:-translate-y-px hover:border-border-strong hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
    >
      {/* Left accent bar */}
      <span
        className="absolute inset-y-0 left-0 w-[3.5px] rounded-l-xl opacity-50 transition-opacity group-hover:opacity-100"
        style={{ backgroundColor: colors.accent }}
        aria-hidden
      />

      {/* Top row: category pill + date */}
      <div className="mb-2.5 flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-[3px] text-[11.5px] font-semibold tracking-wide"
          style={{ color: colors.accent, backgroundColor: colors.tint }}
        >
          <Icon className="h-[13px] w-[13px]" strokeWidth={2.2} aria-hidden />
          {meta.label}
        </span>
        <time className="text-[12.5px] tabular-nums text-muted-foreground" dateTime={post.date}>
          {formatDate(post.date)}
        </time>
      </div>

      {/* Title */}
      <h2 className="text-[17px] font-semibold leading-[1.45] tracking-[-0.015em] text-foreground transition-colors group-hover:text-primary">
        {post.title}
      </h2>

      {/* Summary */}
      <p className="mt-1.5 line-clamp-2 text-[14px] leading-[1.65] text-muted-foreground">
        {post.summary}
      </p>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded bg-muted px-2 py-[2px] text-[11.5px] font-medium text-muted-foreground transition-colors group-hover:bg-border group-hover:text-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}
```

- [ ] **Step 2: type-check 확인**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3: 커밋**

```bash
git add components/blog/PostCardEditorial.tsx
git commit -m "feat: add PostCardEditorial layout"
```

---

### Task 7: PostCardTimeline 컴포넌트

**Files:**
- Create: `components/blog/PostCardTimeline.tsx`

- [ ] **Step 1: PostCardTimeline 구현**

타임라인 레이아웃은 카드 + 좌측 타임라인 영역을 함께 포함한다. `isLast` prop으로 마지막 카드의 연결선을 숨긴다.

```tsx
// components/blog/PostCardTimeline.tsx
'use client'

import Link from 'next/link'
import type { Post } from '@/lib/posts'
import { getCategory } from '@/lib/categories'
import { CATEGORY_ICONS } from '@/lib/category-icons'
import { CATEGORY_COLORS } from '@/lib/category-colors'

interface PostCardTimelineProps {
  post: Post
  isLast?: boolean
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function PostCardTimeline({ post, isLast = false }: PostCardTimelineProps) {
  const meta = getCategory(post.category)
  const Icon = CATEGORY_ICONS[post.category]
  const colors = CATEGORY_COLORS[post.category]
  const d = new Date(post.date)
  const day = String(d.getUTCDate()).padStart(2, '0')
  const month = MONTH_LABELS[d.getUTCMonth()]

  return (
    <div className="group flex gap-0">
      {/* Timeline column */}
      <div className="relative flex w-[72px] shrink-0 flex-col items-center pt-[22px]">
        {/* Vertical line */}
        {!isLast && (
          <div className="absolute bottom-[-12px] left-1/2 top-[42px] w-[1.5px] -translate-x-1/2 bg-border" aria-hidden />
        )}
        {/* Date circle */}
        <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-background text-[13px] font-bold text-muted-foreground transition-colors group-hover:border-primary group-hover:text-primary">
          {day}
        </div>
        <span className="mt-1 text-[10.5px] font-medium uppercase tracking-widest text-muted-foreground">
          {month}
        </span>
      </div>

      {/* Card */}
      <Link
        href={`/posts/${post.slug}`}
        className="block min-w-0 flex-1 rounded-xl border border-border bg-background px-[22px] py-[18px] transition-all hover:border-border-strong hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
      >
        {/* Category */}
        <div className="mb-2 flex items-center gap-2">
          <span
            className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-[7px]"
            style={{ backgroundColor: colors.tint }}
          >
            <Icon className="h-[14px] w-[14px]" style={{ color: colors.accent }} strokeWidth={2.2} aria-hidden />
          </span>
          <span className="text-[12px] font-semibold" style={{ color: colors.accent }}>
            {meta.label}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-[16.5px] font-semibold leading-[1.45] tracking-[-0.01em] text-foreground transition-colors group-hover:text-primary">
          {post.title}
        </h2>

        {/* Summary */}
        <p className="mt-[5px] line-clamp-2 text-[14px] leading-[1.6] text-muted-foreground">
          {post.summary}
        </p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-2.5 flex gap-[5px]">
            {post.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[11px] font-medium text-muted-foreground">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: type-check 확인**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3: 커밋**

```bash
git add components/blog/PostCardTimeline.tsx
git commit -m "feat: add PostCardTimeline layout"
```

---

### Task 8: PostCardFloating 컴포넌트

**Files:**
- Create: `components/blog/PostCardFloating.tsx`

- [ ] **Step 1: PostCardFloating 구현**

```tsx
// components/blog/PostCardFloating.tsx
'use client'

import Link from 'next/link'
import type { Post } from '@/lib/posts'
import { getCategory } from '@/lib/categories'
import { CATEGORY_ICONS } from '@/lib/category-icons'
import { CATEGORY_COLORS } from '@/lib/category-colors'
import { formatDate } from '@/lib/utils'

export function PostCardFloating({ post }: { post: Post }) {
  const meta = getCategory(post.category)
  const Icon = CATEGORY_ICONS[post.category]
  const colors = CATEGORY_COLORS[post.category]

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group grid grid-cols-[44px_1fr] items-start gap-4 rounded-[14px] border border-border bg-background p-5 transition-all hover:border-border-strong hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)]"
    >
      {/* Icon area */}
      <span
        className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
        style={{
          backgroundColor: colors.tint,
          border: `1px solid color-mix(in oklch, ${colors.accent} 15%, transparent)`,
          boxShadow: 'none',
        }}
        aria-hidden
      >
        <Icon className="h-5 w-5" style={{ color: colors.accent }} strokeWidth={1.8} />
      </span>

      {/* Content */}
      <div className="min-w-0">
        {/* Top row */}
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[12px] font-semibold" style={{ color: colors.accent }}>
            {meta.label}
          </span>
          <time className="text-[12px] tabular-nums text-muted-foreground" dateTime={post.date}>
            {formatDate(post.date)}
          </time>
        </div>

        {/* Title */}
        <h2 className="text-[17px] font-semibold leading-[1.4] tracking-[-0.015em] text-foreground transition-colors group-hover:text-primary">
          {post.title}
        </h2>

        {/* Summary */}
        <p className="mt-[5px] line-clamp-2 text-[14px] leading-[1.6] text-muted-foreground">
          {post.summary}
        </p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded bg-muted px-[7px] py-[2px] text-[11px] font-medium text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: type-check 확인**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3: 커밋**

```bash
git add components/blog/PostCardFloating.tsx
git commit -m "feat: add PostCardFloating layout"
```

---

### Task 9: PostList 분기 렌더링

**Files:**
- Modify: `components/blog/PostList.tsx`

- [ ] **Step 1: PostList를 client component로 전환하고 cardLayout 분기 추가**

전체 파일을 다음으로 교체:

```tsx
// components/blog/PostList.tsx
'use client'

import { useSettings } from '@/components/providers/SettingsProvider'
import { PostCardEditorial } from './PostCardEditorial'
import { PostCardTimeline } from './PostCardTimeline'
import { PostCardFloating } from './PostCardFloating'
import type { Post } from '@/lib/posts'

export function PostList({ posts }: { posts: Post[] }) {
  const { settings } = useSettings()

  if (posts.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-dashed border-border py-16 text-center">
        <p className="text-sm text-muted-foreground">
          조건에 맞는 글이 없습니다. 필터를 조정해보세요.
        </p>
      </div>
    )
  }

  if (settings.cardLayout === 'timeline') {
    return (
      <div className="mt-6 space-y-3">
        {posts.map((post, i) => (
          <PostCardTimeline
            key={post.slug}
            post={post}
            isLast={i === posts.length - 1}
          />
        ))}
      </div>
    )
  }

  const Card =
    settings.cardLayout === 'floating' ? PostCardFloating : PostCardEditorial

  return (
    <div className="mt-6 space-y-3">
      {posts.map((post) => (
        <Card key={post.slug} post={post} />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: type-check 확인**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3: 커밋**

```bash
git add components/blog/PostList.tsx
git commit -m "feat: PostList renders card layout from settings"
```

---

### Task 10: RecentPostsSection 분기 렌더링

**Files:**
- Modify: `components/blog/RecentPostsSection.tsx`

- [ ] **Step 1: RecentPostsSection에 cardLayout 분기 적용**

전체 파일을 다음으로 교체:

```tsx
// components/blog/RecentPostsSection.tsx
'use client'

import type { Post } from '@/lib/posts'
import { useSettings } from '@/components/providers/SettingsProvider'
import { PostCardEditorial } from './PostCardEditorial'
import { PostCardTimeline } from './PostCardTimeline'
import { PostCardFloating } from './PostCardFloating'

interface RecentPostsSectionProps {
  posts: Post[]
}

export function RecentPostsSection({ posts }: RecentPostsSectionProps) {
  const { settings } = useSettings()

  if (posts.length === 0) return null

  return (
    <section className="mt-16 border-t border-border pt-12">
      <h2 className="text-[20px] font-semibold text-foreground md:text-[22px]">
        최근 글
      </h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {settings.cardLayout === 'timeline'
          ? posts.map((post, i) => (
              <PostCardTimeline key={post.slug} post={post} isLast={i === posts.length - 1} />
            ))
          : settings.cardLayout === 'floating'
            ? posts.map((post) => <PostCardFloating key={post.slug} post={post} />)
            : posts.map((post) => <PostCardEditorial key={post.slug} post={post} />)
        }
      </div>
    </section>
  )
}
```

- [ ] **Step 2: type-check 확인**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3: 커밋**

```bash
git add components/blog/RecentPostsSection.tsx
git commit -m "feat: RecentPostsSection uses card layout setting"
```

---

### Task 11: 다크모드 카테고리 컬러 대응

**Files:**
- Modify: `components/blog/PostCardEditorial.tsx`
- Modify: `components/blog/PostCardTimeline.tsx`
- Modify: `components/blog/PostCardFloating.tsx`
- Modify: `lib/category-colors.ts`

- [ ] **Step 1: category-colors.ts에 `categoryStyle` 유틸 함수 추가**

`lib/category-colors.ts` 파일 상단에 React import 추가, 하단에 함수 추가:

파일 상단 import 변경:
```ts
import type { CategoryId } from './categories'
```
→
```ts
import type { CSSProperties } from 'react'
import type { CategoryId } from './categories'
```

파일 하단에 함수 추가:
```ts
/** 카테고리 컬러를 CSS custom properties로 주입하는 인라인 스타일 반환.
 *  카드 컴포넌트 루트에 style로 적용하면 내부에서 var(--cat-accent) 등으로 참조 가능. */
export function categoryStyle(id: CategoryId): CSSProperties {
  const c = CATEGORY_COLORS[id]
  return {
    '--cat-accent': c.accent,
    '--cat-tint': c.tint,
    '--cat-dark-tint': c.darkTint,
  } as CSSProperties
}
```

- [ ] **Step 2: globals.css에 다크모드 오버라이드 추가**

`app/globals.css`의 `[data-theme="dark"]` 블록 맨 끝에 추가:

```css
/* Category card tint — dark mode uses --cat-dark-tint */
[data-theme="dark"] [data-cat-tinted] {
  --cat-tint: var(--cat-dark-tint);
}
```

- [ ] **Step 3: 3종 카드에 data-cat-tinted 적용**

각 카드 컴포넌트의 루트 요소에 `style={categoryStyle(post.category)}` 과 `data-cat-tinted` 속성을 추가하고, 하드코딩된 `colors.tint`를 `var(--cat-tint)`로, `colors.accent`를 `var(--cat-accent)`로 교체.

**PostCardEditorial.tsx 변경사항:**

루트 `<Link>`에 추가:
```tsx
style={categoryStyle(post.category)}
data-cat-tinted=""
```

accent bar: `style={{ backgroundColor: colors.accent }}` → `style={{ backgroundColor: 'var(--cat-accent)' }}`
pill: `style={{ color: colors.accent, backgroundColor: colors.tint }}` → `style={{ color: 'var(--cat-accent)', backgroundColor: 'var(--cat-tint)' }}`

**PostCardTimeline.tsx 변경사항:**

래퍼 `<div>`에 추가:
```tsx
style={categoryStyle(post.category)}
data-cat-tinted=""
```

아이콘 배경: `style={{ backgroundColor: colors.tint }}` → `style={{ backgroundColor: 'var(--cat-tint)' }}`
아이콘/라벨 색: `style={{ color: colors.accent }}` → `style={{ color: 'var(--cat-accent)' }}`

**PostCardFloating.tsx 변경사항:**

루트 `<Link>`에 추가:
```tsx
style={categoryStyle(post.category)}
data-cat-tinted=""
```

아이콘 영역: `backgroundColor: colors.tint` → `backgroundColor: 'var(--cat-tint)'`
border: `` `1px solid color-mix(in oklch, ${colors.accent} 15%, transparent)` `` → `'1px solid color-mix(in oklch, var(--cat-accent) 15%, transparent)'`
아이콘/라벨 색: `style={{ color: colors.accent }}` → `style={{ color: 'var(--cat-accent)' }}`

import 정리: `CATEGORY_COLORS` 직접 사용 제거, `categoryStyle` import 추가.

- [ ] **Step 4: type-check 확인**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 5: 다크모드에서 확인**

dev 서버에서 다크모드 전환 후 카드 tint 배경이 어두운 버전으로 적용되는지 확인.

- [ ] **Step 6: 커밋**

```bash
git add lib/category-colors.ts app/globals.css components/blog/PostCardEditorial.tsx components/blog/PostCardTimeline.tsx components/blog/PostCardFloating.tsx
git commit -m "feat: dark mode category color support via CSS custom props"
```

---

### Task 12: 기존 PostCard.tsx 삭제 및 정리

**Files:**
- Delete: `components/blog/PostCard.tsx`

- [ ] **Step 1: PostCard import가 남아있는지 확인**

Run: `grep -r "from.*PostCard" components/ app/ --include="*.tsx" --include="*.ts"`

Expected: `PostList.tsx`와 `RecentPostsSection.tsx`에서 기존 `PostCard` import가 이미 제거된 상태. 다른 파일에서 import가 없어야 한다.

- [ ] **Step 2: PostCard.tsx 삭제**

```bash
git rm components/blog/PostCard.tsx
```

- [ ] **Step 3: type-check + build 확인**

Run: `pnpm type-check && pnpm build`
Expected: PASS — 기존 PostCard를 참조하는 코드가 없으므로 정상 빌드

- [ ] **Step 4: 커밋**

```bash
git commit -m "chore: remove legacy PostCard replaced by 3 layout variants"
```

---

### Task 13: 전체 통합 검증

**Files:** (변경 없음 — 검증만)

- [ ] **Step 1: dev 서버 기동 확인**

Run: `PORT=3010 pnpm dev` (이미 실행 중이면 생략)

- [ ] **Step 2: 인덱스 페이지 3종 레이아웃 전환 확인**

`http://blog.localhost:3010/`에서:
1. FAB 클릭 → 설정 패널 열림
2. Editorial 선택 → 좌측 컬러 바 + pill 카드
3. Timeline 선택 → 좌측 날짜 원 + 연결선 타임라인
4. Floating 선택 → 좌측 아이콘 박스 그리드
5. 패널 닫기 → 새로고침 → 선택한 레이아웃 유지 (localStorage)

- [ ] **Step 3: 다크모드 확인**

라이트/다크 전환 시 3종 카드 모두 tint 배경이 적절히 변경되는지 확인.

- [ ] **Step 4: 포스트 상세 페이지 FAB 확인**

`http://blog.localhost:3010/posts/quick-sort` 등에서 FAB가 보이고, 설정 패널이 정상 동작하는지 확인.

- [ ] **Step 5: RecentPostsSection 확인**

포스트 상세 하단 "최근 글" 영역도 선택한 레이아웃을 반영하는지 확인.

- [ ] **Step 6: 모바일 375px 확인**

브라우저 DevTools에서 375px 뷰포트로 3종 레이아웃 모두 깨지지 않는지 확인. FAB가 콘텐츠를 가리지 않는지 확인.

- [ ] **Step 7: type-check + build 최종 확인**

Run: `pnpm type-check && pnpm build`
Expected: PASS
