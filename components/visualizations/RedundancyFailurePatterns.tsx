import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'

interface NodeSpec {
  label: string
  state: VizState
  badge?: string
}

interface PatternSpec {
  id: string
  title: string
  description: string
  top: NodeSpec[]
  bottom: NodeSpec[]
}

const PATTERNS: PatternSpec[] = [
  {
    id: 'coordinator',
    title: '1. 조정자 SPOF',
    description:
      'DB 마스터 + 슬레이브는 복제했지만, 장애 판정을 내리는 조정자가 하나뿐입니다.',
    top: [
      { label: 'Failover Coordinator', state: 'blocked', badge: 'SPOF' },
    ],
    bottom: [
      { label: 'Master', state: 'confirmed' },
      { label: 'Slave 1', state: 'confirmed' },
      { label: 'Slave 2', state: 'confirmed' },
    ],
  },
  {
    id: 'frontend',
    title: '2. 앞단 SPOF',
    description:
      '앱 서버는 N대지만, 모든 요청이 지나가는 LB나 DNS가 단일 경로입니다.',
    top: [{ label: 'Load Balancer / DNS', state: 'blocked', badge: 'SPOF' }],
    bottom: [
      { label: 'App 1', state: 'confirmed' },
      { label: 'App 2', state: 'confirmed' },
      { label: 'App 3', state: 'confirmed' },
    ],
  },
  {
    id: 'shared-state',
    title: '3. 공유 상태 SPOF',
    description:
      '앱 서버는 무상태 + N대로 확장했지만, 모두가 참조하는 상태 계층이 단일입니다.',
    top: [
      { label: 'App 1', state: 'confirmed' },
      { label: 'App 2', state: 'confirmed' },
      { label: 'App 3', state: 'confirmed' },
    ],
    bottom: [
      {
        label: 'Shared Redis / Config',
        state: 'blocked',
        badge: 'SPOF',
      },
    ],
  },
]

function Node({ label, state, badge }: NodeSpec) {
  return (
    <div
      className={cn(
        'relative flex min-w-[120px] flex-col items-center rounded-[var(--radius-card)] border px-3 py-2 text-center text-[length:var(--text-caption)]',
        vizStateClasses(state),
      )}
    >
      <span className="font-medium leading-tight">{label}</span>
      {badge && (
        <span className="mt-1 rounded-[var(--radius-chip)] bg-viz-blocked px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
          {badge}
        </span>
      )}
    </div>
  )
}

function NodeRow({ nodes }: { nodes: NodeSpec[] }) {
  return (
    <div className="flex flex-wrap items-stretch justify-center gap-2">
      {nodes.map((node, idx) => (
        <Node key={`${node.label}-${idx}`} {...node} />
      ))}
    </div>
  )
}

function PatternCard({ pattern }: { pattern: PatternSpec }) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-muted/30 p-4">
      <div>
        <p className="text-[length:var(--text-body)] font-semibold text-foreground">
          {pattern.title}
        </p>
        <p className="mt-1 text-[length:var(--text-caption)] leading-relaxed text-muted-foreground">
          {pattern.description}
        </p>
      </div>

      <div className="flex flex-col items-center gap-2 pt-2">
        <NodeRow nodes={pattern.top} />
        <ChevronDown
          className="h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
        <NodeRow nodes={pattern.bottom} />
      </div>
    </div>
  )
}

export function RedundancyFailurePatterns() {
  return (
    <VisualContainer
      title="복제했는데 남는 SPOF 3패턴"
      description="복제본을 추가했는데도 여전히 시스템 전체를 멈출 수 있는 단일 경로가 어디에 남는지 비교합니다."
    >
      <div className="flex flex-col gap-4">
        {PATTERNS.map((pattern) => (
          <PatternCard key={pattern.id} pattern={pattern} />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border/40 pt-3 text-[length:var(--text-caption)] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-viz-blocked" />
          단일 경로 (SPOF)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-viz-confirmed" />
          복제된 정상 컴포넌트
        </span>
      </div>
    </VisualContainer>
  )
}
