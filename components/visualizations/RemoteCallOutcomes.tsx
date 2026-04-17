'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses, type VizState } from './common/colors'

type Outcome = 'success' | 'fail' | 'uncertain'

interface Snapshot {
  highlight: Outcome | null
  retryActive: boolean
  idempotencyActive: boolean
  note: string
}

function computeSnapshots(): Snapshot[] {
  return [
    {
      highlight: null,
      retryActive: false,
      idempotencyActive: false,
      note: '클라이언트가 서버로 원격 호출을 보냅니다. 응답 결과는 세 가지 중 하나입니다.',
    },
    {
      highlight: 'success',
      retryActive: false,
      idempotencyActive: false,
      note: '① 성공 응답: 서버가 처리를 마치고 200 응답이 돌아옴. 완료로 확정합니다.',
    },
    {
      highlight: 'fail',
      retryActive: false,
      idempotencyActive: false,
      note: '② 실패 응답: 4xx 또는 서버의 명시적 오류 응답. 실패로 확정합니다.',
    },
    {
      highlight: 'uncertain',
      retryActive: false,
      idempotencyActive: false,
      note: '③ 불확실: 타임아웃, 커넥션 drop, 응답 소실. 서버가 처리했는지 클라이언트는 알 수 없습니다.',
    },
    {
      highlight: 'uncertain',
      retryActive: true,
      idempotencyActive: false,
      note: '불확실을 해결하는 유일한 방법은 재시도입니다. 하지만 재시도는 중복 실행 위험을 동반합니다.',
    },
    {
      highlight: 'uncertain',
      retryActive: true,
      idempotencyActive: true,
      note: '멱등성이 없으면 중복 결제가 발생합니다. 멱등성이 있으면 재시도가 안전해집니다. 이것이 멱등성이 존재해야 하는 근본 이유입니다.',
    },
  ]
}

interface RemoteCallOutcomesProps {
  description?: string
}

export function RemoteCallOutcomes({
  description = '원격 호출의 세 가지 결과(성공/실패/불확실)와, 왜 "불확실"이 멱등성을 강제하는지 단계별로 살펴봅니다.',
}: RemoteCallOutcomesProps) {
  const snapshots = useMemo(computeSnapshots, [])
  const controller = useStepController(snapshots.length)
  const current = snapshots[controller.step]

  return (
    <VisualContainer title="원격 호출의 세 가지 결과" description={description}>
      <div className="space-y-3">
        <OriginBox />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <OutcomeCard
            outcome="success"
            title="① 성공"
            detail="200 OK"
            state="confirmed"
            active={current.highlight === 'success'}
          />
          <OutcomeCard
            outcome="fail"
            title="② 실패"
            detail="4xx/5xx 명시"
            state="blocked"
            active={current.highlight === 'fail'}
          />
          <OutcomeCard
            outcome="uncertain"
            title="③ 불확실"
            detail="타임아웃 / drop"
            state="pivot"
            active={current.highlight === 'uncertain'}
          />
        </div>

        <Cascade
          retryActive={current.retryActive}
          idempotencyActive={current.idempotencyActive}
        />
      </div>

      <StepController {...controller} stepDescription={current.note} />

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <LegendDot state="confirmed" label="확정 결과" />
        <LegendDot state="blocked" label="실패" />
        <LegendDot state="pivot" label="불확실" />
        <LegendDot state="highlight" label="해결 경로" />
      </div>
    </VisualContainer>
  )
}

function OriginBox() {
  return (
    <div className="flex items-center justify-center rounded-[10px] border-2 border-border bg-muted/20 p-3">
      <div className="text-center">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Client
        </div>
        <div className="mt-0.5 text-[13px] font-semibold">원격 호출</div>
      </div>
    </div>
  )
}

interface OutcomeCardProps {
  outcome: Outcome
  title: string
  detail: string
  state: VizState
  active: boolean
}

function OutcomeCard({ title, detail, state, active }: OutcomeCardProps) {
  return (
    <div
      className={cn(
        'rounded-[10px] border-2 p-3 text-center transition-all duration-300 motion-reduce:transition-none',
        active ? vizStateClasses(state) : 'border-border/40 bg-muted/10 text-muted-foreground/70',
      )}
    >
      <div className="text-[13px] font-semibold">{title}</div>
      <div className="mt-1 font-mono text-[11px] opacity-90">{detail}</div>
    </div>
  )
}

interface CascadeProps {
  retryActive: boolean
  idempotencyActive: boolean
}

function Cascade({ retryActive, idempotencyActive }: CascadeProps) {
  return (
    <div className="space-y-2 pt-2">
      <CascadeRow
        label="→ 재시도 (유일한 해결책)"
        active={retryActive}
        state="comparing"
      />
      <CascadeRow
        label="→ 멱등성 (재시도를 안전하게)"
        active={idempotencyActive}
        state="highlight"
      />
    </div>
  )
}

interface CascadeRowProps {
  label: string
  active: boolean
  state: VizState
}

function CascadeRow({ label, active, state }: CascadeRowProps) {
  return (
    <div
      className={cn(
        'rounded-[8px] border-2 p-2.5 text-center text-[12px] font-medium transition-all duration-300 motion-reduce:transition-none',
        active ? vizStateClasses(state) : 'border-border/30 bg-muted/5 text-muted-foreground/50',
      )}
    >
      {label}
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
