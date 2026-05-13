import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'

interface PodTarget {
  name: string
  ip: string
  state: VizState
}

const BACKEND_PODS: PodTarget[] = [
  { name: 'back-end-7c9-2k4sd', ip: '10.244.0.5', state: 'confirmed' },
  { name: 'back-end-7c9-fnp7q', ip: '10.244.0.6', state: 'confirmed' },
  { name: 'back-end-7c9-x8r2c', ip: '10.244.0.7', state: 'confirmed' },
]

export function ClusterIPVirtualHop() {
  return (
    <VisualContainer
      title="호출자 Pod → ClusterIP(가상 IP) → kube-proxy 규칙 → 실제 Pod"
      description="ClusterIP는 어느 노드의 NIC에도 붙어 있지 않은 가상 IP입니다. kube-proxy가 iptables/IPVS 규칙으로 패킷을 selector가 고른 Pod 중 하나에 옮깁니다"
    >
      <div className="space-y-3">
        <div className={`rounded-[var(--radius-card)] border p-3 ${vizStateClasses('pivot')}`}>
          <p className="text-[10.5px] uppercase tracking-wider opacity-70">호출자 Pod (front-end)</p>
          <p className="mt-1 font-mono text-[13px] font-semibold">10.244.0.2</p>
          <p className="mt-1.5 font-mono text-[11.5px] leading-relaxed">
            curl http://back-end:80
          </p>
          <p className="mt-1 text-[11px] leading-relaxed opacity-80">
            DNS가 back-end 이름을 ClusterIP로 해석
          </p>
        </div>

        <div className="flex flex-col items-center text-muted-foreground" aria-hidden="true">
          <span className="text-lg leading-none">↓</span>
          <span className="mt-0.5 text-[11px]">DNS 해석 후 가상 IP로 패킷 송출</span>
        </div>

        <div className={`rounded-[var(--radius-card)] border p-3 ${vizStateClasses('highlight')}`}>
          <p className="text-[10.5px] uppercase tracking-wider opacity-70">ClusterIP (Service: back-end)</p>
          <p className="mt-1 font-mono text-[13px] font-semibold">10.96.0.42 : 80</p>
          <p className="mt-1.5 text-[11px] leading-relaxed opacity-80">
            가상 IP — 노드의 NIC에 붙어 있지 않다. 클러스터 내부에서만 통한다
          </p>
        </div>

        <div className="flex flex-col items-center text-muted-foreground" aria-hidden="true">
          <span className="text-lg leading-none">↓</span>
          <span className="mt-0.5 text-[11px]">kube-proxy가 미리 박아 둔 iptables / IPVS 규칙</span>
        </div>

        <div className={`rounded-[var(--radius-card)] border p-3 ${vizStateClasses('comparing')}`}>
          <p className="text-[10.5px] uppercase tracking-wider opacity-70">kube-proxy 규칙</p>
          <pre className="mt-1 font-mono text-[11.5px] leading-relaxed">
{`if dst == 10.96.0.42:80
  DNAT → 10.244.0.5 / 10.244.0.6 / 10.244.0.7
         (selector가 고른 Pod 풀)`}
          </pre>
        </div>

        <div className="flex flex-col items-center text-muted-foreground" aria-hidden="true">
          <span className="text-lg leading-none">↓</span>
          <span className="mt-0.5 text-[11px]">매 패킷마다 한 대상 선택 (iptables 통계 분산)</span>
        </div>

        <div className="rounded-[var(--radius-panel)] border-2 border-dashed border-border p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Endpoints — selector 매치 Pod IP 목록
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {BACKEND_PODS.map((pod) => (
              <div
                key={pod.ip}
                className={`rounded-[var(--radius-card)] border p-2.5 ${vizStateClasses(pod.state)}`}
              >
                <p className="font-mono text-[11.5px] font-semibold">{pod.name}</p>
                <p className="mt-0.5 font-mono text-[11px] opacity-80">{pod.ip} : 80</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </VisualContainer>
  )
}
