'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses, type VizState } from './common/colors'

type CoroutineState = 'running' | 'suspended' | 'ready' | 'done'

interface Coroutine {
  id: string
  label: string
  state: CoroutineState
}

interface Snapshot {
  coroutines: Coroutine[]
  readyQueue: string[]
  ioRegistered: string[]
  ioCompleted: string[]
  activeThread: string | null
  note: string
}

const INITIAL: Coroutine[] = [
  { id: 'A', label: 'fetchUser()', state: 'ready' },
  { id: 'B', label: 'fetchOrders()', state: 'ready' },
  { id: 'C', label: 'fetchInventory()', state: 'ready' },
]

function computeSnapshots(): Snapshot[] {
  return [
    {
      coroutines: INITIAL,
      readyQueue: ['A', 'B', 'C'],
      ioRegistered: [],
      ioCompleted: [],
      activeThread: null,
      note: '초기 상태입니다. 3개의 코루틴이 실행 대기 중입니다.',
    },
    {
      coroutines: [
        { ...INITIAL[0], state: 'running' },
        INITIAL[1],
        INITIAL[2],
      ],
      readyQueue: ['B', 'C'],
      ioRegistered: [],
      ioCompleted: [],
      activeThread: 'A',
      note: 'Event Loop가 A를 스레드에 올려 실행을 시작합니다.',
    },
    {
      coroutines: [
        { ...INITIAL[0], state: 'suspended' },
        INITIAL[1],
        INITIAL[2],
      ],
      readyQueue: ['B', 'C'],
      ioRegistered: ['A'],
      ioCompleted: [],
      activeThread: null,
      note:
        'A가 await fetchUser()에 도달. Continuation을 Event Loop에 등록하고 스레드에서 빠져나옵니다.',
    },
    {
      coroutines: [
        { ...INITIAL[0], state: 'suspended' },
        { ...INITIAL[1], state: 'running' },
        INITIAL[2],
      ],
      readyQueue: ['C'],
      ioRegistered: ['A'],
      ioCompleted: [],
      activeThread: 'B',
      note: '스레드가 비었으므로 B를 꺼내 실행합니다. A는 여전히 I/O 대기 중입니다.',
    },
    {
      coroutines: [
        { ...INITIAL[0], state: 'suspended' },
        { ...INITIAL[1], state: 'suspended' },
        { ...INITIAL[2], state: 'running' },
      ],
      readyQueue: [],
      ioRegistered: ['A', 'B'],
      ioCompleted: [],
      activeThread: 'C',
      note: 'B도 await에서 suspend. C가 그 자리를 받아 실행 중입니다.',
    },
    {
      coroutines: [
        { ...INITIAL[0], state: 'ready' },
        { ...INITIAL[1], state: 'suspended' },
        { ...INITIAL[2], state: 'running' },
      ],
      readyQueue: ['A'],
      ioRegistered: ['B'],
      ioCompleted: ['A'],
      activeThread: 'C',
      note:
        'OS가 "A의 소켓에 데이터 도착" 알림. Event Loop는 A의 Continuation을 ready 큐로 옮깁니다.',
    },
    {
      coroutines: [
        { ...INITIAL[0], state: 'running' },
        { ...INITIAL[1], state: 'suspended' },
        { ...INITIAL[2], state: 'done' },
      ],
      readyQueue: [],
      ioRegistered: ['B'],
      ioCompleted: [],
      activeThread: 'A',
      note:
        'C가 완료되어 스레드가 비었고, Event Loop가 A를 꺼내 resume(결과)을 호출합니다. A는 state 1부터 재개.',
    },
    {
      coroutines: [
        { ...INITIAL[0], state: 'done' },
        { ...INITIAL[1], state: 'suspended' },
        { ...INITIAL[2], state: 'done' },
      ],
      readyQueue: [],
      ioRegistered: ['B'],
      ioCompleted: [],
      activeThread: null,
      note:
        'A 완료. 1개 스레드가 3개 코루틴을 번갈아 실행하며 I/O 대기 시간을 메웠습니다.',
    },
  ]
}

const STATE_TO_VIZ: Record<CoroutineState, VizState> = {
  running: 'comparing',
  suspended: 'waiting',
  ready: 'confirmed',
  done: 'highlight',
}

const STATE_LABEL: Record<CoroutineState, string> = {
  running: '실행 중',
  suspended: '중단 (I/O 대기)',
  ready: '재개 대기',
  done: '완료',
}

export function EventLoopDance() {
  const snapshots = useMemo(() => computeSnapshots(), [])
  const controller = useStepController(snapshots.length)
  const current = snapshots[controller.step]

  return (
    <VisualContainer
      title="Event Loop + 3개 코루틴의 이어달리기"
      description="1개 스레드가 3개 코루틴을 번갈아 실행합니다. 각 단계에서 어떤 코루틴이 어디에 있는지 추적해보세요"
      onReset={controller.reset}
    >
      <div className="space-y-4">
        {/* Thread slot */}
        <div className="rounded-[var(--radius-card)] border border-border bg-muted/20 p-3">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              Thread 1
            </span>
            <span className="text-[11px] text-muted-foreground">
              현재 이 코어에서 실행 중인 코루틴
            </span>
          </div>
          <div
            className={cn(
              'flex h-14 items-center justify-center rounded-[var(--radius-chip)] border-2 text-[14px] font-semibold transition-colors',
              current.activeThread
                ? vizStateClasses('comparing')
                : 'border-dashed border-border bg-muted/30 text-muted-foreground',
            )}
          >
            {current.activeThread ? (
              <>Coroutine {current.activeThread} 실행 중</>
            ) : (
              <>idle (대기 중인 코루틴 없음 또는 전환 중)</>
            )}
          </div>
        </div>

        {/* Coroutines row */}
        <div>
          <div className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            Coroutines
          </div>
          <div className="grid grid-cols-3 gap-2">
            {current.coroutines.map((c) => (
              <div
                key={c.id}
                className={cn(
                  'rounded-[var(--radius-card)] border-2 p-3 transition-colors',
                  vizStateClasses(STATE_TO_VIZ[c.state]),
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[14px] font-bold">{c.id}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                    {STATE_LABEL[c.state]}
                  </span>
                </div>
                <div className="mt-1 font-mono text-[11px] opacity-75">
                  {c.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Queues row */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <QueueBox
            title="Ready Queue"
            subtitle="Event Loop 실행 대기"
            items={current.readyQueue}
            emptyLabel="비어 있음"
            state="confirmed"
          />
          <QueueBox
            title="I/O 등록됨"
            subtitle="완료 대기 중"
            items={current.ioRegistered}
            emptyLabel="등록 없음"
            state="waiting"
          />
          <QueueBox
            title="I/O 완료 통지"
            subtitle="epoll_wait 리턴"
            items={current.ioCompleted}
            emptyLabel="없음"
            state="highlight"
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
          <LegendDot state="comparing" label="실행 중" />
          <LegendDot state="waiting" label="중단" />
          <LegendDot state="confirmed" label="재개 대기" />
          <LegendDot state="highlight" label="완료" />
        </div>
      </div>

      <StepController {...controller} stepDescription={current.note} />
    </VisualContainer>
  )
}

interface QueueBoxProps {
  title: string
  subtitle: string
  items: string[]
  emptyLabel: string
  state: VizState
}

function QueueBox({ title, subtitle, items, emptyLabel, state }: QueueBoxProps) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-background p-3">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-[12px] font-semibold text-foreground">
          {title}
        </span>
        <span className="text-[10px] text-muted-foreground">{subtitle}</span>
      </div>
      {items.length === 0 ? (
        <div className="flex h-8 items-center justify-center rounded-[var(--radius-chip)] border border-dashed border-border text-[11px] text-muted-foreground">
          {emptyLabel}
        </div>
      ) : (
        <div className="flex h-8 flex-wrap items-center gap-1">
          {items.map((id) => (
            <span
              key={id}
              className={cn(
                'inline-flex h-6 min-w-6 items-center justify-center rounded-[var(--radius-chip)] border px-2 text-[11px] font-mono font-semibold',
                vizStateClasses(state),
              )}
            >
              {id}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function LegendDot({ state, label }: { state: VizState; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          'inline-block h-2.5 w-2.5 rounded-full border',
          vizStateClasses(state),
        )}
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  )
}
