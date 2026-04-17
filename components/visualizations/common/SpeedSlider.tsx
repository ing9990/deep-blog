// components/visualizations/common/SpeedSlider.tsx
'use client'

import { cn } from '@/lib/utils'

export interface SpeedSliderProps {
  /** Current speed level, 1 (slowest) to 5 (fastest). */
  speed: number
  /** Callback fired when the user clicks a segment. */
  onChange: (speed: number) => void
  className?: string
}

const LEVELS = [1, 2, 3, 4, 5] as const

export function SpeedSlider({ speed, onChange, className }: SpeedSliderProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-[length:var(--text-caption)] text-muted-foreground',
        className,
      )}
      role="group"
      aria-label="재생 속도"
    >
      <span className="hidden sm:inline">속도</span>
      <div className="flex items-center gap-0.5">
        {LEVELS.map((level) => {
          const active = level <= speed
          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange(level)}
              aria-label={`속도 ${level}`}
              aria-pressed={speed === level}
              className={cn(
                'h-5 w-2 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active ? 'bg-primary' : 'bg-border',
              )}
            />
          )
        })}
      </div>
    </div>
  )
}
