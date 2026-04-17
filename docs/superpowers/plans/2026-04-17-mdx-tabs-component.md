# MDX `<Tabs>` Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `<Tabs>` / `<Tab>` MDX component that lets a single topic be split into alternative variants (macOS / Linux / Windows style) with page-scoped group synchronization.

**Architecture:** Thin `@radix-ui/react-tabs` wrapper + a page-level React Context (`TabsGroupProvider`) mounted inside `MDXContent`. `<Tab>` is a declaration-only component; `<Tabs>` iterates `React.Children.toArray` to extract Tab nodes and renders Radix primitives. Label-based `value` via `toLowerCase().trim()` normalization. No `localStorage`, no URL sync, no new CSS variables — shadcn tokens only.

**Tech Stack:** Next.js 15 App Router (RSC), TypeScript strict, `@radix-ui/react-tabs` (new), Tailwind v4, Vitest (node env — pure-function tests only).

**Spec:** `docs/superpowers/specs/2026-04-17-mdx-tabs-component.md`

**Note on test path:** Spec mentions `__tests__/`; the actual repo convention is `tests/` (per `vitest.config.ts` glob). This plan uses `tests/`.

---

## File Structure

| File | Responsibility | Create/Modify |
|---|---|---|
| `components/mdx/tabs-utils.ts` | Pure helpers: `toValue(label)`, `extractTabs(children)`, shared types. No React, no `'use client'`. | Create |
| `components/mdx/TabsGroupProvider.tsx` | React Context + Provider. Client component. Page-scoped group state. | Create |
| `components/mdx/Tabs.tsx` | `Tabs`, `Tab` React components. Client component. Wraps `@radix-ui/react-tabs`. | Create |
| `components/mdx/components.tsx` | Register `Tabs`, `Tab` in `mdxComponents`. | Modify |
| `components/mdx/MDXContent.tsx` | Wrap `<Component>` with `<TabsGroupProvider>`. Server component remains server. | Modify |
| `content/posts/_tabs-sandbox.mdx` | `draft: true` regression reference — covers all edge cases. | Create |
| `tests/tabs-utils.test.ts` | Unit tests for `toValue` and `extractTabs`. | Create |
| `package.json` / `pnpm-lock.yaml` | Add `@radix-ui/react-tabs` dependency. | Modify |
| `CLAUDE.md` | Add invariants (Tabs children pattern, Provider placement). | Modify |

---

## Task 1: Install `@radix-ui/react-tabs`

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install the dependency**

Run:
```bash
pnpm add @radix-ui/react-tabs
```

Expected: `package.json` `dependencies` gains `"@radix-ui/react-tabs": "^1.x"`.

- [ ] **Step 2: Verify install**

Run:
```bash
grep react-tabs package.json
```

Expected: one line containing `"@radix-ui/react-tabs"`.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @radix-ui/react-tabs dependency"
```

---

## Task 2: Create `toValue` normalizer (TDD)

**Files:**
- Create: `tests/tabs-utils.test.ts`
- Create: `components/mdx/tabs-utils.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/tabs-utils.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { toValue } from '@/components/mdx/tabs-utils'

describe('toValue', () => {
  it('lowercases', () => {
    expect(toValue('macOS')).toBe('macos')
  })

  it('trims whitespace', () => {
    expect(toValue('  Linux ')).toBe('linux')
  })

  it('preserves internal spaces and punctuation', () => {
    expect(toValue('Native Install (Recommended)')).toBe('native install (recommended)')
  })

  it('handles empty string', () => {
    expect(toValue('')).toBe('')
  })

  it('handles all-whitespace string', () => {
    expect(toValue('   ')).toBe('')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:unit tests/tabs-utils.test.ts`

Expected: FAIL with "Cannot find module '@/components/mdx/tabs-utils'" or import error.

- [ ] **Step 3: Create `tabs-utils.ts` with `toValue`**

Create `components/mdx/tabs-utils.ts`:
```ts
export const toValue = (label: string): string => label.toLowerCase().trim()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:unit tests/tabs-utils.test.ts`

Expected: 5 passing.

- [ ] **Step 5: Commit**

```bash
git add components/mdx/tabs-utils.ts tests/tabs-utils.test.ts
git commit -m "feat(tabs): add toValue label normalizer with tests"
```

---

## Task 3: Add `extractTabs` children parser (TDD)

**Files:**
- Modify: `tests/tabs-utils.test.ts`
- Modify: `components/mdx/tabs-utils.ts`

`extractTabs` walks `children` (a React node or array), picks out elements whose `type === Tab`, and returns a normalized list. It handles: missing label → `"unlabeled"`, duplicate labels → first wins, non-Tab children → dropped. In dev it warns via `console.warn`; in prod it is silent.

- [ ] **Step 1: Extend tabs-utils.ts with a `Tab` sentinel type**

The sentinel is needed so `extractTabs` can identify `<Tab>` elements. We export `Tab` itself from `Tabs.tsx` later (Task 6), but the **function reference** used for identity must already exist when `extractTabs` runs. Solution: define a `tabSymbol` in `tabs-utils.ts` and attach it to the `Tab` function in `Tabs.tsx`.

Replace the file with:
```ts
import type { ReactNode, ReactElement } from 'react'

export const toValue = (label: string): string => label.toLowerCase().trim()

export const TAB_SYMBOL = Symbol.for('mdx.Tab')

export interface TabProps {
  label: string
  children?: ReactNode
}

export interface NormalizedTab {
  label: string
  value: string
  children: ReactNode
}

type TabComponent = ((props: TabProps) => ReactNode) & { [TAB_SYMBOL]?: true }

const isTabElement = (node: ReactNode): node is ReactElement<TabProps> => {
  if (!node || typeof node !== 'object' || !('type' in node)) return false
  const type = (node as ReactElement).type as TabComponent
  return typeof type === 'function' && type[TAB_SYMBOL] === true
}

export function extractTabs(children: ReactNode): NormalizedTab[] {
  const out: NormalizedTab[] = []
  const seen = new Set<string>()
  const flat = Array.isArray(children) ? children : [children]

  for (const node of flat) {
    if (!isTabElement(node)) {
      if (node != null && typeof node === 'object' && process.env.NODE_ENV !== 'production') {
        console.warn('<Tabs>: non-<Tab> child ignored.')
      }
      continue
    }
    const rawLabel = node.props.label
    const label = typeof rawLabel === 'string' ? rawLabel : ''
    if (!label && process.env.NODE_ENV !== 'production') {
      console.warn('<Tab>: missing label, using "unlabeled".')
    }
    const safeLabel = label || 'unlabeled'
    const value = toValue(safeLabel)
    if (seen.has(value)) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`<Tabs>: duplicate tab value "${value}", first wins.`)
      }
      continue
    }
    seen.add(value)
    out.push({ label: safeLabel, value, children: node.props.children })
  }

  return out
}
```

- [ ] **Step 2: Add failing tests for extractTabs**

Append to `tests/tabs-utils.test.ts`:
```ts
import { createElement } from 'react'
import { extractTabs, TAB_SYMBOL } from '@/components/mdx/tabs-utils'

type TabLike = ((props: { label: string; children?: unknown }) => null) & {
  [TAB_SYMBOL]?: true
}

const FakeTab: TabLike = () => null
FakeTab[TAB_SYMBOL] = true
const OtherComponent = () => null

describe('extractTabs', () => {
  it('returns empty array for no children', () => {
    expect(extractTabs(undefined)).toEqual([])
    expect(extractTabs(null)).toEqual([])
    expect(extractTabs([])).toEqual([])
  })

  it('picks out Tab elements and normalizes value', () => {
    const tabs = extractTabs([
      createElement(FakeTab, { label: 'macOS', children: 'mac body' }),
      createElement(FakeTab, { label: 'Linux', children: 'linux body' }),
    ])
    expect(tabs).toHaveLength(2)
    expect(tabs[0]).toMatchObject({ label: 'macOS', value: 'macos', children: 'mac body' })
    expect(tabs[1]).toMatchObject({ label: 'Linux', value: 'linux', children: 'linux body' })
  })

  it('ignores non-Tab children', () => {
    const tabs = extractTabs([
      createElement(FakeTab, { label: 'A' }),
      createElement(OtherComponent, {}),
      'loose text',
    ])
    expect(tabs).toHaveLength(1)
    expect(tabs[0].label).toBe('A')
  })

  it('deduplicates by normalized value, first wins', () => {
    const tabs = extractTabs([
      createElement(FakeTab, { label: 'macOS', children: 'first' }),
      createElement(FakeTab, { label: '  macos ', children: 'second' }),
    ])
    expect(tabs).toHaveLength(1)
    expect(tabs[0].children).toBe('first')
  })

  it('falls back to "unlabeled" when label missing', () => {
    const tabs = extractTabs([
      createElement(FakeTab, { label: '' as string }),
    ])
    expect(tabs).toHaveLength(1)
    expect(tabs[0].label).toBe('unlabeled')
    expect(tabs[0].value).toBe('unlabeled')
  })

  it('accepts a single (non-array) child', () => {
    const tabs = extractTabs(createElement(FakeTab, { label: 'Only' }))
    expect(tabs).toHaveLength(1)
  })
})
```

- [ ] **Step 3: Run tests to confirm they pass**

Run: `pnpm test:unit tests/tabs-utils.test.ts`

Expected: 11 passing (5 from Task 2 + 6 new).

- [ ] **Step 4: Commit**

```bash
git add components/mdx/tabs-utils.ts tests/tabs-utils.test.ts
git commit -m "feat(tabs): add extractTabs children parser with tests"
```

---

## Task 4: Create `TabsGroupProvider`

**Files:**
- Create: `components/mdx/TabsGroupProvider.tsx`

- [ ] **Step 1: Write the provider**

Create `components/mdx/TabsGroupProvider.tsx`:
```tsx
'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type GroupMap = Record<string, string>

interface GroupState {
  groups: GroupMap
  setGroup: (groupId: string, value: string) => void
}

const TabsGroupContext = createContext<GroupState | null>(null)

export function TabsGroupProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<GroupMap>({})
  const setGroup = useCallback((groupId: string, value: string) => {
    setGroups((prev) => (prev[groupId] === value ? prev : { ...prev, [groupId]: value }))
  }, [])
  return (
    <TabsGroupContext.Provider value={{ groups, setGroup }}>
      {children}
    </TabsGroupContext.Provider>
  )
}

export function useTabsGroup(): GroupState | null {
  return useContext(TabsGroupContext)
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/mdx/TabsGroupProvider.tsx
git commit -m "feat(tabs): add TabsGroupProvider for page-scoped sync"
```

---

## Task 5: Create `Tabs` and `Tab` components

**Files:**
- Create: `components/mdx/Tabs.tsx`

`<Tab>` is declaration-only — it exposes `label` + `children` via props but renders nothing by itself. `extractTabs` identifies it via the `TAB_SYMBOL` attached to the function. `<Tabs>` iterates children, seeds the group if needed, and renders Radix primitives.

- [ ] **Step 1: Write `Tabs.tsx`**

Create `components/mdx/Tabs.tsx`:
```tsx
'use client'

import * as RadixTabs from '@radix-ui/react-tabs'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  TAB_SYMBOL,
  extractTabs,
  toValue,
  type TabProps,
} from '@/components/mdx/tabs-utils'
import { useTabsGroup } from '@/components/mdx/TabsGroupProvider'

export const Tab = (_props: TabProps): null => null
Tab.displayName = 'Tab'
;(Tab as unknown as { [TAB_SYMBOL]: true })[TAB_SYMBOL] = true

interface TabsProps {
  group?: string
  defaultValue?: string
  children?: ReactNode
}

export function Tabs({ group, defaultValue, children }: TabsProps) {
  const tabs = useMemo(() => extractTabs(children), [children])

  const ctx = useTabsGroup()
  const groupMode = Boolean(group)
  if (groupMode && !ctx && process.env.NODE_ENV !== 'production') {
    console.warn(`<Tabs group="${group}">: used outside TabsGroupProvider, falling back to local state.`)
  }
  const useCtx = groupMode && ctx !== null

  const normalizedDefault = defaultValue ? toValue(defaultValue) : undefined
  const firstValue = tabs[0]?.value
  const initial = useMemo(() => {
    if (normalizedDefault && tabs.some((t) => t.value === normalizedDefault)) {
      return normalizedDefault
    }
    return firstValue ?? ''
  }, [normalizedDefault, firstValue, tabs])

  const [localValue, setLocalValue] = useState<string>(initial)

  const groupValue = useCtx && group ? ctx!.groups[group] : undefined
  const current =
    useCtx && groupValue && tabs.some((t) => t.value === groupValue)
      ? groupValue
      : useCtx
      ? normalizedDefault && tabs.some((t) => t.value === normalizedDefault)
        ? normalizedDefault
        : firstValue ?? ''
      : localValue

  useEffect(() => {
    if (!useCtx || !group) return
    if (!ctx!.groups[group] && normalizedDefault && tabs.some((t) => t.value === normalizedDefault)) {
      ctx!.setGroup(group, normalizedDefault)
    }
  }, [useCtx, group, ctx, normalizedDefault, tabs])

  const handleChange = (next: string) => {
    if (useCtx && group) {
      ctx!.setGroup(group, next)
    } else {
      setLocalValue(next)
    }
  }

  if (tabs.length === 0) return null

  return (
    <RadixTabs.Root
      value={current}
      onValueChange={handleChange}
      className="my-6 overflow-hidden rounded-[14px] border border-border"
    >
      <RadixTabs.List
        className={cn(
          'flex gap-1 overflow-x-auto border-b border-border px-2',
          '[&::-webkit-scrollbar]:hidden [scrollbar-width:none]',
        )}
      >
        {tabs.map((t) => (
          <RadixTabs.Trigger
            key={t.value}
            value={t.value}
            className={cn(
              '-mb-px whitespace-nowrap px-4 py-2.5 text-[14px] font-medium',
              'text-muted-foreground transition-colors',
              'hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground',
            )}
          >
            {t.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {tabs.map((t) => (
        <RadixTabs.Content
          key={t.value}
          value={t.value}
          className="p-4 [&>:first-child]:mt-0 [&>:last-child]:mb-0 focus-visible:outline-none"
        >
          {t.children}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/mdx/Tabs.tsx
git commit -m "feat(tabs): add Tabs and Tab components (Radix underline style)"
```

---

## Task 6: Register Tabs/Tab in `mdxComponents`

**Files:**
- Modify: `components/mdx/components.tsx`

- [ ] **Step 1: Add imports and map entries**

Open `components/mdx/components.tsx`. Add to the imports block (next to the other MDX component imports):
```ts
import { Tabs, Tab } from '@/components/mdx/Tabs'
```

Add to the `mdxComponents` object (alphabetical order preserved):
```ts
  Tab,
  Tabs,
```

Full resulting block (existing entries preserved, only new lines shown in context):
```tsx
  BTreeInsert,
  Callout,
  GCCycle,
  CardinalitySpectrum,
  CardinalityTradeoff,
  CompositeIndexLeaf,
  QuickSort,
  RelatedPost,
  Tab,
  Tabs,
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/mdx/components.tsx
git commit -m "feat(tabs): register Tabs/Tab in mdxComponents map"
```

---

## Task 7: Wrap `MDXContent` with `TabsGroupProvider`

**Files:**
- Modify: `components/mdx/MDXContent.tsx`

- [ ] **Step 1: Add provider wrapper**

Open `components/mdx/MDXContent.tsx`. Add import after the existing imports:
```ts
import { TabsGroupProvider } from '@/components/mdx/TabsGroupProvider'
```

Change the `MDXContent` return to:
```tsx
export function MDXContent({ code }: MDXContentProps) {
  const Component = useMDXComponent(code)
  return (
    <TabsGroupProvider>
      <Component components={mdxComponents} />
    </TabsGroupProvider>
  )
}
```

`MDXContent` itself remains a Server Component (no `'use client'`). `TabsGroupProvider` is a Client Component, which creates the client boundary — all rendered MDX children below remain server-rendered HTML hydrated inside the provider.

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/mdx/MDXContent.tsx
git commit -m "feat(tabs): wrap MDXContent with TabsGroupProvider"
```

---

## Task 8: Create regression sandbox post

**Files:**
- Create: `content/posts/_tabs-sandbox.mdx`

This sandbox post stays in the repo as `draft: true` — the draft filter in `lib/posts.ts` keeps it out of the public index. It's the single source of truth for Tabs regression checks.

- [ ] **Step 1: Write the sandbox post**

Create `content/posts/_tabs-sandbox.mdx`:
````mdx
---
title: "Tabs Sandbox"
summary: "Regression reference for the <Tabs> component. Not published."
date: "2026-04-17"
category: "Knowledge"
tags: ["tabs"]
keywords: []
draft: true
---

## Group sync — install

<Tabs group="os">
  <Tab label="macOS">
    ```bash
    curl -fsSL https://claude.ai/install.sh | bash
    ```
  </Tab>
  <Tab label="Linux">
    ```bash
    curl -fsSL https://claude.ai/install.sh | bash
    ```
  </Tab>
  <Tab label="Windows">
    ```powershell
    irm https://claude.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

## Group sync — config path (should mirror above)

<Tabs group="os">
  <Tab label="macOS">
    `~/Library/Application Support/claude/config.json`
  </Tab>
  <Tab label="Linux">
    `~/.config/claude/config.json`
  </Tab>
  <Tab label="Windows">
    `%APPDATA%\claude\config.json`
  </Tab>
</Tabs>

## Independent tabs (no group)

<Tabs>
  <Tab label="Java">
    ```java
    System.out.println("hello");
    ```
  </Tab>
  <Tab label="Kotlin">
    ```kotlin
    println("hello")
    ```
  </Tab>
</Tabs>

<Tabs>
  <Tab label="Java">
    Independent from the one above.
  </Tab>
  <Tab label="Kotlin">
    Changing this should not affect the other Java/Kotlin tabs.
  </Tab>
</Tabs>

## Mixed content — tables, callouts, keyword links

<Tabs group="os">
  <Tab label="macOS">
    | Path | Purpose |
    | --- | --- |
    | `~/Library/Logs/claude` | Log output |
    | `~/Library/Caches/claude` | Disk cache |

    <Callout type="info" title="팁">
      로그 파일은 7일 이상 보관됩니다.
    </Callout>
  </Tab>
  <Tab label="Linux">
    Linux uses XDG paths — `$XDG_CACHE_HOME` takes precedence.
  </Tab>
  <Tab label="Windows">
    Windows stores logs under `%LOCALAPPDATA%\claude\logs`.
  </Tab>
</Tabs>

## Many tabs with long labels (mobile horizontal scroll)

<Tabs>
  <Tab label="Native Install (Recommended)">
    One.
  </Tab>
  <Tab label="Homebrew">
    Two.
  </Tab>
  <Tab label="WinGet">
    Three.
  </Tab>
  <Tab label="Debian / Ubuntu APT">
    Four.
  </Tab>
  <Tab label="Arch Linux (AUR)">
    Five.
  </Tab>
  <Tab label="Fedora (DNF)">
    Six.
  </Tab>
</Tabs>
````

- [ ] **Step 2: Regenerate keyword map (tab labels are not keywords but predev runs it anyway)**

Run:
```bash
pnpm generate-keyword-map
```

Expected: either "No changes" or a minor regeneration — verify no errors. If errors cite keyword conflicts, rerun and fix per blog-writer rules (should not happen; this post has `keywords: []`).

- [ ] **Step 3: Run full test suite**

Run: `pnpm test`

Expected: Velite builds the sandbox post successfully, all unit tests pass.

- [ ] **Step 4: Commit**

```bash
git add content/posts/_tabs-sandbox.mdx lib/generated/keyword-map.ts
git commit -m "test(tabs): add regression sandbox post (draft)"
```

---

## Task 9: Manual QA on dev server

**Files:** none (runtime verification only)

- [ ] **Step 1: Start dev server in background**

Per CLAUDE.md dev-server policy, run via the Bash tool with `run_in_background: true`:

Command: `PORT=3010 pnpm dev`

After ~5 seconds, check listener: `lsof -nP -iTCP:3010 -sTCP:LISTEN` — expect one `node` line.

- [ ] **Step 2: Temporarily un-draft the sandbox for viewing**

`lib/posts.ts:7,13` filters drafts out of **both** the list and `getPostBySlug`, so `/posts/_tabs-sandbox` would 404 while `draft: true`. For QA only, flip it:

Edit `content/posts/_tabs-sandbox.mdx` and change `draft: true` to `draft: false`. Save.

The predev keyword-map hook will re-run; wait for the dev server to recompile.

- [ ] **Step 3: Load the sandbox post**

Open: `http://blog.localhost:3010/posts/_tabs-sandbox`

Expected: the sandbox renders with four Tabs sections visible.

- [ ] **Step 4: Walk the manual checklist**

Verify each item. Check all **three** themes via the header toggle (light / dark / system):

- [ ] Active tab underline renders in `--primary` (blue) in both light and dark
- [ ] Container border + tab list bottom border align (no double line, no gap)
- [ ] "Group sync — install" and "Group sync — config path" switch **together** when either is clicked
- [ ] Independent "Java/Kotlin" blocks switch **independently**
- [ ] Shiki code blocks render with proper theming inside tab panels
- [ ] Markdown tables render (the `.table-wrapper` override from `components.tsx` still applies)
- [ ] `<Callout>` inside a tab panel renders with its left border + icon
- [ ] At 375px viewport width, the "many tabs" block scrolls horizontally without pushing the page
- [ ] Keyboard: `Tab` key enters tab list → `←/→` changes tab → focus ring visible on Trigger
- [ ] No hydration warnings in the dev log (`BashOutput` on the dev task)

- [ ] **Step 5: Restore `draft: true`**

Edit `content/posts/_tabs-sandbox.mdx` and change `draft: false` back to `draft: true`. Confirm via `git diff content/posts/_tabs-sandbox.mdx` that the only change after reverting is nothing — i.e. the working tree is clean for this file.

- [ ] **Step 6: Stop the dev server**

Use `KillShell` on the background task or Ctrl-C equivalent.

No commit for this task — verification only.

---

## Task 10: Run required validation commands

**Files:** none (validation only)

- [ ] **Step 1: Type check**

Run: `pnpm type-check`

Expected: exit 0, no errors.

- [ ] **Step 2: Lint**

Run: `pnpm lint`

Expected: exit 0, no errors. Warnings are acceptable if they pre-existed on `main`; new warnings from this change must be fixed.

- [ ] **Step 3: Full build**

Run: `pnpm build`

Expected: exit 0. `.velite/` regenerates, `.next/` builds, no hydration / RSC boundary errors. If build fails, fix before proceeding — do **not** commit around build errors.

No commit — this task is a gate, not a change.

---

## Task 11: Add invariants to CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

Per spec §11, lock in two new invariants so future sessions don't regress them.

- [ ] **Step 1: Add Tabs invariants under §6 "UI 레이아웃 / 디자인 시스템"**

Open `CLAUDE.md`. Find the `### UI 레이아웃 / 디자인 시스템` section. Append two new bullets after the existing list (before the next `###` heading):

```md
- **MDX `<Tabs>` / `<Tab>` children 패턴**: `Tabs`가 `React.Children.toArray`로 `<Tab>`만 필터링 (function에 `TAB_SYMBOL` attached). 외부 자식은 dev `console.warn` 후 드롭. 직접 순회 로직을 `map(child => child.props...)`로 갈아끼우지 말 것 (symbol 식별 누락 → prod에서 silent 오동작).
- **`TabsGroupProvider`는 `components/mdx/MDXContent.tsx` 최상위 1개만**. 블로그 레이아웃(`app/layout.tsx` 등) 상위로 올리면 포스트 간 `group` state leak이 발생한다. 포스트 = 스코프 1개.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: lock Tabs children pattern and provider placement invariants"
```

---

## Task 12: Final verification pass

**Files:** none (cross-cutting sanity check)

- [ ] **Step 1: Re-run full test suite from clean state**

```bash
pnpm test
```

Expected: Velite build + vitest, all green.

- [ ] **Step 2: Confirm git log shape**

```bash
git log --oneline main..HEAD
```

Expected roughly:
```
docs: lock Tabs children pattern and provider placement invariants
test(tabs): add regression sandbox post (draft)
feat(tabs): wrap MDXContent with TabsGroupProvider
feat(tabs): register Tabs/Tab in mdxComponents map
feat(tabs): add Tabs and Tab components (Radix underline style)
feat(tabs): add TabsGroupProvider for page-scoped sync
feat(tabs): add extractTabs children parser with tests
feat(tabs): add toValue label normalizer with tests
chore: add @radix-ui/react-tabs dependency
```

(Order may differ slightly but every task should have a commit.)

- [ ] **Step 3: Confirm working tree clean**

```bash
git status
```

Expected: `nothing to commit, working tree clean`.

No further commit.

---

## Done Criteria

- `pnpm test`, `pnpm type-check`, `pnpm lint`, `pnpm build` all pass.
- `/posts/_tabs-sandbox` manually walked through the checklist in Task 9, all items pass in both themes at desktop + 375px widths.
- `content/posts/_tabs-sandbox.mdx` present as `draft: true` (not in public index).
- CLAUDE.md §6 has the two new invariant bullets.
- No new CSS variables introduced. No changes to `app/globals.css`.
