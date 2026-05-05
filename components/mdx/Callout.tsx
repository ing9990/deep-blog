import type { CSSProperties, ReactNode } from 'react'
import { Info, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react'

type CalloutType = 'info' | 'warning' | 'error' | 'success'

interface CalloutProps {
  type?: CalloutType
  title?: string
  children: ReactNode
}

const VARIANTS: Record<
  CalloutType,
  { icon: typeof Info; cssPrefix: string }
> = {
  info:    { icon: Info,          cssPrefix: 'info' },
  warning: { icon: AlertTriangle, cssPrefix: 'warning' },
  error:   { icon: AlertCircle,   cssPrefix: 'error' },
  success: { icon: CheckCircle2,  cssPrefix: 'success' },
}

export function Callout({ type = 'info', title, children }: CalloutProps) {
  const variant = VARIANTS[type]
  const Icon = variant.icon
  const accentVar = `var(--callout-${variant.cssPrefix}-border)`

  const surface: CSSProperties = {
    borderColor: `color-mix(in oklab, ${accentVar} 35%, var(--border))`,
    backgroundColor: `color-mix(in oklab, ${accentVar} 5%, transparent)`,
  }
  const iconColor: CSSProperties = {
    color: `var(--callout-${variant.cssPrefix}-icon)`,
  }
  const titleColor: CSSProperties = {
    color: `var(--callout-${variant.cssPrefix}-title)`,
  }

  return (
    <aside
      className="my-5 flex items-start gap-2.5 rounded-[var(--radius-card)] border px-4 py-3 text-[length:var(--text-callout-body)] leading-[var(--leading-normal)] text-foreground"
      style={surface}
      role="note"
    >
      <Icon
        className="mt-1 h-4 w-4 flex-shrink-0"
        style={iconColor}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1 [&>p]:my-0 [&>p+p]:mt-1.5">
        {title ? (
          <span className="mr-1.5 font-semibold" style={titleColor}>
            {title}
          </span>
        ) : null}
        {children}
      </div>
    </aside>
  )
}
