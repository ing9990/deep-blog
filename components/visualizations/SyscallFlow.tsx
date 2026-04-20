'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses, type VizState } from './common/colors'

type Mode = 'user' | 'kernel'

interface Register {
  name: string
  value: string
  state: VizState
}

interface Frame {
  mode: Mode
  userPanel: { state: VizState; label: string; detail: string }
  kernelPanel: { state: VizState; label: string; detail: string }
  registers: Register[]
  note: string
}

function buildFrames(): Frame[] {
  return [
    {
      mode: 'user',
      userPanel: {
        state: 'comparing',
        label: 'running',
        detail: 'read(fd, buf, n) 호출 준비',
      },
      kernelPanel: {
        state: 'waiting',
        label: 'idle',
        detail: '대기',
      },
      registers: [
        { name: 'CPL', value: '3', state: 'highlight' },
        { name: 'RAX', value: '?', state: 'waiting' },
        { name: 'RIP', value: 'user code', state: 'waiting' },
      ],
      note: '유저 앱이 glibc의 read() 래퍼를 호출합니다. 아직 유저 모드 (Ring 3).',
    },
    {
      mode: 'user',
      userPanel: {
        state: 'highlight',
        label: 'prepare',
        detail: 'glibc가 시스템 콜 번호·인자 세팅',
      },
      kernelPanel: {
        state: 'waiting',
        label: 'idle',
        detail: '대기',
      },
      registers: [
        { name: 'CPL', value: '3', state: 'highlight' },
        { name: 'RAX', value: '0 (sys_read)', state: 'highlight' },
        { name: 'RDI/RSI/RDX', value: 'fd, buf, n', state: 'highlight' },
      ],
      note: 'glibc가 시스템 콜 번호 0(sys_read)을 RAX에, 인자들을 RDI/RSI/RDX에 배치합니다.',
    },
    {
      mode: 'kernel',
      userPanel: {
        state: 'blocked',
        label: 'paused',
        detail: '유저 RSP 저장됨',
      },
      kernelPanel: {
        state: 'highlight',
        label: 'entry',
        detail: 'syscall 명령 실행됨',
      },
      registers: [
        { name: 'CPL', value: '3 → 0', state: 'pivot' },
        { name: 'RIP', value: 'MSR_LSTAR', state: 'pivot' },
        { name: 'RSP', value: 'kernel stack', state: 'pivot' },
      ],
      note: 'syscall 명령어 실행. CPU가 자동으로 Ring 0 전환 + RIP를 커널 엔트리(MSR_LSTAR)로 점프 + 커널 스택 교체.',
    },
    {
      mode: 'kernel',
      userPanel: {
        state: 'blocked',
        label: 'paused',
        detail: '대기 중',
      },
      kernelPanel: {
        state: 'comparing',
        label: 'dispatch',
        detail: 'sys_call_table[0] 조회',
      },
      registers: [
        { name: 'CPL', value: '0', state: 'confirmed' },
        { name: 'RAX', value: '0', state: 'highlight' },
        { name: 'target', value: 'sys_read', state: 'highlight' },
      ],
      note: '커널 엔트리가 RAX의 번호(0)로 sys_call_table을 조회해 실제 핸들러 sys_read 주소를 얻습니다.',
    },
    {
      mode: 'kernel',
      userPanel: {
        state: 'blocked',
        label: 'paused',
        detail: '대기 중',
      },
      kernelPanel: {
        state: 'pivot',
        label: 'sys_read',
        detail: 'VFS → FS → block → disk',
      },
      registers: [
        { name: 'CPL', value: '0', state: 'confirmed' },
        { name: 'buf', value: 'filling...', state: 'pivot' },
      ],
      note: 'sys_read가 파일 시스템 계층을 거쳐 디스크에서 데이터를 읽고 유저 버퍼에 복사합니다.',
    },
    {
      mode: 'kernel',
      userPanel: {
        state: 'blocked',
        label: 'paused',
        detail: '대기 중',
      },
      kernelPanel: {
        state: 'highlight',
        label: 'return',
        detail: 'sysret 준비',
      },
      registers: [
        { name: 'CPL', value: '0 → 3', state: 'pivot' },
        { name: 'RAX', value: 'bytes read', state: 'confirmed' },
        { name: 'RIP', value: 'user (복원)', state: 'pivot' },
      ],
      note: '결과를 RAX에 세팅하고 sysret 명령으로 유저 모드(Ring 3) 복귀 준비.',
    },
    {
      mode: 'user',
      userPanel: {
        state: 'confirmed',
        label: 'resumed',
        detail: 'read() 리턴값 수신',
      },
      kernelPanel: {
        state: 'waiting',
        label: 'idle',
        detail: '대기',
      },
      registers: [
        { name: 'CPL', value: '3', state: 'highlight' },
        { name: 'RAX', value: 'bytes read', state: 'confirmed' },
        { name: 'buf', value: '데이터 채워짐', state: 'confirmed' },
      ],
      note: '유저 모드 복귀 완료. glibc가 RAX 값을 read()의 리턴값으로 앱에 넘깁니다.',
    },
  ]
}

export function SyscallFlow() {
  const frames = useMemo(() => buildFrames(), [])
  const controller = useStepController(frames.length)
  const current = frames[controller.step]

  return (
    <VisualContainer
      title="시스템 콜 흐름: read()"
      description="유저 모드에서 호출한 read()가 커널 모드를 거쳐 돌아오는 7단계. 각 단계의 CPU 레지스터와 권한 레벨을 확인하세요."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ModePanel
          title="유저 공간 (Ring 3)"
          active={current.mode === 'user'}
          state={current.userPanel.state}
          label={current.userPanel.label}
          detail={current.userPanel.detail}
        />
        <ModePanel
          title="커널 공간 (Ring 0)"
          active={current.mode === 'kernel'}
          state={current.kernelPanel.state}
          label={current.kernelPanel.label}
          detail={current.kernelPanel.detail}
        />
      </div>

      <div className="mt-4 rounded-[var(--radius-card)] border border-border bg-muted/30 p-3">
        <p className="mb-2 text-[length:var(--text-caption)] font-semibold text-muted-foreground">
          CPU 상태
        </p>
        <div className="flex flex-wrap gap-2">
          {current.registers.map((reg) => (
            <span
              key={reg.name}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-[var(--radius-chip)] border-2 px-2.5 py-1 font-mono text-[length:var(--text-caption)]',
                vizStateClasses(reg.state),
              )}
            >
              <span className="font-semibold">{reg.name}</span>
              <span>=</span>
              <span>{reg.value}</span>
            </span>
          ))}
        </div>
      </div>

      <StepController {...controller} stepDescription={current.note} />

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[length:var(--text-caption)] text-muted-foreground">
        <LegendDot stateClass="bg-viz-highlight-bg border-viz-highlight" label="진행 중" />
        <LegendDot stateClass="bg-viz-pivot-bg border-viz-pivot" label="모드 전환" />
        <LegendDot stateClass="bg-viz-comparing-bg border-viz-comparing" label="실행" />
        <LegendDot stateClass="bg-viz-blocked-bg border-viz-blocked" label="일시 정지" />
        <LegendDot stateClass="bg-viz-confirmed-bg border-viz-confirmed" label="완료" />
      </div>
    </VisualContainer>
  )
}

interface ModePanelProps {
  title: string
  active: boolean
  state: VizState
  label: string
  detail: string
}

function ModePanel({ title, active, state, label, detail }: ModePanelProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border-2 p-4 transition-all duration-300 motion-reduce:transition-none',
        active ? vizStateClasses(state) : 'border-border bg-muted/20 opacity-60',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[length:var(--text-caption)] font-semibold uppercase tracking-[var(--tracking-wider)]">
          {title}
        </p>
        <span className="rounded-[var(--radius-chip)] border border-current px-2 py-0.5 text-[length:var(--text-caption)] font-mono">
          {label}
        </span>
      </div>
      <p className="mt-2 text-[length:var(--text-body)] leading-relaxed">{detail}</p>
    </div>
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
