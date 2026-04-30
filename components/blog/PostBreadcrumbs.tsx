'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { SLUG_TO_ENTRY } from '@/lib/generated/keyword-map'
import { useTranslation } from '@/lib/i18n/useTranslation'

const STORAGE_KEY = 'deep-blog-trail'
const HOME_SLUG = '__home__'
const MAX_VISIBLE = 3

const HOME_LABEL = { ko: '글 목록', en: 'All Posts' } as const

interface PostBreadcrumbsProps {
  currentSlug: string
}

export function PostBreadcrumbs({ currentSlug }: PostBreadcrumbsProps) {
  const { lang } = useTranslation()
  const [trail, setTrail] = useState<string[]>([HOME_SLUG, currentSlug])

  useEffect(() => {
    let stored: string[] = []
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
          stored = parsed
        }
      }
    } catch {
      stored = []
    }

    if (stored.length === 0) stored = [HOME_SLUG]

    const idx = stored.indexOf(currentSlug)
    const next = idx >= 0 ? stored.slice(0, idx + 1) : [...stored, currentSlug]

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* storage unavailable */
    }
    setTrail(next)
  }, [currentSlug])

  const visible = trail.slice(-MAX_VISIBLE)

  return (
    <nav aria-label="Breadcrumb" className="mb-10">
      <ol className="flex flex-wrap items-center gap-1.5 text-[length:var(--text-nav-item)] text-muted-foreground">
        {visible.map((slug, i) => {
          const isLast = i === visible.length - 1
          const isHome = slug === HOME_SLUG
          const label = isHome
            ? HOME_LABEL[lang]
            : (SLUG_TO_ENTRY.get(slug)?.title[lang] ?? slug)
          const href = isHome ? '/' : `/posts/${slug}`

          return (
            <li key={`${slug}-${i}`} className="flex min-w-0 items-center gap-1.5">
              {i > 0 && (
                <ChevronRight
                  className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/60"
                  aria-hidden="true"
                />
              )}
              {isLast ? (
                <span
                  aria-current="page"
                  className="block max-w-[180px] truncate font-medium text-foreground sm:max-w-[280px]"
                  title={label}
                >
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  className="block max-w-[140px] truncate transition-colors hover:text-foreground sm:max-w-[200px]"
                  title={label}
                >
                  {label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
