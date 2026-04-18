'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { vizStateClasses } from './common/colors'

interface PERBetaSliderProps {
  description?: string
}

const NUM_REQUESTS = 400
const DELTA = 1
const BUCKETS = 24
const TIME_SPAN = 3 * DELTA
const SEED = 0x9e3779b9

interface SimResult {
  triggers: number[]
  histogram: number[]
  totalTriggered: number
  avgTriggerOffset: number
  effectiveRatio: number
  preExpirationRatio: number
}

function pseudoRandom(state: number): { value: number; nextState: number } {
  const next = (Math.imul(state, 1664525) + 1013904223) >>> 0
  const value = next / 0x100000000
  return { value: value === 0 ? 0.0001 : value, nextState: next }
}

function simulate(beta: number): SimResult {
  let s = SEED
  const triggers: number[] = []
  const histogram = new Array(BUCKETS).fill(0)

  for (let i = 0; i < NUM_REQUESTS; i++) {
    const r1 = pseudoRandom(s)
    s = r1.nextState
    const r2 = pseudoRandom(s)
    s = r2.nextState

    const getOffset = -2 * DELTA * r1.value
    const xfetchOffset = -DELTA * beta * Math.log(r2.value)
    const triggered = getOffset + xfetchOffset >= 0

    if (triggered) {
      triggers.push(getOffset)
      const bucketIdx = Math.min(
        BUCKETS - 1,
        Math.max(0, Math.floor(((getOffset + 2 * DELTA) / TIME_SPAN) * BUCKETS)),
      )
      histogram[bucketIdx]++
    }
  }

  const totalTriggered = triggers.length
  const avgTriggerOffset =
    totalTriggered === 0
      ? 0
      : triggers.reduce((a, b) => a + b, 0) / totalTriggered
  const preExpiration = triggers.filter((t) => t >= -DELTA && t < 0).length
  const preExpirationRatio = totalTriggered === 0 ? 0 : preExpiration / totalTriggered
  const effectiveRatio = totalTriggered / NUM_REQUESTS

  return {
    triggers,
    histogram,
    totalTriggered,
    avgTriggerOffset,
    effectiveRatio,
    preExpirationRatio,
  }
}

export function PERBetaSlider({
  description = 'XFetch 부등식의 β 파라미터를 조절하면서 만료 전 트리거 시점 분포가 어떻게 변하는지 확인하세요. β가 클수록 더 일찍 갱신을 시작합니다.',
}: PERBetaSliderProps) {
  const [beta, setBeta] = useState(1)
  const sim = useMemo(() => simulate(beta), [beta])
  const maxBucket = Math.max(...sim.histogram, 1)

  return (
    <VisualContainer title="PER β 파라미터에 따른 트리거 시점 분포" description={description}>
      <div className="space-y-4">
        <div className="rounded-[var(--radius-card)] border border-border bg-muted/20 p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              htmlFor="beta-slider"
              className="text-[length:var(--text-meta)] font-semibold text-foreground"
            >
              β = <span className="tabular-nums">{beta.toFixed(2)}</span>
            </label>
            <span className="text-[10px] text-muted-foreground">
              0.5 (보수적) – 3.0 (공격적)
            </span>
          </div>
          <input
            id="beta-slider"
            type="range"
            min={0.5}
            max={3.0}
            step={0.1}
            value={beta}
            onChange={(e) => setBeta(parseFloat(e.target.value))}
            className="w-full accent-primary"
            aria-label="β 파라미터 슬라이더"
          />
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>0.5</span>
            <span>1.0 (기본)</span>
            <span>2.0</span>
            <span>3.0</span>
          </div>
        </div>

        <div className="rounded-[var(--radius-card)] border border-border bg-background p-3">
          <p className="mb-2 text-[length:var(--text-meta)] font-semibold text-foreground">
            트리거 시점 히스토그램 ({NUM_REQUESTS}개 가상 요청 시뮬레이션)
          </p>
          <div className="flex h-32 items-end gap-[2px]">
            {sim.histogram.map((count, idx) => {
              const time = -2 * DELTA + (idx / BUCKETS) * TIME_SPAN
              const isPostExpiration = time >= 0
              const heightPct = (count / maxBucket) * 100
              return (
                <div
                  key={idx}
                  className={cn(
                    'flex-1 rounded-t-[2px] border-t-2 transition-all',
                    isPostExpiration
                      ? vizStateClasses('blocked')
                      : vizStateClasses('highlight'),
                  )}
                  style={{ height: `${Math.max(heightPct, count > 0 ? 4 : 0)}%` }}
                  aria-label={`Bucket ${idx}: ${count} triggers`}
                />
              )
            })}
          </div>
          <div className="mt-1 grid grid-cols-4 text-[10px] text-muted-foreground">
            <span>−2δ</span>
            <span className="text-center">−δ</span>
            <span className="text-center font-semibold text-foreground">만료 (0)</span>
            <span className="text-right">+δ</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat
            label="트리거 수"
            value={`${sim.totalTriggered}/${NUM_REQUESTS}`}
            subtitle={`${(sim.effectiveRatio * 100).toFixed(1)}%`}
          />
          <Stat
            label="평균 트리거 시점"
            value={`${sim.avgTriggerOffset.toFixed(2)}δ`}
            subtitle="만료 전"
          />
          <Stat
            label="만료 전 1δ 안"
            value={`${(sim.preExpirationRatio * 100).toFixed(0)}%`}
            subtitle="유효 갱신 비율"
          />
          <Stat
            label="이론값 평균"
            value={`${(-beta * DELTA).toFixed(2)}δ`}
            subtitle="−β·δ"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
        <LegendDot stateClass={vizStateClasses('highlight')} label="만료 전 트리거 (유효)" />
        <LegendDot stateClass={vizStateClasses('blocked')} label="만료 후 트리거 (이상치)" />
      </div>
    </VisualContainer>
  )
}

function Stat({
  label,
  value,
  subtitle,
}: {
  label: string
  value: string
  subtitle: string
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-background p-2 text-center">
      <p className="text-[10px] uppercase tracking-[var(--tracking-wide)] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-[length:var(--text-h4)] font-bold tabular-nums text-foreground">
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground">{subtitle}</p>
    </div>
  )
}

function LegendDot({ stateClass, label }: { stateClass: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn('inline-block h-3 w-3 rounded-sm border-2', stateClass)}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}
