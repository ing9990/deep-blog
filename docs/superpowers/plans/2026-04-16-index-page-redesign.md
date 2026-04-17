# Index Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the blog index page to show a flat chronological post list with category/tag badges on cards, replace top CategoryTabBar with a left-sidebar category nav.

**Architecture:** Lift filter state (category/tag/sort) into a React context (`IndexFilterProvider`) so that the left-sidebar `IndexCategoryNav` and the main-area `BlogHomeClient` share state without fighting the Server Component boundary of `DocShell`. `DocShell` gains a `leftSlot` prop for custom left-column content. `PostCard` adds a category badge.

**Tech Stack:** React Context, Next.js 15 App Router, Tailwind v4, lucide-react icons, existing `lib/categories.ts` + `lib/filters.ts` utilities.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `components/blog/IndexFilterContext.tsx` | Context provider + hook for shared category/tag/sort state + URL sync |
| Create | `components/blog/IndexCategoryNav.tsx` | Left-sidebar category list (icon, label, count) |
| Modify | `components/blog/PostCard.tsx` | Add category badge (icon + label) alongside tags |
| Modify | `components/layout/DocShell.tsx` | Add `leftSlot?: ReactNode` prop |
| Modify | `components/blog/BlogHomeClient.tsx` | Consume context, remove CategoryTabBar/GroupedFeed, always flat list |
| Modify | `app/page.tsx` | Wire IndexFilterProvider + IndexCategoryNav via leftSlot |

---

### Task 1: Create `IndexFilterContext`

**Files:**
- Create: `components/blog/IndexFilterContext.tsx`

- [ ] **Step 1: Create the context provider**

```tsx
'use client'

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { CategoryId } from '@/lib/categories'
import type { SortKey } from '@/lib/filters'
import { buildPostsUrl } from '@/lib/utils'

interface IndexFilterState {
  category: CategoryId | null
  tag: string | undefined
  sort: SortKey
  setCategory: (cat: CategoryId | null) => void
  setTag: (tag: string | undefined) => void
  setSort: (sort: SortKey) => void
}

const IndexFilterCtx = createContext<IndexFilterState | null>(null)

interface IndexFilterProviderProps {
  children: ReactNode
  initialCategory?: CategoryId
  initialTag?: string
  initialSort: SortKey
}

export function IndexFilterProvider({
  children,
  initialCategory,
  initialTag,
  initialSort,
}: IndexFilterProviderProps) {
  const [category, setCategoryRaw] = useState<CategoryId | null>(
    initialCategory ?? null,
  )
  const [tag, setTag] = useState<string | undefined>(initialTag)
  const [sort, setSort] = useState<SortKey>(initialSort)

  function setCategory(next: CategoryId | null) {
    setCategoryRaw(next)
    setTag(undefined)
  }

  /* URL sync — replaceState only, never router.push */
  const isFirstRun = useRef(true)
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    if (typeof window === 'undefined') return
    const next = buildPostsUrl({
      tag,
      sort,
      category: category ?? undefined,
    })
    const current = window.location.pathname + window.location.search
    if (next !== current) {
      window.history.replaceState(null, '', next)
    }
  }, [tag, sort, category])

  return (
    <IndexFilterCtx.Provider
      value={{ category, tag, sort, setCategory, setTag, setSort }}
    >
      {children}
    </IndexFilterCtx.Provider>
  )
}

export function useIndexFilter(): IndexFilterState {
  const ctx = useContext(IndexFilterCtx)
  if (!ctx)
    throw new Error('useIndexFilter must be used within IndexFilterProvider')
  return ctx
}
```

- [ ] **Step 2: Run type check**

Run: `pnpm type-check`
Expected: PASS (new file, no consumers yet)

- [ ] **Step 3: Commit**

```bash
git add components/blog/IndexFilterContext.tsx
git commit -m "feat: add IndexFilterContext for shared category/tag/sort state"
```

---

### Task 2: Create `IndexCategoryNav`

**Files:**
- Create: `components/blog/IndexCategoryNav.tsx`

**Depends on:** Task 1

- [ ] **Step 1: Create the component**

```tsx
'use client'

import { Layers } from 'lucide-react'
import {
  CATEGORIES,
  groupPostsByCategory,
  type CategoryId,
} from '@/lib/categories'
import { CATEGORY_ICONS } from '@/lib/category-icons'
import { cn } from '@/lib/utils'
import { useIndexFilter } from './IndexFilterContext'
import type { Post } from '@/lib/posts'
import { useMemo } from 'react'

interface IndexCategoryNavProps {
  allPosts: Post[]
}

export function IndexCategoryNav({ allPosts }: IndexCategoryNavProps) {
  const { category, setCategory } = useIndexFilter()

  const groups = useMemo(() => groupPostsByCategory(allPosts), [allPosts])

  return (
    <nav aria-label="카테고리 필터" className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => setCategory(null)}
        className={cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
          category === null
            ? 'bg-accent font-medium text-accent-foreground'
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
        )}
      >
        <Layers className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
        <span className="flex-1 text-left">전체</span>
        <span className="tabular-nums text-xs opacity-60">
          {allPosts.length}
        </span>
      </button>

      {CATEGORIES.map((meta) => {
        const group = groups.find((g) => g.category.id === meta.id)
        const count = group?.posts.length ?? 0
        if (count === 0) return null
        const Icon = CATEGORY_ICONS[meta.id]
        const isActive = category === meta.id

        return (
          <button
            key={meta.id}
            type="button"
            onClick={() => setCategory(isActive ? null : meta.id)}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-accent font-medium text-accent-foreground'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
          >
            <Icon
              className="h-4 w-4 shrink-0"
              strokeWidth={2}
              aria-hidden
            />
            <span className="flex-1 text-left">{meta.label}</span>
            <span className="tabular-nums text-xs opacity-60">{count}</span>
          </button>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 2: Run type check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/blog/IndexCategoryNav.tsx
git commit -m "feat: add IndexCategoryNav left-sidebar component"
```

---

### Task 3: Add category badge to `PostCard`

**Files:**
- Modify: `components/blog/PostCard.tsx`

- [ ] **Step 1: Update PostCard to show category icon + label alongside tags**

Replace the entire file content with:

```tsx
import Link from 'next/link'
import type { Post } from '@/lib/posts'
import { getCategory } from '@/lib/categories'
import { CATEGORY_ICONS } from '@/lib/category-icons'
import { formatDate } from '@/lib/utils'

export function PostCard({ post }: { post: Post }) {
  const categoryMeta = getCategory(post.category)
  const CategoryIcon = CATEGORY_ICONS[post.category]

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group block rounded-lg border border-border bg-background p-6 transition-colors hover:border-border-strong hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <CategoryIcon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          {categoryMeta.label}
        </span>
        {post.tags.length > 0 && (
          <>
            <span className="text-border" aria-hidden>·</span>
            <span className="flex flex-wrap gap-1.5">
              {post.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="font-medium">#{tag}</span>
              ))}
            </span>
          </>
        )}
      </div>
      <h2 className="text-[18px] font-semibold leading-[1.4] tracking-[-0.01em] text-foreground transition-colors group-hover:text-primary">
        {post.title}
      </h2>
      <p className="mt-2 line-clamp-2 text-[15px] leading-[1.7] text-muted-foreground">
        {post.summary}
      </p>
      <time
        className="mt-4 block text-[13px] text-muted-foreground"
        dateTime={post.date}
      >
        {formatDate(post.date)}
      </time>
    </Link>
  )
}
```

- [ ] **Step 2: Run type check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/blog/PostCard.tsx
git commit -m "feat: add category badge to PostCard"
```

---

### Task 4: Add `leftSlot` prop to `DocShell`

**Files:**
- Modify: `components/layout/DocShell.tsx`

- [ ] **Step 1: Add leftSlot prop and rendering logic**

In `DocShellProps`, add `leftSlot?: ReactNode`.

Replace the left-column rendering block (the `{showCategoryNav ? ... : ...}` ternary) with:

```tsx
{leftSlot ? (
  <div className="hidden lg:block">
    <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto py-16 pr-2">
      {leftSlot}
    </div>
  </div>
) : showCategoryNav ? (
  <div className="hidden lg:block">
    <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto py-16 pr-2">
      <CategoryNav posts={posts} currentSlug={currentSlug} />
    </div>
  </div>
) : (
  <div className="hidden lg:block" aria-hidden />
)}
```

- [ ] **Step 2: Run type check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/layout/DocShell.tsx
git commit -m "feat: add leftSlot prop to DocShell"
```

---

### Task 5: Refactor `BlogHomeClient` to use context

**Files:**
- Modify: `components/blog/BlogHomeClient.tsx`

**Depends on:** Task 1

- [ ] **Step 1: Rewrite BlogHomeClient**

Replace entire file content with:

```tsx
'use client'

import { useEffect, useMemo } from 'react'
import type { Post } from '@/lib/posts'
import { applyFilters, extractAllTags } from '@/lib/filters'
import { PostList } from './PostList'
import { TagFilterBar } from './TagFilterBar'
import { SortSelect } from './SortSelect'
import { useIndexFilter } from './IndexFilterContext'

interface BlogHomeClientProps {
  allPosts: Post[]
}

export function BlogHomeClient({ allPosts }: BlogHomeClientProps) {
  const { category, tag, setTag, sort, setSort } = useIndexFilter()

  const scopedPosts = useMemo(
    () =>
      category ? allPosts.filter((p) => p.category === category) : allPosts,
    [allPosts, category],
  )

  const scopedTags = useMemo(() => extractAllTags(scopedPosts), [scopedPosts])

  // Safety: clear tag if it no longer exists in scope (stale URL params)
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
        <span>전체 {filtered.length}개 글</span>
        <SortSelect value={sort} onChange={setSort} />
      </div>
      <PostList posts={filtered} />
    </>
  )
}
```

- [ ] **Step 2: Run type check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/blog/BlogHomeClient.tsx
git commit -m "refactor: BlogHomeClient uses IndexFilterContext, flat list only"
```

---

### Task 6: Wire up `app/page.tsx`

**Files:**
- Modify: `app/page.tsx`

**Depends on:** Tasks 1, 2, 4, 5

- [ ] **Step 1: Update page.tsx to use IndexFilterProvider + IndexCategoryNav**

Replace entire file content with:

```tsx
import { getAllPosts } from '@/lib/posts'
import type { SortKey } from '@/lib/filters'
import { CATEGORY_IDS, type CategoryId } from '@/lib/categories'
import { BlogHomeClient } from '@/components/blog/BlogHomeClient'
import { HeroIntro } from '@/components/blog/HeroIntro'
import { DocShell } from '@/components/layout/DocShell'
import { IndexFilterProvider } from '@/components/blog/IndexFilterContext'
import { IndexCategoryNav } from '@/components/blog/IndexCategoryNav'

export default async function IndexPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; cat?: string; sort?: string }>
}) {
  const { tag, cat, sort } = await searchParams
  const allPosts = getAllPosts()

  const validSort: SortKey =
    sort === 'oldest' || sort === 'title' ? sort : 'latest'

  const validCategory: CategoryId | undefined =
    cat && (CATEGORY_IDS as readonly string[]).includes(cat)
      ? (cat as CategoryId)
      : undefined

  return (
    <>
      <HeroIntro />
      <IndexFilterProvider
        initialCategory={validCategory}
        initialTag={tag}
        initialSort={validSort}
      >
        <DocShell leftSlot={<IndexCategoryNav allPosts={allPosts} />}>
          <section className="mb-4">
            <h1 className="text-[32px] font-bold tracking-[-0.02em] md:text-[40px]">
              DEEP
            </h1>
          </section>
          <BlogHomeClient allPosts={allPosts} />
        </DocShell>
      </IndexFilterProvider>
    </>
  )
}
```

- [ ] **Step 2: Run type check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3: Run dev server and verify**

Run: `PORT=3010 pnpm dev` (background)
Visit: `http://blog.localhost:3010/`

Verify:
- All posts shown in flat list, sorted by date (newest first)
- Each PostCard shows category icon + label + tags
- Left sidebar shows category list with icons and counts
- Clicking a category filters posts + shows TagFilterBar
- Clicking same category again returns to "전체"
- URL updates with `?cat=xxx&tag=yyy` via replaceState
- SortSelect works in both modes
- Dark mode looks correct
- No console errors in dev log

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: wire up index page with left nav + flat post list"
```

---

### Task 7: Cleanup unused components

**Files:**
- Check: `components/blog/CategoryTabBar.tsx` — no longer imported anywhere
- Check: `components/blog/CategoryGroupedFeed.tsx` — no longer imported anywhere

- [ ] **Step 1: Verify no other imports exist**

Run: `grep -r "CategoryTabBar\|CategoryGroupedFeed" --include="*.tsx" --include="*.ts" -l`

If only the component definition files show up (no imports from other files), delete both files.

- [ ] **Step 2: Delete unused files**

```bash
rm components/blog/CategoryTabBar.tsx components/blog/CategoryGroupedFeed.tsx
```

- [ ] **Step 3: Final type check + build**

Run: `pnpm type-check && pnpm build`
Expected: Both PASS

- [ ] **Step 4: Commit**

```bash
git add -u
git commit -m "chore: remove unused CategoryTabBar and CategoryGroupedFeed"
```

---

## Notes

- **Mobile:** The left nav is `hidden lg:block` (desktop only). Mobile users currently lose category filtering. If this becomes an issue, a horizontal scrolling bar or drawer can be added later.
- **DocShell grid invariant maintained:** `leftSlot` renders inside the same `288px` left column with the same sticky positioning. The 3-column grid `[288px, minmax(0,1fr), 224px]` is unchanged.
- **URL sync moved to context:** The `history.replaceState` logic previously in `BlogHomeClient` now lives in `IndexFilterProvider`, keeping it DRY since both `IndexCategoryNav` and `BlogHomeClient` trigger state changes.
