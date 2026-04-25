'use client'

import { useMemo, useRef, useState } from 'react'
import { VisualContainer } from './common/VisualContainer'
import { cn } from '@/lib/utils'

type Label = 'A' | 'B'

interface Point {
  x: number
  y: number
  label: Label
}

const POINTS: Point[] = [
  { x: 16, y: 22, label: 'A' },
  { x: 22, y: 16, label: 'A' },
  { x: 12, y: 32, label: 'A' },
  { x: 24, y: 28, label: 'A' },
  { x: 30, y: 20, label: 'A' },
  { x: 18, y: 42, label: 'A' },
  { x: 32, y: 36, label: 'A' },
  { x: 38, y: 24, label: 'A' },
  { x: 42, y: 44, label: 'A' },
  { x: 50, y: 36, label: 'A' },
  { x: 26, y: 52, label: 'A' },
  { x: 56, y: 28, label: 'A' },

  { x: 84, y: 78, label: 'B' },
  { x: 78, y: 84, label: 'B' },
  { x: 88, y: 70, label: 'B' },
  { x: 76, y: 72, label: 'B' },
  { x: 70, y: 80, label: 'B' },
  { x: 82, y: 64, label: 'B' },
  { x: 66, y: 88, label: 'B' },
  { x: 60, y: 74, label: 'B' },
  { x: 56, y: 84, label: 'B' },
  { x: 72, y: 60, label: 'B' },
  { x: 50, y: 70, label: 'B' },
  { x: 64, y: 56, label: 'B' },
]

const K_OPTIONS = [1, 3, 5, 7] as const
const INITIAL_QUERY = { x: 50, y: 50 }

export function KnnClassifier() {
  const [query, setQuery] = useState(INITIAL_QUERY)
  const [k, setK] = useState<number>(3)
  const svgRef = useRef<SVGSVGElement>(null)

  const ranked = useMemo(() => {
    return POINTS.map((p, i) => ({
      ...p,
      i,
      d: Math.hypot(p.x - query.x, p.y - query.y),
    })).sort((a, b) => a.d - b.d)
  }, [query])

  const top = ranked.slice(0, k)
  const topIdx = new Set(top.map((p) => p.i))
  const votesA = top.filter((p) => p.label === 'A').length
  const votesB = k - votesA
  const decision: Label = votesA >= votesB ? 'A' : 'B'
  const radius = top.length > 0 ? top[top.length - 1].d : 0

  function moveQuery(evt: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg) return
    const pt = svg.createSVGPoint()
    pt.x = evt.clientX
    pt.y = evt.clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return
    const local = pt.matrixTransform(ctm.inverse())
    setQuery({
      x: Math.max(3, Math.min(97, local.x)),
      y: Math.max(3, Math.min(97, local.y)),
    })
  }

  function reset() {
    setQuery(INITIAL_QUERY)
    setK(3)
  }

  return (
    <VisualContainer
      title="kNN 분류 인터랙티브"
      description="공간 어디든 클릭해 새 점의 위치를 옮겨 보세요. 가장 가까운 k개 점이 강조되고, 다수결 결과가 즉시 갱신됩니다."
      onReset={reset}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[length:var(--text-sm)] text-muted-foreground">k 값</span>
          {K_OPTIONS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setK(v)}
              aria-pressed={k === v}
              className={cn(
                'h-8 min-w-10 rounded-[var(--radius-chip)] border px-3 text-[length:var(--text-sm)] transition-colors',
                k === v
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-muted',
              )}
            >
              {v}
            </button>
          ))}
        </div>

        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          onClick={moveQuery}
          className="h-72 w-full cursor-crosshair rounded-[var(--radius-card)] border border-border bg-background sm:h-80"
          role="img"
          aria-label="kNN 분류 산점도. 캔버스를 클릭하면 새 점의 위치가 바뀌고 가장 가까운 k개 점이 강조됩니다."
        >
          <line x1="5" y1="95" x2="95" y2="95" className="stroke-border" strokeWidth="0.25" />
          <line x1="5" y1="5" x2="5" y2="95" className="stroke-border" strokeWidth="0.25" />

          {radius > 0 && (
            <circle
              cx={query.x}
              cy={query.y}
              r={radius}
              className="fill-none stroke-viz-highlight"
              strokeWidth="0.4"
              strokeDasharray="1.6 1.6"
              opacity="0.85"
            />
          )}

          {top.map((p) => (
            <line
              key={`link-${p.i}`}
              x1={query.x}
              y1={query.y}
              x2={p.x}
              y2={p.y}
              className="stroke-viz-highlight"
              strokeWidth="0.25"
              strokeDasharray="0.8 0.8"
              opacity="0.55"
            />
          ))}

          {POINTS.map((p, i) => {
            const isTop = topIdx.has(i)
            const colorClass =
              p.label === 'A'
                ? 'fill-viz-comparing-bg stroke-viz-comparing'
                : 'fill-viz-blocked-bg stroke-viz-blocked'
            return (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={isTop ? 1.8 : 1.3}
                strokeWidth={isTop ? 0.7 : 0.4}
                className={cn(colorClass, !isTop && 'opacity-55')}
              />
            )
          })}

          <circle
            cx={query.x}
            cy={query.y}
            r="2.4"
            className={cn(
              'stroke-foreground',
              decision === 'A' ? 'fill-viz-comparing-bg' : 'fill-viz-blocked-bg',
            )}
            strokeWidth="0.7"
          />
          <circle
            cx={query.x}
            cy={query.y}
            r="0.6"
            className="fill-foreground"
          />
        </svg>

        <div className="flex flex-wrap items-center justify-between gap-3 text-[length:var(--text-sm)]">
          <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
            <LegendDot tone="A" label="클래스 A" />
            <LegendDot tone="B" label="클래스 B" />
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5 rounded-full border border-viz-highlight"
              />
              가까운 k개
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">투표</span>
            <span className="font-mono">
              A {votesA} : B {votesB}
            </span>
            <span aria-hidden className="text-muted-foreground">
              →
            </span>
            <span
              className={cn(
                'rounded-[var(--radius-chip)] border px-2 py-0.5 font-semibold',
                decision === 'A'
                  ? 'border-viz-comparing bg-viz-comparing-bg text-viz-comparing-fg'
                  : 'border-viz-blocked bg-viz-blocked-bg text-viz-blocked-fg',
              )}
            >
              클래스 {decision}
            </span>
          </div>
        </div>
      </div>
    </VisualContainer>
  )
}

function LegendDot({ tone, label }: { tone: Label; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className={cn(
          'inline-block h-2.5 w-2.5 rounded-full border',
          tone === 'A'
            ? 'border-viz-comparing bg-viz-comparing-bg'
            : 'border-viz-blocked bg-viz-blocked-bg',
        )}
      />
      {label}
    </span>
  )
}
