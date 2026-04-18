'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses, type VizState } from './common/colors'

interface TrieBuilderProps {
  description?: string
}

type NodeState = 'default' | VizState

interface TrieVizNode {
  id: string
  char: string
  depth: number
  isEnd: boolean
  state: NodeState
}

interface Snapshot {
  nodes: TrieVizNode[]
  note: string
}

function mk(
  id: string,
  char: string,
  depth: number,
  state: NodeState = 'default',
  isEnd = false,
): TrieVizNode {
  return { id, char, depth, isEnd, state }
}

function buildSnapshots(): Snapshot[] {
  return [
    {
      nodes: [mk('root', '·', 0)],
      note: '빈 트라이입니다. 루트 노드만 존재합니다.',
    },
    {
      nodes: [
        mk('root', '·', 0),
        mk('a', 'a', 1, 'pivot'),
        mk('ap', 'p', 2, 'pivot'),
        mk('app', 'p', 3, 'pivot'),
        mk('appl', 'l', 4, 'pivot'),
        mk('apple', 'e', 5, 'pivot', true),
      ],
      note: '"apple" 삽입: a → p → p → l → e 경로의 5개 노드를 신규 생성. 마지막 e 노드의 isEnd를 true로 설정합니다.',
    },
    {
      nodes: [
        mk('root', '·', 0),
        mk('a', 'a', 1, 'comparing'),
        mk('ap', 'p', 2, 'comparing'),
        mk('app', 'p', 3, 'confirmed', true),
        mk('appl', 'l', 4),
        mk('apple', 'e', 5, 'default', true),
      ],
      note: '"app" 삽입: a → p → p 경로를 재사용. 중간 p 노드의 isEnd만 true로 변경합니다. 신규 노드 생성 없음.',
    },
    {
      nodes: [
        mk('root', '·', 0),
        mk('a', 'a', 1, 'comparing'),
        mk('ap', 'p', 2, 'comparing'),
        mk('app', 'p', 3, 'default', true),
        mk('appl', 'l', 4),
        mk('apple', 'e', 5, 'default', true),
        mk('apr', 'r', 3, 'pivot'),
        mk('apri', 'i', 4, 'pivot'),
        mk('apric', 'c', 5, 'pivot'),
        mk('aprico', 'o', 6, 'pivot'),
        mk('apricot', 't', 7, 'pivot', true),
      ],
      note: '"apricot" 삽입: a → p 경로는 재사용, r → i → c → o → t는 신규 분기로 생성합니다.',
    },
    {
      nodes: [
        mk('root', '·', 0),
        mk('a', 'a', 1, 'comparing'),
        mk('ap', 'p', 2, 'comparing'),
        mk('app', 'p', 3, 'confirmed', true),
        mk('appl', 'l', 4),
        mk('apple', 'e', 5, 'default', true),
        mk('apr', 'r', 3),
        mk('apri', 'i', 4),
        mk('apric', 'c', 5),
        mk('aprico', 'o', 6),
        mk('apricot', 't', 7, 'default', true),
      ],
      note: '"app" 정확 검색: a → p → p 경로를 따라 내려간 뒤 마지막 p의 isEnd = true 확인 → 단어 존재합니다.',
    },
    {
      nodes: [
        mk('root', '·', 0),
        mk('a', 'a', 1, 'comparing'),
        mk('ap', 'p', 2, 'comparing'),
        mk('app', 'p', 3, 'highlight', true),
        mk('appl', 'l', 4, 'highlight'),
        mk('apple', 'e', 5, 'highlight', true),
        mk('apr', 'r', 3, 'highlight'),
        mk('apri', 'i', 4, 'highlight'),
        mk('apric', 'c', 5, 'highlight'),
        mk('aprico', 'o', 6, 'highlight'),
        mk('apricot', 't', 7, 'highlight', true),
      ],
      note: '"ap" 접두어 검색: a → p 경로를 찾은 뒤 서브트리의 모든 isEnd 노드를 수집 → app, apple, apricot 3개.',
    },
  ]
}

export function TrieBuilder({
  description = 'apple, app, apricot 삽입 후 정확 검색과 접두어 검색까지의 트라이 동작을 단계별로 확인하세요.',
}: TrieBuilderProps) {
  const snapshots = useMemo(() => buildSnapshots(), [])
  const controller = useStepController(snapshots.length)
  const current = snapshots[controller.step]

  return (
    <VisualContainer title="트라이 삽입과 탐색" description={description}>
      <div className="rounded-[10px] bg-muted/40 px-3 py-4">
        <div className="flex flex-col gap-1.5 overflow-x-auto">
          {current.nodes.map((n) => (
            <div
              key={n.id}
              className="flex items-center gap-2"
              style={{ paddingLeft: `${n.depth * 22}px` }}
            >
              <div
                className={cn(
                  'inline-flex h-9 min-w-[36px] items-center justify-center gap-1 rounded-[6px] border-2 px-2 text-[13px] font-mono font-semibold transition-all duration-300 motion-reduce:transition-none',
                  n.state === 'default'
                    ? 'border-border bg-background text-foreground'
                    : vizStateClasses(n.state),
                )}
              >
                <span>{n.char}</span>
                {n.isEnd && (
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
                    aria-label="단어 끝"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <StepController {...controller} stepDescription={current.note} />

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <LegendDot stateClass="bg-viz-pivot-bg border-viz-pivot" label="신규 생성" />
        <LegendDot stateClass="bg-viz-comparing-bg border-viz-comparing" label="탐색/재사용" />
        <LegendDot stateClass="bg-viz-confirmed-bg border-viz-confirmed" label="단어 끝 확정" />
        <LegendDot stateClass="bg-viz-highlight-bg border-viz-highlight" label="접두어 매칭" />
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
          isEnd = true
        </span>
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
