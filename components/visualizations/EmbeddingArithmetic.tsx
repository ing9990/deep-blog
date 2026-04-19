'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { vizStateClasses } from './common/colors'

interface Point {
  label: string
  x: number
  y: number
  state: 'pivot' | 'comparing' | 'confirmed' | 'highlight' | 'waiting'
}

const WORDS: Point[] = [
  { label: 'King', x: 0.25, y: 0.72, state: 'comparing' },
  { label: 'Queen', x: 0.42, y: 0.25, state: 'confirmed' },
  { label: 'Man', x: 0.55, y: 0.78, state: 'comparing' },
  { label: 'Woman', x: 0.72, y: 0.31, state: 'confirmed' },
  { label: 'Prince', x: 0.15, y: 0.58, state: 'waiting' },
  { label: 'Princess', x: 0.35, y: 0.14, state: 'waiting' },
]

type OperationStep = 'idle' | 'vKing' | 'minusMan' | 'plusWoman' | 'done'

const KING = WORDS[0]
const QUEEN = WORDS[1]
const MAN = WORDS[2]
const WOMAN = WORDS[3]

const STEP_DESCRIPTIONS: Record<OperationStep, string> = {
  idle: '단어 6개가 의미에 따라 2D 평면에 배치되어 있습니다. 위쪽은 여성성, 왼쪽은 젊음에 가까운 축입니다.',
  vKing: 'King의 벡터를 시작점으로 삼습니다.',
  minusMan: 'Man 벡터를 빼면 "왕의 지위"만 남습니다 (성별 축에서 남성 성분 제거).',
  plusWoman: 'Woman 벡터를 더하면 여성 성분이 추가됩니다.',
  done: '결과 지점(흰색 원)이 Queen 근처에 도달합니다. 의미 관계가 벡터 산술로 표현된다는 증거입니다.',
}

export function EmbeddingArithmetic() {
  const [step, setStep] = useState<OperationStep>('idle')
  const svgW = 360
  const svgH = 220

  const toPx = (p: { x: number; y: number }) => ({
    x: 20 + p.x * (svgW - 40),
    y: 20 + p.y * (svgH - 40),
  })

  const result = useMemo(() => {
    return {
      x: KING.x - MAN.x + WOMAN.x,
      y: KING.y - MAN.y + WOMAN.y,
    }
  }, [])

  const stepOrder: OperationStep[] = ['idle', 'vKing', 'minusMan', 'plusWoman', 'done']
  const currentIdx = stepOrder.indexOf(step)

  const goNext = () => {
    if (currentIdx < stepOrder.length - 1) {
      setStep(stepOrder[currentIdx + 1])
    }
  }
  const goPrev = () => {
    if (currentIdx > 0) {
      setStep(stepOrder[currentIdx - 1])
    }
  }
  const reset = () => setStep('idle')

  const showKing = currentIdx >= 1
  const showMinusMan = currentIdx >= 2
  const showPlusWoman = currentIdx >= 3
  const showResult = currentIdx >= 4

  const kingPx = toPx(KING)
  const manPx = toPx(MAN)
  const womanPx = toPx(WOMAN)
  const resultPx = toPx(result)
  const afterMinusMan = {
    x: kingPx.x - (manPx.x - toPx({ x: 0, y: 0 }).x) + 20,
    y: kingPx.y - (manPx.y - toPx({ x: 0, y: 0 }).y) + 20,
  }

  return (
    <VisualContainer
      title="Embedding 벡터 산술: King - Man + Woman ≈ Queen"
      description="단어의 의미가 벡터 공간 좌표로 표현되고, 의미 관계가 벡터 연산으로 드러나는 예입니다."
    >
      <div className="space-y-3">
        <div className="rounded-[var(--radius-card)] border border-border bg-muted/20 p-3">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="h-56 w-full"
            aria-label="단어 embedding 벡터 공간"
          >
            <g stroke="currentColor" strokeOpacity={0.12} strokeWidth={1}>
              {Array.from({ length: 5 }, (_, i) => (
                <line
                  key={`h-${i}`}
                  x1={20}
                  y1={20 + (i * (svgH - 40)) / 4}
                  x2={svgW - 20}
                  y2={20 + (i * (svgH - 40)) / 4}
                />
              ))}
              {Array.from({ length: 5 }, (_, i) => (
                <line
                  key={`v-${i}`}
                  x1={20 + (i * (svgW - 40)) / 4}
                  y1={20}
                  x2={20 + (i * (svgW - 40)) / 4}
                  y2={svgH - 20}
                />
              ))}
            </g>

            {showKing && (
              <line
                x1={kingPx.x}
                y1={kingPx.y}
                x2={afterMinusMan.x}
                y2={afterMinusMan.y}
                className={showMinusMan ? 'stroke-viz-blocked' : 'stroke-viz-comparing'}
                strokeWidth={2}
                strokeDasharray="5,3"
                opacity={showMinusMan ? 1 : 0.4}
              />
            )}
            {showPlusWoman && (
              <line
                x1={afterMinusMan.x}
                y1={afterMinusMan.y}
                x2={resultPx.x}
                y2={resultPx.y}
                className="stroke-viz-confirmed"
                strokeWidth={2}
                strokeDasharray="5,3"
              />
            )}

            {WORDS.map((w) => {
              const p = toPx(w)
              return (
                <g key={w.label}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={6}
                    className={cn(
                      'transition-all duration-300',
                      w.label === 'King' && showKing && 'opacity-100',
                      w.label === 'Queen' && showResult && 'opacity-100',
                      vizStateClasses(w.state).split(' ')[0],
                      vizStateClasses(w.state).split(' ')[1],
                    )}
                  />
                  <text
                    x={p.x + 10}
                    y={p.y + 4}
                    className="fill-foreground text-[11px] font-semibold"
                  >
                    {w.label}
                  </text>
                </g>
              )
            })}

            {showResult && (
              <g>
                <circle
                  cx={resultPx.x}
                  cy={resultPx.y}
                  r={8}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeDasharray="3,2"
                />
                <text
                  x={resultPx.x + 12}
                  y={resultPx.y - 8}
                  className="fill-foreground text-[10px] font-medium italic"
                >
                  결과
                </text>
              </g>
            )}
          </svg>
        </div>

        <div className="rounded-[var(--radius-card)] border border-border bg-muted/30 p-3 text-[length:var(--text-meta)] leading-relaxed">
          <span className="font-semibold">Step {currentIdx} / {stepOrder.length - 1}:</span>{' '}
          {STEP_DESCRIPTIONS[step]}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-9 items-center justify-center rounded-[var(--radius-card)] border border-border px-3 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              리셋
            </button>
            <button
              type="button"
              onClick={goPrev}
              disabled={currentIdx === 0}
              className="inline-flex h-9 items-center justify-center rounded-[var(--radius-card)] border border-border px-3 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
            >
              ← 이전
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={currentIdx === stepOrder.length - 1}
              className="inline-flex h-9 items-center justify-center rounded-[var(--radius-card)] border border-border px-3 text-[11px] font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              다음 →
            </button>
          </div>
          <span className="text-[11px] text-muted-foreground">
            v(King) - v(Man) + v(Woman) ≈ v(Queen)
          </span>
        </div>
      </div>
    </VisualContainer>
  )
}
