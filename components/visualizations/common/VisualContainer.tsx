import type { ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface VisualContainerProps {
  /** Visualization title shown in the figcaption. */
  title: string
  /** Optional single-line description under the title. */
  description?: string
  /** Visualization body (array/tree/timeline/…) + controller. */
  children: ReactNode
  /** Optional reset handler. When provided, renders a top-right reset button. */
  onReset?: () => void
  /** Extra class names for the outer figure. */
  className?: string
}

export function VisualContainer({
  title,
  description,
  children,
  onReset,
  className,
}: VisualContainerProps) {
  return (
    <figure
      className={cn(
        'not-prose my-8 rounded-[var(--radius-panel)] border border-border bg-background p-5',
        className,
      )}
    >
      <figcaption className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[length:var(--text-h4)] font-semibold text-foreground">{title}</p>
          {description && (
            <p className="mt-1 text-[length:var(--text-caption)] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[var(--radius-card)] border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="초기 상태로 리셋"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </figcaption>
      {children}
    </figure>
  )
}
