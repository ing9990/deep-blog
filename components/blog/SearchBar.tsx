'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Document as FlexDocument } from 'flexsearch'
import { Input } from '@/components/ui/input'
import { buildPostsUrl } from '@/lib/utils'
import type { SortKey } from '@/lib/filters'
import { loadAndBuildIndex, type SearchDoc } from '@/lib/search-index'

interface SearchBarProps {
  defaultQuery?: string
  currentTag?: string
  currentSort: SortKey
}

type IndexState = 'idle' | 'loading' | 'ready' | 'failed'

export function SearchBar({ defaultQuery, currentTag, currentSort }: SearchBarProps) {
  const router = useRouter()
  const [value, setValue] = useState(defaultQuery ?? '')
  const [indexState, setIndexState] = useState<IndexState>('idle')

  const currentTagRef = useRef(currentTag)
  const currentSortRef = useRef(currentSort)
  const defaultQueryRef = useRef(defaultQuery)
  const indexRef = useRef<FlexDocument<SearchDoc> | null>(null)
  const indexStateRef = useRef<IndexState>('idle')

  useEffect(() => {
    currentTagRef.current = currentTag
  }, [currentTag])

  useEffect(() => {
    currentSortRef.current = currentSort
  }, [currentSort])

  useEffect(() => {
    defaultQueryRef.current = defaultQuery
  }, [defaultQuery])

  useEffect(() => {
    setValue(defaultQuery ?? '')
  }, [defaultQuery])

  useEffect(() => {
    indexStateRef.current = indexState
  }, [indexState])

  const ensureIndex = useCallback(async (): Promise<FlexDocument<SearchDoc> | null> => {
    if (indexRef.current) return indexRef.current
    if (indexStateRef.current === 'loading' || indexStateRef.current === 'failed') {
      return null
    }
    setIndexState('loading')
    indexStateRef.current = 'loading'
    try {
      const idx = await loadAndBuildIndex()
      indexRef.current = idx
      setIndexState('ready')
      indexStateRef.current = 'ready'
      return idx
    } catch (err) {
      console.warn('[search] index load failed, falling back to substring:', err)
      setIndexState('failed')
      indexStateRef.current = 'failed'
      return null
    }
  }, [])

  const computeMatched = useCallback(
    (query: string, idx: FlexDocument<SearchDoc>): string[] => {
      const trimmed = query.trim()
      if (!trimmed) return []
      const results = idx.search(trimmed, { limit: 50 })
      const slugs = new Set<string>()
      for (const fieldResult of results) {
        for (const id of fieldResult.result) slugs.add(String(id))
      }
      return Array.from(slugs)
    },
    [],
  )

  useEffect(() => {
    const handle = setTimeout(() => {
      const next = value
      if ((next ?? '') === (defaultQueryRef.current ?? '')) return

      void (async () => {
        const idx = indexRef.current ?? (await ensureIndex())
        const trimmed = next.trim()
        let matched: readonly string[] | undefined
        if (idx && trimmed.length > 0) {
          matched = computeMatched(trimmed, idx)
        }

        router.push(
          buildPostsUrl({
            tag: currentTagRef.current,
            query: next,
            sort: currentSortRef.current,
            matched,
          }),
          { scroll: false },
        )
      })()
    }, 250)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const placeholder =
    indexState === 'loading' ? '검색 준비 중...' : '검색어를 입력하세요...'

  return (
    <div className="mt-8">
      <Input
        type="search"
        inputMode="search"
        placeholder={placeholder}
        value={value}
        onFocus={() => {
          void ensureIndex()
        }}
        onChange={(e) => {
          const ne = e.nativeEvent as InputEvent
          if (ne.isComposing) return
          setValue(e.target.value)
        }}
        onCompositionEnd={(e) => {
          setValue((e.target as HTMLInputElement).value)
        }}
        className="h-11"
        aria-label="글 검색"
      />
    </div>
  )
}
