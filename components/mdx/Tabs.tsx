import type { ReactNode } from 'react'
import { extractTabs, type TabProps } from '@/components/mdx/tabs-utils'
import { TabsView } from '@/components/mdx/TabsView'

// `Tab` is a marker component. It is never rendered — `Tabs` inspects children
// to extract `{label, children}` pairs. Keeping it as a plain function here
// means MDX can still pass it through the `mdxComponents` map without crossing
// a client boundary.
export const Tab = (_props: TabProps): null => null
Tab.displayName = 'Tab'

interface TabsProps {
  group?: string
  defaultValue?: string
  children?: ReactNode
}

/**
 * Tabs is a Server Component so it can inspect `children` synchronously while
 * they are still concrete React elements. Moving the extraction across the
 * RSC→client boundary (which the previous `'use client'` version did) caused
 * later tabs to arrive as unresolved lazy references when an earlier tab's
 * Shiki-rendered code block was large enough to split the stream — the client
 * saw `{$$typeof: react.lazy, _payload: Promise<pending>}` instead of the Tab
 * element and silently dropped it.
 */
export function Tabs({ group, defaultValue, children }: TabsProps) {
  const tabs = extractTabs(children)
  if (tabs.length === 0) return null
  return <TabsView group={group} defaultValue={defaultValue} tabs={tabs} />
}
