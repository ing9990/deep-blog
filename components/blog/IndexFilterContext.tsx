'use client'

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { CATEGORY_IDS, type CategoryId } from '@/lib/categories'
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
}

export function IndexFilterProvider({ children }: IndexFilterProviderProps) {
  const [category, setCategoryRaw] = useState<CategoryId | null>(null)
  const [tag, setTag] = useState<string | undefined>(undefined)
  const [sort, setSort] = useState<SortKey>('latest')

  function setCategory(next: CategoryId | null) {
    setCategoryRaw(next)
    setTag(undefined)
  }

  /* Apply deep-link filters from the URL once, after hydration. The index
     page is statically prerendered with default (unfiltered) state, so the
     filters are read client-side here instead of from server searchParams. */
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const catParam = sp.get('cat')
    const tagParam = sp.get('tag')
    const sortParam = sp.get('sort')
    if (catParam && (CATEGORY_IDS as readonly string[]).includes(catParam)) {
      setCategoryRaw(catParam as CategoryId)
    }
    if (tagParam) setTag(tagParam)
    if (sortParam === 'oldest' || sortParam === 'title') setSort(sortParam)
  }, [])

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
