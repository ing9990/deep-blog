'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// Shown once per session on the index page. Scroll-driven, two progressive
// highlight stages revealed by down gestures:
//   stage 1 → all three intro lines emphasized together
//   stage 2 → "DEEP" brand block emphasized
// One more down gesture past stage 2 dismisses the hero. Dismissal is final
// for the session (sessionStorage flag); there is no re-open path.
//
// Intent detection uses a burst + commit-delta detector so that trackpad
// inertia and micro-jitter don't accidentally advance stages. See
// `createBurstDetector` below.
const STORAGE_KEY = 'deep-hero-seen'
const FADE_MS = 500
const STAGE_TOTAL = 2

// Tuning — see the "Commit-delta burst" design notes.
const ADVANCE_IDLE_GAP_MS = 120
const ADVANCE_COMMIT_DELTA = 220
const ADVANCE_COOLDOWN_MS = 420
// Touch needs its own tuning: trackpad inertia isn't a concern (touchend stops
// events cleanly), and mobile swipes are shorter in pixel distance than
// trackpad scrolls. A 220px threshold frequently misses legitimate swipes.
const ADVANCE_TOUCH_IDLE_GAP_MS = 140
const ADVANCE_TOUCH_COMMIT_DELTA = 80

type Stage = 0 | 1 | 2 | 3
type Dir = 'up' | 'down'

interface BurstDetector {
  feed(delta: number, now: number): Dir | null
  emit(dir: Dir, now: number): Dir | null
}

// A burst is a contiguous stream of same-direction wheel/touch deltas with
// idle gaps no longer than `idleGapMs`. When the same-direction accumulation
// crosses `commitDelta`, we emit one intent and start over. `intentCooldownMs`
// blocks rapid re-fires so that trackpad inertia after a decisive flick
// doesn't stack multiple intents back-to-back.
function createBurstDetector(opts: {
  idleGapMs: number
  commitDelta: number
  intentCooldownMs: number
}): BurstDetector {
  let accum = 0
  let lastInputAt = 0
  let lastIntentAt = 0

  const tryEmit = (dir: Dir, now: number): Dir | null => {
    if (now - lastIntentAt < opts.intentCooldownMs) return null
    lastIntentAt = now
    accum = 0
    return dir
  }

  return {
    feed(delta, now) {
      if (Math.abs(delta) < 1) return null
      if (now - lastInputAt > opts.idleGapMs) accum = 0
      if ((accum > 0 && delta < 0) || (accum < 0 && delta > 0)) accum = 0
      lastInputAt = now
      accum += delta
      if (Math.abs(accum) < opts.commitDelta) return null
      return tryEmit(accum > 0 ? 'down' : 'up', now)
    },
    emit(dir, now) {
      return tryEmit(dir, now)
    },
  }
}

export function HeroIntro() {
  const [mounted, setMounted] = useState(false)
  const [show, setShow] = useState(false)
  const [dismissing, setDismissing] = useState(false)
  const [stage, setStage] = useState<Stage>(0)
  // Ref guard: once dismissal has been scheduled, subsequent effect runs must
  // not clear or re-schedule the timer. Without this, setDismissing(true)
  // triggers a re-render which cancels the pending setShow(false) and leaves
  // body scroll locked forever.
  const dismissScheduledRef = useRef(false)
  // Click/tap handler ref. The advance + cooldown logic lives inside the
  // gesture useEffect; the JSX onClick reads from this ref so clicks share
  // the same cooldown as wheel/touch (prevents double-advance when a swipe
  // also produces a synthetic click).
  const clickAdvanceRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    setMounted(true)
    try {
      const seen = sessionStorage.getItem(STORAGE_KEY)
      if (!seen) setShow(true)
    } catch {
      // sessionStorage can throw (private mode, iframe). Default: don't show.
    }
  }, [])

  useEffect(() => {
    if (!show) return
    setStage(0)
    dismissScheduledRef.current = false
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [show])

  // Advance stages on down gestures while the hero is visible.
  useEffect(() => {
    if (!show || dismissing) return

    const wheelDetector = createBurstDetector({
      idleGapMs: ADVANCE_IDLE_GAP_MS,
      commitDelta: ADVANCE_COMMIT_DELTA,
      intentCooldownMs: ADVANCE_COOLDOWN_MS,
    })
    const touchDetector = createBurstDetector({
      idleGapMs: ADVANCE_TOUCH_IDLE_GAP_MS,
      commitDelta: ADVANCE_TOUCH_COMMIT_DELTA,
      intentCooldownMs: ADVANCE_COOLDOWN_MS,
    })
    let touchStart = 0

    const advance = () => {
      setStage((prev) =>
        prev >= STAGE_TOTAL + 1 ? prev : ((prev + 1) as Stage),
      )
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const dir = wheelDetector.feed(e.deltaY, Date.now())
      if (dir === 'down') advance()
    }

    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === 'ArrowDown' ||
        e.key === 'PageDown' ||
        e.key === ' ' ||
        e.key === 'Enter'
      ) {
        e.preventDefault()
        if (wheelDetector.emit('down', Date.now()) === 'down') advance()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setStage((STAGE_TOTAL + 1) as Stage)
      }
    }

    const onTouchStart = (e: TouchEvent) => {
      touchStart = e.touches[0]?.clientY ?? 0
    }

    // Non-passive so preventDefault() can stop iOS rubber-band and
    // native scroll from fighting with our own gesture detection.
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const y = e.touches[0]?.clientY ?? 0
      const delta = touchStart - y // finger up = content down = positive
      touchStart = y
      const dir = touchDetector.feed(delta, Date.now())
      if (dir === 'down') advance()
    }

    clickAdvanceRef.current = () => {
      if (wheelDetector.emit('down', Date.now()) === 'down') advance()
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      clickAdvanceRef.current = null
    }
  }, [show, dismissing])

  // Once stage advances past the final line, kick off dismissal.
  // Deliberately does NOT include `dismissing` in deps, and uses a ref guard
  // so the timeout is scheduled exactly once per hero lifetime.
  useEffect(() => {
    if (!show) return
    if (stage <= STAGE_TOTAL) return
    if (dismissScheduledRef.current) return
    dismissScheduledRef.current = true
    setDismissing(true)
    try {
      sessionStorage.setItem(STORAGE_KEY, String(Date.now()))
    } catch {}
    // SettingsFabIntro listens for this to schedule its own intro playback
    // after hero fade-out. CustomEvent is always available in the client
    // effect runtime, so no try/catch is needed.
    window.dispatchEvent(new CustomEvent('deep-hero-dismissed'))
    window.setTimeout(() => setShow(false), FADE_MS)
  }, [stage, show])

  if (!mounted || !show) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="DEEP 소개"
      onClick={() => clickAdvanceRef.current?.()}
      className={cn(
        'fixed inset-0 z-[var(--z-hero)] flex touch-none cursor-pointer flex-col items-center justify-center overflow-hidden overscroll-contain bg-black px-6 text-white',
        'transition-opacity duration-500',
        dismissing ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
    >
      {/* Subtle dot grid for tactile texture without breaking the SOLID black feel */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:28px_28px]"
      />
      {/* Subtle radial vignette to draw the eye to center */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.7)_100%)]"
      />

      <div className="relative mx-auto max-w-4xl text-center">
        <p className="hero-fade-1 mb-7 inline-flex items-center gap-3 text-[length:var(--text-caption)] font-medium uppercase tracking-[var(--tracking-widest)] text-white/55">
          <span className="h-px w-8 bg-white/30" aria-hidden="true" />
          Deep Understanding
          <span className="h-px w-8 bg-white/30" aria-hidden="true" />
        </p>

        <h1 className="flex flex-col gap-3 text-balance text-[length:var(--text-h1)] font-bold leading-tight tracking-[var(--tracking-tightest)]">
          <HeroLine stage={stage} mountClass="hero-rise-1">
            기술의 작동 원리부터
          </HeroLine>
          <HeroLine stage={stage} mountClass="hero-rise-2">
            왜 필요한지까지,
          </HeroLine>
          <HeroLine stage={stage} mountClass="hero-rise-3">
            <span className="font-extrabold tracking-wide">쉽게 이해</span>
            할 수 있도록.
          </HeroLine>
        </h1>

        <div
          className={cn(
            'hero-rise-3 mt-14 flex items-center justify-center gap-5 transition-all duration-500 ease-out',
            stage === 0 && 'opacity-90',
            stage === 1 && 'scale-[0.96] opacity-25',
            stage === 2 && 'scale-[1.04] opacity-100',
            stage > 2 && 'opacity-100',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'h-px origin-right bg-white/60 transition-all duration-700 ease-out',
              stage === 2 ? 'w-20 opacity-80' : 'w-14 opacity-25',
            )}
          />
          <span
            className={cn(
              'text-[length:var(--text-h1)] font-extrabold tracking-[var(--tracking-display)] transition-colors duration-500',
              stage === 2 ? 'text-white' : 'text-white/80',
            )}
          >
            DEEP
          </span>
          <span
            aria-hidden="true"
            className={cn(
              'h-px origin-left bg-white/60 transition-all duration-700 ease-out',
              stage === 2 ? 'w-20 opacity-80' : 'w-14 opacity-25',
            )}
          />
        </div>
      </div>

      <div className="hero-fade-2 absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-white/55">
        <span className="text-[length:var(--text-caption)] font-medium uppercase tracking-[var(--tracking-widest)]">
          {stage === 0 && 'Tap or scroll'}
          {stage >= 1 && stage <= STAGE_TOTAL && `${stage} / ${STAGE_TOTAL}`}
          {stage > STAGE_TOTAL && 'Enter'}
        </span>
        <div
          aria-hidden="true"
          className="flex h-9 w-[22px] items-start justify-center rounded-full border border-white/25 pt-1.5"
        >
          <span className="hero-scroll-hint block h-1.5 w-[2px] rounded-full bg-white/80" />
        </div>
        <ChevronDown className="hero-chevron h-3 w-3" aria-hidden="true" />
      </div>
    </div>
  )
}

interface HeroLineProps {
  stage: Stage
  mountClass: string
  children: React.ReactNode
}

function HeroLine({ stage, mountClass, children }: HeroLineProps) {
  // All three lines share a single "active" stage (stage 1) so the intro
  // stays at two content beats: stage 1 emphasizes the lines, stage 2
  // emphasizes DEEP. Passing stage 2 starts dismissal.
  const isActive = stage === 1
  const isInitial = stage === 0
  const isPassed = stage > 1

  return (
    <span
      className={cn(
        mountClass,
        'block transition-all duration-500 ease-out',
        isActive && 'text-white',
        isInitial && 'text-white/85',
        !isActive && !isInitial && (isPassed ? 'text-white/25' : 'text-white/20'),
      )}
    >
      <span className="relative inline-block">
        {children}
        <span
          aria-hidden="true"
          className={cn(
            'absolute -bottom-1 left-0 right-0 h-[2px] origin-left bg-white/85 transition-transform duration-700 ease-out',
            isActive ? 'scale-x-100' : 'scale-x-0',
          )}
        />
      </span>
    </span>
  )
}
