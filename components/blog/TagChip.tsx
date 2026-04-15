'use client'

import { cn } from '@/lib/utils'

interface TagChipProps {
  label: string
  count?: number
  active: boolean
  onClick: () => void
}

export function TagChip({ label, count, active, onClick }: TagChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-muted-foreground hover:border-border-strong hover:text-foreground',
      )}
    >
      {label}
      {typeof count === 'number' && (
        <span className={cn('ml-1.5 text-xs', active ? 'opacity-80' : 'opacity-60')}>
          {count}
        </span>
      )}
    </button>
  )
}
