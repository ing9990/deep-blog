'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const OPTIONS = [
  { value: 'light', icon: Sun, label: '라이트 모드' },
  { value: 'system', icon: Monitor, label: '시스템 테마' },
  { value: 'dark', icon: Moon, label: '다크 모드' },
] as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const current = mounted ? theme ?? 'system' : null

  return (
    <div
      role="radiogroup"
      aria-label="테마 선택"
      className="inline-flex items-center gap-0.5"
    >
      {OPTIONS.map(({ value, icon: Icon, label }) => {
        const active = current === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            onClick={() => setTheme(value)}
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
              active
                ? 'bg-muted text-foreground shadow-sm ring-1 ring-border/60'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
        )
      })}
    </div>
  )
}
