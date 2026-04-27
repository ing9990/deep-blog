import type { CSSProperties, ReactNode } from 'react'

interface EmphasisProps {
  children: ReactNode
}

const STYLE: CSSProperties = {
  color: 'var(--emphasis-fg)',
  fontWeight: 'var(--weight-semibold)',
}

export function Emphasis({ children }: EmphasisProps) {
  return <span style={STYLE}>{children}</span>
}
