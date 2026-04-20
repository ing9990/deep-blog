import { VisualContainer } from './common/VisualContainer'
import { vizStateClasses, type VizState } from './common/colors'
import { cn } from '@/lib/utils'

interface Edge {
  label: string
  systems: string
  note: string
  state: VizState
}

const EDGES: Edge[] = [
  {
    label: 'CP (C + P)',
    systems: 'Zookeeper · etcd · HBase · MongoDB 기본',
    note: '파티션 시 가용성 포기. 최신 값 확신이 없으면 응답을 거절해 일관성을 지킵니다.',
    state: 'comparing',
  },
  {
    label: 'AP (A + P)',
    systems: 'DynamoDB · Cassandra · Riak',
    note: '파티션 시 일관성 포기. 낡은 값이라도 응답을 계속 돌려줍니다. 복구 후 merge로 수렴.',
    state: 'highlight',
  },
  {
    label: 'CA (C + A)',
    systems: '단일 노드 또는 파티션 없는 환경',
    note: '분산 시스템에서는 실질적으로 달성 불가능. 네트워크 파티션은 피할 수 없으므로 이 조합은 "P를 무시한 가정"에 불과합니다.',
    state: 'blocked',
  },
]

export function CAPTriangle() {
  return (
    <VisualContainer
      title="CAP 삼각형"
      description="Consistency · Availability · Partition Tolerance 세 속성 중 분산 시스템이 실제로 선택할 수 있는 조합은 CP 또는 AP. CA는 단일 노드의 영역입니다."
    >
      <div className="flex flex-col items-center">
        <svg
          viewBox="0 0 400 290"
          className="w-full max-w-md"
          role="img"
          aria-label="CAP 삼각형. 세 꼭짓점은 Consistency, Availability, Partition Tolerance이며 세 변은 각각 CP, AP, CA 조합을 나타냅니다."
        >
          <polygon
            points="200,40 60,240 340,240"
            fill="none"
            stroke="var(--border)"
            strokeWidth="2"
          />

          <circle
            cx="200"
            cy="40"
            r="26"
            fill="var(--viz-pivot-bg)"
            stroke="var(--viz-pivot-border)"
            strokeWidth="2"
          />
          <text
            x="200"
            y="48"
            textAnchor="middle"
            fontSize="20"
            fontWeight="700"
            fill="var(--viz-pivot-fg)"
          >
            C
          </text>
          <text x="200" y="14" textAnchor="middle" fontSize="11" fill="var(--foreground)">
            Consistency
          </text>

          <circle
            cx="60"
            cy="240"
            r="26"
            fill="var(--viz-confirmed-bg)"
            stroke="var(--viz-confirmed-border)"
            strokeWidth="2"
          />
          <text
            x="60"
            y="248"
            textAnchor="middle"
            fontSize="20"
            fontWeight="700"
            fill="var(--viz-confirmed-fg)"
          >
            A
          </text>
          <text x="60" y="278" textAnchor="middle" fontSize="11" fill="var(--foreground)">
            Availability
          </text>

          <circle
            cx="340"
            cy="240"
            r="26"
            fill="var(--viz-highlight-bg)"
            stroke="var(--viz-highlight-border)"
            strokeWidth="2"
          />
          <text
            x="340"
            y="248"
            textAnchor="middle"
            fontSize="20"
            fontWeight="700"
            fill="var(--viz-highlight-fg)"
          >
            P
          </text>
          <text x="340" y="278" textAnchor="middle" fontSize="11" fill="var(--foreground)">
            Partition Tolerance
          </text>

          <text x="115" y="145" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--muted-foreground)">
            CA
          </text>
          <text x="285" y="145" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--muted-foreground)">
            CP
          </text>
          <text x="200" y="260" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--muted-foreground)">
            AP
          </text>
        </svg>
      </div>

      <div className="mt-4 space-y-2">
        {EDGES.map((edge) => (
          <div
            key={edge.label}
            className={cn(
              'rounded-[var(--radius-card)] border-2 p-3',
              vizStateClasses(edge.state),
            )}
          >
            <p className="text-[length:var(--text-meta)] font-semibold">{edge.label}</p>
            <p className="mt-1.5 text-[length:var(--text-caption)] font-mono opacity-80">
              {edge.systems}
            </p>
            <p className="mt-1.5 text-[length:var(--text-caption)] leading-relaxed opacity-85">
              {edge.note}
            </p>
          </div>
        ))}
      </div>
    </VisualContainer>
  )
}
