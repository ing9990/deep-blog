'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
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

  const currentTagRef = useRef(currentTag)
  const currentSortRef = useRef(currentSort)
  const defaultQueryRef = useRef(defaultQuery)

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
    const handle = setTimeout(() => {
      if ((value ?? '') === (defaultQueryRef.current ?? '')) return
      router.push(
        buildPostsUrl({
          tag: currentTagRef.current,
          query: value,
          sort: currentSortRef.current,
        }),
        { scroll: false },
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
