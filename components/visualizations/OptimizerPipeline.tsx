import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'

interface Stage {
  name: string
  description: string
  state: VizState
  substeps?: string[]
  exitNote?: string
}

const STAGES: Stage[] = [
  {
    name: 'SQL',
    description: '쿼리 입력',
    state: 'waiting',
  },
  {
    name: 'Parser',
    description: '구문 분석 → AST 생성',
    state: 'waiting',
  },
  {
    name: 'Optimizer (CBO)',
    description: '실행 계획 생성',
    state: 'highlight',
    substeps: [
      '통계 조회 (innodb_stats_*)',
      'Plan enumeration (greedy + pruning)',
      'Cost calculation (I/O + CPU)',
      'Plan select (최저 비용)',
    ],
    exitNote: 'EXPLAIN: 여기서 정지 → 계획 snapshot 출력',
  },
  {
    name: 'Executor',
    description: '계획 실행 + row fetch',
    state: 'waiting',
    exitNote: 'EXPLAIN ANALYZE: 여기까지 실행 → 실측치 추가',
  },
  {
    name: 'Result',
    description: '최종 결과 셋',
    state: 'waiting',
  },
]

export function OptimizerPipeline() {
  return (
    <VisualContainer
      title="MySQL 옵티마이저 파이프라인"
      description="EXPLAIN은 Optimizer 단계에서 멈춰서 결정만 출력합니다. EXPLAIN ANALYZE는 Executor까지 진행해 실측치를 추가합니다."
    >
      <ol className="space-y-1">
        {STAGES.map((stage, idx) => {
          const isLast = idx === STAGES.length - 1
          return (
            <li key={stage.name} className="grid grid-cols-[28px_1fr] gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full border text-[12px] font-semibold ${vizStateClasses(
                    stage.state,
                  )}`}
                >
                  {idx + 1}
                </span>
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className="mt-1 min-h-5 w-px flex-1 bg-border"
                  />
                )}
              </div>

              <div className="space-y-2 pb-3">
                <div
                  className={`rounded-[var(--radius-card)] border px-3 py-2 ${vizStateClasses(
                    stage.state,
                  )}`}
                >
                  <div className="text-[14px] font-semibold">{stage.name}</div>
                  <div className="text-[12px] opacity-80">
                    {stage.description}
                  </div>
                  {stage.substeps && (
                    <ol className="mt-2 space-y-1 text-[12px] opacity-90">
                      {stage.substeps.map((s, i) => (
                        <li key={s}>
                          {i + 1}. {s}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
                {stage.exitNote && (
                  <div className="ml-1 flex items-start gap-1.5 text-[12px] text-muted-foreground">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 inline-block h-px w-3 bg-border"
                    />
                    <span>{stage.exitNote}</span>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-viz-highlight" />
          EXPLAIN의 정지 지점
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-viz-waiting" />
          EXPLAIN은 거치지 않는 단계
        </span>
      </div>
    </VisualContainer>
  )
}
