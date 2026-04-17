'use client'

import { Layers } from 'lucide-react'
import {
  CATEGORIES,
  groupPostsByCategory,
  type CategoryId,
} from '@/lib/categories'
import { CATEGORY_ICONS } from '@/lib/category-icons'
import { cn } from '@/lib/utils'
import { useIndexFilter } from './IndexFilterContext'
import type { Post } from '@/lib/posts'
import { useMemo } from 'react'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface IndexCategoryNavProps {
  allPosts: Post[]
}

export function IndexCategoryNav({ allPosts }: IndexCategoryNavProps) {
  const { t, lang } = useTranslation()
  const { category, setCategory } = useIndexFilter()

  const groups = useMemo(() => groupPostsByCategory(allPosts), [allPosts])

  return (
    <nav aria-label={t('index.category.filter')} className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => setCategory(null)}
        className={cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
          category === null
            ? 'bg-accent font-medium text-accent-foreground'
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
        )}
      >
        <Layers className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
        <span className="flex-1 text-left">{t('index.all')}</span>
        <span className="tabular-nums text-xs opacity-60">
          {allPosts.length}
        </span>
      </button>

      {CATEGORIES.map((meta) => {
        const group = groups.find((g) => g.category.id === meta.id)
        const count = group?.posts.length ?? 0
        if (count === 0) return null
        const Icon = CATEGORY_ICONS[meta.id]
        const isActive = category === meta.id

        return (
          <button
            key={meta.id}
            type="button"
            onClick={() => setCategory(isActive ? null : meta.id)}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-accent font-medium text-accent-foreground'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
          >
            <Icon
              className="h-4 w-4 shrink-0"
              strokeWidth={2}
              aria-hidden
            />
            <span className="flex-1 text-left">{meta.label[lang]}</span>
            <span className="tabular-nums text-xs opacity-60">{count}</span>
          </button>
        )
      })}
    </nav>
  )
}
