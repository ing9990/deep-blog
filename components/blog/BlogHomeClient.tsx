'use client'

import { useEffect, useMemo } from 'react'
import type { CardPost } from '@/lib/client-post'
import { applyFilters, extractAllTags } from '@/lib/filters'
import { PostList } from './PostList'
import { TagFilterBar } from './TagFilterBar'
import { SortSelect } from './SortSelect'
import { useIndexFilter } from './IndexFilterContext'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface BlogHomeClientProps {
  allPosts: CardPost[]
}

export function BlogHomeClient({ allPosts }: BlogHomeClientProps) {
  const { t, lang } = useTranslation()
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
    () => applyFilters(scopedPosts, { tag, sort }, lang),
    [scopedPosts, tag, sort, lang],
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
      <div className="mt-8 flex items-center justify-between text-[length:var(--text-meta)] text-muted-foreground">
        <span>{t('index.total.count', { n: filtered.length })}</span>
        <SortSelect value={sort} onChange={setSort} />
      </div>
      <PostList posts={filtered} />
    </>
  )
}
