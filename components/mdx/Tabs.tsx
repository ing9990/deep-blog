'use client'

import * as RadixTabs from '@radix-ui/react-tabs'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  extractTabs,
  toValue,
  type TabProps,
} from '@/components/mdx/tabs-utils'
import { useTabsGroup } from '@/components/mdx/TabsGroupProvider'

export const Tab = (_props: TabProps): null => null
Tab.displayName = 'Tab'

interface TabsProps {
  group?: string
  defaultValue?: string
  children?: ReactNode
}

export function Tabs({ group, defaultValue, children }: TabsProps) {
  const tabs = useMemo(() => extractTabs(children), [children])

  const ctx = useTabsGroup()
  const groupMode = Boolean(group)
  if (groupMode && !ctx && process.env.NODE_ENV !== 'production') {
    console.warn(`<Tabs group="${group}">: used outside TabsGroupProvider, falling back to local state.`)
  }
  const useCtx = groupMode && ctx !== null

  const normalizedDefault = defaultValue ? toValue(defaultValue) : undefined
  const firstValue = tabs[0]?.value
  const initial = useMemo(() => {
    if (normalizedDefault && tabs.some((t) => t.value === normalizedDefault)) {
      return normalizedDefault
    }
    return firstValue ?? ''
  }, [normalizedDefault, firstValue, tabs])

  const [localValue, setLocalValue] = useState<string>(initial)

  const groupValue = useCtx && group ? ctx!.groups[group] : undefined
  const current =
    useCtx && groupValue && tabs.some((t) => t.value === groupValue)
      ? groupValue
      : useCtx
      ? normalizedDefault && tabs.some((t) => t.value === normalizedDefault)
        ? normalizedDefault
        : firstValue ?? ''
      : localValue

  useEffect(() => {
    if (!useCtx || !group) return
    if (!ctx!.groups[group] && normalizedDefault && tabs.some((t) => t.value === normalizedDefault)) {
      ctx!.setGroup(group, normalizedDefault)
    }
  }, [useCtx, group, ctx, normalizedDefault, tabs])

  const handleChange = (next: string) => {
    if (useCtx && group) {
      ctx!.setGroup(group, next)
    } else {
      setLocalValue(next)
    }
  }

  if (tabs.length === 0) return null

  return (
    <RadixTabs.Root
      value={current}
      onValueChange={handleChange}
      className="my-6 overflow-hidden rounded-[14px] border border-border"
    >
      <RadixTabs.List
        className={cn(
          'flex gap-1 overflow-x-auto border-b border-border px-2',
          '[&::-webkit-scrollbar]:hidden [scrollbar-width:none]',
        )}
      >
        {tabs.map((t) => (
          <RadixTabs.Trigger
            key={t.value}
            value={t.value}
            className={cn(
              '-mb-px whitespace-nowrap px-4 py-2.5 text-[14px] font-medium',
              'text-muted-foreground transition-colors',
              'hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground',
            )}
          >
            {t.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {tabs.map((t) => (
        <RadixTabs.Content
          key={t.value}
          value={t.value}
          className="p-4 [&>:first-child]:mt-0 [&>:last-child]:mb-0 focus-visible:outline-none"
        >
          {t.children}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  )
}
