import type { ReactNode, ReactElement } from 'react'

export const toValue = (label: string): string => label.toLowerCase().trim()

export const TAB_SYMBOL = Symbol.for('mdx.Tab')

export interface TabProps {
  label: string
  children?: ReactNode
}

export interface NormalizedTab {
  label: string
  value: string
  children: ReactNode
}

type TabComponent = ((props: TabProps) => ReactNode) & { [TAB_SYMBOL]?: true }

const isTabElement = (node: ReactNode): node is ReactElement<TabProps> => {
  if (!node || typeof node !== 'object' || !('type' in node)) return false
  const type = (node as ReactElement).type as TabComponent
  return typeof type === 'function' && type[TAB_SYMBOL] === true
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
    const rawLabel = node.props.label
    const label = typeof rawLabel === 'string' ? rawLabel : ''
    if (!label && process.env.NODE_ENV !== 'production') {
      console.warn('<Tab>: missing label, using "unlabeled".')
    }
    const safeLabel = label || 'unlabeled'
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
