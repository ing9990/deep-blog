'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { vizStateClasses } from './common/colors'

const SEQUENCE = ['M', 'K', 'T', 'A', 'Y', 'I', 'A', 'K'] as const
const LAYER_PATTERNS: number[][] = [
  [0, 0.85, 0.7, 0.25, 0.2, 0.15, 0.15, 0.1],
  [0.15, 0, 0.85, 0.35, 0.25, 0.2, 0.15, 0.1],
  [0.1, 0.2, 0, 0.8, 0.35, 0.2, 0.15, 0.1],
  [0.05, 0.1, 0.2, 0, 0.7, 0.3, 0.2, 0.15],
  [0.1, 0.15, 0.2, 0.3, 0, 0.75, 0.35, 0.25],
  [0.05, 0.15, 0.2, 0.25, 0.7, 0, 0.65, 0.35],
  [0.1, 0.1, 0.15, 0.25, 0.35, 0.55, 0, 0.75],
  [0.8, 0.2, 0.15, 0.2, 0.25, 0.3, 0.6, 0],
]

const LAYER_PATTERNS_DEEP: number[][] = [
  [0, 0.25, 0.15, 0.35, 0.2, 0.15, 0.25, 0.75],
  [0.2, 0, 0.3, 0.25, 0.2, 0.3, 0.15, 0.65],
  [0.25, 0.3, 0, 0.35, 0.6, 0.25, 0.2, 0.4],
  [0.3, 0.25, 0.35, 0, 0.7, 0.3, 0.25, 0.45],
  [0.2, 0.2, 0.6, 0.7, 0, 0.4, 0.3, 0.25],
  [0.2, 0.3, 0.25, 0.3, 0.4, 0, 0.7, 0.35],
  [0.3, 0.2, 0.25, 0.3, 0.35, 0.7, 0, 0.4],
  [0.7, 0.6, 0.35, 0.4, 0.25, 0.35, 0.4, 0],
]

export function SelfAttentionFlow() {
  const [selected, setSelected] = useState(4)
  const [layerMode, setLayerMode] = useState<'early' | 'deep'>('early')

  const attentionWeights = useMemo(() => {
    const raw = layerMode === 'early' ? LAYER_PATTERNS : LAYER_PATTERNS_DEEP
    const row = raw[selected]
    const sum = row.reduce((a, b) => a + b, 0) || 1
    return row.map((w) => w / sum)
  }, [selected, layerMode])

  const svgW = 420
  const svgH = 180
  const padX = 30
  const slotWidth = (svgW - 2 * padX) / SEQUENCE.length
  const rowY = svgH - 40

  return (
    <VisualContainer
      title="Self-attention: 각 위치가 다른 위치에 주목하는 구조"
      description="사각형을 클릭하면 그 위치의 Query가 다른 위치들의 Key에 부여하는 attention 가중치가 아치로 표시됩니다."
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-muted-foreground">Transformer 층 깊이:</span>
          <div className="inline-flex rounded-[var(--radius-card)] border border-border">
            <button
              type="button"
              onClick={() => setLayerMode('early')}
              className={cn(
                'px-3 py-1.5 text-[11px] font-medium transition-colors',
                layerMode === 'early'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              초기 층 (가까운 이웃)
            </button>
            <button
              type="button"
              onClick={() => setLayerMode('deep')}
              className={cn(
                'px-3 py-1.5 text-[11px] font-medium transition-colors border-l border-border',
                layerMode === 'deep'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              깊은 층 (장거리 관계)
            </button>
          </div>
        </div>

        <div className="rounded-[var(--radius-card)] border border-border bg-muted/20 p-3">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="h-44 w-full"
            aria-label="self-attention 가중치 시각화"
          >
            {attentionWeights.map((w, targetIdx) => {
              if (targetIdx === selected || w < 0.02) return null
              const fromX = padX + selected * slotWidth + slotWidth / 2
              const toX = padX + targetIdx * slotWidth + slotWidth / 2
              const midX = (fromX + toX) / 2
              const arcHeight = 90 * (Math.abs(selected - targetIdx) / SEQUENCE.length + 0.3)
              const midY = rowY - arcHeight

              const opacity = Math.max(0.15, w * 3)
              const strokeWidth = 0.8 + w * 6

              return (
                <path
                  key={targetIdx}
                  d={`M ${fromX} ${rowY} Q ${midX} ${midY} ${toX} ${rowY}`}
                  fill="none"
                  className="stroke-primary transition-all duration-300"
                  strokeWidth={strokeWidth}
                  strokeOpacity={opacity}
                />
              )
            })}

            {SEQUENCE.map((aa, i) => {
              const x = padX + i * slotWidth + slotWidth / 2
              const isSelected = i === selected
              const weight = attentionWeights[i]
              const isSourceOrTarget = isSelected || weight > 0.1
              return (
                <g
                  key={i}
                  className="cursor-pointer"
                  onClick={() => setSelected(i)}
                >
                  <rect
                    x={x - 18}
                    y={rowY - 14}
                    width={36}
                    height={28}
                    rx={4}
                    className={cn(
                      'transition-all duration-300',
                      isSelected
                        ? 'fill-viz-pivot-bg stroke-viz-pivot'
                        : isSourceOrTarget
                          ? 'fill-viz-comparing-bg stroke-viz-comparing'
                          : 'fill-background stroke-border',
                    )}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                  <text
                    x={x}
                    y={rowY + 5}
                    textAnchor="middle"
                    className={cn(
                      'text-[13px] font-bold',
                      isSelected
                        ? 'fill-viz-pivot-fg'
                        : isSourceOrTarget
                          ? 'fill-viz-comparing-fg'
                          : 'fill-foreground',
                    )}
                  >
                    {aa}
                  </text>
                  <text
                    x={x}
                    y={rowY + 30}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[9px] tabular-nums"
                  >
                    {i}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        <div className="rounded-[var(--radius-card)] border border-border bg-muted/30 p-3">
          <div className="mb-2 text-[11px] text-muted-foreground">
            위치 {selected} ({SEQUENCE[selected]}) 의 attention 분포
          </div>
          <div className="space-y-1">
            {attentionWeights.map((w, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <span className="w-12 text-muted-foreground tabular-nums">
                  → {SEQUENCE[i]} ({i})
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full transition-[width] duration-300',
                      i === selected
                        ? vizStateClasses('pivot')
                        : vizStateClasses('comparing'),
                    )}
                    style={{ width: `${w * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right font-medium tabular-nums">
                  {(w * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            {layerMode === 'early'
              ? '초기 층은 인접한 아미노산에 집중합니다. 지역적 문맥(local context)을 먼저 파악합니다.'
              : '깊은 층은 서열상 멀리 떨어진 위치에도 강하게 주목합니다. 3D에서 접촉할 장거리 쌍을 포착합니다.'}
          </p>
        </div>
      </div>
    </VisualContainer>
  )
}
