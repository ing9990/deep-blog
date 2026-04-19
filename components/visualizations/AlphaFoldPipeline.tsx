import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'

interface Stage {
  step: number
  label: string
  shape: string
  role: string
  state: VizState
}

const STAGES: Stage[] = [
  {
    step: 1,
    label: '아미노산 서열',
    shape: 'N 문자',
    role: '입력. 길이 N의 1차원 서열 (예: MKTAYIAK...)',
    state: 'waiting',
  },
  {
    step: 2,
    label: 'MSA 구축',
    shape: 'M × N 격자',
    role: 'UniRef / BFD에서 유사 단백질 서열 수백~수천 개 수집 후 정렬',
    state: 'comparing',
  },
  {
    step: 3,
    label: 'MSA Embedding',
    shape: 'M × N × E',
    role: 'MSA 격자를 숫자 벡터 표현으로 변환 (cluster/extra split 최적화)',
    state: 'comparing',
  },
  {
    step: 4,
    label: 'Pair Embedding 초기화',
    shape: 'N × N × E',
    role: 'MSA에서 아미노산 쌍 단위 관계 벡터 격자 생성 (outer product mean)',
    state: 'highlight',
  },
  {
    step: 5,
    label: 'Grid Transformer',
    shape: 'N × N × E',
    role: 'row-wise / column-wise self-attention 교대로 pair embedding 정제 (5~45층)',
    state: 'pivot',
  },
  {
    step: 6,
    label: 'Single Embedding',
    shape: 'N × E',
    role: 'pair embedding에서 각 아미노산의 최종 단일 벡터 추출',
    state: 'comparing',
  },
  {
    step: 7,
    label: 'Folding NN',
    shape: 'N × (3 + 9)',
    role: '각 아미노산의 3D 좌표 (x,y,z) 와 회전 행렬 (3×3) 생성',
    state: 'confirmed',
  },
  {
    step: 8,
    label: '예측된 3D 구조',
    shape: '3D PDB',
    role: '출력. 단백질 전체의 원자 좌표. 약 1초 이내에 완성',
    state: 'confirmed',
  },
]

export function AlphaFoldPipeline() {
  return (
    <VisualContainer
      title="AlphaFold 파이프라인 (특허 FIG 1 재구성)"
      description="아미노산 서열 하나가 3D 구조로 변환되는 8단계. 각 단계의 데이터 형상과 역할."
    >
      <div className="space-y-2">
        {STAGES.map((stage, idx) => (
          <div key={stage.step} className="space-y-1.5">
            <div
              className={`rounded-[var(--radius-card)] border-2 p-3 ${vizStateClasses(
                stage.state,
              )}`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-current text-[11px] font-bold tabular-nums">
                    {stage.step}
                  </span>
                  <span className="text-[13px] font-semibold">{stage.label}</span>
                </div>
                <code className="rounded-md border border-current/30 bg-background/40 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
                  {stage.shape}
                </code>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed opacity-90">
                {stage.role}
              </p>
            </div>
            {idx < STAGES.length - 1 && (
              <div className="flex justify-center text-muted-foreground" aria-hidden="true">
                <span className="text-[14px]">↓</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </VisualContainer>
  )
}
