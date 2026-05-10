import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'

interface NamespaceCell {
  ns: string
  tag: string
  state: VizState
  resources: { name: string; kind: string; highlight?: boolean }[]
}

const NAMESPACES: NamespaceCell[] = [
  {
    ns: 'default',
    tag: '클러스터 기본',
    state: 'waiting',
    resources: [
      { name: 'web-pod', kind: 'Pod' },
      { name: 'web-deployment', kind: 'Deployment' },
    ],
  },
  {
    ns: 'dev',
    tag: '개발 환경',
    state: 'comparing',
    resources: [
      { name: 'db-service', kind: 'Service', highlight: true },
      { name: 'web-pod', kind: 'Pod' },
    ],
  },
  {
    ns: 'prod',
    tag: '프로덕션',
    state: 'confirmed',
    resources: [
      { name: 'db-service', kind: 'Service', highlight: true },
      { name: 'web-deployment', kind: 'Deployment' },
    ],
  },
]

export function NamespaceIsolation() {
  return (
    <VisualContainer
      title="Namespace는 이름의 격리 단위"
      description="같은 이름의 db-service가 dev와 prod에 동시에 존재해도 서로 부딪치지 않습니다. 한 Namespace 안에서만 이름이 유일하면 됩니다"
    >
      <div className="grid gap-3 md:grid-cols-3">
        {NAMESPACES.map((cell) => (
          <NamespaceBox key={cell.ns} cell={cell} />
        ))}
      </div>
      <p className="mt-4 border-t border-border/40 pt-3 text-[12px] leading-relaxed text-muted-foreground">
        강조된 두 <span className="font-mono">db-service</span>는 같은 이름이지만 서로 다른 Namespace 소속입니다. K8s는 이름의 유일성을 클러스터 전체가 아니라 <span className="font-mono">(namespace, name)</span> 쌍 단위로 검사합니다.
      </p>
    </VisualContainer>
  )
}

function NamespaceBox({ cell }: { cell: NamespaceCell }) {
  return (
    <div className="rounded-[var(--radius-panel)] border-2 border-dashed border-border p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-mono text-[13px] font-semibold text-foreground">{cell.ns}</p>
        <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{cell.tag}</p>
      </div>
      <div className="mt-3 space-y-2">
        {cell.resources.map((res) => (
          <div
            key={res.name}
            className={`rounded-[var(--radius-card)] border p-2.5 ${vizStateClasses(
              res.highlight ? cell.state : 'waiting',
            )} ${res.highlight ? 'ring-2 ring-offset-2 ring-offset-background' : ''}`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-mono text-[12px] font-semibold">{res.name}</p>
              <p className="text-[10.5px] uppercase tracking-wider opacity-70">{res.kind}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
