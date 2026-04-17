'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses, type VizState } from './common/colors'

interface Link {
  id: string
  title: string
  subtitle: string
  state: VizState
}

interface Snapshot {
  activeIndex: number
  note: string
}

const LINKS: Array<Omit<Link, 'state'>> = [
  {
    id: 'two-generals',
    title: 'Two Generals Problem',
    subtitle: '비동기 네트워크에서 양측 상호 합의 불가',
  },
  {
    id: 'retry',
    title: '재시도 필연성',
    subtitle: '"불확실" 결과를 해결할 유일한 수단',
  },
  {
    id: 'at-least-once',
    title: 'at-least-once delivery',
    subtitle: '중복 허용 전달, 업계 표준',
  },
  {
    id: 'dedupe-problem',
    title: '중복 감지 문제',
    subtitle: '수신측에서 "같은 요청 두 번째"를 어떻게 알아채나?',
  },
  {
    id: 'key-dedupe',
    title: '키 기반 dedupe',
    subtitle: 'Idempotency-Key 또는 자연 멱등 설계',
  },
]

function computeSnapshots(): Snapshot[] {
  const notes = [
    '인과 사슬을 하나씩 따라가며 멱등성이 왜 필연인지 살펴봅니다.',
    'Two Generals Problem. 비동기 네트워크에서는 양측이 "상대가 받았다"를 확정적으로 합의할 수 없다는 고전 결과입니다.',
    '합의가 불가능하므로 클라이언트는 타임아웃 시 재시도할 수밖에 없습니다. 재시도가 분산 시스템의 필연적 도구가 됩니다.',
    '재시도 정책을 가진 시스템은 자동으로 at-least-once 전달로 수렴합니다. AWS SQS, Kafka, gRPC 모두 이 속성을 기본값으로 가집니다.',
    '문제가 수신측으로 전이됩니다. "같은 요청이 두 번 도착했을 때 두 번 실행할 것인가?" 돈/재고가 걸린 연산에서는 No.',
    '해결책은 키 기반 de-duplication입니다. Idempotency-Key 테이블 또는 연산 의미론을 자연 멱등으로 설계하는 두 갈래로 귀결됩니다.',
  ]
  return notes.map((note, idx) => ({ activeIndex: idx - 1, note }))
}

interface IdempotencyCausalityChainProps {
  description?: string
}

export function IdempotencyCausalityChain({
  description = '분산 시스템의 CS 제약이 어떻게 멱등성 설계를 필연적으로 강제하는지 인과 사슬을 따라가며 확인하세요.',
}: IdempotencyCausalityChainProps) {
  const snapshots = useMemo(computeSnapshots, [])
  const controller = useStepController(snapshots.length)
  const current = snapshots[controller.step]

  return (
    <VisualContainer
      title="CS 제약 인과 사슬"
      description={description}
    >
      <div className="space-y-2">
        {LINKS.map((link, idx) => {
          const isActive = current.activeIndex === idx
          const isPast = current.activeIndex > idx
          const state: VizState = isActive
            ? 'highlight'
            : isPast
              ? 'confirmed'
              : 'waiting'
          const isDim = !isActive && !isPast
          return (
            <ChainLink
              key={link.id}
              link={{ ...link, state }}
              showArrow={idx < LINKS.length - 1}
              dimmed={isDim}
            />
          )
        })}
      </div>

      <StepController {...controller} stepDescription={current.note} />

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <LegendDot state="highlight" label="현재 단계" />
        <LegendDot state="confirmed" label="도달한 단계" />
        <LegendDot state="waiting" label="앞으로 나올 단계" />
      </div>
    </VisualContainer>
  )
}

interface ChainLinkProps {
  link: Link
  showArrow: boolean
  dimmed: boolean
}

function ChainLink({ link, showArrow, dimmed }: ChainLinkProps) {
  return (
    <div className="space-y-1">
      <div
        className={cn(
          'rounded-[10px] border-2 p-3 transition-all duration-300 motion-reduce:transition-none',
          dimmed ? 'opacity-50' : 'opacity-100',
          vizStateClasses(link.state),
        )}
      >
        <div className="text-[13px] font-semibold leading-tight">{link.title}</div>
        <div className="mt-1 text-[12px] leading-snug opacity-90">{link.subtitle}</div>
      </div>
      {showArrow && (
        <div
          className={cn(
            'text-center text-[14px] font-bold leading-none transition-opacity duration-300 motion-reduce:transition-none',
            dimmed ? 'text-muted-foreground/30' : 'text-muted-foreground',
          )}
          aria-hidden="true"
        >
          ↓
        </div>
      )}
    </div>
  )
}

function LegendDot({ state, label }: { state: VizState; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn('inline-block h-3 w-3 rounded-sm border-2', vizStateClasses(state))}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}
