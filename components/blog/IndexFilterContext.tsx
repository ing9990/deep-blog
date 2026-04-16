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
