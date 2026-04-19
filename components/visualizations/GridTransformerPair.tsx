'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'

const N = 8
const SELF = { i: 3, j: 5 }

type Mode = 'row' | 'column'

function cellActivity(
  mode: Mode,
  selected: { i: number; j: number },
  cell: { i: number; j: number },
): 'selected' | 'attending' | 'dim' {
  if (cell.i === selected.i && cell.j === selected.j) return 'selected'
  if (mode === 'row' && cell.i === selected.i) return 'attending'
  if (mode === 'column' && cell.j === selected.j) return 'attending'
  return 'dim'
}

export function GridTransformerPair() {
  const [selected, setSelected] = useState(SELF)
  const [mode, setMode] = useState<Mode>('row')

  const cells = useMemo(() => {
    const arr: { i: number; j: number }[] = []
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        arr.push({ i, j })
      }
    }
    return arr
  }, [])

  const complexity = useMemo(() => {
    const full = N * N * N * N
    const perDir = N * N * N
    return { full, perDir, reduction: (full / perDir).toFixed(0) }
  }, [])

  const distance = useMemo(() => {
    const di = selected.i - selected.j
    return Math.abs(di)
  }, [selected])

  return (
    <VisualContainer
      title="Grid Transformer: Pair embedding 격자에 row/column attention 교대"
      description="N×N pair embedding 격자에서 한 칸을 선택하면, row-wise 또는 column-wise attention이 참조하는 영역이 표시됩니다."
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="text-muted-foreground">Attention 방향:</span>
          <div className="inline-flex rounded-[var(--radius-card)] border border-border">
            <button
              type="button"
              onClick={() => setMode('row')}
              className={cn(
                'px-3 py-1.5 font-medium transition-colors',
                mode === 'row'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              Row-wise (같은 행)
            </button>
            <button
              type="button"
              onClick={() => setMode('column')}
              className={cn(
                'border-l border-border px-3 py-1.5 font-medium transition-colors',
                mode === 'column'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              Column-wise (같은 열)
            </button>
          </div>
          <span className="ml-auto text-muted-foreground">
            선택: (i={selected.i}, j={selected.j})
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-[auto,1fr]">
          <div className="rounded-[var(--radius-card)] border border-border bg-muted/20 p-3">
            <div className="mb-2 flex items-baseline gap-2 text-[11px]">
              <span className="text-muted-foreground">j →</span>
            </div>
            <div
              className="grid gap-0.5"
              style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }}
            >
              {cells.map((cell) => {
                const activity = cellActivity(mode, selected, cell)
                return (
                  <button
                    key={`${cell.i}-${cell.j}`}
                    type="button"
                    onClick={() => setSelected(cell)}
                    aria-label={`pair (${cell.i}, ${cell.j})`}
                    className={cn(
                      'aspect-square rounded-[3px] border text-[9px] font-semibold transition-all duration-200',
                      activity === 'selected' &&
                        'border-viz-pivot bg-viz-pivot-bg text-viz-pivot-fg ring-2 ring-viz-pivot',
                      activity === 'attending' &&
                        'border-viz-comparing bg-viz-comparing-bg text-viz-comparing-fg',
                      activity === 'dim' && 'border-border bg-background opacity-40',
                    )}
                  >
                    {activity === 'selected' ? '★' : ''}
                  </button>
                )
              })}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              <span>(0, 0)</span>
              <span>i ↓</span>
              <span>
                ({N - 1}, {N - 1})
              </span>
            </div>
          </div>

          <div className="space-y-2 text-[11px]">
            <div className="rounded-[var(--radius-card)] border border-border bg-muted/30 p-3">
              <div className="mb-1.5 text-[11px] font-semibold text-foreground">
                선택된 쌍 (i={selected.i}, j={selected.j})
              </div>
              <p className="leading-relaxed text-muted-foreground">
                이 벡터는 아미노산 {selected.i} 번과 {selected.j} 번 사이의{' '}
                <span className="font-semibold text-foreground">관계 정보</span>를 담습니다.
                학습이 끝나면 이 벡터에서 두 아미노산의 3D 거리와 접촉 확률이 디코딩됩니다.
                현재 서열상 거리 = <span className="tabular-nums">{distance}</span>.
              </p>
            </div>

            <div className="rounded-[var(--radius-card)] border border-border bg-muted/30 p-3">
              <div className="mb-1.5 font-semibold text-foreground">
                {mode === 'row' ? 'Row-wise attention' : 'Column-wise attention'}
              </div>
              <p className="leading-relaxed text-muted-foreground">
                {mode === 'row'
                  ? `같은 행 (i=${selected.i}) 의 ${N}개 칸만 서로 attention을 계산합니다. 아미노산 ${selected.i} 번이 다른 j 위치들과 어떤 관계인지 파악.`
                  : `같은 열 (j=${selected.j}) 의 ${N}개 칸만 서로 attention을 계산합니다. 아미노산 ${selected.j} 번에 접촉하는 파트너들 사이의 관계 파악.`}
              </p>
            </div>

            <div className="rounded-[var(--radius-card)] border border-border bg-muted/30 p-3">
              <div className="mb-1.5 font-semibold text-foreground">계산량 비교</div>
              <dl className="space-y-1 leading-relaxed text-muted-foreground">
                <div className="flex justify-between">
                  <dt>모든 쌍이 모든 쌍과 (N⁴)</dt>
                  <dd className="tabular-nums">{complexity.full.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Row 또는 Column 한 방향 (N³)</dt>
                  <dd className="tabular-nums">{complexity.perDir.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between font-semibold text-foreground">
                  <dt>감소 비율</dt>
                  <dd className="tabular-nums">× {complexity.reduction}</dd>
                </div>
              </dl>
              <p className="mt-2 text-[10px] italic text-muted-foreground">
                N=8 기준. 실제 단백질 길이 (N=500~2000) 에서는 훨씬 큰 차이.
              </p>
            </div>
          </div>
        </div>
      </div>
    </VisualContainer>
  )
}
