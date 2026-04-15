'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { FlatTocItem } from '@/lib/toc'

export function TableOfContents({ items }: { items: FlatTocItem[] }) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null)

  useEffect(() => {
    if (items.length === 0) return

    const elements = items
      .map((item) => document.getElementById(item.slug))
      .filter((el): el is HTMLElement => el !== null)

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          setActiveSlug(visible[0].target.id)
        }
      },
      { rootMargin: '-80px 0px -70% 0px' },
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [items])

  if (items.length === 0) return null

  return (
    <nav aria-label="목차">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        On this page
      </p>
      <ul className="space-y-2 border-l border-border">
        {items.map((item) => (
          <li
            key={item.slug}
            className={cn(
              '-ml-px border-l-2 pl-4 text-sm transition-colors',
              item.depth === 3 && 'pl-7',
              activeSlug === item.slug
                ? 'border-primary font-medium text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <a
              href={`#${item.slug}`}
              className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
