import type { ReactNode } from 'react'
import { Info, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type CalloutType = 'info' | 'warning' | 'error' | 'success'

interface CalloutProps {
  type?: CalloutType
  title?: string
  children: ReactNode
}

// Minimalist callout design — body text uses --foreground for maximum
// contrast in both themes. Accent color only appears on the left border,
// icon, and title. This keeps callouts readable regardless of palette.
const VARIANTS: Record<
  CalloutType,
  {
    icon: typeof Info
    surfaceClass: string
    iconClass: string
    titleClass: string
    defaultTitle: string
  }
> = {
  info: {
    icon: Info,
    surfaceClass: 'border-l-blue-500 bg-blue-50/60 dark:border-l-blue-400 dark:bg-blue-950/20',
    iconClass: 'text-blue-600 dark:text-blue-400',
    titleClass: 'text-blue-900 dark:text-blue-200',
    defaultTitle: '참고',
  },
  warning: {
    icon: AlertTriangle,
    surfaceClass: 'border-l-amber-500 bg-amber-50/60 dark:border-l-amber-400 dark:bg-amber-950/20',
    iconClass: 'text-amber-600 dark:text-amber-400',
    titleClass: 'text-amber-900 dark:text-amber-200',
    defaultTitle: '주의',
  },
  error: {
    icon: AlertCircle,
    surfaceClass: 'border-l-red-500 bg-red-50/60 dark:border-l-red-400 dark:bg-red-950/20',
    iconClass: 'text-red-600 dark:text-red-400',
    titleClass: 'text-red-900 dark:text-red-200',
    defaultTitle: '경고',
  },
  success: {
    icon: CheckCircle2,
    surfaceClass: 'border-l-emerald-500 bg-emerald-50/60 dark:border-l-emerald-400 dark:bg-emerald-950/20',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    titleClass: 'text-emerald-900 dark:text-emerald-200',
    defaultTitle: '팁',
  },
}

export function Callout({ type = 'info', title, children }: CalloutProps) {
  const variant = VARIANTS[type]
  const Icon = variant.icon
  const displayTitle = title ?? variant.defaultTitle

  return (
    <aside
      className={cn(
        'my-6 flex gap-3 rounded-[14px] border border-border border-l-4 p-4 text-[15px] leading-[1.7] text-foreground',
        variant.surfaceClass,
      )}
      role="note"
    >
      <Icon
        className={cn('mt-0.5 h-5 w-5 flex-shrink-0', variant.iconClass)}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className={cn('mb-1 font-semibold', variant.titleClass)}>{displayTitle}</p>
        <div className="[&>p]:my-0 [&>p+p]:mt-2">{children}</div>
      </div>
    </aside>
  )
}
