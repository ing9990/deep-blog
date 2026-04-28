'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import type { ClientPost } from '@/lib/client-post'
import type { ClientBook } from '@/lib/client-book'
import { groupPostsByCategory } from '@/lib/categories'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { BOOKS_URL } from '@/lib/cross-host-url'

interface CategoryNavProps {
  posts: ClientPost[]
  books?: ClientBook[]
  currentSlug?: string | null
  onLinkClick?: () => void
}

export function CategoryNav({ posts, books, currentSlug, onLinkClick }: CategoryNavProps) {
  const { lang } = useTranslation()
  if (!Array.isArray(posts) || posts.length === 0) return null
  const groups = groupPostsByCategory(posts, lang)

  const shelfBooks = books ?? []

  return (
    <nav aria-label="카테고리" className="flex flex-col gap-1">
      {shelfBooks.length > 0 && (
        <section aria-label="읽고 정리한 책" className="mb-4">
          <ul className="flex gap-2 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {shelfBooks.map((book, i) => (
              <li
                key={book.slug}
                className={cn(
                  'shrink-0',
                  i === 0 && 'ml-auto',
                  i === shelfBooks.length - 1 && 'mr-auto',
                )}
              >
                <Link
                  href={`${BOOKS_URL}/${book.slug}`}
                  onClick={onLinkClick}
                  aria-label={`${book.title[lang]} 표지`}
                  className="group block"
                >
                  <div className="relative aspect-[2/3] w-[68px] overflow-hidden rounded-[var(--radius-chip)] border border-border bg-muted shadow-[var(--shadow-card)] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-card-hover)]">
                    <Image
                      src={book.cover}
                      alt=""
                      fill
                      sizes="68px"
                      className="object-cover"
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
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
