'use client'

import Link from 'next/link'
import type { Post } from '@/lib/posts'
import { getCategory } from '@/lib/categories'
import { CATEGORY_ICONS } from '@/lib/category-icons'
import { formatDate } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/useTranslation'

export function PostCardEditorial({ post }: { post: Post }) {
  const { lang } = useTranslation()
  const meta = getCategory(post.category)
  const Icon = CATEGORY_ICONS[post.category]

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group relative block overflow-hidden rounded-xl border border-border bg-background px-6 py-5 transition-all hover:-translate-y-px hover:border-border-strong hover:shadow-[var(--shadow-card-hover)]"
    >
      {/* Left accent bar */}
      <span
        className="absolute inset-y-0 left-0 w-[3.5px] rounded-l-xl bg-border opacity-60 transition-colors group-hover:bg-border-strong group-hover:opacity-100"
        aria-hidden
      />

      {/* Top row: category pill + date */}
      <div className="mb-2.5 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-[3px] text-[length:var(--text-caption)] font-semibold tracking-wide text-muted-foreground">
          <Icon className="h-[13px] w-[13px]" strokeWidth={2.2} aria-hidden />
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
      <p className="mt-1.5 line-clamp-2 text-[length:var(--text-body-sm)] leading-[var(--leading-normal)] text-muted-foreground">
        {post.summary[lang]}
      </p>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded bg-muted px-2 py-0.5 text-[length:var(--text-badge)] font-medium text-muted-foreground transition-colors group-hover:bg-border group-hover:text-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}
