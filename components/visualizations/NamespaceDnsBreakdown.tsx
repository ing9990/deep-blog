import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'

interface DnsPart {
  text: string
  label: string
  desc: string
  state: VizState
}

const PARTS: DnsPart[] = [
  { text: 'db-service', label: 'Service 이름', desc: '같은 Namespace 안에서는 이 부분만으로 부른다', state: 'pivot' },
  { text: 'dev', label: 'Namespace', desc: '서비스가 속한 Namespace', state: 'comparing' },
  { text: 'svc', label: 'Service 하위 도메인', desc: 'Service 종류임을 나타내는 고정 토큰', state: 'highlight' },
  { text: 'cluster.local', label: '클러스터 도메인', desc: '클러스터 전체의 DNS 루트 (기본값)', state: 'confirmed' },
]

export function NamespaceDnsBreakdown() {
  return (
    <VisualContainer
      title="Service의 FQDN은 4 조각으로 이뤄진다"
      description="다른 Namespace의 서비스를 부를 때 쓰는 풀네임. 같은 Namespace 안에서는 첫 조각만으로 충분합니다"
    >
      <div className="rounded-[var(--radius-panel)] border-2 border-dashed border-border p-4">
        <div className="flex flex-wrap items-center justify-center gap-1 font-mono text-[15px] font-semibold">
          {PARTS.map((part, idx) => (
            <span key={part.text} className="flex items-center gap-1">
              <span
                className={`rounded-[var(--radius-chip)] border px-2.5 py-1 ${vizStateClasses(part.state)}`}
              >
                {part.text}
              </span>
              {idx < PARTS.length - 1 && (
                <span className="text-muted-foreground" aria-hidden="true">
                  .
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {PARTS.map((part) => (
          <div
            key={part.text}
            className={`rounded-[var(--radius-card)] border p-3 ${vizStateClasses(part.state)}`}
          >
            <p className="font-mono text-[12px] font-semibold">{part.text}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wider opacity-70">{part.label}</p>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{part.desc}</p>
          </div>
        ))}
      </div>
    </VisualContainer>
  )
}
