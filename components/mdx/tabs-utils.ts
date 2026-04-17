import type { ReactNode, ReactElement } from 'react'

export const toValue = (label: string): string => label.toLowerCase().trim()

export interface TabProps {
  label: string
  children?: ReactNode
}

export interface NormalizedTab {
  label: string
  value: string
  children: ReactNode
}

// Identify a <Tab> child by duck-typing: any React element whose props have a
// string `label`. Using reference identity (type === Tab) is unreliable across
// the RSC client boundary — the `type` field may be a client module reference
// on the server, not the Tab function itself. Props, however, round-trip
// cleanly through RSC serialization.
const isTabElement = (node: ReactNode): node is ReactElement<TabProps> => {
  if (!node || typeof node !== 'object' || !('props' in node)) return false
  const props = (node as ReactElement).props as { label?: unknown } | null
  return !!props && typeof props.label === 'string'
}

export function extractTabs(children: ReactNode): NormalizedTab[] {
  const out: NormalizedTab[] = []
  const seen = new Set<string>()
  const flat = Array.isArray(children) ? children : [children]

  for (const node of flat) {
    if (!isTabElement(node)) {
      if (node != null && typeof node === 'object' && process.env.NODE_ENV !== 'production') {
        console.warn('<Tabs>: non-<Tab> child ignored.')
      }
      continue
    }
    const label = (node.props as TabProps).label
    const safeLabel = label.trim() || 'unlabeled'
    if (!label.trim() && process.env.NODE_ENV !== 'production') {
      console.warn('<Tab>: empty label, using "unlabeled".')
    }
    const value = toValue(safeLabel)
    if (seen.has(value)) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`<Tabs>: duplicate tab value "${value}", first wins.`)
      }
      continue
    }
    seen.add(value)
    out.push({ label: safeLabel, value, children: node.props.children })
  }

  return out
}
