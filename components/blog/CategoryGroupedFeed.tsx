'use client'

import { ChevronRight } from 'lucide-react'
import type { CategoryGroup, CategoryId } from '@/lib/categories'
import { CATEGORY_ICONS } from '@/lib/category-icons'
import type { Post } from '@/lib/posts'
import { PostCard } from './PostCard'

interface CategoryGroupedFeedProps {
  groups: CategoryGroup<Post>[]
  onViewAll: (id: CategoryId) => void
  previewCount?: number
}

export function CategoryGroupedFeed({
  groups,
  onViewAll,
  previewCount = 3,
}: CategoryGroupedFeedProps) {
  if (groups.length === 0) {
    return (
      <div className="mt-8 rounded-lg border border-dashed border-border py-16 text-center">
        <p className="text-sm text-muted-foreground">아직 글이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-14">
      {groups.map(({ category, posts }) => {
        const Icon = CATEGORY_ICONS[category.id]
        const preview = posts.slice(0, previewCount)
        const hasMore = posts.length > previewCount

        return (
          <section key={category.id} aria-labelledby={`cat-${category.id}`}>
            <header className="mb-4 flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                </span>
                <h2
                  id={`cat-${category.id}`}
                  className="flex min-w-0 items-baseline gap-2 text-[17px] font-semibold tracking-[-0.01em] text-foreground"
                >
                  {category.label}
                  <span className="text-sm font-normal tabular-nums text-muted-foreground">
                    {posts.length}
                  </span>
                </h2>
              </div>
              {hasMore && (
                <button
                  type="button"
                  onClick={() => onViewAll(category.id)}
                  className="group inline-flex shrink-0 items-center gap-0.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  전체 보기
                  <ChevronRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </button>
              )}
            </header>
            <div className="space-y-3">
              {preview.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
