import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'

interface NodeBox {
  name: string
  ip: string
  pods: { name: string; ip: string; state: VizState }[]
}

const NODES: NodeBox[] = [
  {
    name: 'node-1',
    ip: '192.168.1.2',
    pods: [{ name: 'myapp-2k4sd', ip: '10.244.0.2', state: 'confirmed' }],
  },
  {
    name: 'node-2',
    ip: '192.168.1.3',
    pods: [
      { name: 'myapp-fnp7q', ip: '10.244.1.5', state: 'confirmed' },
      { name: 'myapp-x8r2c', ip: '10.244.1.6', state: 'confirmed' },
    ],
  },
  {
    name: 'node-3',
    ip: '192.168.1.4',
    pods: [],
  },
]

export function ServiceMultiNodeNodePort() {
  return (
    <VisualContainer
      title="모든 노드에 동일 NodePort가 열린다"
      description="외부 클라이언트가 어느 노드 IP로 접근하든 같은 Pod 풀에 도달합니다. Pod이 그 노드에 없는 경우(node-3)에도 노드는 다른 노드의 Pod으로 트래픽을 전달합니다"
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          {NODES.map((node) => (
            <div key={node.name} className="rounded-[var(--radius-panel)] border-2 border-dashed border-border p-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-mono text-[13px] font-semibold text-foreground">{node.name}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{node.ip}</p>
              </div>
              <div className={`mt-2 rounded-[var(--radius-card)] border p-2 ${vizStateClasses('highlight')}`}>
                <p className="font-mono text-[11.5px] font-semibold">listen :30008</p>
                <p className="text-[10px] uppercase tracking-wider opacity-70">NodePort</p>
              </div>
              <div className="mt-2 space-y-1.5">
                {node.pods.length === 0 ? (
                  <p className="rounded-[var(--radius-card)] border border-dashed border-border/60 p-2 text-center text-[11px] italic text-muted-foreground">
                    이 노드에는 매치 Pod 없음
                  </p>
                ) : (
                  node.pods.map((pod) => (
                    <div
                      key={pod.name}
                      className={`rounded-[var(--radius-card)] border p-2 ${vizStateClasses(pod.state)}`}
                    >
                      <p className="font-mono text-[11.5px] font-semibold">{pod.name}</p>
                      <p className="font-mono text-[10.5px] opacity-70">{pod.ip}:80</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-[var(--radius-card)] border border-border/60 bg-muted/30 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            외부에서 들어오는 요청
          </p>
          <pre className="mt-1.5 font-mono text-[11.5px] leading-relaxed text-foreground">
{`curl http://192.168.1.2:30008   # node-1로 들어가도
curl http://192.168.1.3:30008   # node-2로 들어가도
curl http://192.168.1.4:30008   # node-3로 들어가도 (Pod 없음)
                                 # → 같은 Endpoints 풀의 Pod 중 하나로 도달`}
          </pre>
        </div>
      </div>
    </VisualContainer>
  )
}
