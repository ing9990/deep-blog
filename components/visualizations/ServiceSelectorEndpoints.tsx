import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'

interface PodEntry {
  name: string
  ip: string
  labels: { app: string; type?: string }
  state: VizState
  matched: boolean
}

const PODS: PodEntry[] = [
  {
    name: 'myapp-7c9fbb-2k4sd',
    ip: '10.244.0.2',
    labels: { app: 'myapp', type: 'front-end' },
    state: 'confirmed',
    matched: true,
  },
  {
    name: 'myapp-7c9fbb-fnp7q',
    ip: '10.244.0.3',
    labels: { app: 'myapp', type: 'front-end' },
    state: 'confirmed',
    matched: true,
  },
  {
    name: 'myapp-7c9fbb-x8r2c',
    ip: '10.244.0.4',
    labels: { app: 'myapp', type: 'front-end' },
    state: 'confirmed',
    matched: true,
  },
  {
    name: 'other-pod-9j2kr',
    ip: '10.244.0.9',
    labels: { app: 'log-agent' },
    state: 'blocked',
    matched: false,
  },
]

export function ServiceSelectorEndpoints() {
  const matchedIps = PODS.filter((p) => p.matched).map((p) => p.ip)

  return (
    <VisualContainer
      title="selector → Endpoints → Pod"
      description="Service의 selector가 라벨과 일치하는 Pod을 찾아 Endpoints 객체에 IP 목록으로 모읍니다. 라벨이 다른 Pod은 같은 클러스터에 있어도 빠집니다"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-start">
        <div className={`rounded-[var(--radius-card)] border p-3 ${vizStateClasses('pivot')}`}>
          <p className="text-[10.5px] uppercase tracking-wider opacity-70">Service</p>
          <p className="mt-1 font-mono text-[13px] font-semibold">myapp-service</p>
          <p className="mt-2 text-[11px] uppercase tracking-wider opacity-70">selector</p>
          <pre className="mt-1 font-mono text-[11.5px] leading-relaxed">
{`app: myapp
type: front-end`}
          </pre>
        </div>

        <div className="hidden text-muted-foreground lg:block" aria-hidden="true">
          →
        </div>

        <div className={`rounded-[var(--radius-card)] border p-3 ${vizStateClasses('highlight')}`}>
          <p className="text-[10.5px] uppercase tracking-wider opacity-70">Endpoints</p>
          <p className="mt-1 font-mono text-[13px] font-semibold">myapp-service</p>
          <p className="mt-2 text-[11px] uppercase tracking-wider opacity-70">subsets[0].addresses</p>
          <pre className="mt-1 font-mono text-[11.5px] leading-relaxed">
{matchedIps.map((ip) => `- ${ip}`).join('\n')}
          </pre>
          <p className="mt-2 text-[10.5px] leading-relaxed opacity-70">
            Service가 만들어질 때 자동 생성. Pod이 추가·삭제되면 자동 갱신
          </p>
        </div>

        <div className="hidden text-muted-foreground lg:block" aria-hidden="true">
          →
        </div>

        <div className="space-y-2">
          <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
            클러스터의 Pod 풀
          </p>
          {PODS.map((pod) => (
            <div
              key={pod.name}
              className={`rounded-[var(--radius-card)] border p-2.5 ${vizStateClasses(pod.state)}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-mono text-[12px] font-semibold">{pod.name}</p>
                <p className="font-mono text-[10.5px] opacity-70">{pod.ip}</p>
              </div>
              <p className="mt-1 font-mono text-[10.5px] opacity-80">
                {Object.entries(pod.labels)
                  .map(([k, v]) => `${k}=${v}`)
                  .join(' · ')}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-wider opacity-60">
                {pod.matched ? 'selector 일치' : 'selector 불일치 — 제외'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </VisualContainer>
  )
}
