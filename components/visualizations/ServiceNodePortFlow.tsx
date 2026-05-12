import { vizStateClasses } from './common/colors'
import { VisualContainer } from './common/VisualContainer'

export function ServiceNodePortFlow() {
  return (
    <VisualContainer
      title="외부 클라이언트 → 노드:NodePort → ClusterIP → Pod"
      description="두 네트워크가 다릅니다. 사용자의 노트북은 노드 네트워크에는 닿지만, Pod 네트워크에는 닿지 못합니다. 그 사이를 NodePort가 잇습니다"
    >
      <div className="space-y-3">
        <div className="rounded-[var(--radius-panel)] border-2 border-dashed border-border p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            노드 네트워크 · 192.168.1.0/24
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div className={`rounded-[var(--radius-card)] border p-3 ${vizStateClasses('pivot')}`}>
              <p className="text-[10.5px] uppercase tracking-wider opacity-70">사용자 노트북</p>
              <p className="mt-1 font-mono text-[13px] font-semibold">192.168.1.1</p>
              <p className="mt-1.5 font-mono text-[11.5px] leading-relaxed">
                curl http://192.168.1.2:30008
              </p>
            </div>
            <div className="hidden text-muted-foreground sm:block" aria-hidden="true">
              →
            </div>
            <div className={`rounded-[var(--radius-card)] border p-3 ${vizStateClasses('comparing')}`}>
              <p className="text-[10.5px] uppercase tracking-wider opacity-70">노드 (kube-proxy)</p>
              <p className="mt-1 font-mono text-[13px] font-semibold">192.168.1.2</p>
              <p className="mt-1.5 font-mono text-[11.5px] leading-relaxed">
                listen :30008 → forward
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center text-muted-foreground" aria-hidden="true">
          <span className="text-lg leading-none">↓</span>
          <span className="mt-0.5 text-[11px]">노드가 Pod 네트워크로 옮긴다</span>
        </div>

        <div className="rounded-[var(--radius-panel)] border-2 border-dashed border-border p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Pod 네트워크 · 10.244.0.0/16
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div className={`rounded-[var(--radius-card)] border p-3 ${vizStateClasses('highlight')}`}>
              <p className="text-[10.5px] uppercase tracking-wider opacity-70">ClusterIP (Service)</p>
              <p className="mt-1 font-mono text-[13px] font-semibold">10.96.0.42 : 80</p>
              <p className="mt-1.5 font-mono text-[11.5px] leading-relaxed">
                NodePort에 자동 포함된 가상 IP
              </p>
            </div>
            <div className="hidden text-muted-foreground sm:block" aria-hidden="true">
              →
            </div>
            <div className={`rounded-[var(--radius-card)] border p-3 ${vizStateClasses('confirmed')}`}>
              <p className="text-[10.5px] uppercase tracking-wider opacity-70">Pod (myapp)</p>
              <p className="mt-1 font-mono text-[13px] font-semibold">10.244.0.2 : 80</p>
              <p className="mt-1.5 font-mono text-[11.5px] leading-relaxed">
                컨테이너 안의 어플리케이션
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-2 rounded-[var(--radius-card)] border border-border/60 bg-muted/30 p-3 sm:grid-cols-3">
          <PortLabel field="nodePort" value="30008" desc="노드 OS가 외부에 여는 포트" />
          <PortLabel field="port" value="80" desc="ClusterIP의 포트 (필수 필드)" />
          <PortLabel field="targetPort" value="80" desc="Pod 안 컨테이너의 포트" />
        </div>
      </div>
    </VisualContainer>
  )
}

function PortLabel({ field, value, desc }: { field: string; value: string; desc: string }) {
  return (
    <div>
      <p className="font-mono text-[11.5px] font-semibold text-foreground">
        {field} <span className="opacity-60">=</span> {value}
      </p>
      <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  )
}
