'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'

interface HNSWLevelWalkProps {
  description?: string
}

interface NodeSpec {
  id: string
  x: number
}

type NodeState = 'idle' | 'entry' | 'current' | 'visited' | 'topk'

interface LevelSpec {
  name: string
  y: number
  nodes: NodeSpec[]
  edges: [string, string][]
}

interface Snapshot {
  activeLevel: 0 | 1 | 2
  nodeStates: Record<string, NodeState>
  note: string
  badge: string
}

const QX = 340

const L2: LevelSpec = {
  name: 'Level 2',
  y: 45,
  nodes: [
    { id: 'n-a', x: 50 },
    { id: 'n-b', x: 150 },
    { id: 'n-c', x: 230 },
    { id: 'n-d', x: 320 },
  ],
  edges: [
    ['n-a', 'n-b'],
    ['n-b', 'n-c'],
    ['n-c', 'n-d'],
    ['n-a', 'n-c'],
  ],
}

const L1: LevelSpec = {
  name: 'Level 1',
  y: 150,
  nodes: [
    { id: 'n-a', x: 50 },
    { id: 'n-e', x: 100 },
    { id: 'n-b', x: 150 },
    { id: 'n-f', x: 195 },
    { id: 'n-c', x: 230 },
    { id: 'n-g', x: 275 },
    { id: 'n-d', x: 320 },
    { id: 'n-h', x: 360 },
  ],
  edges: [
    ['n-a', 'n-e'],
    ['n-e', 'n-b'],
    ['n-b', 'n-f'],
    ['n-f', 'n-c'],
    ['n-c', 'n-g'],
    ['n-g', 'n-d'],
    ['n-d', 'n-h'],
    ['n-e', 'n-f'],
    ['n-f', 'n-g'],
  ],
}

const L0: LevelSpec = {
  name: 'Level 0 (base)',
  y: 255,
  nodes: [
    { id: 'n-a', x: 50 },
    { id: 'n-i', x: 75 },
    { id: 'n-e', x: 100 },
    { id: 'n-j', x: 125 },
    { id: 'n-b', x: 150 },
    { id: 'n-k', x: 175 },
    { id: 'n-f', x: 195 },
    { id: 'n-l', x: 215 },
    { id: 'n-c', x: 230 },
    { id: 'n-m', x: 250 },
    { id: 'n-g', x: 275 },
    { id: 'n-n', x: 300 },
    { id: 'n-d', x: 320 },
    { id: 'n-o', x: 340 },
    { id: 'n-h', x: 360 },
    { id: 'n-p', x: 380 },
  ],
  edges: [
    ['n-a', 'n-i'],
    ['n-i', 'n-e'],
    ['n-e', 'n-j'],
    ['n-j', 'n-b'],
    ['n-b', 'n-k'],
    ['n-k', 'n-f'],
    ['n-f', 'n-l'],
    ['n-l', 'n-c'],
    ['n-c', 'n-m'],
    ['n-m', 'n-g'],
    ['n-g', 'n-n'],
    ['n-n', 'n-d'],
    ['n-d', 'n-o'],
    ['n-o', 'n-h'],
    ['n-h', 'n-p'],
  ],
}

const LEVELS: LevelSpec[] = [L0, L1, L2]

function s(
  activeLevel: 0 | 1 | 2,
  states: Record<string, NodeState>,
  badge: string,
  note: string,
): Snapshot {
  return { activeLevel, nodeStates: states, badge, note }
}

function buildSnapshots(): Snapshot[] {
  return [
    s(
      2,
      {},
      '개요',
      'HNSW는 3개 층의 NSW 그래프입니다. 상위 층은 긴 엣지로 공간을 빠르게 가로지르고, 하위 층은 촘촘한 엣지로 정밀 탐색을 담당합니다. 질의 Q는 오른쪽 끝 근처에 있습니다.',
    ),
    s(
      2,
      { 'n-a': 'entry', 'n-b': 'idle', 'n-c': 'idle', 'n-d': 'idle' },
      'Level 2 · 진입',
      '최상위 Level 2의 진입점 A에서 탐색을 시작합니다. 목표는 Q에 가장 가까운 이웃으로 greedy하게 이동하는 것입니다.',
    ),
    s(
      2,
      { 'n-a': 'visited', 'n-c': 'current', 'n-b': 'idle', 'n-d': 'idle' },
      'Level 2 · greedy hop',
      'A의 이웃 중 Q에 가장 가까운 C로 이동합니다. 한 hop으로 공간의 절반 이상을 건너뜁니다. 이것이 상위 층의 "고속도로" 역할입니다.',
    ),
    s(
      2,
      { 'n-a': 'visited', 'n-c': 'visited', 'n-d': 'current', 'n-b': 'idle' },
      'Level 2 · 다음 hop',
      'C의 이웃 중 Q에 더 가까운 D로 이동합니다. 더 나아갈 이웃이 없으면 이 층에서의 greedy는 종료됩니다.',
    ),
    s(
      1,
      {
        'n-a': 'visited',
        'n-c': 'visited',
        'n-d': 'current',
        'n-e': 'idle',
        'n-f': 'idle',
        'n-g': 'idle',
        'n-h': 'idle',
        'n-b': 'idle',
      },
      'Level 1 · 레벨 다운',
      'Level 2에서 최종 도달한 D를 진입점으로 Level 1로 내려갑니다. Level 1은 중간 밀도 그래프로 더 세밀한 greedy 탐색이 가능합니다.',
    ),
    s(
      1,
      {
        'n-d': 'visited',
        'n-g': 'current',
        'n-h': 'idle',
        'n-e': 'idle',
        'n-f': 'idle',
        'n-c': 'idle',
        'n-a': 'idle',
        'n-b': 'idle',
      },
      'Level 1 · 정밀 조정',
      'D의 이웃 중 Q에 더 가까운 G로 이동합니다. 이 층의 엣지는 Level 2보다 짧고 촘촘해서 "국도" 역할을 합니다.',
    ),
    s(
      0,
      {
        'n-d': 'visited',
        'n-g': 'visited',
        'n-n': 'current',
        'n-o': 'idle',
        'n-m': 'idle',
        'n-h': 'idle',
        'n-p': 'idle',
        'n-c': 'idle',
        'n-f': 'idle',
        'n-l': 'idle',
        'n-b': 'idle',
        'n-k': 'idle',
        'n-e': 'idle',
        'n-j': 'idle',
        'n-a': 'idle',
        'n-i': 'idle',
      },
      'Level 0 · 최종 정밀화',
      'Level 0 (base) 층으로 내려와 모든 벡터 중에서 최종 top-k를 찾습니다. 이 층의 촘촘한 엣지는 "골목길"에 해당합니다.',
    ),
    s(
      0,
      {
        'n-d': 'topk',
        'n-g': 'topk',
        'n-n': 'topk',
        'n-o': 'idle',
        'n-m': 'idle',
        'n-h': 'idle',
        'n-p': 'idle',
        'n-c': 'idle',
        'n-f': 'idle',
        'n-l': 'idle',
        'n-b': 'idle',
        'n-k': 'idle',
        'n-e': 'idle',
        'n-j': 'idle',
        'n-a': 'idle',
        'n-i': 'idle',
      },
      '완료 · top-k 반환',
      'Q 주변의 top-3 이웃을 반환합니다. 전체 노드를 탐색하지 않고 O(log N) 기대 시간에 근사 답을 얻었습니다.',
    ),
  ]
}

const NODE_STYLE: Record<
  NodeState,
  { fill: string; stroke: string; textFill: string }
> = {
  idle: {
    fill: 'var(--muted)',
    stroke: 'var(--border)',
    textFill: 'var(--muted-foreground)',
  },
  entry: {
    fill: 'var(--viz-pivot-bg)',
    stroke: 'var(--viz-pivot)',
    textFill: 'var(--viz-pivot-fg)',
  },
  current: {
    fill: 'var(--viz-comparing-bg)',
    stroke: 'var(--viz-comparing)',
    textFill: 'var(--viz-comparing-fg)',
  },
  visited: {
    fill: 'var(--viz-confirmed-bg)',
    stroke: 'var(--viz-confirmed)',
    textFill: 'var(--viz-confirmed-fg)',
  },
  topk: {
    fill: 'var(--viz-highlight-bg)',
    stroke: 'var(--viz-highlight)',
    textFill: 'var(--viz-highlight-fg)',
  },
}

export function HNSWLevelWalk({
  description = 'HNSW의 3-레벨 greedy search가 어떻게 상위 층에서 공간을 빠르게 가로지르고 하위 층에서 정밀해지는지 단계별로 확인하세요.',
}: HNSWLevelWalkProps) {
  const snapshots = useMemo(() => buildSnapshots(), [])
  const controller = useStepController(snapshots.length)
  const current = snapshots[controller.step]

  return (
    <VisualContainer title="HNSW 레벨 탐색" description={description}>
      <div className="rounded-[10px] bg-muted/40 p-3">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground">
          {current.badge}
        </div>

        <svg
          viewBox="0 0 420 320"
          className="block h-auto w-full"
          role="img"
          aria-label="HNSW three-level greedy search"
        >
          <line
            x1={QX}
            y1={20}
            x2={QX}
            y2={290}
            stroke="var(--viz-pivot)"
            strokeOpacity={0.35}
            strokeWidth={1}
            strokeDasharray="3 4"
          />

          {LEVELS.map((level, idx) => {
            const isActive = current.activeLevel === (idx as 0 | 1 | 2)
            const levelOpacity = isActive ? 1 : 0.35

            return (
              <g key={level.name} opacity={levelOpacity}>
                <text
                  x={16}
                  y={level.y + 4}
                  fontSize={10}
                  fontWeight={600}
                  fill={
                    isActive ? 'var(--foreground)' : 'var(--muted-foreground)'
                  }
                >
                  {level.name}
                </text>

                {level.edges.map(([a, b], edgeIdx) => {
                  const na = level.nodes.find((n) => n.id === a)
                  const nb = level.nodes.find((n) => n.id === b)
                  if (!na || !nb) return null
                  return (
                    <line
                      key={`${level.name}-edge-${edgeIdx}`}
                      x1={na.x}
                      y1={level.y}
                      x2={nb.x}
                      y2={level.y}
                      stroke={
                        isActive
                          ? 'var(--viz-confirmed)'
                          : 'var(--border)'
                      }
                      strokeOpacity={isActive ? 0.5 : 0.6}
                      strokeWidth={isActive ? 1.5 : 1}
                    />
                  )
                })}

                {level.nodes.map((node) => {
                  const state = current.nodeStates[node.id] ?? 'idle'
                  const style = NODE_STYLE[state]
                  const r = state === 'idle' ? 6 : 8
                  return (
                    <g key={`${level.name}-${node.id}`}>
                      <circle
                        cx={node.x}
                        cy={level.y}
                        r={r}
                        fill={style.fill}
                        stroke={style.stroke}
                        strokeWidth={1.8}
                        className="transition-all duration-300 motion-reduce:transition-none"
                      />
                    </g>
                  )
                })}
              </g>
            )
          })}

          <g>
            <circle
              cx={QX}
              cy={15}
              r={10}
              fill="var(--viz-pivot-bg)"
              stroke="var(--viz-pivot)"
              strokeWidth={2}
            />
            <text
              x={QX}
              y={19}
              textAnchor="middle"
              fontSize={11}
              fontWeight={700}
              fill="var(--viz-pivot-fg)"
            >
              Q
            </text>
          </g>
        </svg>
      </div>

      <StepController {...controller} stepDescription={current.note} />

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <LegendDot className="bg-viz-pivot-bg border-viz-pivot" label="진입점 / 질의 Q" />
        <LegendDot
          className="bg-viz-comparing-bg border-viz-comparing"
          label="현재 노드"
        />
        <LegendDot
          className="bg-viz-confirmed-bg border-viz-confirmed"
          label="탐색 경로"
        />
        <LegendDot
          className="bg-viz-highlight-bg border-viz-highlight"
          label="최종 top-k"
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
