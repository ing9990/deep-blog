'use client'

import Link from 'next/link'
import { ArrowUpRight, BookOpen, ChevronDown } from 'lucide-react'
import type { ClientPost } from '@/lib/client-post'
import { groupPostsByCategory } from '@/lib/categories'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/useTranslation'

const BOOKS_URL = 'https://books.ing9990.com'

interface CategoryNavProps {
  posts: ClientPost[]
  currentSlug?: string | null
  onLinkClick?: () => void
}

export function CategoryNav({ posts, currentSlug, onLinkClick }: CategoryNavProps) {
  const { lang } = useTranslation()
  if (!Array.isArray(posts) || posts.length === 0) return null
  const groups = groupPostsByCategory(posts, lang)

  return (
    <nav aria-label="카테고리" className="flex flex-col gap-1">
      <Link
        href={BOOKS_URL}
        onClick={onLinkClick}
        className="group mb-2 flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-[length:var(--text-nav-header)] font-semibold uppercase tracking-[var(--tracking-wide)] text-foreground transition-colors hover:border-border-strong hover:bg-accent"
      >
        <span className="inline-flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span>책</span>
        </span>
        <ArrowUpRight
          className="h-3.5 w-3.5 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
          aria-hidden="true"
        />
      </Link>
      {groups.map(({ category, posts: categoryPosts }) => {
        return (
          <details
            key={category.id}
            open
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
