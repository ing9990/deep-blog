import { VisualContainer } from './common/VisualContainer'
import { vizStateClasses, type VizState } from './common/colors'
import { cn } from '@/lib/utils'

type System = 'DB' | 'ES'

interface Step {
  time: string
  system: System
  action: string
  state: VizState
}

interface Scenario {
  title: string
  steps: Step[]
  finalDb: { value: string; state: VizState }
  finalEs: { value: string; state: VizState }
  verdict: string
}

const SCENARIOS: Scenario[] = [
  {
    title: '외부 호출 실패',
    steps: [
      { time: 't₁', system: 'DB', action: 'UPDATE 커밋', state: 'confirmed' },
      { time: 't₂', system: 'ES', action: 'index 호출 (네트워크 타임아웃)', state: 'blocked' },
    ],
    finalDb: { value: '새 값', state: 'confirmed' },
    finalEs: { value: '과거 값', state: 'blocked' },
    verdict: '검색 인덱스가 과거 상태로 남음',
  },
  {
    title: '역순: 외부 먼저 → DB 롤백',
    steps: [
      { time: 't₁', system: 'ES', action: 'index 성공', state: 'confirmed' },
      { time: 't₂', system: 'DB', action: 'UPDATE 롤백 (제약 위반 등)', state: 'blocked' },
    ],
    finalDb: { value: '과거 값', state: 'waiting' },
    finalEs: { value: '유령 상태', state: 'blocked' },
    verdict: 'DB에 없는 상태가 검색 인덱스에 존재',
  },
  {
    title: '커밋 후 크래시',
    steps: [
      { time: 't₁', system: 'DB', action: 'UPDATE 커밋', state: 'confirmed' },
      { time: 't₂', system: 'ES', action: '호출 직전 프로세스 크래시', state: 'blocked' },
    ],
    finalDb: { value: '새 값', state: 'confirmed' },
    finalEs: { value: '과거 값', state: 'blocked' },
    verdict: '재시작해도 호출을 재현할 방법이 없음',
  },
]

function SystemBadge({ system }: { system: System }) {
  const label = system === 'DB' ? 'DB' : 'ES'
  return (
    <span className="inline-flex h-5 min-w-[28px] items-center justify-center rounded-[4px] border border-border bg-muted/40 px-1.5 font-mono text-[10px] font-semibold text-muted-foreground">
      {label}
    </span>
  )
}

export function DualWriteFailureWindows() {
  return (
    <VisualContainer
      title="Dual-write의 세 가지 실패 창"
      description="DB와 외부 시스템을 순차로 갱신하는 순진한 코드가 결국 어떤 상태 불일치로 끝나는지 세 시나리오를 나란히 보여줍니다."
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {SCENARIOS.map((scenario) => (
          <div
            key={scenario.title}
            className="flex flex-col rounded-[var(--radius-card)] border border-border bg-muted/20 p-3"
          >
            <div className="mb-3 text-[length:var(--text-meta)] font-semibold text-foreground">
              {scenario.title}
            </div>

            <div className="flex-1 space-y-2">
              {scenario.steps.map((step, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex items-start gap-2 rounded-[6px] border-2 p-2 text-[11px] leading-snug',
                    vizStateClasses(step.state),
                  )}
                >
                  <span className="mt-0.5 font-mono text-[10px] font-semibold opacity-70">
                    {step.time}
                  </span>
                  <SystemBadge system={step.system} />
                  <span className="flex-1">{step.action}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-[6px] border border-border bg-background p-2">
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                최종 상태
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div
                  className={cn(
                    'rounded-[4px] border px-1.5 py-1 text-[10px]',
                    vizStateClasses(scenario.finalDb.state),
                  )}
                >
                  <div className="font-mono text-[9px] font-semibold opacity-70">DB</div>
                  <div className="font-medium">{scenario.finalDb.value}</div>
                </div>
                <div
                  className={cn(
                    'rounded-[4px] border px-1.5 py-1 text-[10px]',
                    vizStateClasses(scenario.finalEs.state),
                  )}
                >
                  <div className="font-mono text-[9px] font-semibold opacity-70">ES</div>
                  <div className="font-medium">{scenario.finalEs.value}</div>
                </div>
              </div>
              <div className="mt-2 text-[10px] leading-snug text-muted-foreground">
                → {scenario.verdict}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span
            className={cn('inline-block size-2 rounded-sm border-2', vizStateClasses('confirmed'))}
            aria-hidden="true"
          />
          성공 / 쓰기 반영됨
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className={cn('inline-block size-2 rounded-sm border-2', vizStateClasses('blocked'))}
            aria-hidden="true"
          />
          실패 / 어긋난 상태
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className={cn('inline-block size-2 rounded-sm border-2', vizStateClasses('waiting'))}
            aria-hidden="true"
          />
          롤백됨
        </span>
      </div>
    </VisualContainer>
  )
}
