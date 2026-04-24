import { VisualContainer } from './common/VisualContainer'
import { vizStateClasses } from './common/colors'
import { cn } from '@/lib/utils'

interface Stage {
  label: string
  detail: string
  data: string
}

const LEXICAL_STAGES: Stage[] = [
  {
    label: '쿼리 수신',
    detail: '사용자 입력 그대로',
    data: '"결제 실패 로그"',
  },
  {
    label: '토크나이즈',
    detail: '공백 분리 + 정규화',
    data: '["결제", "실패", "로그"]',
  },
  {
    label: 'Inverted Index 조회',
    detail: 'term → posting list 병합',
    data: 'doc_ids: [42, 103, 789, ...]',
  },
  {
    label: 'BM25 스코어링',
    detail: 'TF 포화 + IDF + 길이 보정',
    data: 'score: 12.7, 9.3, 6.1, ...',
  },
  {
    label: 'Top-K 랭킹',
    detail: '점수 내림차순 정렬',
    data: 'rank₁, rank₂, rank₃, ...',
  },
]

const SEMANTIC_STAGES: Stage[] = [
  {
    label: '쿼리 수신',
    detail: '사용자 입력 그대로',
    data: '"결제 실패 로그"',
  },
  {
    label: 'Embedding 생성',
    detail: '모델 추론 (bge-m3 등)',
    data: 'vec: float[768]',
  },
  {
    label: 'ANN 인덱스 탐색',
    detail: 'HNSW · IVF 근접 탐색',
    data: 'candidates: [v₁, v₂, ..., v_N]',
  },
  {
    label: 'Cosine 거리 계산',
    detail: '쿼리 벡터 ↔ 후보 벡터',
    data: 'sim: 0.87, 0.82, 0.78, ...',
  },
  {
    label: 'Top-K 랭킹',
    detail: '유사도 내림차순 정렬',
    data: 'rank₁, rank₂, rank₃, ...',
  },
]

function StageCard({
  index,
  stage,
  state,
}: {
  index: number
  stage: Stage
  state: 'pivot' | 'highlight'
}) {
  return (
    <div
      className={cn(
        'relative rounded-[var(--radius-card)] border p-3',
        vizStateClasses(state),
      )}
    >
      <div className="flex items-start gap-2">
        <span className="inline-flex size-5 flex-shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-semibold">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold leading-tight">{stage.label}</p>
          <p className="mt-0.5 text-[11px] leading-snug opacity-80">{stage.detail}</p>
          <p className="mt-1.5 truncate font-mono text-[11px] opacity-70">
            {stage.data}
          </p>
        </div>
      </div>
    </div>
  )
}

function PipelineColumn({
  title,
  subtitle,
  stages,
  state,
}: {
  title: string
  subtitle: string
  stages: Stage[]
  state: 'pivot' | 'highlight'
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="mb-3">
        <p className="text-[13px] font-semibold text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        {stages.map((stage, i) => (
          <div key={stage.label} className="flex flex-col">
            <StageCard index={i} stage={stage} state={state} />
            {i < stages.length - 1 && (
              <div className="my-0.5 flex justify-center text-muted-foreground">
                <span className="text-[13px]" aria-hidden="true">
                  ↓
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SearchPipelineCompare() {
  return (
    <VisualContainer
      title="Lexical · Semantic · Hybrid 파이프라인"
      description="같은 쿼리가 두 축에서 어떻게 흘러 어떻게 합쳐지는지"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">
        <PipelineColumn
          title="Lexical Pipeline"
          subtitle="형태 일치 · BM25"
          stages={LEXICAL_STAGES}
          state="pivot"
        />
        <PipelineColumn
          title="Semantic Pipeline"
          subtitle="의미 벡터 · ANN"
          stages={SEMANTIC_STAGES}
          state="highlight"
        />
      </div>

      <div className="mt-4 flex justify-center">
        <div className="flex flex-col items-center gap-0.5 text-muted-foreground">
          <span className="text-[13px]" aria-hidden="true">
            ↘ &nbsp; ↙
          </span>
        </div>
      </div>

      <div className={cn('mt-2 rounded-[var(--radius-card)] border p-4', vizStateClasses('confirmed'))}>
        <div className="flex flex-col gap-1">
          <p className="text-[13px] font-semibold">RRF 결합 (Reciprocal Rank Fusion)</p>
          <p className="text-[12px] opacity-80">
            각 축에서 순위만 추출해 합산, 점수 스케일 차이를 원천적으로 제거
          </p>
          <p className="mt-1 font-mono text-[12px] opacity-75">
            score(doc) = 1 / (k + rank_lex) + 1 / (k + rank_sem), &nbsp; k = 60
          </p>
        </div>
      </div>

      <div className="mt-1 flex justify-center text-muted-foreground">
        <span className="text-[13px]" aria-hidden="true">
          ↓
        </span>
      </div>

      <div className="rounded-[var(--radius-card)] border border-border bg-background p-3 text-center">
        <p className="text-[13px] font-semibold text-foreground">최종 Top-K 결과</p>
        <p className="text-[11px] text-muted-foreground">두 축의 상보적 강점이 합쳐진 단일 랭킹</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-viz-pivot" />
          Lexical 축
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-viz-highlight" />
          Semantic 축
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-viz-confirmed" />
          결합 결과
        </span>
      </div>
    </VisualContainer>
  )
}
