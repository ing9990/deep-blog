import type { ReactNode } from 'react'
import { Info, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type CalloutType = 'info' | 'warning' | 'error' | 'success'

interface CalloutProps {
  type?: CalloutType
  title?: string
  children: ReactNode
}

const VARIANTS: Record<
  CalloutType,
  { icon: typeof Info; className: string; iconClassName: string; defaultTitle: string }
> = {
  info: {
    icon: Info,
    className: 'border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100',
    iconClassName: 'text-blue-600 dark:text-blue-400',
    defaultTitle: '참고',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
    iconClassName: 'text-amber-600 dark:text-amber-400',
    defaultTitle: '주의',
  },
  error: {
    icon: AlertCircle,
    className: 'border-red-200 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100',
    iconClassName: 'text-red-600 dark:text-red-400',
    defaultTitle: '경고',
  },
  success: {
    icon: CheckCircle2,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100',
    iconClassName: 'text-emerald-600 dark:text-emerald-400',
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
        'my-6 flex gap-3 rounded-[14px] border p-4 text-[15px] leading-[1.7]',
        variant.className,
      )}
      role="note"
    >
      <Icon className={cn('mt-0.5 h-5 w-5 flex-shrink-0', variant.iconClassName)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="mb-1 font-semibold">{displayTitle}</p>
        <div className="[&>p]:my-0 [&>p+p]:mt-2">{children}</div>
      </div>
    </aside>
  )
}
