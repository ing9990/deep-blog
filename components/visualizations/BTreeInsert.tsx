'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses, type VizState } from './common/colors'

interface BTreeInsertProps {
  description?: string
}

type CellState = VizState | 'default'

interface KeyCell {
  value: number
  state: CellState
}

interface TreeNode {
  keys: KeyCell[]
}

interface Snapshot {
  levels: TreeNode[][]
  note: string
}

function k(value: number, state: CellState = 'default'): KeyCell {
  return { value, state }
}

function buildSnapshots(): Snapshot[] {
  return [
    {
      levels: [
        [{ keys: [k(20), k(40)] }],
        [
          { keys: [k(5), k(10)] },
          { keys: [k(25), k(30), k(35)] },
          { keys: [k(50), k(60)] },
        ],
      ],
      note: '차수 4인 B-Tree입니다. 각 노드는 최대 3개의 키를 담을 수 있습니다.',
    },
    {
      levels: [
        [{ keys: [k(20, 'comparing'), k(40, 'comparing')] }],
        [
          { keys: [k(5), k(10)] },
          { keys: [k(25), k(30), k(35)] },
          { keys: [k(50), k(60)] },
        ],
      ],
      note: '28을 삽입합니다. 루트 노드에서 탐색을 시작합니다.',
    },
    {
      levels: [
        [{ keys: [k(20), k(40)] }],
        [
          { keys: [k(5), k(10)] },
          { keys: [k(25, 'comparing'), k(30, 'comparing'), k(35, 'comparing')] },
          { keys: [k(50), k(60)] },
        ],
      ],
      note: '20 < 28 < 40 → 가운데 자식으로 이동합니다.',
    },
    {
      levels: [
        [{ keys: [k(20), k(40)] }],
        [
          { keys: [k(5), k(10)] },
          { keys: [k(25), k(28, 'pivot'), k(30), k(35)] },
          { keys: [k(50), k(60)] },
        ],
      ],
      note: '리프에 28을 삽입합니다. 정렬 순서를 유지합니다.',
    },
    {
      levels: [
        [{ keys: [k(20), k(40)] }],
        [
          { keys: [k(5), k(10)] },
          { keys: [k(25, 'blocked'), k(28, 'blocked'), k(30, 'blocked'), k(35, 'blocked')] },
          { keys: [k(50), k(60)] },
        ],
      ],
      note: '키가 4개로 최대(3개)를 초과했습니다. 분할이 필요합니다.',
    },
    {
      levels: [
        [{ keys: [k(20), k(40)] }],
        [
          { keys: [k(5), k(10)] },
          { keys: [k(25), k(28), k(30, 'highlight'), k(35)] },
          { keys: [k(50), k(60)] },
        ],
      ],
      note: '중간 키 30을 선택합니다. 이 키가 부모로 올라갑니다.',
    },
    {
      levels: [
        [{ keys: [k(20), k(30, 'highlight'), k(40)] }],
        [
          { keys: [k(5), k(10)] },
          { keys: [k(25, 'confirmed'), k(28, 'confirmed')] },
          { keys: [k(35, 'confirmed')] },
          { keys: [k(50), k(60)] },
        ],
      ],
      note: '30을 부모로 올리고, 좌 [25, 28] / 우 [35]로 분할합니다.',
    },
    {
      levels: [
        [{ keys: [k(20, 'confirmed'), k(30, 'confirmed'), k(40, 'confirmed')] }],
        [
          { keys: [k(5, 'confirmed'), k(10, 'confirmed')] },
          { keys: [k(25, 'confirmed'), k(28, 'confirmed')] },
          { keys: [k(35, 'confirmed')] },
          { keys: [k(50, 'confirmed'), k(60, 'confirmed')] },
        ],
      ],
      note: '삽입 완료! 모든 리프의 깊이가 동일하게 유지됩니다.',
    },
  ]
}

export function BTreeInsert({
  description = '키 28을 삽입할 때 노드 분할이 발생하는 과정을 단계별로 확인하세요.',
}: BTreeInsertProps) {
  const snapshots = useMemo(() => buildSnapshots(), [])
  const controller = useStepController(snapshots.length)
  const current = snapshots[controller.step]

  return (
    <VisualContainer title="B-Tree 삽입과 분할" description={description}>
      <div className="flex flex-col items-center gap-6 rounded-[10px] bg-muted/40 px-3 py-6">
        {current.levels.map((level, levelIdx) => (
          <div
            key={levelIdx}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {level.map((node, nodeIdx) => (
              <div
                key={nodeIdx}
                className="flex overflow-hidden rounded-[8px] border-2 border-border"
              >
                {node.keys.map((cell, cellIdx) => {
                  const stateClass =
                    cell.state === 'default'
                      ? 'bg-background text-foreground'
                      : vizStateClasses(cell.state)

                  return (
                    <div
                      key={cellIdx}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center border-r border-border text-[13px] font-semibold transition-all duration-300 last:border-r-0 motion-reduce:transition-none',
                        stateClass,
                      )}
                    >
                      {cell.value}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        ))}
      </div>

      <StepController {...controller} stepDescription={current.note} />

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <LegendDot stateClass="bg-viz-comparing-bg border-viz-comparing" label="탐색 중" />
        <LegendDot stateClass="bg-viz-pivot-bg border-viz-pivot" label="삽입" />
        <LegendDot stateClass="bg-viz-blocked-bg border-viz-blocked" label="오버플로우" />
        <LegendDot stateClass="bg-viz-highlight-bg border-viz-highlight" label="Promote" />
        <LegendDot stateClass="bg-viz-confirmed-bg border-viz-confirmed" label="확정" />
      </div>
    </VisualContainer>
  )
}

function LegendDot({
  stateClass,
  label,
}: {
  stateClass: string
  label: string
}) {
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
