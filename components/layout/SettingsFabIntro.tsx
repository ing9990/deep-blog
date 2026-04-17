'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'deep-fab-intro-seen'
const HERO_DIALOG_SELECTOR = '[aria-label="DEEP 소개"]'
const HERO_DISMISSED_EVENT = 'deep-hero-dismissed'

const DELAY_AFTER_HERO_MS = 1200
const DELAY_DEFAULT_MS = 800
const HERO_FALLBACK_MS = 10000

const ORBIT_DURATION_MS = 1600
const STATIC_DURATION_MS = 2100

const ORBIT_RADIUS_DESKTOP = 56
const ORBIT_RADIUS_MOBILE = 40
const START_RADIUS_DESKTOP = 80
const START_RADIUS_MOBILE = 56
const MOBILE_BREAKPOINT = 375

type Stage = 'idle' | 'playing'

interface OrbitTarget {
  key: 'sun' | 'moon' | 'lang'
  angleDeg: number
}

const ORBIT_TARGETS: readonly OrbitTarget[] = [
  { key: 'sun',  angleDeg: -90 },
  { key: 'lang', angleDeg: 150 },
  { key: 'moon', angleDeg: 30  },
]

function polar(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180
  return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius }
}

export function SettingsFabIntro() {
  const { lang } = useTranslation()
  const [stage, setStage] = useState<Stage>('idle')
  const [reducedMotion, setReducedMotion] = useState(false)
  const [radii, setRadii] = useState({ orbit: ORBIT_RADIUS_DESKTOP, start: START_RADIUS_DESKTOP })

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return
    } catch {
      return
    }

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mql.matches)

    let cleanupFns: Array<() => void> = []
    const addCleanup = (fn: () => void) => cleanupFns.push(fn)

    const begin = () => {
      try {
        if (sessionStorage.getItem(STORAGE_KEY)) return
        sessionStorage.setItem(STORAGE_KEY, String(Date.now()))
      } catch {
        return
      }
      // Compute radii synchronously so the first playing render has correct
      // mobile/desktop values. Resize effect still handles mid-animation changes.
      const isMobile = window.innerWidth <= MOBILE_BREAKPOINT
      setRadii({
        orbit: isMobile ? ORBIT_RADIUS_MOBILE : ORBIT_RADIUS_DESKTOP,
        start: isMobile ? START_RADIUS_MOBILE : START_RADIUS_DESKTOP,
      })
      setStage('playing')
    }

    const start = () => {
      if (document.visibilityState !== 'visible') {
        const onVisible = () => {
          if (document.visibilityState === 'visible') {
            document.removeEventListener('visibilitychange', onVisible)
            begin()
          }
        }
        document.addEventListener('visibilitychange', onVisible)
        addCleanup(() => document.removeEventListener('visibilitychange', onVisible))
        return
      }
      begin()
    }

    const schedule = (delayMs: number) => {
      const id = window.setTimeout(() => start(), delayMs)
      addCleanup(() => window.clearTimeout(id))
    }

    const heroVisible = document.querySelector(HERO_DIALOG_SELECTOR)
    if (heroVisible) {
      let fallbackId: number
      const onDismissed = () => {
        window.clearTimeout(fallbackId)
        schedule(DELAY_AFTER_HERO_MS)
      }
      window.addEventListener(HERO_DISMISSED_EVENT, onDismissed, { once: true })
      addCleanup(() => window.removeEventListener(HERO_DISMISSED_EVENT, onDismissed))
      fallbackId = window.setTimeout(() => {
        window.removeEventListener(HERO_DISMISSED_EVENT, onDismissed)
        schedule(DELAY_AFTER_HERO_MS)
      }, HERO_FALLBACK_MS)
      addCleanup(() => window.clearTimeout(fallbackId))
    } else {
      schedule(DELAY_DEFAULT_MS)
    }

    return () => {
      for (const fn of cleanupFns) fn()
      cleanupFns = []
    }
  }, [])

  useEffect(() => {
    if (stage !== 'playing') return
    const duration = reducedMotion ? STATIC_DURATION_MS : ORBIT_DURATION_MS
    const id = window.setTimeout(() => setStage('idle'), duration)
    return () => window.clearTimeout(id)
  }, [stage, reducedMotion])

  useEffect(() => {
    if (stage !== 'playing') return
    const compute = () => {
      const isMobile = window.innerWidth <= MOBILE_BREAKPOINT
      setRadii({
        orbit: isMobile ? ORBIT_RADIUS_MOBILE : ORBIT_RADIUS_DESKTOP,
        start: isMobile ? START_RADIUS_MOBILE : START_RADIUS_DESKTOP,
      })
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [stage])

  if (stage !== 'playing') return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[var(--z-fab-intro)]"
    >
      {!reducedMotion && (
        <span className="absolute inset-0 rounded-xl border-2 border-foreground/40 animate-[fab-ring-pulse_1.6s_cubic-bezier(0.22,1,0.36,1)_forwards]" />
      )}
      {ORBIT_TARGETS.map((target, index) => {
        const end = polar(target.angleDeg, radii.orbit)
        const start = polar(target.angleDeg, radii.start)
        return (
          <OrbitIcon
            key={target.key}
            startX={start.x}
            startY={start.y}
            endX={end.x}
            endY={end.y}
            delayMs={index * 60}
            reducedMotion={reducedMotion}
          >
            {target.key === 'sun' && <Sun className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />}
            {target.key === 'moon' && <Moon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />}
            {target.key === 'lang' && (
              <span
                className={cn(
                  'text-[length:var(--text-button)] font-bold leading-none',
                  lang === 'en' ? 'font-mono' : 'font-sans',
                )}
              >
                {lang === 'ko' ? '가' : 'A'}
              </span>
            )}
          </OrbitIcon>
        )
      })}
    </div>
  )
}

interface OrbitIconProps {
  startX: number
  startY: number
  endX: number
  endY: number
  delayMs: number
  reducedMotion: boolean
  children: ReactNode
}

function OrbitIcon({
  startX,
  startY,
  endX,
  endY,
  delayMs,
  reducedMotion,
  children,
}: OrbitIconProps) {
  // Dynamic CSS variables must stay inline (Tailwind JIT cannot generate
  // per-icon arbitrary classes at runtime). Static positioning moves to
  // Tailwind utilities.
  const style: CSSProperties = {
    ['--start-x' as string]: `${startX}px`,
    ['--start-y' as string]: `${startY}px`,
    ['--end-x' as string]: `${endX}px`,
    ['--end-y' as string]: `${endY}px`,
    animationDelay: `${delayMs}ms`,
  }

  const animationClass = reducedMotion
    ? 'animate-[fab-orbit-static_2.1s_cubic-bezier(0.22,1,0.36,1)_forwards]'
    : 'animate-[fab-orbit-full_1.6s_linear_forwards]'

  return (
    <span
      className={cn(
        'absolute left-1/2 top-1/2 -ml-[15px] -mt-[15px] flex h-[30px] w-[30px] items-center justify-center rounded-full bg-background text-foreground shadow-sm ring-1 ring-border',
        animationClass,
      )}
      style={style}
    >
      {children}
    </span>
  )
}
