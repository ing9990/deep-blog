'use client'

import Link from 'next/link'
import { ChevronDown, Library } from 'lucide-react'
import type { ClientPost } from '@/lib/client-post'
import type { ClientBook } from '@/lib/client-book'
import { groupPostsByCategory } from '@/lib/categories'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useCrossHostUrls } from '@/lib/cross-host-context'

interface CategoryNavProps {
  posts: ClientPost[]
  books?: ClientBook[]
  currentSlug?: string | null
  onLinkClick?: () => void
}

export function CategoryNav({ posts, books, currentSlug, onLinkClick }: CategoryNavProps) {
  const { lang } = useTranslation()
  const { books: booksUrl } = useCrossHostUrls()
  if (!Array.isArray(posts) || posts.length === 0) return null
  const groups = groupPostsByCategory(posts, lang)

  const bookCount = books?.length ?? 0

  const activeCategoryId = currentSlug
    ? (posts.find((p) => p.slug === currentSlug)?.category ?? null)
    : null

  const orderedGroups = [
    ...groups.filter((g) => g.category.id === 'mini-coupang-backend'),
    ...groups.filter((g) => g.category.id !== 'mini-coupang-backend'),
  ]

  return (
    <nav aria-label="카테고리" className="flex flex-col gap-1">
      {bookCount > 0 && (
        <Link
          href={booksUrl}
          onClick={onLinkClick}
          className="mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-[length:var(--text-nav-item)] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <Library className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          <span className="flex-1 text-left">책</span>
          <span className="tabular-nums text-[length:var(--text-meta)] opacity-60">
            {bookCount}
          </span>
        </Link>
      )}

      {orderedGroups.map(({ category, posts: categoryPosts }) => {
        return (
          <details
            key={category.id}
            open={category.id === activeCategoryId}
            className="group/cat border-b border-border/60 pb-1 last:border-b-0"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-md px-3 py-2 text-[length:var(--text-nav-header)] font-semibold uppercase tracking-[var(--tracking-wide)] text-foreground transition-colors hover:bg-muted/60 [&::-webkit-details-marker]:hidden">
              <span>{category.label[lang]}</span>
              <ChevronDown
                className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-open/cat:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <ul className="mt-1 space-y-0.5">
              {categoryPosts.map((post) => {
                const isActive = post.slug === currentSlug
                return (
                  <li key={post.slug}>
                    <Link
                      href={`/posts/${post.slug}`}
                      onClick={onLinkClick}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'block rounded-md px-3 py-1.5 text-[length:var(--text-nav-item)] transition-colors',
                        isActive
                          ? 'bg-accent font-medium text-accent-foreground'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                      )}
                    >
                      {post.title[lang]}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </details>
        )
      })}
    </nav>
  )
}
