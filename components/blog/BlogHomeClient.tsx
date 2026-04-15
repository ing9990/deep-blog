'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Post } from '@/lib/posts'
import { applyFilters, extractAllTags, type SortKey } from '@/lib/filters'
import { CATEGORIES, groupPostsByCategory, type CategoryId } from '@/lib/categories'
import { buildPostsUrl } from '@/lib/utils'
import { PostList } from './PostList'
import { TagFilterBar } from './TagFilterBar'
import { SortSelect } from './SortSelect'
import { CategoryTabBar } from './CategoryTabBar'
import { CategoryGroupedFeed } from './CategoryGroupedFeed'

interface BlogHomeClientProps {
  allPosts: Post[]
  initialTag?: string
  initialCategory?: CategoryId
  initialSort: SortKey
}

// Index page has two modes:
//   1. All (category === null): category-grouped feed — browse by topic
//   2. Category scoped: flat list + tag filter contextual to that category
export function BlogHomeClient({
  allPosts,
  initialTag,
  initialCategory,
  initialSort,
}: BlogHomeClientProps) {
  const [category, setCategory] = useState<CategoryId | null>(
    initialCategory ?? null,
  )
  const [tag, setTag] = useState<string | undefined>(initialTag)
  const [sort, setSort] = useState<SortKey>(initialSort)

  const groups = useMemo(() => groupPostsByCategory(allPosts), [allPosts])

  const categoryTabs = useMemo(
    () =>
      CATEGORIES.map((meta) => ({
        meta,
        count: groups.find((g) => g.category.id === meta.id)?.posts.length ?? 0,
      })).filter((t) => t.count > 0),
    [groups],
  )

  const scopedPosts = useMemo(
    () =>
      category ? allPosts.filter((p) => p.category === category) : allPosts,
    [allPosts, category],
  )

  const scopedTags = useMemo(() => extractAllTags(scopedPosts), [scopedPosts])

  // Auto-clear tag when it's no longer present in the current scope.
  useEffect(() => {
    if (!tag) return
    const exists = scopedTags.some((t) => t.tag === tag)
    if (!exists) setTag(undefined)
  }, [scopedTags, tag])

  const filtered = useMemo(
    () => applyFilters(scopedPosts, { tag, sort }),
    [scopedPosts, tag, sort],
  )

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

  function handleCategorySelect(next: CategoryId | null) {
    setCategory(next)
    setTag(undefined)
  }

  return (
    <>
      <CategoryTabBar
        categories={categoryTabs}
        totalCount={allPosts.length}
        selected={category}
        onSelect={handleCategorySelect}
      />

      {category === null ? (
        <CategoryGroupedFeed
          groups={groups}
          onViewAll={(id) => handleCategorySelect(id)}
        />
      ) : (
        <>
          <TagFilterBar
            allTags={scopedTags}
            selected={tag}
            onToggle={setTag}
          />
          <div className="mt-8 flex items-center justify-between text-sm text-muted-foreground">
            <span>전체 {filtered.length}개 글</span>
            <SortSelect value={sort} onChange={setSort} />
          </div>
          <PostList posts={filtered} />
        </>
      )}
    </>
  )
}
