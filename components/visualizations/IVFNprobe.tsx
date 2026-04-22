'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'

interface IVFNprobeProps {
  description?: string
}

type CellState = 'idle' | 'centroid-compare' | 'scanned' | 'query-cell'

interface Cell {
  id: number
  col: number
  row: number
  centroid: { x: number; y: number }
  points: { x: number; y: number }[]
  distanceRank: number
}

interface Snapshot {
  cellStates: Record<number, CellState>
  showAllCentroidLines: boolean
  note: string
  badge: string
  stats: { label: string; value: string; kind?: 'good' | 'bad' }[]
}

const GRID_COLS = 4
const GRID_ROWS = 4
const CELL_W = 80
const CELL_H = 55
const ORIGIN_X = 30
const ORIGIN_Y = 25

const QUERY = { x: ORIGIN_X + CELL_W * 2 + 30, y: ORIGIN_Y + CELL_H * 2 - 5 }

function buildCells(): Cell[] {
  const cells: Cell[] = []
  const rng = mulberry32(42)
  let id = 0
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const cx = ORIGIN_X + col * CELL_W + CELL_W / 2 + (rng() - 0.5) * 10
      const cy = ORIGIN_Y + row * CELL_H + CELL_H / 2 + (rng() - 0.5) * 10
      const pointCount = 4 + Math.floor(rng() * 3)
      const points: { x: number; y: number }[] = []
      for (let p = 0; p < pointCount; p++) {
        const dx = (rng() - 0.5) * (CELL_W - 18)
        const dy = (rng() - 0.5) * (CELL_H - 18)
        points.push({ x: cx + dx, y: cy + dy })
      }
      cells.push({
        id,
        col,
        row,
        centroid: { x: cx, y: cy },
        points,
        distanceRank: 0,
      })
      id++
    }
  }
  for (const cell of cells) {
    cell.distanceRank = Math.hypot(
      cell.centroid.x - QUERY.x,
      cell.centroid.y - QUERY.y,
    )
  }
  const sortedIds = cells
    .slice()
    .sort((a, b) => a.distanceRank - b.distanceRank)
    .map((c) => c.id)
  cells.forEach((c) => {
    c.distanceRank = sortedIds.indexOf(c.id)
  })
  return cells
}

function mulberry32(seed: number): () => number {
  let t = seed
  return () => {
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function setRank(cells: Cell[], rankLimit: number): Record<number, CellState> {
  const states: Record<number, CellState> = {}
  cells.forEach((c) => {
    if (c.distanceRank < rankLimit) {
      states[c.id] = c.distanceRank === 0 ? 'query-cell' : 'scanned'
    } else {
      states[c.id] = 'idle'
    }
  })
  return states
}

function buildSnapshots(cells: Cell[]): Snapshot[] {
  const allCompare: Record<number, CellState> = {}
  cells.forEach((c) => (allCompare[c.id] = 'centroid-compare'))

  return [
    {
      cellStates: Object.fromEntries(cells.map((c) => [c.id, 'idle'])),
      showAllCentroidLines: false,
      badge: '설정 · nlist=16',
      note: 'IVF는 전체 벡터 공간을 nlist개 cluster로 분할합니다. 여기서는 nlist=16이며, 각 cluster의 중심(centroid)이 다이아몬드로 표시됩니다.',
      stats: [
        { label: 'nlist', value: '16' },
        { label: '벡터 수', value: '약 80' },
      ],
    },
    {
      cellStates: allCompare,
      showAllCentroidLines: true,
      badge: '질의 · centroid 비교',
      note: '질의 Q가 들어오면 먼저 16개 centroid와만 거리를 계산합니다. 전체 벡터가 아니라 centroid 개수만 비교합니다.',
      stats: [
        { label: 'centroid 비교', value: '16' },
        { label: '벡터 비교', value: '0 (아직)' },
      ],
    },
    {
      cellStates: setRank(cells, 1),
      showAllCentroidLines: false,
      badge: 'nprobe = 1',
      note: 'nprobe=1이면 가장 가까운 cluster 1개 안의 벡터들만 실제 거리 계산을 합니다. 빠르지만 정답이 다른 cluster에 있으면 놓칩니다.',
      stats: [
        { label: 'scan한 cluster', value: '1 / 16' },
        { label: 'recall@10 (실험 추정)', value: '약 0.55', kind: 'bad' },
        { label: 'latency', value: '가장 빠름', kind: 'good' },
      ],
    },
    {
      cellStates: setRank(cells, 3),
      showAllCentroidLines: false,
      badge: 'nprobe = 3',
      note: 'nprobe=3이면 가까운 cluster 3개를 검사합니다. cluster 경계 근처의 벡터도 포함할 가능성이 높아지면서 recall이 크게 오릅니다.',
      stats: [
        { label: 'scan한 cluster', value: '3 / 16' },
        { label: 'recall@10 (실험 추정)', value: '약 0.85', kind: 'good' },
        { label: 'latency', value: '중간' },
      ],
    },
    {
      cellStates: setRank(cells, 8),
      showAllCentroidLines: false,
      badge: 'nprobe = 8',
      note: 'nprobe=8이면 절반의 cluster를 검사합니다. recall은 exact에 매우 가까워지지만 비용도 cluster 수에 비례해 커집니다.',
      stats: [
        { label: 'scan한 cluster', value: '8 / 16' },
        { label: 'recall@10 (실험 추정)', value: '약 0.99', kind: 'good' },
        { label: 'latency', value: '느림', kind: 'bad' },
      ],
    },
    {
      cellStates: setRank(cells, 3),
      showAllCentroidLines: false,
      badge: '핵심 거래',
      note: 'nprobe가 곧 recall과 latency 사이의 손잡이입니다. 서비스의 품질 요건에 맞춰 nprobe를 튜닝하는 것이 IVF 운영의 핵심입니다.',
      stats: [
        { label: 'nprobe ↑', value: 'recall ↑ · latency ↑' },
        { label: 'nprobe ↓', value: 'recall ↓ · latency ↓' },
      ],
    },
  ]
}

const CELL_STYLE: Record<
  CellState,
  { fill: string; stroke: string; strokeOpacity: number }
> = {
  idle: {
    fill: 'var(--muted)',
    stroke: 'var(--border)',
    strokeOpacity: 0.6,
  },
  'centroid-compare': {
    fill: 'var(--viz-comparing-bg)',
    stroke: 'var(--viz-comparing)',
    strokeOpacity: 0.6,
  },
  scanned: {
    fill: 'var(--viz-confirmed-bg)',
    stroke: 'var(--viz-confirmed)',
    strokeOpacity: 0.8,
  },
  'query-cell': {
    fill: 'var(--viz-confirmed-bg)',
    stroke: 'var(--viz-confirmed)',
    strokeOpacity: 1,
  },
}

export function IVFNprobe({
  description = 'IVF의 nprobe 파라미터가 recall과 latency를 어떻게 trade-off하는지 단계별로 확인하세요.',
}: IVFNprobeProps) {
  const cells = useMemo(() => buildCells(), [])
  const snapshots = useMemo(() => buildSnapshots(cells), [cells])
  const controller = useStepController(snapshots.length)
  const current = snapshots[controller.step]

  return (
    <VisualContainer
      title="IVF cluster와 nprobe 트레이드오프"
      description={description}
    >
      <div className="rounded-[10px] bg-muted/40 p-3">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground">
          {current.badge}
        </div>

        <svg
          viewBox="0 0 380 260"
          className="block h-auto w-full"
          role="img"
          aria-label="IVF nprobe tradeoff"
        >
          {cells.map((cell) => {
            const state = current.cellStates[cell.id]
            const style = CELL_STYLE[state]
            return (
              <g key={cell.id}>
                <rect
                  x={ORIGIN_X + cell.col * CELL_W}
                  y={ORIGIN_Y + cell.row * CELL_H}
                  width={CELL_W - 2}
                  height={CELL_H - 2}
                  rx={4}
                  fill={style.fill}
                  fillOpacity={0.7}
                  stroke={style.stroke}
                  strokeOpacity={style.strokeOpacity}
                  strokeWidth={1.5}
                  className="transition-all duration-300 motion-reduce:transition-none"
                />
                {(state === 'scanned' || state === 'query-cell') &&
                  cell.points.map((p, i) => (
                    <circle
                      key={`p-${cell.id}-${i}`}
                      cx={p.x}
                      cy={p.y}
                      r={2.5}
                      fill="var(--viz-confirmed-fg)"
                      fillOpacity={0.8}
                    />
                  ))}
                {state === 'idle' &&
                  cell.points.map((p, i) => (
                    <circle
                      key={`p-idle-${cell.id}-${i}`}
                      cx={p.x}
                      cy={p.y}
                      r={2}
                      fill="var(--muted-foreground)"
                      fillOpacity={0.35}
                    />
                  ))}
              </g>
            )
          })}

          {current.showAllCentroidLines &&
            cells.map((cell) => (
              <line
                key={`cline-${cell.id}`}
                x1={QUERY.x}
                y1={QUERY.y}
                x2={cell.centroid.x}
                y2={cell.centroid.y}
                stroke="var(--viz-comparing)"
                strokeOpacity={0.3}
                strokeWidth={0.7}
                strokeDasharray="2 3"
              />
            ))}

          {cells.map((cell) => (
            <g key={`cent-${cell.id}`}>
              <rect
                x={cell.centroid.x - 4}
                y={cell.centroid.y - 4}
                width={8}
                height={8}
                transform={`rotate(45 ${cell.centroid.x} ${cell.centroid.y})`}
                fill="var(--viz-pivot-bg)"
                stroke="var(--viz-pivot)"
                strokeWidth={1.5}
              />
            </g>
          ))}

          <g>
            <circle
              cx={QUERY.x}
              cy={QUERY.y}
              r={9}
              fill="var(--viz-highlight-bg)"
              stroke="var(--viz-highlight)"
              strokeWidth={2}
            />
            <text
              x={QUERY.x}
              y={QUERY.y + 3.5}
              textAnchor="middle"
              fontSize={10}
              fontWeight={700}
              fill="var(--viz-highlight-fg)"
            >
              Q
            </text>
          </g>
        </svg>

        {current.stats.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {current.stats.map((s) => (
              <div
                key={s.label}
                className={cn(
                  'rounded-[var(--radius-card)] border px-3 py-2',
                  s.kind === 'good'
                    ? 'border-viz-confirmed/50 bg-viz-confirmed-bg/40'
                    : s.kind === 'bad'
                      ? 'border-viz-blocked/50 bg-viz-blocked-bg/40'
                      : 'border-border bg-background',
                )}
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
        <LegendDiamond label="centroid" />
        <LegendDot
          className="bg-viz-highlight-bg border-viz-highlight"
          label="질의 Q"
        />
        <LegendDot
          className="bg-viz-comparing-bg border-viz-comparing"
          label="centroid 비교 중"
        />
        <LegendDot
          className="bg-viz-confirmed-bg border-viz-confirmed"
          label="scan된 cluster"
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

function LegendDiamond({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-3 w-3 rotate-45 border-2 border-viz-pivot bg-viz-pivot-bg"
        aria-hidden="true"
      />
      {label}
    </span>
  )
}
