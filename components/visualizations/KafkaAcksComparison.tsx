import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { vizStateClasses, type VizState } from './common/colors'

interface Scenario {
  acks: string
  label: string
  riskState: VizState
  steps: TimelineEvent[]
  ackAt: number
  riskNote: string
}

interface TimelineEvent {
  actor: 'Producer' | 'Leader' | 'Followers'
  label: string
  /** Mark this row as the "ack returned" point. */
  isAck?: boolean
  /** Visual note for the row. */
  detail?: string
}

const SCENARIOS: Scenario[] = [
  {
    acks: '0',
    label: 'Fire and forget',
    riskState: 'blocked',
    ackAt: 1,
    steps: [
      { actor: 'Producer', label: 'send(M)' },
      { actor: 'Producer', label: 'ack 즉시 리턴', isAck: true, detail: 'Broker 응답 대기 안 함' },
      { actor: 'Leader', label: '(M 아직 도착 여부 미확인)' },
      { actor: 'Followers', label: '(복제 여부 무관)' },
    ],
    riskNote: 'Broker 가 받았는지조차 확인 안 함. 네트워크 drop 이면 통째로 유실.',
  },
  {
    acks: '1',
    label: 'Leader 확인',
    riskState: 'comparing',
    ackAt: 2,
    steps: [
      { actor: 'Producer', label: 'send(M)' },
      { actor: 'Leader', label: '디스크에 M append (LEO+1)' },
      { actor: 'Leader', label: 'ack 리턴', isAck: true, detail: 'Follower 복제 전에 응답' },
      { actor: 'Followers', label: 'Fetch 로 M 수신 (비동기)', detail: '이 지점 전에 Leader 죽으면 유실' },
    ],
    riskNote: 'Leader 가 응답한 직후, Follower 복제 전에 Leader 가 죽으면 M 은 사라짐.',
  },
  {
    acks: 'all',
    label: 'ISR 전체 확인',
    riskState: 'confirmed',
    ackAt: 3,
    steps: [
      { actor: 'Producer', label: 'send(M)' },
      { actor: 'Leader', label: '디스크에 M append' },
      { actor: 'Followers', label: 'Fetch 로 M 수신 (ISR 전체)', detail: 'HW 전진 직전' },
      { actor: 'Leader', label: 'ack 리턴', isAck: true, detail: 'HW 가 M 을 포함한 뒤 응답' },
    ],
    riskNote: 'ISR 전체가 M 을 가진 뒤 응답. Leader 가 죽어도 ISR 중 누군가 갖고 있어 유실 없음.',
  },
]

export function KafkaAcksComparison() {
  return (
    <VisualContainer
      title="acks 옵션별 응답 시점과 유실 위험"
      description='Producer 의 send() 이후 어느 시점에 "성공" 응답이 돌아오는지, 그 사이 Leader 가 죽으면 어떤 일이 일어나는지 비교합니다.'
    >
      <div className="grid gap-4 md:grid-cols-3">
        {SCENARIOS.map((s) => (
          <ScenarioCard key={s.acks} scenario={s} />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
        <LegendDot state="blocked" label="고위험: Broker 확인 안 함" />
        <LegendDot state="comparing" label="중간: Leader 만 확인" />
        <LegendDot state="confirmed" label="안전: ISR 전체 확인" />
      </div>
    </VisualContainer>
  )
}

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border-2 bg-background p-4',
        vizStateClasses(scenario.riskState),
      )}
    >
      <div className="mb-3 flex items-baseline justify-between">
        <span className="font-mono text-[14px] font-bold">acks={scenario.acks}</span>
        <span className="text-[11px] font-medium opacity-70">{scenario.label}</span>
      </div>

      <div className="space-y-1.5">
        {scenario.steps.map((step, idx) => (
          <TimelineRow
            key={idx}
            actor={step.actor}
            label={step.label}
            detail={step.detail}
            isAck={step.isAck}
            isAckedBefore={idx < scenario.ackAt}
          />
        ))}
      </div>

      <div className="mt-4 rounded-[var(--radius-chip)] border border-border/60 bg-background/60 p-2 text-[11px] leading-relaxed opacity-90">
        <span className="font-semibold">결과:</span> {scenario.riskNote}
      </div>
    </div>
  )
}

interface TimelineRowProps {
  actor: 'Producer' | 'Leader' | 'Followers'
  label: string
  detail?: string
  isAck?: boolean
  isAckedBefore: boolean
}

function TimelineRow({ actor, label, detail, isAck, isAckedBefore }: TimelineRowProps) {
  return (
    <div className="flex items-start gap-2">
      <div
        className={cn(
          'mt-0.5 flex w-[84px] flex-shrink-0 items-center justify-center rounded-[var(--radius-chip)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
          actor === 'Producer' && 'bg-muted text-muted-foreground',
          actor === 'Leader' && 'bg-viz-highlight-bg text-viz-highlight-fg',
          actor === 'Followers' && 'bg-background text-muted-foreground',
        )}
      >
        {actor}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              'text-[12px] leading-tight',
              isAck ? 'font-semibold' : '',
              !isAckedBefore && !isAck && 'opacity-50',
            )}
          >
            {label}
          </span>
          {isAck && (
            <span className="rounded-[var(--radius-chip)] bg-viz-confirmed-bg px-1.5 py-0 text-[10px] font-semibold text-viz-confirmed-fg">
              ack 반환
            </span>
          )}
        </div>
        {detail && (
          <p
            className={cn(
              'mt-0.5 text-[11px] leading-snug opacity-70',
              !isAckedBefore && !isAck && 'opacity-40',
            )}
          >
            {detail}
          </p>
        )}
      </div>
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
