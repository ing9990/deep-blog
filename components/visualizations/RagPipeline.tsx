import { ArrowRight } from 'lucide-react'
import { VisualContainer } from './common/VisualContainer'
import { vizStateClasses, type VizState } from './common/colors'

interface Step {
  label: string
  sub: string
  state: VizState
}

const INDEXING: Step[] = [
  { label: '문서', sub: 'PDF, 위키, 사내 DB', state: 'waiting' },
  { label: 'Chunking', sub: '수백 토큰 단위로 분할', state: 'highlight' },
  { label: 'Embedding', sub: '각 chunk → 벡터', state: 'comparing' },
  { label: 'Vector DB', sub: 'chunk + 벡터 + 메타데이터', state: 'confirmed' },
]

const QUERYING: Step[] = [
  { label: '사용자 질문', sub: '자연어', state: 'waiting' },
  { label: 'Query 벡터화', sub: '같은 embedding 모델', state: 'comparing' },
  { label: 'ANN 검색', sub: 'top-k chunk', state: 'highlight' },
  { label: '프롬프트 주입', sub: '참고 문서 + 질문', state: 'pivot' },
  { label: 'LLM 응답', sub: '근거 문서 기반 답변', state: 'confirmed' },
]

function StepCard({ step }: { step: Step }) {
  return (
    <div
      className={`min-w-[120px] flex-shrink-0 rounded-[var(--radius-card)] border px-3 py-2.5 ${vizStateClasses(
        step.state,
      )}`}
    >
      <p className="text-[length:var(--text-sm)] font-semibold">{step.label}</p>
      <p className="mt-0.5 text-[11px] leading-snug opacity-80">{step.sub}</p>
    </div>
  )
}

function Flow({ title, steps }: { title: string; steps: Step[] }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="flex items-stretch gap-1.5 overflow-x-auto pb-2">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-1.5">
            <StepCard step={step} />
            {i < steps.length - 1 && (
              <ArrowRight
                className="h-4 w-4 flex-shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function RagPipeline() {
  return (
    <VisualContainer
      title="RAG의 두 단계 파이프라인"
      description="오프라인 Indexing과 온라인 Querying이 벡터 DB를 공유합니다"
    >
      <div className="space-y-5">
        <Flow title="Indexing (오프라인, 1회)" steps={INDEXING} />
        <Flow title="Querying (온라인, 요청마다)" steps={QUERYING} />
      </div>
    </VisualContainer>
  )
}
