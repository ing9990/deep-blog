'use client'

import { Layers, type LucideIcon } from 'lucide-react'
import type { CategoryId, CategoryMeta } from '@/lib/categories'
import { CATEGORY_ICONS } from '@/lib/category-icons'
import { cn } from '@/lib/utils'

interface CategoryTabBarProps {
  categories: Array<{ meta: CategoryMeta; count: number }>
  totalCount: number
  selected: CategoryId | null
  onSelect: (id: CategoryId | null) => void
}

export function CategoryTabBar({
  categories,
  totalCount,
  selected,
  onSelect,
}: CategoryTabBarProps) {
  return (
    <div
      role="tablist"
      aria-label="카테고리"
      className="-mx-1 mt-6 flex gap-1.5 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <Tab
        icon={Layers}
        label="All"
        count={totalCount}
        active={selected === null}
        onClick={() => onSelect(null)}
      />
      {categories.map(({ meta, count }) => (
        <Tab
          key={meta.id}
          icon={CATEGORY_ICONS[meta.id]}
          label={meta.label}
          count={count}
          active={selected === meta.id}
          onClick={() => onSelect(meta.id)}
        />
      ))}
    </div>
  )
}

interface TabProps {
  icon: LucideIcon
  label: string
  count: number
  active: boolean
  onClick: () => void
}

function Tab({ icon: Icon, label, count, active, onClick }: TabProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-muted-foreground hover:border-border-strong hover:text-foreground',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
      <span className="whitespace-nowrap">{label}</span>
      <span
        className={cn(
          'tabular-nums text-xs',
          active ? 'opacity-80' : 'opacity-60',
        )}
      >
        {count}
      </span>
    </button>
  )
}
