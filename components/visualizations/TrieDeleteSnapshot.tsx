import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { vizStateClasses, type VizState } from './common/colors'

interface TrieDeleteSnapshotProps {
  description?: string
}

type NodeState = 'default' | VizState

interface DeleteNode {
  char: string
  depth: number
  isEnd: boolean
  state: NodeState
  removed?: boolean
}

interface DeleteStep {
  label: string
  nodes: DeleteNode[]
  note: string
}

const STEPS: DeleteStep[] = [
  {
    label: 'Step 1: 초기 상태',
    note: 'apple과 app이 함께 저장되어 있습니다. 중간 p 노드와 끝 e 노드 모두 isEnd = true.',
    nodes: [
      { char: '·', depth: 0, isEnd: false, state: 'default' },
      { char: 'a', depth: 1, isEnd: false, state: 'default' },
      { char: 'p', depth: 2, isEnd: false, state: 'default' },
      { char: 'p', depth: 3, isEnd: true, state: 'default' },
      { char: 'l', depth: 4, isEnd: false, state: 'default' },
      { char: 'e', depth: 5, isEnd: true, state: 'default' },
    ],
  },
  {
    label: 'Step 2: isEnd 해제',
    note: 'apple 삭제 요청. 끝 노드 e의 isEnd를 false로 변경합니다. 노드 자체는 아직 제거하지 않습니다.',
    nodes: [
      { char: '·', depth: 0, isEnd: false, state: 'default' },
      { char: 'a', depth: 1, isEnd: false, state: 'default' },
      { char: 'p', depth: 2, isEnd: false, state: 'default' },
      { char: 'p', depth: 3, isEnd: true, state: 'default' },
      { char: 'l', depth: 4, isEnd: false, state: 'default' },
      { char: 'e', depth: 5, isEnd: false, state: 'blocked' },
    ],
  },
  {
    label: 'Step 3: 역순 제거',
    note: 'e와 l은 isEnd = false이고 자식도 없음 → 제거. p(depth 3)는 isEnd = true (app이 사용 중) → 보존. a, p(depth 2)도 app 경로로 사용 중 → 보존.',
    nodes: [
      { char: '·', depth: 0, isEnd: false, state: 'default' },
      { char: 'a', depth: 1, isEnd: false, state: 'confirmed' },
      { char: 'p', depth: 2, isEnd: false, state: 'confirmed' },
      { char: 'p', depth: 3, isEnd: true, state: 'confirmed' },
      { char: 'l', depth: 4, isEnd: false, state: 'blocked', removed: true },
      { char: 'e', depth: 5, isEnd: false, state: 'blocked', removed: true },
    ],
  },
]

export function TrieDeleteSnapshot({
  description = 'apple과 app이 저장된 트라이에서 apple만 삭제할 때, app이 사용하는 공유 노드가 어떻게 보존되는지.',
}: TrieDeleteSnapshotProps) {
  return (
    <VisualContainer title="트라이 삭제: 공유 노드 보존" description={description}>
      <div className="grid gap-4 md:grid-cols-3">
        {STEPS.map((step) => (
          <div
            key={step.label}
            className="flex flex-col rounded-[8px] border border-border bg-muted/30 p-3"
          >
            <h4 className="mb-3 text-[length:var(--text-meta)] font-semibold text-foreground">
              {step.label}
            </h4>
            <div className="flex flex-col gap-1.5">
              {step.nodes.map((n, i) => (
                <div
                  key={i}
                  className="flex items-center"
                  style={{ paddingLeft: `${n.depth * 14}px` }}
                >
                  <div
                    className={cn(
                      'inline-flex h-7 min-w-[28px] items-center justify-center gap-1 rounded-[5px] border-2 px-1.5 text-[12px] font-mono font-semibold transition-colors',
                      n.state === 'default'
                        ? 'border-border bg-background text-foreground'
                        : vizStateClasses(n.state),
                      n.removed && 'opacity-40 line-through',
                    )}
                  >
                    <span>{n.char}</span>
                    {n.isEnd && (
                      <span
                        className="inline-block h-1 w-1 rounded-full bg-primary"
                        aria-label="단어 끝"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{step.note}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-sm border-2 bg-viz-blocked-bg border-viz-blocked"
            aria-hidden="true"
          />
          삭제 대상/제거됨
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-sm border-2 bg-viz-confirmed-bg border-viz-confirmed"
            aria-hidden="true"
          />
          보존
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-1 w-1 rounded-full bg-primary" aria-hidden="true" />
          isEnd = true
        </span>
      </div>
    </VisualContainer>
  )
}
