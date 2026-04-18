'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses, type VizState } from './common/colors'

type ModelKey =
  | 'sync-blocking'
  | 'non-blocking-poll'
  | 'multiplexing'
  | 'signal-driven'
  | 'true-async'

interface Cell {
  state: VizState
  label: string
}

interface Frame {
  user: Cell
  kernel: Cell
  data: Cell
  note: string
}

interface ModelDef {
  key: ModelKey
  label: string
  subtitle: string
  frames: Frame[]
}

const MODELS: ModelDef[] = [
  {
    key: 'sync-blocking',
    label: 'Sync Blocking',
    subtitle: '전통 read(). 두 단계 모두 스레드가 멈춥니다',
    frames: [
      {
        user: { state: 'comparing', label: 'running' },
        kernel: { state: 'waiting', label: 'idle' },
        data: { state: 'waiting', label: '없음' },
        note: '스레드 실행 중. read() 호출 직전.',
      },
      {
        user: { state: 'blocked', label: 'sleep' },
        kernel: { state: 'comparing', label: '대기' },
        data: { state: 'waiting', label: '없음' },
        note: 'read() 호출. 데이터가 없어 스레드가 sleep 상태로 들어간다 (단계 1: 데이터 대기).',
      },
      {
        user: { state: 'blocked', label: 'sleep' },
        kernel: { state: 'comparing', label: '수신' },
        data: { state: 'comparing', label: '커널 버퍼' },
        note: '네트워크 데이터가 커널 버퍼에 도착. 스레드는 여전히 sleep.',
      },
      {
        user: { state: 'blocked', label: 'sleep' },
        kernel: { state: 'highlight', label: '복사' },
        data: { state: 'highlight', label: '복사 중' },
        note: '커널 버퍼에서 유저 버퍼로 복사 (단계 2). 이 순간도 스레드는 block.',
      },
      {
        user: { state: 'comparing', label: 'running' },
        kernel: { state: 'waiting', label: 'idle' },
        data: { state: 'confirmed', label: '유저 버퍼' },
        note: 'read() 리턴. 스레드가 깨어나 데이터 처리 진행.',
      },
    ],
  },
  {
    key: 'non-blocking-poll',
    label: 'Non-Blocking Poll',
    subtitle: 'O_NONBLOCK 폴링. 즉시 리턴받지만 CPU를 계속 사용합니다',
    frames: [
      {
        user: { state: 'comparing', label: 'running' },
        kernel: { state: 'waiting', label: 'idle' },
        data: { state: 'waiting', label: '없음' },
        note: '스레드가 O_NONBLOCK 플래그로 read() 호출 준비.',
      },
      {
        user: { state: 'highlight', label: 'poll 1' },
        kernel: { state: 'comparing', label: 'check' },
        data: { state: 'waiting', label: '없음' },
        note: 'read() 1회차. 데이터 없음 → 즉시 EAGAIN 리턴 (스레드는 block되지 않음).',
      },
      {
        user: { state: 'highlight', label: 'poll 2' },
        kernel: { state: 'comparing', label: 'check' },
        data: { state: 'waiting', label: '없음' },
        note: '짧은 간격 후 read() 2회차. 여전히 EAGAIN. CPU를 계속 돌리는 중.',
      },
      {
        user: { state: 'highlight', label: 'poll 3' },
        kernel: { state: 'highlight', label: '복사' },
        data: { state: 'comparing', label: '커널 버퍼' },
        note: 'read() 3회차. 데이터 도착 → 커널이 유저 버퍼로 복사 (이 순간만 block).',
      },
      {
        user: { state: 'comparing', label: 'running' },
        kernel: { state: 'waiting', label: 'idle' },
        data: { state: 'confirmed', label: '유저 버퍼' },
        note: '데이터 처리 진행. 폴링 횟수만큼 CPU 사이클이 소비되었음.',
      },
    ],
  },
  {
    key: 'multiplexing',
    label: 'I/O Multiplexing',
    subtitle: 'select / epoll. 여러 fd를 감시만 async, 실제 read는 sync',
    frames: [
      {
        user: { state: 'comparing', label: 'running' },
        kernel: { state: 'waiting', label: 'idle' },
        data: { state: 'waiting', label: 'fd들 감시 전' },
        note: '스레드가 여러 fd를 select() / epoll_wait()에 등록.',
      },
      {
        user: { state: 'blocked', label: 'select()' },
        kernel: { state: 'comparing', label: 'fd N개 감시' },
        data: { state: 'waiting', label: '도착 대기' },
        note: 'select() 호출. 스레드 block 상태로 여러 fd 중 하나가 ready 되기를 대기.',
      },
      {
        user: { state: 'blocked', label: 'select()' },
        kernel: { state: 'highlight', label: 'fd K ready' },
        data: { state: 'comparing', label: '커널 버퍼' },
        note: 'fd K에 데이터 도착 → select()가 ready set 리턴 준비.',
      },
      {
        user: { state: 'highlight', label: 'read(K)' },
        kernel: { state: 'highlight', label: '복사' },
        data: { state: 'highlight', label: '복사 중' },
        note: '스레드가 read(fd K)를 sync로 호출 → 커널이 유저 버퍼로 복사 (여전히 sync 구간).',
      },
      {
        user: { state: 'comparing', label: 'running' },
        kernel: { state: 'waiting', label: 'idle' },
        data: { state: 'confirmed', label: '유저 버퍼' },
        note: '데이터 처리 → 다시 select() 루프로 돌아감. Nginx, Node.js가 이 구조.',
      },
    ],
  },
  {
    key: 'signal-driven',
    label: 'Signal-Driven',
    subtitle: 'SIGIO. 커널이 시그널로 알려주지만 실제 read는 여전히 sync',
    frames: [
      {
        user: { state: 'comparing', label: 'handler 등록' },
        kernel: { state: 'waiting', label: 'idle' },
        data: { state: 'waiting', label: '없음' },
        note: '스레드가 SIGIO 시그널 핸들러를 등록 후 다른 일 수행.',
      },
      {
        user: { state: 'confirmed', label: 'other work' },
        kernel: { state: 'comparing', label: 'fd 감시' },
        data: { state: 'waiting', label: '없음' },
        note: '스레드는 block되지 않고 다른 작업 수행. 커널은 fd를 감시.',
      },
      {
        user: { state: 'confirmed', label: 'other work' },
        kernel: { state: 'highlight', label: 'SIGIO 발송' },
        data: { state: 'comparing', label: '커널 버퍼' },
        note: '데이터 도착 → 커널이 SIGIO 시그널 발송.',
      },
      {
        user: { state: 'highlight', label: 'handler + read()' },
        kernel: { state: 'highlight', label: '복사' },
        data: { state: 'highlight', label: '복사 중' },
        note: '시그널 핸들러가 발동. 핸들러에서 read() 호출 → 커널이 복사 (이 부분만 sync).',
      },
      {
        user: { state: 'comparing', label: 'main flow' },
        kernel: { state: 'waiting', label: 'idle' },
        data: { state: 'confirmed', label: '유저 버퍼' },
        note: '메인 흐름 재개. 시그널 처리의 까다로움 때문에 실무에서는 거의 쓰이지 않음.',
      },
    ],
  },
  {
    key: 'true-async',
    label: 'True Async',
    subtitle: 'io_uring / IOCP. 두 단계 모두 커널이 처리, 완료 통보',
    frames: [
      {
        user: { state: 'highlight', label: 'SQ 제출' },
        kernel: { state: 'waiting', label: 'idle' },
        data: { state: 'waiting', label: '없음' },
        note: '스레드가 submission queue에 I/O 요청 제출 후 즉시 리턴.',
      },
      {
        user: { state: 'confirmed', label: 'other work' },
        kernel: { state: 'comparing', label: '요청 처리' },
        data: { state: 'waiting', label: '없음' },
        note: '스레드는 completely 자유. 커널이 데이터 대기 중 (단계 1).',
      },
      {
        user: { state: 'confirmed', label: 'other work' },
        kernel: { state: 'highlight', label: '복사' },
        data: { state: 'highlight', label: '유저 버퍼' },
        note: '데이터 도착 → 커널이 유저 버퍼로 직접 복사 (단계 2). 스레드는 여전히 다른 일.',
      },
      {
        user: { state: 'confirmed', label: 'other work' },
        kernel: { state: 'highlight', label: 'CQ 기록' },
        data: { state: 'confirmed', label: '유저 버퍼' },
        note: '커널이 completion queue에 완료 이벤트 기록.',
      },
      {
        user: { state: 'comparing', label: 'CQ poll → 처리' },
        kernel: { state: 'waiting', label: 'idle' },
        data: { state: 'confirmed', label: '유저 버퍼' },
        note: '스레드가 CQ를 폴링(또는 콜백)으로 결과 수신. 두 단계 모두 비동기화됨.',
      },
    ],
  },
]

export function IOModelTimeline() {
  const [modelKey, setModelKey] = useState<ModelKey>('sync-blocking')
  const model = useMemo(
    () => MODELS.find((m) => m.key === modelKey) ?? MODELS[0],
    [modelKey],
  )
  const controller = useStepController(model.frames.length)
  const current = model.frames[controller.step]

  return (
    <VisualContainer
      title="I/O 모델 타임라인"
      description="각 모델이 User Thread, Kernel, Data 상태를 어떻게 다루는지 단계별로 비교하세요"
    >
      <div className="mb-3 flex flex-wrap gap-1">
        {MODELS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => {
              setModelKey(m.key)
              controller.reset()
            }}
            className={cn(
              'rounded-[var(--radius-chip)] border px-3 py-1.5 text-[12px] font-medium transition-colors',
              modelKey === m.key
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border bg-background text-muted-foreground hover:bg-muted',
            )}
            aria-pressed={modelKey === m.key}
          >
            {m.label}
          </button>
        ))}
      </div>

      <p className="mb-3 text-[length:var(--text-caption)] leading-relaxed text-muted-foreground">
        {model.subtitle}
      </p>

      <div className="space-y-2 rounded-[var(--radius-card)] border border-border bg-muted/30 p-3">
        <TimelineRow
          label="User Thread"
          frames={model.frames}
          current={controller.step}
          field="user"
        />
        <TimelineRow
          label="Kernel"
          frames={model.frames}
          current={controller.step}
          field="kernel"
        />
        <TimelineRow
          label="Data"
          frames={model.frames}
          current={controller.step}
          field="data"
        />
        <div className="flex items-center gap-2 pt-1 text-[10px] text-muted-foreground">
          <div className="w-24 shrink-0" />
          <div className="flex flex-1 justify-between px-1">
            <span>시간 →</span>
          </div>
        </div>
      </div>

      <StepController {...controller} stepDescription={current.note} />
    </VisualContainer>
  )
}

function TimelineRow({
  label,
  frames,
  current,
  field,
}: {
  label: string
  frames: Frame[]
  current: number
  field: 'user' | 'kernel' | 'data'
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 shrink-0 text-[11px] font-semibold text-foreground">
        {label}
      </div>
      <div className="flex flex-1 gap-1">
        {frames.map((frame, i) => {
          const cell = frame[field]
          const isPast = i < current
          const isCurrent = i === current
          const isFuture = i > current
          return (
            <div
              key={i}
              className={cn(
                'flex-1 rounded-[4px] border-2 px-1 py-1.5 text-center text-[10px] font-medium transition-all motion-reduce:transition-none',
                vizStateClasses(cell.state),
                isFuture && 'opacity-25',
                isPast && 'opacity-60',
                isCurrent && 'ring-2 ring-ring ring-offset-1 ring-offset-background',
              )}
            >
              {cell.label}
            </div>
          )
        })}
      </div>
    </div>
  )
}
