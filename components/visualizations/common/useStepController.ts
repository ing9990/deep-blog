// components/visualizations/common/useStepController.ts
import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseStepControllerOptions {
  /** Initial playback speed level, 1 (slowest) to 5 (fastest). Default 3. */
  initialSpeed?: number
  /** Whether auto-play should start immediately. Default false. Ignored if reducedMotion is true. */
  initialPlaying?: boolean
}

export interface StepControllerState {
  readonly step: number
  readonly totalSteps: number
  readonly isPlaying: boolean
  readonly speed: number
  readonly canPrev: boolean
  readonly canNext: boolean
  readonly progress: number
  readonly reducedMotion: boolean

  prev: () => void
  next: () => void
  play: () => void
  pause: () => void
  toggle: () => void
  reset: () => void
  setSpeed: (speed: number) => void
  goTo: (step: number) => void
}

const SPEED_MAP: Record<number, number> = {
  1: 1600,
  2: 1200,
  3: 800,
  4: 600,
  5: 400,
}

function clampSpeed(speed: number): number {
  return Math.max(1, Math.min(5, Math.round(speed)))
}

function speedToMs(speed: number): number {
  return SPEED_MAP[clampSpeed(speed)]
}

export function useStepController(
  totalSteps: number,
  options: UseStepControllerOptions = {},
): StepControllerState {
  const { initialSpeed = 3, initialPlaying = false } = options

  const [step, setStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(initialPlaying)
  const [speed, setSpeedState] = useState(() => clampSpeed(initialSpeed))
  const [reducedMotion, setReducedMotion] = useState(false)

  // Reset step/play when totalSteps changes (e.g., parent passed new data).
  useEffect(() => {
    setStep(0)
    setIsPlaying(false)
  }, [totalSteps])

  // Detect prefers-reduced-motion and subscribe to changes.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = (): void => setReducedMotion(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  // If reducedMotion becomes true while playing, force-pause.
  useEffect(() => {
    if (reducedMotion && isPlaying) {
      setIsPlaying(false)
    }
  }, [reducedMotion, isPlaying])

  // Auto-play timer.
  useEffect(() => {
    if (!isPlaying) return
    if (reducedMotion) return
    if (step >= totalSteps - 1) {
      setIsPlaying(false)
      return
    }
    const handle = setTimeout(() => {
      setStep((s) => Math.min(totalSteps - 1, s + 1))
    }, speedToMs(speed))
    return () => clearTimeout(handle)
  }, [isPlaying, step, speed, totalSteps, reducedMotion])

  const stepRef = useRef(step)
  useEffect(() => {
    stepRef.current = step
  }, [step])

  const prev = useCallback((): void => {
    setStep((s) => (s > 0 ? s - 1 : s))
  }, [])

  const next = useCallback((): void => {
    setStep((s) => (s < totalSteps - 1 ? s + 1 : s))
  }, [totalSteps])

  const play = useCallback((): void => {
    if (reducedMotion) return
    if (stepRef.current >= totalSteps - 1) return
    setIsPlaying(true)
  }, [reducedMotion, totalSteps])

  const pause = useCallback((): void => {
    setIsPlaying(false)
  }, [])

  const toggle = useCallback((): void => {
    if (isPlaying) {
      setIsPlaying(false)
    } else {
      play()
    }
  }, [isPlaying, play])

  const reset = useCallback((): void => {
    setStep(0)
    setIsPlaying(false)
  }, [])

  const setSpeed = useCallback((s: number): void => {
    setSpeedState(clampSpeed(s))
  }, [])

  const goTo = useCallback(
    (n: number): void => {
      const clamped = Math.max(0, Math.min(totalSteps - 1, Math.round(n)))
      setStep(clamped)
      setIsPlaying(false)
    },
    [totalSteps],
  )

  const canPrev = step > 0
  const canNext = step < totalSteps - 1
  const progress = totalSteps > 1 ? step / (totalSteps - 1) : 0

  return {
    step,
    totalSteps,
    isPlaying,
    speed,
    canPrev,
    canNext,
    progress,
    reducedMotion,
    prev,
    next,
    play,
    pause,
    toggle,
    reset,
    setSpeed,
    goTo,
  }
}
