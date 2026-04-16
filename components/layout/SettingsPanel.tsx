// components/layout/SettingsPanel.tsx
'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useSettings, type CardLayout } from '@/components/providers/SettingsProvider'
import { cn } from '@/lib/utils'

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
}

const LAYOUT_OPTIONS: { value: CardLayout; label: string }[] = [
  { value: 'floating', label: 'Default' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'timeline', label: 'Timeline' },
]

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { settings, updateSetting } = useSettings()
  const panelRef = useRef<HTMLDivElement>(null)

  // ESC 닫기
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // 외부 클릭 닫기
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // requestAnimationFrame으로 FAB 클릭 이벤트와 충돌 방지
    const id = requestAnimationFrame(() => {
      document.addEventListener('mousedown', handleClick)
    })
    return () => {
      cancelAnimationFrame(id)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="설정"
      className="fixed bottom-20 right-6 z-50 w-[300px] origin-bottom-right animate-[panel-in_0.25s_cubic-bezier(0.22,1,0.36,1)_both] rounded-2xl border border-border bg-background shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 pb-3 pt-4">
        <h3 className="text-[15px] font-bold tracking-tight">설정</h3>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
          aria-label="설정 닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="py-2">
        {/* Theme Section */}
        <div className="px-5 py-3">
          <div className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            테마
          </div>
          <div className="flex gap-2">
            {LAYOUT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateSetting('cardLayout', opt.value)}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1.5 rounded-xl border-[1.5px] px-2 py-2.5 transition-all',
                  settings.cardLayout === opt.value
                    ? 'border-primary bg-accent'
                    : 'border-border bg-background hover:border-border-strong hover:bg-muted',
                )}
              >
                <LayoutMiniIcon layout={opt.value} active={settings.cardLayout === opt.value} />
                <span className="text-[11px] font-semibold">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* 각 레이아웃의 특징을 추상화한 미니 와이어프레임 아이콘 */
function LayoutMiniIcon({ layout, active }: { layout: CardLayout; active: boolean }) {
  const barColor = active ? 'bg-primary' : 'bg-muted-foreground/30'
  const dotColor = active ? 'bg-primary' : 'bg-muted-foreground/30'

  if (layout === 'editorial') {
    return (
      <div className="flex h-7 w-9 items-stretch overflow-hidden rounded">
        <div className={cn('w-[3px] shrink-0 rounded-l', barColor)} />
        <div className="flex flex-1 flex-col justify-center gap-1 pl-1.5 pr-1">
          <div className={cn('h-[3px] w-full rounded-full', barColor)} />
          <div className={cn('h-[2px] w-3/4 rounded-full', barColor, 'opacity-50')} />
        </div>
      </div>
    )
  }

  if (layout === 'timeline') {
    return (
      <div className="flex h-7 w-9 items-center gap-1 rounded px-1">
        <div className={cn('h-2.5 w-2.5 shrink-0 rounded-full border-2', active ? 'border-primary' : 'border-muted-foreground/30')} />
        <div className="flex flex-1 flex-col justify-center gap-1">
          <div className={cn('h-[3px] w-full rounded-full', barColor)} />
          <div className={cn('h-[2px] w-3/4 rounded-full', barColor, 'opacity-50')} />
        </div>
      </div>
    )
  }

  // floating
  return (
    <div className="flex h-7 w-9 items-center gap-1.5 rounded px-1">
      <div className={cn('h-3 w-3 shrink-0 rounded', dotColor)} />
      <div className="flex flex-1 flex-col justify-center gap-1">
        <div className={cn('h-[3px] w-full rounded-full', barColor)} />
        <div className={cn('h-[2px] w-3/4 rounded-full', barColor, 'opacity-50')} />
      </div>
    </div>
  )
}
