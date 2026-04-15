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
      { scroll: false },
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
