import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'

interface Caller {
  ns: string
  call: string
  resolves: string
  state: VizState
  note: string
}

const CALLERS: Caller[] = [
  {
    ns: 'default',
    call: 'curl http://back-end',
    resolves: 'back-end.default.svc.cluster.local → 10.96.0.42',
    state: 'confirmed',
    note: '같은 Namespace이므로 짧은 이름만으로 충분',
  },
  {
    ns: 'monitoring',
    call: 'curl http://back-end',
    resolves: '먼저 back-end.monitoring.svc.cluster.local 시도 → 없음 → 외부 DNS로 빠짐 → 실패',
    state: 'blocked',
    note: '다른 Namespace에서 짧은 이름을 부르면 자기 Namespace를 먼저 본다',
  },
  {
    ns: 'monitoring',
    call: 'curl http://back-end.default',
    resolves: 'back-end.default.svc.cluster.local → 10.96.0.42',
    state: 'confirmed',
    note: '풀네임의 일부만 적어도 CoreDNS가 나머지를 자동으로 채운다',
  },
  {
    ns: 'monitoring',
    call: 'curl http://back-end.default.svc.cluster.local',
    resolves: 'back-end.default.svc.cluster.local → 10.96.0.42',
    state: 'highlight',
    note: '클러스터 전역에서 가장 명확한 풀네임',
  },
]

export function ClusterIPDnsResolution() {
  return (
    <VisualContainer
      title="같은 Namespace는 짧게, 다른 Namespace는 풀네임으로"
      description="CoreDNS가 Service 이름을 ClusterIP로 해석할 때 호출자의 Namespace를 먼저 봅니다. 다른 Namespace의 Service를 부르려면 어디까지 적어야 하는지 정리합니다"
    >
      <div className="space-y-2.5">
        {CALLERS.map((c, idx) => (
          <div
            key={`${c.ns}-${idx}`}
            className={`rounded-[var(--radius-card)] border p-3 ${vizStateClasses(c.state)}`}
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wider opacity-70">
                ns={c.ns}
              </span>
              <span className="font-mono text-[12.5px] font-semibold">{c.call}</span>
            </div>
            <p className="mt-1.5 font-mono text-[11.5px] leading-relaxed opacity-90">
              {c.resolves}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{c.note}</p>
          </div>
        ))}
      </div>
    </VisualContainer>
  )
}
