'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses } from './common/colors'

interface NeuralNetTrainingProps {
  description?: string
}

interface TrainingSnapshot {
  epoch: number
  weight: number
  loss: number
  predictions: number[]
  note: string
}

const TRUE_SLOPE = 1.8
const NUM_POINTS = 7
const TARGETS = Array.from({ length: NUM_POINTS }, (_, i) => TRUE_SLOPE * (i + 1))
const XS = Array.from({ length: NUM_POINTS }, (_, i) => i + 1)

function computeSnapshots(): TrainingSnapshot[] {
  const snapshots: TrainingSnapshot[] = []
  let weight = 0.2
  const lr = 0.04
  const totalEpochs = 12

  for (let epoch = 0; epoch <= totalEpochs; epoch++) {
    const predictions = XS.map((x) => weight * x)
    const loss =
      predictions.reduce((sum, p, i) => sum + (p - TARGETS[i]) ** 2, 0) / NUM_POINTS

    const note =
      epoch === 0
        ? '무작위 초기 가중치. 예측값이 정답과 멀리 떨어져 있어 loss가 큽니다.'
        : epoch === totalEpochs
          ? '학습 완료. 가중치가 수렴해 예측선이 데이터에 맞춰졌습니다.'
          : `Epoch ${epoch}: loss의 기울기를 따라 가중치를 조금씩 조정 (lr=${lr})`

    snapshots.push({
      epoch,
      weight,
      loss,
      predictions: predictions.slice(),
      note,
    })

    if (epoch < totalEpochs) {
      const gradient =
        predictions.reduce((sum, p, i) => sum + (p - TARGETS[i]) * XS[i], 0) /
        NUM_POINTS
      weight = weight - lr * gradient
    }
  }

  return snapshots
}

export function NeuralNetTraining({
  description = '초기 무작위 가중치에서 경사 하강법으로 예측선이 데이터에 맞춰지는 과정입니다.',
}: NeuralNetTrainingProps) {
  const snapshots = useMemo(() => computeSnapshots(), [])
  const controller = useStepController(snapshots.length)
  const current = snapshots[controller.step]
  const maxLoss = snapshots[0].loss
  const lossPct = Math.min(100, (current.loss / maxLoss) * 100)

  const chartWidth = 320
  const chartHeight = 180
  const padX = 30
  const padY = 20
  const xScale = (chartWidth - 2 * padX) / (NUM_POINTS + 1)
  const maxY = Math.max(...TARGETS) * 1.1
  const yScale = (chartHeight - 2 * padY) / maxY

  return (
    <VisualContainer title="신경망 학습 과정" description={description}>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[var(--radius-card)] border border-border bg-muted/20 p-3">
            <div className="mb-2 text-[11px] text-muted-foreground">
              예측선 vs 실제 데이터
            </div>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="h-40 w-full"
              aria-label="예측선과 실제 데이터 비교"
            >
              <line
                x1={padX}
                y1={chartHeight - padY}
                x2={chartWidth - padX}
                y2={chartHeight - padY}
                stroke="currentColor"
                strokeOpacity={0.2}
              />
              <line
                x1={padX}
                y1={padY}
                x2={padX}
                y2={chartHeight - padY}
                stroke="currentColor"
                strokeOpacity={0.2}
              />
              {TARGETS.map((t, i) => {
                const cx = padX + (i + 1) * xScale
                const cy = chartHeight - padY - t * yScale
                return (
                  <circle
                    key={`target-${i}`}
                    cx={cx}
                    cy={cy}
                    r={4}
                    className="fill-viz-confirmed-bg stroke-viz-confirmed"
                    strokeWidth={2}
                  />
                )
              })}
              <line
                x1={padX + xScale}
                y1={chartHeight - padY - current.predictions[0] * yScale}
                x2={padX + NUM_POINTS * xScale}
                y2={chartHeight - padY - current.predictions[NUM_POINTS - 1] * yScale}
                className="stroke-viz-comparing"
                strokeWidth={2.5}
              />
              {current.predictions.map((p, i) => {
                const cx = padX + (i + 1) * xScale
                const cy = chartHeight - padY - p * yScale
                return (
                  <circle
                    key={`pred-${i}`}
                    cx={cx}
                    cy={cy}
                    r={3}
                    className="fill-viz-comparing-bg stroke-viz-comparing"
                    strokeWidth={1.5}
                  />
                )
              })}
            </svg>
          </div>

          <div className="rounded-[var(--radius-card)] border border-border bg-muted/20 p-3">
            <div className="mb-2 text-[11px] text-muted-foreground">상태</div>
            <dl className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Epoch</dt>
                <dd className="font-semibold tabular-nums">
                  {current.epoch} / {snapshots.length - 1}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">가중치 w</dt>
                <dd className="font-semibold tabular-nums">
                  {current.weight.toFixed(3)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">목표 w</dt>
                <dd className="font-semibold tabular-nums text-muted-foreground">
                  {TRUE_SLOPE.toFixed(3)}
                </dd>
              </div>
              <div>
                <div className="mb-1 flex justify-between">
                  <dt className="text-muted-foreground">Loss</dt>
                  <dd className="font-semibold tabular-nums">
                    {current.loss.toFixed(3)}
                  </dd>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full transition-[width] duration-300',
                      vizStateClasses('blocked'),
                    )}
                    style={{ width: `${lossPct}%` }}
                  />
                </div>
              </div>
            </dl>
          </div>
        </div>

        <StepController {...controller} stepDescription={current.note} />

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <LegendDot
            stateClass="bg-viz-confirmed-bg border-viz-confirmed"
            label="실제 데이터"
          />
          <LegendDot
            stateClass="bg-viz-comparing-bg border-viz-comparing"
            label="예측선"
          />
        </div>
      </div>
    </VisualContainer>
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
