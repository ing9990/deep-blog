import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'

interface ClaimNode {
  num: number
  label: string
  depth: number
  parent: number | null
  kind: 'method' | 'system' | 'media'
  state: VizState
  note?: string
}

const CLAIMS: ClaimNode[] = [
  {
    num: 1,
    label: '방법 (Method) 독립항',
    depth: 0,
    parent: null,
    kind: 'method',
    state: 'pivot',
    note: 'MSA → pair embedding → self-attention NN → 3D 구조',
  },
  {
    num: 2,
    label: 'self-attention layer 동작 정의',
    depth: 1,
    parent: 1,
    kind: 'method',
    state: 'comparing',
  },
  {
    num: 3,
    label: 'proper subset으로 한정',
    depth: 2,
    parent: 2,
    kind: 'method',
    state: 'comparing',
  },
  {
    num: 4,
    label: 'row-wise self-attention',
    depth: 3,
    parent: 3,
    kind: 'method',
    state: 'highlight',
  },
  {
    num: 5,
    label: 'column-wise self-attention',
    depth: 4,
    parent: 4,
    kind: 'method',
    state: 'highlight',
  },
  {
    num: 6,
    label: 'row/column alternating 배열 ★',
    depth: 5,
    parent: 5,
    kind: 'method',
    state: 'confirmed',
    note: 'Grid Transformer 핵심 구조',
  },
  {
    num: 7,
    label: 'pair → single embedding → 3D',
    depth: 1,
    parent: 1,
    kind: 'method',
    state: 'comparing',
  },
  {
    num: 8,
    label: 'MSA cluster/extra split',
    depth: 1,
    parent: 1,
    kind: 'method',
    state: 'comparing',
  },
  {
    num: 9,
    label: 'cluster ↔ extra 반복 업데이트',
    depth: 2,
    parent: 8,
    kind: 'method',
    state: 'comparing',
  },
  {
    num: 10,
    label: '시스템 (System) 독립항',
    depth: 0,
    parent: null,
    kind: 'system',
    state: 'pivot',
    note: 'Claim 1의 시스템 버전',
  },
  {
    num: 16,
    label: '저장매체 (Storage Media) 독립항',
    depth: 0,
    parent: null,
    kind: 'media',
    state: 'pivot',
    note: 'Claim 1의 매체 버전',
  },
]

const KIND_LABEL: Record<ClaimNode['kind'], string> = {
  method: '행위 자체 (process)',
  system: '컴퓨터 시스템 (machine)',
  media: '코드가 담긴 매체 (article)',
}

export function ClaimHierarchyTree() {
  return (
    <VisualContainer
      title="특허 청구항 계층 구조"
      description="3개 독립항 + 17개 종속항. Claim 1의 종속 체인이 기술적 신규성의 핵심입니다."
    >
      <div className="space-y-3">
        {CLAIMS.map((claim) => {
          const indent = claim.depth * 20
          const showKindLabel = claim.depth === 0
          return (
            <div
              key={claim.num}
              className="flex items-start gap-2"
              style={{ paddingLeft: `${indent}px` }}
            >
              {claim.depth > 0 && (
                <span
                  className="mt-3 flex-shrink-0 text-muted-foreground"
                  aria-hidden="true"
                >
                  └─
                </span>
              )}
              <div
                className={`flex-1 rounded-[var(--radius-card)] border-2 p-2.5 ${vizStateClasses(
                  claim.state,
                )}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <code className="text-[11px] font-bold tabular-nums opacity-80">
                      Claim {claim.num}
                    </code>
                    <span className="text-[12px] font-semibold">{claim.label}</span>
                  </div>
                  {showKindLabel && (
                    <span className="text-[10px] italic opacity-70">
                      {KIND_LABEL[claim.kind]}
                    </span>
                  )}
                </div>
                {claim.note && (
                  <p className="mt-1 text-[10px] leading-relaxed opacity-85">
                    {claim.note}
                  </p>
                )}
              </div>
            </div>
          )
        })}

        <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-muted/20 p-2.5 text-[11px] text-muted-foreground">
          <strong className="font-semibold text-foreground">생략:</strong> Claim 11
          ~ 15 (시스템 종속항, Claim 2 ~ 6의 시스템 버전), Claim 17 ~ 20 (매체 종속항,
          Claim 2 ~ 5의 매체 버전). 같은 기술 한정을 3 범주에 걸쳐 반복 청구하는
          미국 특허 실무의 정석.
        </div>
      </div>
    </VisualContainer>
  )
}
