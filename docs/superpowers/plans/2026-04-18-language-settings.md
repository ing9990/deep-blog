# 언어 설정 토글 + 카테고리/UI chrome 이중화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 전역 설정 패널에 언어 토글(ko/en, 기본 en)을 추가하고, 토글 즉시 카테고리 라벨/설명과 블로그 UI chrome이 해당 언어로 전환되도록 한다.

**Architecture:** `SettingsProvider`에 `language` 필드 추가 + localStorage persistence 재사용. 번역은 중앙 dict(`lib/i18n/messages.ts`)에 flat dotted key로 저장하고, `useTranslation()` 훅이 현재 언어에 해당하는 문자열을 반환. 카테고리는 `CategoryMeta.label/description`을 `{ ko; en }` 객체로 이중화해 사용처에서 `[lang]`로 선택.

**Tech Stack:** Next.js 15 App Router (existing), TypeScript strict, Tailwind v4, Vitest + jsdom

**Spec:** `docs/superpowers/specs/2026-04-18-language-settings.md`

---

## File Structure

**신규:**
- `lib/i18n/messages.ts` — 번역 dict + `translate()` 순수 함수 (테스트 대상)
- `lib/i18n/useTranslation.ts` — 클라이언트 훅, `translate()` 래퍼
- `__tests__/i18n.test.ts` — `translate()` 단위 테스트

**수정:**
- `components/providers/SettingsProvider.tsx` — `language` 필드, 값 검증
- `lib/categories.ts` — `label/description` 이중화
- `lib/utils.ts` — `formatDate(iso, lang)` 시그니처 확장
- `components/layout/SettingsFab.tsx` — aria-label 번역
- `components/layout/SettingsPanel.tsx` — 헤더/테마 번역 + 언어 섹션 추가
- `components/blog/IndexCategoryNav.tsx` — 카테고리 label + aria-label + "전체"
- `components/blog/PostCardEditorial.tsx` — `meta.label[lang]` + `formatDate(date, lang)`
- `components/blog/PostCardTimeline.tsx` — `meta.label[lang]`
- `components/blog/PostCardFloating.tsx` — `meta.label[lang]` + `formatDate(date, lang)`
- `components/blog/PostMeta.tsx` — `'use client'` 전환 + `formatDate(date, lang)`
- `components/blog/HeaderActions.tsx` — aria-label × 4, 검색 placeholder
- `components/blog/BlogHomeClient.tsx` — "전체 N개 글" 보간 번역
- `components/blog/TagFilterBar.tsx` — "All" → 번역
- `components/blog/RecentPostsSection.tsx` — "최근 글" 번역
- `components/blog/SortSelect.tsx` — 정렬 옵션 라벨 번역
- `components/blog/ReadingTime.tsx` — "읽기 N분" 보간 번역
- `components/blog/PostList.tsx` — empty state 번역
- `components/blog/TagPageHeader.tsx` — "전체 글 목록", "N개 글" 번역

---

## Task 1: `SettingsProvider`에 `language` 필드 추가

**Files:**
- Modify: `components/providers/SettingsProvider.tsx`

- [ ] **Step 1: 전체 파일 교체**

`components/providers/SettingsProvider.tsx` 전체를 다음으로 교체:

```tsx
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
export type Language = 'en' | 'ko'

export interface Settings {
  cardLayout: CardLayout
  language: Language
}

const DEFAULT_SETTINGS: Settings = {
  cardLayout: 'timeline',
  language: 'en',
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

function normalizeLanguage(value: unknown): Language {
  return value === 'ko' || value === 'en' ? value : 'en'
}

function normalizeCardLayout(value: unknown): CardLayout {
  return value === 'editorial' || value === 'timeline' || value === 'floating'
    ? value
    : 'timeline'
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<Record<keyof Settings, unknown>>
    return {
      cardLayout: normalizeCardLayout(parsed.cardLayout),
      language: normalizeLanguage(parsed.language),
    }
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

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  )
}
```

- [ ] **Step 2: type-check 확인**

Run: `pnpm type-check`
Expected: PASS — 기존 `Settings` 사용처(SettingsPanel)는 새 필드에 영향받지 않음(기존 `cardLayout`만 읽음).

- [ ] **Step 3: 커밋**

```bash
git add components/providers/SettingsProvider.tsx
git commit -m "feat(settings): add language field with value validation"
```

---

## Task 2: i18n 번역 dict 생성

**Files:**
- Create: `lib/i18n/messages.ts`

- [ ] **Step 1: `lib/i18n/messages.ts` 파일 생성**

```ts
import type { Language } from '@/components/providers/SettingsProvider'

export const MESSAGES = {
  // 헤더 네비 / 인터랙션
  'header.search.placeholder': { ko: '검색...',           en: 'Search...' },
  'header.open.nav':           { ko: '카테고리 열기',     en: 'Open navigation' },
  'header.open.search':        { ko: '검색 열기',         en: 'Open search' },
  'header.open.toc':           { ko: '목차 열기',         en: 'Open table of contents' },
  'header.open.github':        { ko: 'GitHub 저장소 열기', en: 'Open GitHub repository' },
  'header.site.actions':       { ko: '사이트 액션',       en: 'Site actions' },

  // 인덱스 / 필터
  'index.category.filter':     { ko: '카테고리 필터',     en: 'Category filter' },
  'index.all':                 { ko: '전체',              en: 'All' },
  'index.total.count':         { ko: '전체 {n}개 글',     en: '{n} posts total' },
  'index.empty':               { ko: '조건에 맞는 글이 없습니다. 필터를 조정해보세요.',
                                 en: 'No posts match your filter. Try adjusting filters.' },
  'tag.filter.all':            { ko: '전체',              en: 'All' },
  'tag.page.back':             { ko: '전체 글 목록',      en: 'All posts' },
  'tag.page.count':            { ko: '{n}개 글',          en: '{n} posts' },

  // 정렬
  'sort.latest':               { ko: '최신순',            en: 'Newest' },
  'sort.oldest':               { ko: '오래된순',          en: 'Oldest' },
  'sort.title':                { ko: '제목순',            en: 'Title' },

  // 포스트
  'post.recent':               { ko: '최근 글',           en: 'Recent Posts' },
  'post.reading.time':         { ko: '읽기 {n}분',        en: '{n} min read' },

  // 설정 패널
  'settings.title':            { ko: '설정',              en: 'Settings' },
  'settings.open':             { ko: '설정 열기',         en: 'Open settings' },
  'settings.close':            { ko: '설정 닫기',         en: 'Close settings' },
  'settings.theme':            { ko: '테마',              en: 'Theme' },
  'settings.layout.timeline':  { ko: 'Default',           en: 'Default' },
  'settings.layout.editorial': { ko: 'Editorial',         en: 'Editorial' },
  'settings.layout.floating':  { ko: 'Floating',          en: 'Floating' },
  'settings.language':         { ko: '언어',              en: 'Language' },
  'settings.lang.ko':          { ko: '한국어',            en: 'Korean' },
  'settings.lang.en':          { ko: '영어',              en: 'English' },
} as const

export type MessageKey = keyof typeof MESSAGES

export function translate(
  key: MessageKey,
  lang: Language,
  params?: Record<string, string | number>,
): string {
  let msg = MESSAGES[key][lang]
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      msg = msg.replaceAll(`{${k}}`, String(v))
    }
  }
  return msg
}
```

- [ ] **Step 2: type-check 확인**

Run: `pnpm type-check`
Expected: PASS — 새 파일, 아직 사용처 없음.

- [ ] **Step 3: 커밋**

```bash
git add lib/i18n/messages.ts
git commit -m "feat(i18n): add messages dict and translate() function"
```

---

## Task 3: `useTranslation` 훅 + 단위 테스트

**Files:**
- Create: `lib/i18n/useTranslation.ts`
- Create: `__tests__/i18n.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/i18n.test.ts` 생성:

```ts
import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n/messages'

describe('translate()', () => {
  it('returns the Korean string when lang=ko', () => {
    expect(translate('settings.title', 'ko')).toBe('설정')
  })

  it('returns the English string when lang=en', () => {
    expect(translate('settings.title', 'en')).toBe('Settings')
  })

  it('interpolates {n} param', () => {
    expect(translate('post.reading.time', 'ko', { n: 3 })).toBe('읽기 3분')
    expect(translate('post.reading.time', 'en', { n: 3 })).toBe('3 min read')
  })

  it('supports multi-param interpolation', () => {
    expect(translate('index.total.count', 'ko', { n: 12 })).toBe('전체 12개 글')
    expect(translate('index.total.count', 'en', { n: 12 })).toBe('12 posts total')
  })

  it('returns the raw template unchanged when no params provided for a parameterized key', () => {
    expect(translate('post.reading.time', 'ko')).toBe('읽기 {n}분')
  })
})
```

- [ ] **Step 2: 테스트 실행해서 import 해결 확인**

Run: `pnpm vitest run __tests__/i18n.test.ts`
Expected: PASS — `translate()`는 Task 2에서 이미 구현됨. 테스트는 기존 구현을 검증하는 것.

(PASS가 나오지 않으면 Task 2 구현을 다시 확인. 특히 `replaceAll` 호환성, Node 버전 이슈 가능성 체크.)

- [ ] **Step 3: `useTranslation` 훅 작성**

`lib/i18n/useTranslation.ts` 생성:

```ts
'use client'

import { useSettings } from '@/components/providers/SettingsProvider'
import { translate, type MessageKey } from './messages'

export function useTranslation() {
  const { settings } = useSettings()
  const lang = settings.language
  const t = (key: MessageKey, params?: Record<string, string | number>) =>
    translate(key, lang, params)
  return { t, lang }
}
```

- [ ] **Step 4: type-check 확인**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add lib/i18n/useTranslation.ts __tests__/i18n.test.ts
git commit -m "feat(i18n): add useTranslation hook and translate() unit tests"
```

---

## Task 4: 카테고리 스키마 이중화 + 사용처 4개 수정

**Files:**
- Modify: `lib/categories.ts`
- Modify: `components/blog/IndexCategoryNav.tsx`
- Modify: `components/blog/PostCardEditorial.tsx`
- Modify: `components/blog/PostCardTimeline.tsx`
- Modify: `components/blog/PostCardFloating.tsx`

- [ ] **Step 1: `lib/categories.ts` 전체 교체**

```ts
export const CATEGORY_IDS = [
  'computer-science',
  'data-structure',
  'language',
  'database',
  'frameworks',
  'library',
  'ai',
  'knowledge',
  'etc',
] as const

export type CategoryId = (typeof CATEGORY_IDS)[number]

export interface CategoryMeta {
  id: CategoryId
  label:       { ko: string; en: string }
  description: { ko: string; en: string }
}

export const CATEGORIES: readonly CategoryMeta[] = [
  {
    id: 'computer-science',
    label:       { en: 'Computer Science', ko: '컴퓨터 과학' },
    description: { en: 'OS, algorithms', ko: 'OS, 알고리즘' },
  },
  {
    id: 'data-structure',
    label:       { en: 'Data Structure', ko: '자료구조' },
    description: { en: 'B-Tree, hash maps, arrays, linked lists', ko: 'B-Tree, 해시맵, 배열, 연결 리스트' },
  },
  {
    id: 'language',
    label:       { en: 'Language', ko: '언어' },
    description: { en: 'Kotlin, TypeScript, Java, JVM', ko: 'Kotlin, TypeScript, Java, JVM' },
  },
  {
    id: 'database',
    label:       { en: 'Database', ko: '데이터베이스' },
    description: { en: 'MySQL, PostgreSQL, indexes', ko: 'MySQL, PostgreSQL, 인덱스' },
  },
  {
    id: 'frameworks',
    label:       { en: 'Frameworks', ko: '프레임워크' },
    description: { en: 'Spring Boot, Next.js', ko: 'Spring Boot, Next.js' },
  },
  {
    id: 'library',
    label:       { en: 'Library', ko: '라이브러리' },
    description: { en: 'Querydsl, JPA', ko: 'Querydsl, JPA' },
  },
  {
    id: 'ai',
    label:       { en: 'AI', ko: 'AI' },
    description: { en: 'LLM, machine learning, AI engineering', ko: 'LLM, 머신러닝, AI 엔지니어링' },
  },
  {
    id: 'knowledge',
    label:       { en: 'Knowledge', ko: '지식' },
    description: { en: 'Terms, concepts, fundamentals', ko: '용어, 개념, 기초 지식' },
  },
  {
    id: 'etc',
    label:       { en: 'ETC', ko: '그 외' },
    description: { en: 'Other topics', ko: '그 외 주제' },
  },
]

const CATEGORY_MAP = new Map<CategoryId, CategoryMeta>(
  CATEGORIES.map((c) => [c.id, c]),
)

export function getCategory(id: CategoryId): CategoryMeta {
  const meta = CATEGORY_MAP.get(id)
  if (!meta) throw new Error(`Unknown category id: ${id}`)
  return meta
}

export interface CategoryGroup<T> {
  category: CategoryMeta
  posts: T[]
}

export function groupPostsByCategory<T extends { category: CategoryId; date: string; title: string }>(
  posts: readonly T[],
): CategoryGroup<T>[] {
  const buckets = new Map<CategoryId, T[]>()
  for (const post of posts) {
    const list = buckets.get(post.category) ?? []
    list.push(post)
    buckets.set(post.category, list)
  }

  return CATEGORIES.flatMap((category) => {
    const list = buckets.get(category.id)
    if (!list || list.length === 0) return []
    const sorted = list.slice().sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1
      return a.title.localeCompare(b.title, 'ko')
    })
    return [{ category, posts: sorted }]
  })
}
```

- [ ] **Step 2: type-check로 타입 에러 목록 확인**

Run: `pnpm type-check`
Expected: FAIL — `meta.label`이 `string`이 아닌 객체가 되어 사용처 4곳에서 타입 에러.

예상 오류 위치:
- `components/blog/IndexCategoryNav.tsx:67` — `{meta.label}`
- `components/blog/PostCardEditorial.tsx:35` — `{meta.label}`
- `components/blog/PostCardTimeline.tsx:69` — `{meta.label}`
- `components/blog/PostCardFloating.tsx:39` — `{meta.label}`

- [ ] **Step 3: `components/blog/PostCardEditorial.tsx` 수정**

파일 상단 import에 훅 추가:

```tsx
import { useTranslation } from '@/lib/i18n/useTranslation'
```

컴포넌트 시작부에 `lang` 읽기 추가:

```tsx
export function PostCardEditorial({ post }: { post: Post }) {
  const { lang } = useTranslation()
  const meta = getCategory(post.category)
  // ... 기존 코드
```

`{meta.label}` → `{meta.label[lang]}` 교체.

- [ ] **Step 4: `components/blog/PostCardTimeline.tsx` 동일 수정**

```tsx
import { useTranslation } from '@/lib/i18n/useTranslation'

export function PostCardTimeline(/* ... */) {
  const { lang } = useTranslation()
  const meta = getCategory(post.category)
  // ...
```

`{meta.label}` → `{meta.label[lang]}` 교체.

- [ ] **Step 5: `components/blog/PostCardFloating.tsx` 동일 수정**

```tsx
import { useTranslation } from '@/lib/i18n/useTranslation'

export function PostCardFloating({ post }: { post: Post }) {
  const { lang } = useTranslation()
  const meta = getCategory(post.category)
  // ...
```

`{meta.label}` → `{meta.label[lang]}` 교체.

- [ ] **Step 6: `components/blog/IndexCategoryNav.tsx` 수정**

이미 `'use client'` 컴포넌트. 상단에 훅 import + 사용:

```tsx
import { useTranslation } from '@/lib/i18n/useTranslation'
```

컴포넌트 시작부:

```tsx
export function IndexCategoryNav({ allPosts }: IndexCategoryNavProps) {
  const { t, lang } = useTranslation()
  const { category, setCategory } = useIndexFilter()
  // ...
```

3곳 교체:

1. `aria-label="카테고리 필터"` → `aria-label={t('index.category.filter')}`
2. `<span className="flex-1 text-left">전체</span>` → `<span className="flex-1 text-left">{t('index.all')}</span>`
3. `{meta.label}` → `{meta.label[lang]}`

- [ ] **Step 7: type-check 확인**

Run: `pnpm type-check`
Expected: PASS — 4곳 모두 수정 완료, 타입 에러 해소.

- [ ] **Step 8: 커밋**

```bash
git add lib/categories.ts components/blog/IndexCategoryNav.tsx components/blog/PostCardEditorial.tsx components/blog/PostCardTimeline.tsx components/blog/PostCardFloating.tsx
git commit -m "feat(i18n): bilingualize category labels/descriptions and migrate usages"
```

---

## Task 5: `formatDate(iso, lang)` 확장 + 사용처 마이그레이션

**Files:**
- Modify: `lib/utils.ts`
- Modify: `components/blog/PostMeta.tsx`
- Modify: `components/blog/PostCardEditorial.tsx`
- Modify: `components/blog/PostCardFloating.tsx`

- [ ] **Step 1: `lib/utils.ts`의 `formatDate` 확장**

기존 함수를 다음으로 교체:

```ts
import type { Language } from '@/components/providers/SettingsProvider'

const EN_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function formatDate(iso: string, lang: Language = 'en'): string {
  const d = new Date(iso)
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth() // 0-indexed
  const day = d.getUTCDate()

  if (lang === 'ko') {
    return `${y}년 ${m + 1}월 ${day}일`
  }
  return `${EN_MONTHS[m]} ${day}, ${y}`
}
```

(기존 `yyyy.mm.dd` 포맷은 폐기. lang별 자연 포맷으로 대체.)

- [ ] **Step 2: type-check로 호출부 영향 확인**

Run: `pnpm type-check`
Expected: PASS — 기본값 `'en'`이라 기존 `formatDate(date)` 호출은 컴파일 통과. 단 런타임 출력 포맷이 달라짐 → Step 3~5에서 호출부를 lang 전달로 업데이트.

- [ ] **Step 3: `components/blog/PostMeta.tsx`를 `'use client'`로 전환하고 lang 전달**

전체 파일을 다음으로 교체:

```tsx
'use client'

import Link from 'next/link'
import { ReadingTime } from './ReadingTime'
import { formatDate } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface PostMetaProps {
  tags: readonly string[]
  date: string
  readingTime: number
}

export function PostMeta({ tags, date, readingTime }: PostMetaProps) {
  const { lang } = useTranslation()
  const formattedDate = formatDate(date, lang)
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <Link
            key={tag}
            href={`/tags/${encodeURIComponent(tag)}`}
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
```

- [ ] **Step 4: `PostCardEditorial.tsx`에서 formatDate에 lang 전달**

이미 Task 4에서 `const { lang } = useTranslation()` 추가됨. `{formatDate(post.date)}` → `{formatDate(post.date, lang)}`로 변경.

- [ ] **Step 5: `PostCardFloating.tsx`에서 formatDate에 lang 전달**

동일하게 `{formatDate(post.date)}` → `{formatDate(post.date, lang)}`.

- [ ] **Step 6: type-check + build 확인**

Run: `pnpm type-check`
Expected: PASS

Run: `pnpm build`
Expected: PASS — PostMeta가 server에서 client로 전환됐으므로 상위 호출부가 server여도 RSC 경계 통과.

- [ ] **Step 7: 커밋**

```bash
git add lib/utils.ts components/blog/PostMeta.tsx components/blog/PostCardEditorial.tsx components/blog/PostCardFloating.tsx
git commit -m "feat(i18n): extend formatDate with lang arg and migrate callers"
```

---

## Task 6: `SettingsFab` aria-label 번역

**Files:**
- Modify: `components/layout/SettingsFab.tsx`

- [ ] **Step 1: 전체 파일 교체**

```tsx
'use client'

import { useCallback, useState } from 'react'
import { Settings } from 'lucide-react'
import { SettingsPanel } from './SettingsPanel'
import { useTranslation } from '@/lib/i18n/useTranslation'

export function SettingsFab() {
  const { t } = useTranslation()
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
        aria-label={t('settings.open')}
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

- [ ] **Step 2: type-check 확인**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3: 커밋**

```bash
git add components/layout/SettingsFab.tsx
git commit -m "feat(i18n): translate SettingsFab aria-label"
```

---

## Task 7: `SettingsPanel` 헤더/테마 번역 + 언어 섹션 추가

**Files:**
- Modify: `components/layout/SettingsPanel.tsx`

- [ ] **Step 1: 전체 파일 교체**

```tsx
// components/layout/SettingsPanel.tsx
'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import {
  useSettings,
  type CardLayout,
  type Language,
} from '@/components/providers/SettingsProvider'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { cn } from '@/lib/utils'
import type { MessageKey } from '@/lib/i18n/messages'

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
}

const LAYOUT_OPTIONS: { value: CardLayout; labelKey: MessageKey }[] = [
  { value: 'timeline',  labelKey: 'settings.layout.timeline' },
  { value: 'editorial', labelKey: 'settings.layout.editorial' },
  { value: 'floating',  labelKey: 'settings.layout.floating' },
]

const LANGUAGE_OPTIONS: { value: Language; labelKey: MessageKey }[] = [
  { value: 'ko', labelKey: 'settings.lang.ko' },
  { value: 'en', labelKey: 'settings.lang.en' },
]

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { settings, updateSetting } = useSettings()
  const { t, lang } = useTranslation()
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
      aria-label={t('settings.title')}
      className="fixed bottom-20 right-6 z-50 w-[300px] origin-bottom-right animate-[panel-in_0.25s_cubic-bezier(0.22,1,0.36,1)_both] rounded-2xl border border-border bg-background shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 pb-3 pt-4">
        <h3 className="text-[15px] font-bold tracking-tight">{t('settings.title')}</h3>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
          aria-label={t('settings.close')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="py-2">
        {/* Theme Section */}
        <div className="px-5 py-3">
          <div className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('settings.theme')}
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
                <span className="text-[11px] font-semibold">{t(opt.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Language Section */}
        <div className="px-5 py-3">
          <div className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('settings.language')}
          </div>
          <div className="flex gap-2">
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateSetting('language', opt.value)}
                className={cn(
                  'flex-1 rounded-lg border-[1.5px] px-3 py-2 text-[12.5px] font-semibold transition-all',
                  lang === opt.value
                    ? 'border-primary bg-accent text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-border-strong',
                )}
              >
                {t(opt.labelKey)}
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

- [ ] **Step 2: type-check 확인**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3: dev 서버에서 확인**

`http://blog.localhost:3010/` 에서:
1. FAB 클릭 → 설정 패널 열림
2. 테마 섹션이 "테마" (기본 한국어 dict — 영어 기본이면 "Theme") 표시
3. 아래 구분선 + 언어 섹션 "Language / Korean / English" 표시
4. 언어 "한국어" 클릭 → 설정 패널 전체 라벨이 한국어로 전환
5. 새로고침 후에도 한국어 유지

- [ ] **Step 4: 커밋**

```bash
git add components/layout/SettingsPanel.tsx
git commit -m "feat(i18n): translate SettingsPanel headers and add language section"
```

---

## Task 8: `HeaderActions` 번역

**Files:**
- Modify: `components/blog/HeaderActions.tsx`

- [ ] **Step 1: 전체 파일 교체**

```tsx
'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { AlignRight, Menu, Search } from 'lucide-react'
import { GithubMark } from './GithubMark'
import { useMobileUI } from '@/components/providers/MobileUIProvider'
import { ThemeToggle } from './ThemeToggle'
import { useTranslation } from '@/lib/i18n/useTranslation'

export function HeaderActions() {
  const { t } = useTranslation()
  const { openNav, openSearch, openToc, tocItems } = useMobileUI()
  const hasToc = !!tocItems && tocItems.length > 0

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        openSearch()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openSearch])

  return (
    <div className="flex h-16 items-center gap-3 lg:grid lg:grid-cols-[288px_minmax(0,1fr)_224px] lg:gap-12">
      <div className="flex shrink-0 items-center lg:min-w-0">
        <button
          type="button"
          onClick={openNav}
          aria-label={t('header.open.nav')}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3 lg:ml-0 lg:w-full">
        <Link
          href="/"
          className="flex shrink-0 items-center font-semibold tracking-tight"
        >
          <span className="text-[17px]">DEEP</span>
        </Link>

        <button
          type="button"
          onClick={openSearch}
          aria-label={t('header.open.search')}
          className="mx-auto inline-flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-muted/40 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:h-auto md:w-[180px] md:justify-start md:px-3 md:py-2 lg:w-[220px] xl:w-[280px]"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="hidden md:inline">{t('header.search.placeholder')}</span>
          <kbd className="ml-auto hidden rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:inline">
            ⌘K
          </kbd>
        </button>

        <nav
          aria-label={t('header.site.actions')}
          className="flex shrink-0 items-center gap-0.5"
        >
          {hasToc && (
            <button
              type="button"
              onClick={openToc}
              aria-label={t('header.open.toc')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
            >
              <AlignRight className="h-5 w-5" />
            </button>
          )}
          <a
            href="https://github.com/ing9990"
            target="_blank"
            rel="noreferrer"
            aria-label={t('header.open.github')}
            className="group inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-muted hover:text-foreground active:scale-95"
          >
            <GithubMark className="h-[18px] w-[18px] transition-transform duration-300 ease-out group-hover:-rotate-12" />
          </a>
          <span aria-hidden="true" className="mx-2 h-5 w-px bg-border" />
          <ThemeToggle />
        </nav>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: type-check 확인**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3: 커밋**

```bash
git add components/blog/HeaderActions.tsx
git commit -m "feat(i18n): translate header aria-labels and search placeholder"
```

---

## Task 9: `BlogHomeClient` + `TagFilterBar` 번역

**Files:**
- Modify: `components/blog/BlogHomeClient.tsx`
- Modify: `components/blog/TagFilterBar.tsx`

- [ ] **Step 1: `BlogHomeClient.tsx` 전체 교체**

```tsx
'use client'

import { useEffect, useMemo } from 'react'
import type { Post } from '@/lib/posts'
import { applyFilters, extractAllTags } from '@/lib/filters'
import { PostList } from './PostList'
import { TagFilterBar } from './TagFilterBar'
import { SortSelect } from './SortSelect'
import { useIndexFilter } from './IndexFilterContext'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface BlogHomeClientProps {
  allPosts: Post[]
}

export function BlogHomeClient({ allPosts }: BlogHomeClientProps) {
  const { t } = useTranslation()
  const { category, tag, setTag, sort, setSort } = useIndexFilter()

  const scopedPosts = useMemo(
    () =>
      category ? allPosts.filter((p) => p.category === category) : allPosts,
    [allPosts, category],
  )

  const scopedTags = useMemo(() => extractAllTags(scopedPosts), [scopedPosts])

  useEffect(() => {
    if (!tag) return
    const exists = scopedTags.some((t) => t.tag === tag)
    if (!exists) setTag(undefined)
  }, [scopedTags, tag, setTag])

  const filtered = useMemo(
    () => applyFilters(scopedPosts, { tag, sort }),
    [scopedPosts, tag, sort],
  )

  return (
    <>
      {category !== null && (
        <TagFilterBar
          allTags={scopedTags}
          selected={tag}
          onToggle={setTag}
        />
      )}
      <div className="mt-8 flex items-center justify-between text-sm text-muted-foreground">
        <span>{t('index.total.count', { n: filtered.length })}</span>
        <SortSelect value={sort} onChange={setSort} />
      </div>
      <PostList posts={filtered} />
    </>
  )
}
```

- [ ] **Step 2: `TagFilterBar.tsx` 전체 교체**

```tsx
'use client'

import { TagChip } from './TagChip'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface TagFilterBarProps {
  allTags: Array<{ tag: string; count: number }>
  selected?: string
  onToggle: (tag: string | undefined) => void
}

export function TagFilterBar({ allTags, selected, onToggle }: TagFilterBarProps) {
  const { t } = useTranslation()

  function toggle(tag?: string) {
    onToggle(selected === tag ? undefined : tag)
  }

  return (
    <div className="mt-8 flex flex-wrap gap-2">
      <TagChip label={t('tag.filter.all')} active={!selected} onClick={() => toggle(undefined)} />
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

- [ ] **Step 3: type-check 확인**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 4: 커밋**

```bash
git add components/blog/BlogHomeClient.tsx components/blog/TagFilterBar.tsx
git commit -m "feat(i18n): translate index counter and tag filter 'all' label"
```

---

## Task 10: `RecentPostsSection` "최근 글" 번역

**Files:**
- Modify: `components/blog/RecentPostsSection.tsx`

- [ ] **Step 1: 파일 수정 — import 추가 + 훅 + heading 교체**

파일 상단 import에 훅 추가:

```tsx
import { useTranslation } from '@/lib/i18n/useTranslation'
```

컴포넌트 시작부:

```tsx
export function RecentPostsSection({ posts }: RecentPostsSectionProps) {
  const { t } = useTranslation()
  const { settings } = useSettings()
  // ...
```

heading 교체:

```tsx
<h2 className="text-[20px] font-semibold text-foreground md:text-[22px]">
  {t('post.recent')}
</h2>
```

- [ ] **Step 2: type-check 확인**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3: 커밋**

```bash
git add components/blog/RecentPostsSection.tsx
git commit -m "feat(i18n): translate recent posts heading"
```

---

## Task 11: `SortSelect` + `ReadingTime` + `PostList` + `TagPageHeader` 번역

**Files:**
- Modify: `components/blog/SortSelect.tsx`
- Modify: `components/blog/ReadingTime.tsx`
- Modify: `components/blog/PostList.tsx`
- Modify: `components/blog/TagPageHeader.tsx`

- [ ] **Step 1: `SortSelect.tsx` 전체 교체**

```tsx
'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SortKey } from '@/lib/filters'
import { useTranslation } from '@/lib/i18n/useTranslation'
import type { MessageKey } from '@/lib/i18n/messages'

interface SortSelectProps {
  value: SortKey
  onChange: (next: SortKey) => void
}

const LABEL_KEYS: Record<SortKey, MessageKey> = {
  latest: 'sort.latest',
  oldest: 'sort.oldest',
  title:  'sort.title',
}

const isSortKey = (s: string): s is SortKey => s in LABEL_KEYS

export function SortSelect({ value, onChange }: SortSelectProps) {
  const { t } = useTranslation()
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (isSortKey(next)) onChange(next)
      }}
    >
      <SelectTrigger className="h-9 w-[120px] text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(LABEL_KEYS) as SortKey[]).map((key) => (
          <SelectItem key={key} value={key}>
            {t(LABEL_KEYS[key])}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

- [ ] **Step 2: `ReadingTime.tsx` 전체 교체**

```tsx
'use client'

import { useTranslation } from '@/lib/i18n/useTranslation'

export function ReadingTime({ minutes }: { minutes: number }) {
  const { t } = useTranslation()
  return <span>{t('post.reading.time', { n: minutes })}</span>
}
```

- [ ] **Step 3: `PostList.tsx` empty state 번역**

파일 상단 import 추가:

```tsx
import { useTranslation } from '@/lib/i18n/useTranslation'
```

컴포넌트 시작부:

```tsx
export function PostList({ posts }: { posts: Post[] }) {
  const { t } = useTranslation()
  const { settings } = useSettings()
  // ...
```

empty state 블록 교체:

```tsx
if (posts.length === 0) {
  return (
    <div className="mt-6 rounded-lg border border-dashed border-border py-16 text-center">
      <p className="text-sm text-muted-foreground">
        {t('index.empty')}
      </p>
    </div>
  )
}
```

- [ ] **Step 4: `TagPageHeader.tsx` 전체 교체**

```tsx
'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface TagPageHeaderProps {
  tag: string
  count: number
}

export function TagPageHeader({ tag, count }: TagPageHeaderProps) {
  const { t } = useTranslation()
  return (
    <div>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        {t('tag.page.back')}
      </Link>
      <h1 className="mt-6 text-[32px] font-bold tracking-[-0.02em] md:text-[40px]">
        #{tag}
      </h1>
      <p className="mt-3 text-[15px] text-muted-foreground">{t('tag.page.count', { n: count })}</p>
    </div>
  )
}
```

- [ ] **Step 5: type-check + build 확인**

Run: `pnpm type-check`
Expected: PASS

Run: `pnpm build`
Expected: PASS — `TagPageHeader`가 server에서 client로 전환되었으므로, 상위에서 children으로 넘기는 구조라면 문제없음.

- [ ] **Step 6: 커밋**

```bash
git add components/blog/SortSelect.tsx components/blog/ReadingTime.tsx components/blog/PostList.tsx components/blog/TagPageHeader.tsx
git commit -m "feat(i18n): translate sort options, reading time, empty state, tag header"
```

---

## Task 12: 통합 검증

**Files:** (변경 없음 — 검증만)

- [ ] **Step 1: 전체 테스트 실행**

Run: `pnpm test`
Expected: PASS (velite + vitest 둘 다).

- [ ] **Step 2: lint**

Run: `pnpm lint`
Expected: PASS. 경고가 있어도 기존 수준 초과 금지.

- [ ] **Step 3: type-check + build**

Run: `pnpm type-check && pnpm build`
Expected: PASS.

- [ ] **Step 4: dev 서버 수동 QA**

`http://blog.localhost:3010/` 방문 후 다음 시나리오 통과 확인:

1. **첫 방문 기본값**
   - localStorage 비우고 새로고침 → UI 전체 영어 (`DEEP` / `Search...` 수평 가운데, 카테고리 라벨 영어, `Recent Posts`, `All`, `12 posts total`, `Apr 18, 2026` 형식 등).

2. **한국어 전환**
   - 설정 FAB 클릭 → 설정 패널 열림
   - 언어 섹션에서 `한국어` 클릭 (현재 영어 모드라 라벨은 `Korean`)
   - 즉시 전환: 헤더 aria-label, 설정 패널 전체, 카테고리 네비("전체" + 한국어 label), 인덱스 카운터("전체 12개 글"), 카드 카테고리 pill, 날짜 포맷(`2026년 4월 18일`), `최근 글`, `#태그`, 태그 페이지 "전체 글 목록".
   - 언어 섹션 라벨이 "언어 / 한국어 / 영어"로 자기 언어 반영.

3. **영어로 복귀**
   - 설정 패널에서 `영어` 클릭 → 즉시 영어 전환.

4. **Persistence**
   - 한국어 상태에서 새로고침 → 한국어 유지.
   - localStorage 수동 제거(`localStorage.removeItem('deep-settings')`) → 새로고침 → 영어(기본값)로 복귀.

5. **포스트 상세**
   - `/posts/b-tree-structure` 등 방문 → 헤더·PostMeta 날짜·ReadingTime("3 min read" / "읽기 3분")·최근 글 heading·카테고리 pill 언어 반영.

6. **태그 페이지**
   - `/tags/<some-tag>` 방문 → 상단 "All posts" / "N posts" 또는 "전체 글 목록" / "N개 글" 표시.

7. **카드 레이아웃 3종 × 언어 2개 조합**
   - 설정 패널에서 Default/Editorial/Floating을 교차 선택하며 언어 전환 시 카드 카테고리 라벨·날짜가 모두 반영되는지 확인.

8. **라이트/다크 × 언어 직교**
   - 테마 토글과 언어 토글이 독립 동작.

9. **모바일 375px**
   - DevTools 뷰포트 375px → 설정 패널 2섹션 세로 스크롤 없어도 들어맞음. FAB이 콘텐츠 가리지 않음.

- [ ] **Step 5: 검증 노트 작성 (선택)**

위 9개 시나리오 중 재현된 문제가 있으면 이슈로 기록. 회귀 없이 통과하면 최종 커밋 불필요 (구현 task에서 커밋 완료).
