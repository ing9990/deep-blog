// components/visualizations/common/StepController.tsx
'use client'

import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SpeedSlider } from './SpeedSlider'
import type { StepControllerState } from './useStepController'

export interface StepControllerProps extends StepControllerState {
  /** Optional single-line note for the current step (rendered above controls). */
  stepDescription?: string
  /** Whether to render the SpeedSlider. Default true. Auto-hidden when reducedMotion. */
  showSpeedSlider?: boolean
  /** Whether to render the clickable progress bar. Default true. */
  showProgressBar?: boolean
  className?: string
}

export function StepController({
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
  toggle,
  reset,
  setSpeed,
  goTo,
  stepDescription,
  showSpeedSlider = true,
  showProgressBar = true,
  className,
}: StepControllerProps) {
  const lastStep = totalSteps - 1
  const showSlider = showSpeedSlider && !reducedMotion
  const showBar = showProgressBar && totalSteps > 1

  return (
    <div className={cn('mt-4 space-y-3', className)}>
      {stepDescription && (
        <div className="rounded-[10px] border border-border bg-muted/30 p-3 text-[13px] leading-relaxed text-foreground">
          <span className="font-semibold">
            Step {step} / {lastStep}:
          </span>{' '}
          {stepDescription}
        </div>
      )}

      {showBar && (
        <ProgressBar
          progress={progress}
          step={step}
          totalSteps={totalSteps}
          onJump={goTo}
        />
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <ControlButton
            onClick={reset}
            disabled={step === 0 && !isPlaying}
            ariaLabel="처음으로 리셋"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </ControlButton>
          <ControlButton onClick={prev} disabled={!canPrev} ariaLabel="이전 단계">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </ControlButton>
          <ControlButton
            onClick={toggle}
            disabled={!canNext || reducedMotion}
            ariaLabel={isPlaying ? '일시정지' : '자동 재생'}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4" aria-hidden="true" />
            )}
          </ControlButton>
          <ControlButton onClick={next} disabled={!canNext} ariaLabel="다음 단계">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </ControlButton>
        </div>
        {showSlider && <SpeedSlider speed={speed} onChange={setSpeed} />}
      </div>
    </div>
  )
}

interface ControlButtonProps {
  onClick: () => void
  disabled?: boolean
  ariaLabel: string
  children: ReactNode
}

function ControlButton({ onClick, disabled, ariaLabel, children }: ControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}

interface ProgressBarProps {
  progress: number
  step: number
  totalSteps: number
  onJump: (step: number) => void
}

function ProgressBar({ progress, step, totalSteps, onJump }: ProgressBarProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    onJump(Math.round(ratio * (totalSteps - 1)))
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group relative block h-2 w-full overflow-hidden rounded-full bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={0}
      aria-valuemax={totalSteps - 1}
      aria-label="진행 상황 — 클릭해서 점프"
    >
      <span
        className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-300"
        style={{ width: `${progress * 100}%` }}
        aria-hidden="true"
      />
    </button>
  )
}
