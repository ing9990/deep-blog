'use client'

import Link from 'next/link'
import type { Post } from '@/lib/posts'
import { getCategory } from '@/lib/categories'
import { CATEGORY_ICONS } from '@/lib/category-icons'
import { categoryStyle } from '@/lib/category-colors'
import { formatDate } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/useTranslation'

export function PostCardEditorial({ post }: { post: Post }) {
  const { lang } = useTranslation()
  const meta = getCategory(post.category)
  const Icon = CATEGORY_ICONS[post.category]

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group relative block overflow-hidden rounded-xl border border-border bg-background px-6 py-5 transition-all hover:-translate-y-px hover:border-border-strong hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
      style={categoryStyle(post.category)}
      data-cat-tinted=""
    >
      {/* Left accent bar */}
      <span
        className="absolute inset-y-0 left-0 w-[3.5px] rounded-l-xl opacity-50 transition-opacity group-hover:opacity-100"
        style={{ backgroundColor: 'var(--cat-accent)' }}
        aria-hidden
      />

      {/* Top row: category pill + date */}
      <div className="mb-2.5 flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-[3px] text-[11.5px] font-semibold tracking-wide"
          style={{ color: 'var(--cat-accent)', backgroundColor: 'var(--cat-tint)' }}
        >
          <Icon className="h-[13px] w-[13px]" strokeWidth={2.2} aria-hidden />
          {meta.label[lang]}
        </span>
        <time className="text-[12.5px] tabular-nums text-muted-foreground" dateTime={post.date}>
          {formatDate(post.date, lang)}
        </time>
      </div>

      {/* Title */}
      <h2 className="text-[17px] font-semibold leading-[1.45] tracking-[-0.015em] text-foreground transition-colors group-hover:text-primary">
        {post.title}
      </h2>

      {/* Summary */}
      <p className="mt-1.5 line-clamp-2 text-[14px] leading-[1.65] text-muted-foreground">
        {post.summary}
      </p>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded bg-muted px-2 py-[2px] text-[11.5px] font-medium text-muted-foreground transition-colors group-hover:bg-border group-hover:text-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}
