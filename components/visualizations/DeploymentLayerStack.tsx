import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'

interface PodEntry {
  name: string
  state: VizState
}

const PODS: PodEntry[] = [
  { name: 'myapp-deployment-7c9fbb-2k4sd', state: 'confirmed' },
  { name: 'myapp-deployment-7c9fbb-fnp7q', state: 'confirmed' },
  { name: 'myapp-deployment-7c9fbb-x8r2c', state: 'confirmed' },
]

export function DeploymentLayerStack() {
  return (
    <VisualContainer
      title="Deployment → ReplicaSet → Pod 3단 계층"
      description="사용자가 만드는 객체는 Deployment 한 개. ReplicaSet과 Pod은 자동으로 따라옵니다. 이름 해시가 어디서 왔는지 함께 표시했습니다"
    >
      <div className="space-y-4">
        <LayerBox
          tag="Layer 1 · 사용자가 만드는 객체"
          state="pivot"
          name="myapp-deployment"
          subtitle="kind: Deployment"
          tail="replicas: 3, selector: type=front-end"
        />

        <ArrowDown label="Deployment가 자동으로 만든다" />

        <LayerBox
          tag="Layer 2 · 자동 생성"
          state="comparing"
          name="myapp-deployment-7c9fbb"
          subtitle="kind: ReplicaSet"
          tail="이름 = Deployment 이름 + template 해시"
        />

        <ArrowDown label="ReplicaSet이 selector에 맞춰 만든다" />

        <div className="rounded-[var(--radius-panel)] border-2 border-dashed border-border p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Layer 3 · ReplicaSet이 만드는 Pod (replicas만큼)
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {PODS.map((pod) => (
              <div
                key={pod.name}
                className={`rounded-[var(--radius-card)] border p-2.5 ${vizStateClasses(pod.state)}`}
              >
                <p className="font-mono text-[11px] leading-tight break-all">
                  {pod.name}
                </p>
                <p className="mt-1.5 text-[10.5px] uppercase tracking-wider opacity-70">
                  kind: Pod
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 border-t border-border/40 pt-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
            Pod 이름 = ReplicaSet 이름 + 무작위 접미사. 같은 RS에서 만든 파드는 가운데 해시(<span className="font-mono">7c9fbb</span>)를 공유합니다.
          </p>
        </div>
      </div>
    </VisualContainer>
  )
}

interface LayerBoxProps {
  tag: string
  state: VizState
  name: string
  subtitle: string
  tail: string
}

function LayerBox({ tag, state, name, subtitle, tail }: LayerBoxProps) {
  return (
    <div className="rounded-[var(--radius-panel)] border-2 border-dashed border-border p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {tag}
      </p>
      <div className={`mt-3 rounded-[var(--radius-card)] border p-3 ${vizStateClasses(state)}`}>
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-mono text-[13px] font-semibold">{name}</p>
          <p className="text-[10.5px] uppercase tracking-wider opacity-70">{subtitle}</p>
        </div>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{tail}</p>
      </div>
    </div>
  )
}

function ArrowDown({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center text-muted-foreground" aria-hidden="true">
      <span className="text-lg leading-none">↓</span>
      <span className="mt-0.5 text-[11px]">{label}</span>
    </div>
  )
}
