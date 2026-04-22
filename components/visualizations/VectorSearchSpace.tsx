'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'

interface VectorSearchSpaceProps {
  description?: string
}

interface Point {
  id: number
  x: number
  y: number
}

type PointState =
  | 'idle'
  | 'scanning'
  | 'exact-topk'
  | 'ann-hit'
  | 'ann-miss'
  | 'ann-false'

interface Snapshot {
  query: { x: number; y: number }
  pointStates: Record<number, PointState>
  showLinesToAll: boolean
  showAnnLines: boolean
  note: string
  badge: string
  stats?: { label: string; value: string }[]
}

const POINTS: Point[] = [
  { id: 0, x: 60, y: 70 },
  { id: 1, x: 90, y: 50 },
  { id: 2, x: 40, y: 120 },
  { id: 3, x: 120, y: 80 },
  { id: 4, x: 150, y: 60 },
  { id: 5, x: 180, y: 100 },
  { id: 6, x: 210, y: 70 },
  { id: 7, x: 240, y: 120 },
  { id: 8, x: 75, y: 160 },
  { id: 9, x: 110, y: 140 },
  { id: 10, x: 145, y: 110 },
  { id: 11, x: 175, y: 140 },
  { id: 12, x: 205, y: 170 },
  { id: 13, x: 235, y: 150 },
  { id: 14, x: 270, y: 105 },
  { id: 15, x: 300, y: 75 },
  { id: 16, x: 330, y: 110 },
  { id: 17, x: 305, y: 155 },
  { id: 18, x: 270, y: 195 },
  { id: 19, x: 230, y: 210 },
  { id: 20, x: 185, y: 200 },
  { id: 21, x: 130, y: 195 },
  { id: 22, x: 85, y: 215 },
  { id: 23, x: 55, y: 185 },
  { id: 24, x: 345, y: 170 },
  { id: 25, x: 315, y: 215 },
  { id: 26, x: 360, y: 55 },
  { id: 27, x: 155, y: 235 },
  { id: 28, x: 250, y: 55 },
  { id: 29, x: 45, y: 245 },
]

const QUERY = { x: 165, y: 130 }

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function topK(k: number): number[] {
  return POINTS.slice()
    .map((p) => ({ id: p.id, d: dist(p, QUERY) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, k)
    .map((e) => e.id)
}

function buildSnapshots(): Snapshot[] {
  const exactTop3 = topK(3)
  const [best, second, third] = exactTop3

  const scanning: Record<number, PointState> = {}
  POINTS.forEach((p) => (scanning[p.id] = 'scanning'))

  const exact: Record<number, PointState> = {}
  POINTS.forEach((p) => (exact[p.id] = 'idle'))
  exactTop3.forEach((id) => (exact[id] = 'exact-topk'))

  const annCandidateId = 11
  const annResult: Record<number, PointState> = {}
  POINTS.forEach((p) => (annResult[p.id] = 'idle'))
  annResult[best] = 'ann-hit'
  annResult[second] = 'ann-hit'
  annResult[third] = 'ann-miss'
  annResult[annCandidateId] = 'ann-false'

  const idle: Record<number, PointState> = {}
  POINTS.forEach((p) => (idle[p.id] = 'idle'))

  return [
    {
      query: QUERY,
      pointStates: idle,
      showLinesToAll: false,
      showAnnLines: false,
      note: '2D 공간에 30개의 벡터가 있고, 질의 벡터 Q가 중앙에 있습니다. 목표는 Q에 가장 가까운 top-3을 찾는 것입니다.',
      badge: '설정',
      stats: [
        { label: '데이터 벡터 N', value: '30' },
        { label: '차원 D', value: '2' },
        { label: 'top-k', value: '3' },
      ],
    },
    {
      query: QUERY,
      pointStates: scanning,
      showLinesToAll: true,
      showAnnLines: false,
      note: 'Exact kNN은 Q와 모든 벡터 사이 거리를 계산합니다. 30개 점 × 2차원 = 30회 거리 계산이 필요합니다.',
      badge: 'Exact kNN · 전체 스캔',
      stats: [
        { label: '거리 계산 횟수', value: '30' },
        { label: '비용 모델', value: 'O(N·D)' },
      ],
    },
    {
      query: QUERY,
      pointStates: exact,
      showLinesToAll: false,
      showAnnLines: false,
      note: '거리 계산 후 상위 3개가 Q의 정확한 최근접 이웃입니다. recall@3 = 1.00 (완벽).',
      badge: 'Exact 결과',
      stats: [
        { label: 'recall@3', value: '1.00' },
        { label: 'top-3 vs 전체', value: '3 / 30' },
      ],
    },
    {
      query: QUERY,
      pointStates: annResult,
      showLinesToAll: false,
      showAnnLines: true,
      note: 'ANN은 일부 벡터만 검사해 sub-linear 시간에 답을 냅니다. 여기서는 3위 이웃을 놓치고 다른 근접 후보를 포함했습니다.',
      badge: 'ANN 근사 결과',
      stats: [
        { label: '거리 계산 횟수', value: '약 8' },
        { label: 'recall@3', value: '0.67' },
        { label: '속도 개선', value: '~4배' },
      ],
    },
    {
      query: QUERY,
      pointStates: annResult,
      showLinesToAll: false,
      showAnnLines: true,
      note: '이것이 ANN의 근본 거래입니다. exact 정확성을 조금 양보하고 sub-linear 시간을 얻습니다. N이 수백만이면 이 거래가 유일한 실용해입니다.',
      badge: '핵심 거래',
      stats: [
        { label: 'N = 100', value: 'full scan 충분' },
        { label: 'N = 1M', value: 'ANN 필수' },
      ],
    },
  ]
}

const STATE_STYLE: Record<PointState, { fill: string; stroke: string; r: number }> = {
  idle: { fill: 'var(--muted)', stroke: 'var(--border)', r: 5 },
  scanning: { fill: 'var(--viz-comparing-bg)', stroke: 'var(--viz-comparing)', r: 5 },
  'exact-topk': {
    fill: 'var(--viz-confirmed-bg)',
    stroke: 'var(--viz-confirmed)',
    r: 7,
  },
  'ann-hit': {
    fill: 'var(--viz-confirmed-bg)',
    stroke: 'var(--viz-confirmed)',
    r: 7,
  },
  'ann-miss': { fill: 'var(--viz-blocked-bg)', stroke: 'var(--viz-blocked)', r: 7 },
  'ann-false': {
    fill: 'var(--viz-highlight-bg)',
    stroke: 'var(--viz-highlight)',
    r: 7,
  },
}

export function VectorSearchSpace({
  description = '2D 공간에서 exact kNN과 ANN 근사 검색이 어떻게 다른 결과를 내는지 단계별로 확인하세요.',
}: VectorSearchSpaceProps) {
  const snapshots = useMemo(() => buildSnapshots(), [])
  const controller = useStepController(snapshots.length)
  const current = snapshots[controller.step]

  return (
    <VisualContainer title="벡터 공간에서의 kNN과 ANN" description={description}>
      <div className="rounded-[10px] bg-muted/40 p-3">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground">
          {current.badge}
        </div>

        <svg
          viewBox="0 0 400 280"
          className="block h-auto w-full"
          role="img"
          aria-label="Vector search 2D space"
        >
          {current.showLinesToAll &&
            POINTS.map((p) => (
              <line
                key={`scanline-${p.id}`}
                x1={current.query.x}
                y1={current.query.y}
                x2={p.x}
                y2={p.y}
                stroke="var(--viz-comparing)"
                strokeOpacity={0.35}
                strokeWidth={0.8}
                strokeDasharray="2 3"
              />
            ))}

          {current.showAnnLines &&
            POINTS.filter(
              (p) =>
                current.pointStates[p.id] === 'ann-hit' ||
                current.pointStates[p.id] === 'ann-false',
            ).map((p) => (
              <line
                key={`annline-${p.id}`}
                x1={current.query.x}
                y1={current.query.y}
                x2={p.x}
                y2={p.y}
                stroke="var(--viz-highlight)"
                strokeOpacity={0.6}
                strokeWidth={1.2}
                strokeDasharray="4 2"
              />
            ))}

          {POINTS.map((p) => {
            const state = current.pointStates[p.id]
            const style = STATE_STYLE[state]
            return (
              <circle
                key={p.id}
                cx={p.x}
                cy={p.y}
                r={style.r}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={1.5}
                className="transition-all duration-300 motion-reduce:transition-none"
              />
            )
          })}

          <g>
            <circle
              cx={current.query.x}
              cy={current.query.y}
              r={11}
              fill="var(--viz-pivot-bg)"
              stroke="var(--viz-pivot)"
              strokeWidth={2}
            />
            <text
              x={current.query.x}
              y={current.query.y + 4}
              textAnchor="middle"
              fontSize={11}
              fontWeight={700}
              fill="var(--viz-pivot-fg)"
            >
              Q
            </text>
          </g>
        </svg>

        {current.stats && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {current.stats.map((s) => (
              <div
                key={s.label}
                className="rounded-[var(--radius-card)] border border-border bg-background px-3 py-2"
              >
                <div className="text-[11px] text-muted-foreground">{s.label}</div>
                <div className="text-[13px] font-semibold text-foreground">
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <StepController {...controller} stepDescription={current.note} />

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <LegendDot className="bg-viz-pivot-bg border-viz-pivot" label="질의 벡터 Q" />
        <LegendDot
          className="bg-viz-comparing-bg border-viz-comparing"
          label="거리 계산 중"
        />
        <LegendDot
          className="bg-viz-confirmed-bg border-viz-confirmed"
          label="정답 top-k / ANN 정답"
        />
        <LegendDot
          className="bg-viz-blocked-bg border-viz-blocked"
          label="ANN 놓친 정답"
        />
        <LegendDot
          className="bg-viz-highlight-bg border-viz-highlight"
          label="ANN 근사 대체"
        />
      </div>
    </VisualContainer>
  )
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn('inline-block h-3 w-3 rounded-full border-2', className)}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}
