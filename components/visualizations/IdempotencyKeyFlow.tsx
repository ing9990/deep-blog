'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses, type VizState } from './common/colors'

interface Snapshot {
  client: { label: string; state: VizState }
  keys: Array<{ key: string; result: string; highlight: boolean }>
  biz: { balance: number; state: VizState }
  activeArrow: 'c2k' | 'k2biz' | 'biz2k' | 'k2c' | 'none'
  note: string
}

const KEY_A = 'req-abc-123'

function computeSnapshots(): Snapshot[] {
  const snaps: Snapshot[] = []

  snaps.push({
    client: { label: '대기 중', state: 'waiting' },
    keys: [],
    biz: { balance: 100, state: 'waiting' },
    activeArrow: 'none',
    note: '초기 상태. Keys 테이블은 비어 있고 계좌 잔액은 100만원입니다.',
  })

  snaps.push({
    client: { label: `POST /charge\nkey=${KEY_A}`, state: 'comparing' },
    keys: [],
    biz: { balance: 100, state: 'waiting' },
    activeArrow: 'c2k',
    note: '클라이언트가 Idempotency-Key를 헤더에 담아 첫 요청을 전송합니다.',
  })

  snaps.push({
    client: { label: '요청 전송됨', state: 'waiting' },
    keys: [],
    biz: { balance: 100, state: 'waiting' },
    activeArrow: 'none',
    note: `서버: Keys 테이블에서 "${KEY_A}"를 조회. 없음 → 정상 처리로 진입.`,
  })

  snaps.push({
    client: { label: '요청 전송됨', state: 'waiting' },
    keys: [],
    biz: { balance: 90, state: 'comparing' },
    activeArrow: 'k2biz',
    note: '비즈니스 로직 실행: 잔액에서 10만원 차감 (100 → 90).',
  })

  snaps.push({
    client: { label: '요청 전송됨', state: 'waiting' },
    keys: [{ key: KEY_A, result: '200 {balance:90}', highlight: true }],
    biz: { balance: 90, state: 'confirmed' },
    activeArrow: 'biz2k',
    note: '처리 결과와 응답(status+body)을 Keys 테이블에 저장. 상태 변경과 같은 트랜잭션으로 커밋.',
  })

  snaps.push({
    client: { label: '⚠️ 타임아웃!\n(응답 소실)', state: 'blocked' },
    keys: [{ key: KEY_A, result: '200 {balance:90}', highlight: false }],
    biz: { balance: 90, state: 'confirmed' },
    activeArrow: 'none',
    note: '서버는 응답을 보냈지만 네트워크에서 소실. 클라이언트는 타임아웃 상태이므로 성공/실패를 알 수 없음.',
  })

  snaps.push({
    client: { label: `재시도\nkey=${KEY_A}`, state: 'comparing' },
    keys: [{ key: KEY_A, result: '200 {balance:90}', highlight: false }],
    biz: { balance: 90, state: 'confirmed' },
    activeArrow: 'c2k',
    note: '클라이언트가 동일한 Idempotency-Key로 재시도. 서버에 다시 요청 도착.',
  })

  snaps.push({
    client: { label: '재시도 중', state: 'waiting' },
    keys: [{ key: KEY_A, result: '200 {balance:90}', highlight: true }],
    biz: { balance: 90, state: 'confirmed' },
    activeArrow: 'none',
    note: `서버: Keys 테이블에서 "${KEY_A}" 조회. 발견 ✓. 저장된 응답을 그대로 재생(replay).`,
  })

  snaps.push({
    client: { label: '✓ 응답 수신\n200 {balance:90}', state: 'confirmed' },
    keys: [{ key: KEY_A, result: '200 {balance:90}', highlight: false }],
    biz: { balance: 90, state: 'confirmed' },
    activeArrow: 'k2c',
    note: '비즈니스 로직은 건너뜀. 잔액은 여전히 90이며 중복 차감 없이 동일 응답을 반환.',
  })

  return snaps
}

interface IdempotencyKeyFlowProps {
  description?: string
}

export function IdempotencyKeyFlow({
  description = '타임아웃 후 재시도 시 Idempotency-Key가 어떻게 중복 실행을 막고 저장된 응답을 재생하는지 단계별로 확인하세요.',
}: IdempotencyKeyFlowProps) {
  const snapshots = useMemo(computeSnapshots, [])
  const controller = useStepController(snapshots.length)
  const current = snapshots[controller.step]

  return (
    <VisualContainer title="Idempotency-Key 처리 흐름" description={description}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <BoxColumn label="Client">
          <ClientBox snapshot={current} />
        </BoxColumn>

        <BoxColumn label="Server: Keys Table">
          <KeysTableBox snapshot={current} />
        </BoxColumn>

        <BoxColumn label="Server: Business DB">
          <BizBox snapshot={current} />
        </BoxColumn>
      </div>

      <FlowIndicator active={current.activeArrow} />

      <StepController {...controller} stepDescription={current.note} />

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <LegendDot state="comparing" label="처리 중" />
        <LegendDot state="confirmed" label="확정" />
        <LegendDot state="blocked" label="실패/불확실" />
        <LegendDot state="waiting" label="대기" />
      </div>
    </VisualContainer>
  )
}

interface BoxColumnProps {
  label: string
  children: React.ReactNode
}

function BoxColumn({ label, children }: BoxColumnProps) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  )
}

function ClientBox({ snapshot }: { snapshot: Snapshot }) {
  return (
    <div
      className={cn(
        'flex min-h-[92px] items-center justify-center rounded-[10px] border-2 p-3 text-center text-[12px] font-medium leading-snug whitespace-pre-line transition-all duration-300 motion-reduce:transition-none',
        vizStateClasses(snapshot.client.state),
      )}
    >
      {snapshot.client.label}
    </div>
  )
}

function KeysTableBox({ snapshot }: { snapshot: Snapshot }) {
  const empty = snapshot.keys.length === 0
  return (
    <div className="min-h-[92px] rounded-[10px] border border-border bg-muted/20 p-2.5">
      {empty ? (
        <div className="flex h-full min-h-[68px] items-center justify-center text-[11px] italic text-muted-foreground/70">
          비어 있음
        </div>
      ) : (
        <div className="space-y-1.5">
          {snapshot.keys.map((row) => (
            <div
              key={row.key}
              className={cn(
                'rounded-[6px] border-2 p-2 text-[11px] leading-snug transition-all duration-300 motion-reduce:transition-none',
                vizStateClasses(row.highlight ? 'pivot' : 'confirmed'),
              )}
            >
              <div className="font-mono font-semibold">{row.key}</div>
              <div className="mt-0.5 font-mono text-[10px] opacity-80">{row.result}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BizBox({ snapshot }: { snapshot: Snapshot }) {
  return (
    <div
      className={cn(
        'flex min-h-[92px] flex-col items-center justify-center rounded-[10px] border-2 p-3 text-center transition-all duration-300 motion-reduce:transition-none',
        vizStateClasses(snapshot.biz.state),
      )}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
        balance
      </div>
      <div className="mt-1 text-[22px] font-bold tabular-nums">
        {snapshot.biz.balance}
        <span className="ml-0.5 text-[12px] font-medium opacity-75">만원</span>
      </div>
    </div>
  )
}

function FlowIndicator({ active }: { active: Snapshot['activeArrow'] }) {
  const ARROW_LABEL: Record<Snapshot['activeArrow'], string | null> = {
    c2k: 'Client → Keys (요청 도착, 키 조회)',
    k2biz: 'Keys → Business (키 없음 → 비즈 로직 실행)',
    biz2k: 'Business → Keys (처리 결과 + 응답 저장)',
    k2c: 'Keys → Client (저장된 응답 replay)',
    none: null,
  }
  const label = ARROW_LABEL[active]
  if (!label) {
    return (
      <div className="mt-3 h-6 text-center text-[11px] italic text-muted-foreground/50">
        흐름 대기 중
      </div>
    )
  }
  return (
    <div className="mt-3 flex h-6 items-center justify-center text-[11px] font-medium text-primary">
      → {label}
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
