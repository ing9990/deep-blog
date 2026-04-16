'use client'

import Link from 'next/link'
import type { Post } from '@/lib/posts'
import { getCategory } from '@/lib/categories'
import { CATEGORY_ICONS } from '@/lib/category-icons'
import { CATEGORY_COLORS } from '@/lib/category-colors'
import { formatDate } from '@/lib/utils'

export function PostCardFloating({ post }: { post: Post }) {
  const meta = getCategory(post.category)
  const Icon = CATEGORY_ICONS[post.category]
  const colors = CATEGORY_COLORS[post.category]

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group grid grid-cols-[44px_1fr] items-start gap-4 rounded-[14px] border border-border bg-background p-5 transition-all hover:border-border-strong hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)]"
    >
      {/* Icon area */}
      <span
        className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
        style={{
          backgroundColor: colors.tint,
          border: `1px solid color-mix(in oklch, ${colors.accent} 15%, transparent)`,
          boxShadow: 'none',
        }}
        aria-hidden
      >
        <Icon className="h-5 w-5" style={{ color: colors.accent }} strokeWidth={1.8} />
      </span>

      {/* Content */}
      <div className="min-w-0">
        {/* Top row */}
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[12px] font-semibold" style={{ color: colors.accent }}>
            {meta.label}
          </span>
          <time className="text-[12px] tabular-nums text-muted-foreground" dateTime={post.date}>
            {formatDate(post.date)}
          </time>
        </div>

        {/* Title */}
        <h2 className="text-[17px] font-semibold leading-[1.4] tracking-[-0.015em] text-foreground transition-colors group-hover:text-primary">
          {post.title}
        </h2>

        {/* Summary */}
        <p className="mt-[5px] line-clamp-2 text-[14px] leading-[1.6] text-muted-foreground">
          {post.summary}
        </p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded bg-muted px-[7px] py-[2px] text-[11px] font-medium text-muted-foreground"
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
