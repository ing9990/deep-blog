'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

type TabId = 'project' | 'books'

interface LandingPanelsProps {
  projectPanel: React.ReactNode
  booksPanel: React.ReactNode
}

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'project', label: '미니쿠팡 기술 포인트' },
  { id: 'books', label: '지금 읽고 있는 것' },
]

export function LandingPanels({ projectPanel, booksPanel }: LandingPanelsProps) {
  const [active, setActive] = useState<TabId>('project')

  return (
    <div className="w-full">
      <div className="mx-auto mb-8 w-full max-w-4xl px-6 md:mb-10">
        <div
          role="tablist"
          aria-label="DEEP 패널 전환"
          className="flex w-full border-b border-border"
        >
          {TABS.map((tab) => {
            const isActive = active === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActive(tab.id)}
                className={cn(
                  'relative -mb-px flex-1 px-4 py-3 text-center text-[length:var(--text-body)] font-medium transition-colors',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute inset-x-0 bottom-0 h-0.5 transition-opacity',
                    isActive ? 'bg-primary opacity-100' : 'opacity-0',
                  )}
                />
              </button>
            )
          })}
        </div>
      </div>

      <div
        role="tabpanel"
        id="panel-project"
        aria-labelledby="tab-project"
        hidden={active !== 'project'}
      >
        {projectPanel}
      </div>
      <div
        role="tabpanel"
        id="panel-books"
        aria-labelledby="tab-books"
        hidden={active !== 'books'}
      >
        {booksPanel}
      </div>
    </div>
  )
}
