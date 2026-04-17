import type { CSSProperties, ReactNode } from 'react'
import { Info, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react'

type CalloutType = 'info' | 'warning' | 'error' | 'success'

interface CalloutProps {
  type?: CalloutType
  title?: string
  children: ReactNode
}

// Colors are defined as CSS variables in app/globals.css (--callout-<type>-<slot>),
// one set per theme. This keeps both light and dark mode values explicit and
// predictable without relying on Tailwind palette utilities (which can drift
// when consumed inside .prose-kr or be mis-extracted from template literals).
const VARIANTS: Record<
  CalloutType,
  { icon: typeof Info; cssPrefix: string; defaultTitle: string }
> = {
  info:    { icon: Info,          cssPrefix: 'info',    defaultTitle: '참고' },
  warning: { icon: AlertTriangle, cssPrefix: 'warning', defaultTitle: '주의' },
  error:   { icon: AlertCircle,   cssPrefix: 'error',   defaultTitle: '경고' },
  success: { icon: CheckCircle2,  cssPrefix: 'success', defaultTitle: '팁' },
}

export function Callout({ type = 'info', title, children }: CalloutProps) {
  const variant = VARIANTS[type]
  const Icon = variant.icon
  const displayTitle = title ?? variant.defaultTitle

  const surface: CSSProperties = {
    backgroundColor: `var(--callout-${variant.cssPrefix}-bg)`,
    borderLeftColor: `var(--callout-${variant.cssPrefix}-border)`,
  }
  const iconColor: CSSProperties = {
    color: `var(--callout-${variant.cssPrefix}-icon)`,
  }
  const titleColor: CSSProperties = {
    color: `var(--callout-${variant.cssPrefix}-title)`,
  }

  return (
    <aside
      className="my-6 flex gap-3 rounded-[var(--radius-panel)] border border-border border-l-4 p-4 text-[length:var(--text-callout-body)] leading-[1.7] text-foreground"
      style={surface}
      role="note"
    >
      <Icon
        className="mt-0.5 h-5 w-5 flex-shrink-0"
        style={iconColor}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="mb-1 font-semibold" style={titleColor}>
          {displayTitle}
        </p>
        <div className="[&>p]:my-0 [&>p+p]:mt-2">{children}</div>
      </div>
    </aside>
  )
}
