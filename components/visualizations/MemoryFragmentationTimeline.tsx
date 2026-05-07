'use client'

import { useCallback, useReducer, useState } from 'react'
import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { cn } from '@/lib/utils'

const HEAP_SIZE = 1000

interface Block {
  id: string
  kind: 'used' | 'free'
  size: number
  color?: VizState
  label?: string
}

interface State {
  blocks: Block[]
  failure: { size: number; reason: string } | null
  nextId: number
}

const COLOR_CYCLE: VizState[] = ['pivot', 'comparing', 'confirmed', 'highlight', 'waiting']

function emptyHeap(): State {
  return {
    blocks: [{ id: 'free-0', kind: 'free', size: HEAP_SIZE }],
    failure: null,
    nextId: 1,
  }
}

interface ScenarioStep {
  state: State
  description: string
}

const SCENARIO_STEPS: ScenarioStep[] = [
  {
    state: { blocks: [{ id: 'free-0', kind: 'free', size: 1000 }], failure: null, nextId: 1 },
    description: '프로세스 시작 직후. 힙 1000B가 한 덩어리로 비어 있다.',
  },
  {
    state: {
      blocks: [
        { id: 'A', kind: 'used', size: 100, color: 'pivot', label: 'A' },
        { id: 'free-1', kind: 'free', size: 900 },
      ],
      failure: null,
      nextId: 2,
    },
    description: 'A(100B) 할당. 힙 앞에서부터 100B가 떼어진다.',
  },
  {
    state: {
      blocks: [
        { id: 'A', kind: 'used', size: 100, color: 'pivot', label: 'A' },
        { id: 'B', kind: 'used', size: 150, color: 'comparing', label: 'B' },
        { id: 'free-2', kind: 'free', size: 750 },
      ],
      failure: null,
      nextId: 3,
    },
    description: 'B(150B) 할당. A 옆에 이어서 150B가 떼어진다.',
  },
  {
    state: {
      blocks: [
        { id: 'A', kind: 'used', size: 100, color: 'pivot', label: 'A' },
        { id: 'B', kind: 'used', size: 150, color: 'comparing', label: 'B' },
        { id: 'C', kind: 'used', size: 80, color: 'confirmed', label: 'C' },
        { id: 'free-3', kind: 'free', size: 670 },
      ],
      failure: null,
      nextId: 4,
    },
    description: 'C(80B) 할당. 여기까지는 앞에서부터 차곡차곡 채우는 단순한 패턴.',
  },
  {
    state: {
      blocks: [
        { id: 'A', kind: 'used', size: 100, color: 'pivot', label: 'A' },
        { id: 'free-4', kind: 'free', size: 150 },
        { id: 'C', kind: 'used', size: 80, color: 'confirmed', label: 'C' },
        { id: 'free-3', kind: 'free', size: 670 },
      ],
      failure: null,
      nextId: 5,
    },
    description: 'B 해제. A와 C 사이에 150B 빈 자리가 생긴다. A·C는 그대로 유지.',
  },
  {
    state: {
      blocks: [
        { id: 'A', kind: 'used', size: 100, color: 'pivot', label: 'A' },
        { id: 'D', kind: 'used', size: 50, color: 'highlight', label: 'D' },
        { id: 'free-5', kind: 'free', size: 100 },
        { id: 'C', kind: 'used', size: 80, color: 'confirmed', label: 'C' },
        { id: 'free-3', kind: 'free', size: 670 },
      ],
      failure: null,
      nextId: 6,
    },
    description: 'D(50B) 할당. 빈 자리 150B 중 앞 50B에 들어가고 100B가 자투리로 남는다.',
  },
  {
    state: {
      blocks: [
        { id: 'free-6', kind: 'free', size: 100 },
        { id: 'D', kind: 'used', size: 50, color: 'highlight', label: 'D' },
        { id: 'free-5', kind: 'free', size: 100 },
        { id: 'C', kind: 'used', size: 80, color: 'confirmed', label: 'C' },
        { id: 'free-3', kind: 'free', size: 670 },
      ],
      failure: null,
      nextId: 7,
    },
    description: 'A 해제. 빈 자리가 더 흩어진다. 빈 자리 합계 870B, 가장 큰 연속 670B.',
  },
  {
    state: {
      blocks: [
        { id: 'free-6', kind: 'free', size: 100 },
        { id: 'D', kind: 'used', size: 50, color: 'highlight', label: 'D' },
        { id: 'free-5', kind: 'free', size: 100 },
        { id: 'C', kind: 'used', size: 80, color: 'confirmed', label: 'C' },
        { id: 'free-3', kind: 'free', size: 670 },
      ],
      failure: { size: 700, reason: '빈 자리 합계 870B 충분, 그러나 700B 연속 자리 없음 (최대 670B)' },
      nextId: 8,
    },
    description: 'F(700B) 할당 시도 → 거절. 빈 자리 합계는 충분한데 700B 연속 자리가 없다.',
  },
]

type Action =
  | { type: 'allocate'; size: number }
  | { type: 'free'; id: string }
  | { type: 'reset' }

function coalesce(blocks: Block[]): Block[] {
  const merged: Block[] = []
  for (const b of blocks) {
    const last = merged[merged.length - 1]
    if (last && last.kind === 'free' && b.kind === 'free') {
      merged[merged.length - 1] = { ...last, size: last.size + b.size }
    } else {
      merged.push(b)
    }
  }
  return merged
}

function sandboxReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'reset':
      return emptyHeap()
    case 'allocate': {
      const idx = state.blocks.findIndex((b) => b.kind === 'free' && b.size >= action.size)
      if (idx === -1) {
        return {
          ...state,
          failure: {
            size: action.size,
            reason: `${action.size}B 연속 자리 없음 (단편화 발현)`,
          },
        }
      }
      const target = state.blocks[idx]
      const color = COLOR_CYCLE[(state.nextId - 1) % COLOR_CYCLE.length]
      const id = `obj-${state.nextId}`
      const remainder = target.size - action.size
      const inserted: Block[] = [
        { id, kind: 'used', size: action.size, color, label: `${state.nextId}` },
      ]
      if (remainder > 0) {
        inserted.push({ id: `free-after-${state.nextId}`, kind: 'free', size: remainder })
      }
      const newBlocks = [...state.blocks.slice(0, idx), ...inserted, ...state.blocks.slice(idx + 1)]
      return { blocks: newBlocks, failure: null, nextId: state.nextId + 1 }
    }
    case 'free': {
      const idx = state.blocks.findIndex((b) => b.id === action.id)
      if (idx === -1 || state.blocks[idx].kind === 'free') return state
      const newBlocks = [...state.blocks]
      newBlocks[idx] = {
        id: `free-from-${action.id}`,
        kind: 'free',
        size: newBlocks[idx].size,
      }
      return { ...state, blocks: coalesce(newBlocks), failure: null }
    }
  }
}

export function MemoryFragmentationTimeline() {
  const [mode, setMode] = useState<'scenario' | 'sandbox'>('scenario')
  const controller = useStepController(SCENARIO_STEPS.length)
  const [sandbox, dispatch] = useReducer(sandboxReducer, undefined, emptyHeap)

  const scenario = SCENARIO_STEPS[controller.step]
  const state = mode === 'scenario' ? scenario.state : sandbox

  const onReset = useCallback(() => {
    if (mode === 'scenario') controller.reset()
    else dispatch({ type: 'reset' })
  }, [mode, controller])

  return (
    <VisualContainer
      title="메모리 단편화 타임라인"
      description="할당과 해제가 시간 위에서 뒤섞이며 빈 자리가 흩어지는 과정"
      onReset={onReset}
    >
      <ModeToggle mode={mode} onChange={setMode} />
      <HeapBar
        blocks={state.blocks}
        failure={state.failure}
        onFree={(id) => dispatch({ type: 'free', id })}
        interactive={mode === 'sandbox'}
      />
      <Stats state={state} />
      {mode === 'sandbox' ? (
        <SandboxActions onAllocate={(size) => dispatch({ type: 'allocate', size })} />
      ) : (
        <StepController {...controller} stepDescription={scenario.description} />
      )}
    </VisualContainer>
  )
}

interface ModeToggleProps {
  mode: 'scenario' | 'sandbox'
  onChange: (mode: 'scenario' | 'sandbox') => void
}

function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div
      className="mb-4 inline-flex rounded-[var(--radius-card)] border border-border p-1"
      role="tablist"
      aria-label="시뮬레이션 모드"
    >
      {(['scenario', 'sandbox'] as const).map((m) => (
        <button
          key={m}
          type="button"
          role="tab"
          aria-selected={mode === m}
          onClick={() => onChange(m)}
          className={cn(
            'rounded-[var(--radius-chip)] px-3 py-1 text-[length:var(--text-meta)] font-medium transition-colors',
            mode === m
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {m === 'scenario' ? '시나리오' : '자유 시뮬레이션'}
        </button>
      ))}
    </div>
  )
}

interface HeapBarProps {
  blocks: Block[]
  failure: { size: number; reason: string } | null
  onFree: (id: string) => void
  interactive: boolean
}

function HeapBar({ blocks, failure, onFree, interactive }: HeapBarProps) {
  return (
    <div className="space-y-2">
      <div
        className={cn(
          'flex h-14 w-full overflow-hidden rounded-[var(--radius-card)] border bg-muted/30',
          failure ? 'border-viz-blocked' : 'border-border',
        )}
        role="img"
        aria-label="힙 메모리 영역"
      >
        {blocks.map((b) => (
          <BlockSegment key={b.id} block={b} onFree={onFree} interactive={interactive} />
        ))}
      </div>
      {failure && (
        <div className="rounded-[var(--radius-card)] border border-viz-blocked bg-viz-blocked-bg/40 p-3 text-[length:var(--text-meta)] text-viz-blocked-fg">
          <span className="font-semibold">할당 실패: {failure.size}B 요청</span>
          <span className="ml-2 text-foreground/80">{failure.reason}</span>
        </div>
      )}
    </div>
  )
}

interface BlockSegmentProps {
  block: Block
  onFree: (id: string) => void
  interactive: boolean
}

function BlockSegment({ block, onFree, interactive }: BlockSegmentProps) {
  const widthPct = (block.size / HEAP_SIZE) * 100
  const isFree = block.kind === 'free'
  const colorClass =
    isFree || !block.color
      ? 'bg-muted/50 text-muted-foreground'
      : vizStateClasses(block.color)

  const baseClass = cn(
    'flex h-full items-center justify-center overflow-hidden border-r border-background/60 text-[length:var(--text-meta)] font-medium tabular-nums last:border-r-0',
    colorClass,
  )

  const content = (
    <span className="truncate px-1">
      {isFree ? `빈 ${block.size}B` : `${block.label} ${block.size}B`}
    </span>
  )

  if (interactive && !isFree) {
    return (
      <button
        type="button"
        onClick={() => onFree(block.id)}
        style={{ width: `${widthPct}%` }}
        className={cn(baseClass, 'cursor-pointer hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset')}
        aria-label={`객체 ${block.label} (${block.size}B) 해제`}
      >
        {content}
      </button>
    )
  }

  return (
    <div style={{ width: `${widthPct}%` }} className={baseClass}>
      {content}
    </div>
  )
}

interface StatsProps {
  state: State
}

function Stats({ state }: StatsProps) {
  const used = state.blocks.filter((b) => b.kind === 'used').reduce((s, b) => s + b.size, 0)
  const free = state.blocks.filter((b) => b.kind === 'free').reduce((s, b) => s + b.size, 0)
  const largestFree = state.blocks
    .filter((b) => b.kind === 'free')
    .reduce((m, b) => Math.max(m, b.size), 0)
  const fragRatio = free > 0 ? (1 - largestFree / free) * 100 : 0

  return (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Stat label="사용 중" value={`${used}B`} />
      <Stat label="빈 자리 합계" value={`${free}B`} />
      <Stat label="최대 연속 빈 자리" value={`${largestFree}B`} />
      <Stat label="외부 단편화 비율" value={`${fragRatio.toFixed(0)}%`} />
    </div>
  )
}

interface StatProps {
  label: string
  value: string
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-muted/20 px-3 py-2">
      <div className="text-[length:var(--text-caption)] text-muted-foreground">{label}</div>
      <div className="text-[length:var(--text-meta)] font-semibold tabular-nums text-foreground">
        {value}
      </div>
    </div>
  )
}

interface SandboxActionsProps {
  onAllocate: (size: number) => void
}

function SandboxActions({ onAllocate }: SandboxActionsProps) {
  const sizes = [50, 100, 200, 300, 500, 700]
  return (
    <div className="mt-4 space-y-2">
      <div className="text-[length:var(--text-caption)] text-muted-foreground">
        할당하려면 아래 크기 버튼을 누르고, 해제하려면 위 막대의 객체를 클릭합니다.
      </div>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => onAllocate(size)}
            className="rounded-[var(--radius-chip)] border border-border px-3 py-1 text-[length:var(--text-meta)] font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            할당 +{size}B
          </button>
        ))}
      </div>
    </div>
  )
}
