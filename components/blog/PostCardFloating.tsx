'use client'

import Link from 'next/link'
import type { Post } from '@/lib/posts'
import { getCategory } from '@/lib/categories'
import { CATEGORY_ICONS } from '@/lib/category-icons'
import { getCategoryColor } from '@/lib/category-colors'
import { cn, formatDate } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/useTranslation'

export function PostCardFloating({ post }: { post: Post }) {
  const { lang } = useTranslation()
  const meta = getCategory(post.category)
  const Icon = CATEGORY_ICONS[post.category]
  const colorClass = getCategoryColor(post.category)

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group grid grid-cols-[44px_1fr] items-start gap-4 rounded-[var(--radius-panel)] border border-border bg-background p-5 transition-all hover:-translate-y-px hover:border-border-strong hover:shadow-[var(--shadow-card-hover)]"
    >
      {/* Icon area */}
      <span
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted transition-transform group-hover:scale-105"
        aria-hidden
      >
        <Icon className={cn('h-5 w-5 text-muted-foreground', colorClass)} strokeWidth={1.8} />
      </span>

      {/* Content */}
      <div className="min-w-0">
        {/* Top row */}
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[length:var(--text-caption)] font-semibold text-muted-foreground">
            {meta.label[lang]}
          </span>
          <time className="text-[length:var(--text-meta)] tabular-nums text-muted-foreground" dateTime={post.date}>
            {formatDate(post.date, lang)}
          </time>
        </div>

        {/* Title */}
        <h2 className="text-[length:var(--text-h4)] font-semibold leading-[var(--leading-snug)] tracking-[var(--tracking-tighter)] text-foreground transition-colors group-hover:text-primary">
          {post.title[lang]}
        </h2>

        {/* Summary */}
        <p className="mt-[5px] line-clamp-2 text-[length:var(--text-body-sm)] leading-[var(--leading-normal)] text-muted-foreground">
          {post.summary[lang]}
        </p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded bg-muted px-2 py-0.5 text-[length:var(--text-badge)] font-medium text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
