'use client'

import Link from 'next/link'
import type { Post } from '@/lib/posts'
import { getCategory } from '@/lib/categories'
import { CATEGORY_ICONS } from '@/lib/category-icons'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { EN_MONTHS } from '@/lib/utils'

interface PostCardTimelineProps {
  post: Post
  isFirst?: boolean
  isLast?: boolean
  showDate?: boolean
}

export function PostCardTimeline({ post, isFirst = false, isLast = false, showDate = true }: PostCardTimelineProps) {
  const { lang } = useTranslation()
  const meta = getCategory(post.category)
  const Icon = CATEGORY_ICONS[post.category]
  const d = new Date(post.date)
  const day = String(d.getUTCDate()).padStart(2, '0')
  const month = EN_MONTHS[d.getUTCMonth()]

  return (
    <div className="group flex gap-0">
      {/* Timeline column: node center is always at 42px from top */}
      <div className="relative flex w-[72px] shrink-0 flex-col items-center pt-[22px]">
        {/* Line from previous card → node */}
        {!isFirst && (
          <div className="absolute left-1/2 top-0 h-[42px] w-[1.5px] -translate-x-1/2 bg-border" aria-hidden />
        )}
        {/* Line from node → next card */}
        {!isLast && (
          <div className="absolute bottom-[-12px] left-1/2 top-[42px] w-[1.5px] -translate-x-1/2 bg-border" aria-hidden />
        )}

        {showDate ? (
          <>
            <div className="relative z-[var(--z-nav)] flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-background text-[length:var(--text-meta)] font-bold text-muted-foreground transition-colors group-hover:border-primary group-hover:text-primary">
              {day}
            </div>
            <span className="relative z-[var(--z-nav)] mt-3 bg-background px-1 text-[length:var(--text-meta)] font-medium uppercase tracking-widest text-muted-foreground">
              {month}
            </span>
          </>
        ) : (
          <div className="relative z-[var(--z-nav)] mt-[15px] h-2.5 w-2.5 rounded-full border-[1.5px] border-border bg-background transition-colors group-hover:border-primary" />
        )}
      </div>

      {/* Card */}
      <Link
        href={`/posts/${post.slug}`}
        className="block min-w-0 flex-1 rounded-xl border border-border bg-background px-[22px] py-[18px] transition-all hover:border-border-strong hover:shadow-[var(--shadow-card-hover)]"
      >
        {/* Category */}
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-[var(--radius-chip)] bg-muted">
            <Icon className="h-[14px] w-[14px] text-muted-foreground" strokeWidth={2.2} aria-hidden />
          </span>
          <span className="text-[length:var(--text-caption)] font-semibold text-muted-foreground">
            {meta.label[lang]}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-[length:var(--text-h4)] font-semibold leading-[var(--leading-snug)] tracking-[var(--tracking-tight)] text-foreground transition-colors group-hover:text-primary">
          {post.title[lang]}
        </h2>

        {/* Summary */}
        <p className="mt-[5px] line-clamp-2 text-[length:var(--text-body-sm)] leading-[var(--leading-normal)] text-muted-foreground">
          {post.summary[lang]}
        </p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-2.5 flex gap-[5px]">
            {post.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[length:var(--text-badge)] font-medium text-muted-foreground">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </Link>
    </div>
  )
}
