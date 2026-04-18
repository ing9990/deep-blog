import { VisualContainer } from './common/VisualContainer'

type Sentiment = 'positive' | 'negative' | 'neutral'

interface Cell {
  text: string
  sentiment: Sentiment
}

interface AlgoRow {
  name: string
  stw: Cell
  throughput: Cell
  memory: Cell
  workload: string
}

const ROWS: AlgoRow[] = [
  {
    name: 'Serial',
    stw: { text: '가장 김', sentiment: 'negative' },
    throughput: { text: '보통', sentiment: 'neutral' },
    memory: { text: '최소', sentiment: 'positive' },
    workload: '소형 힙 · 클라이언트',
  },
  {
    name: 'Parallel',
    stw: { text: '중간', sentiment: 'neutral' },
    throughput: { text: '최고', sentiment: 'positive' },
    memory: { text: '낮음', sentiment: 'positive' },
    workload: '배치 처리',
  },
  {
    name: 'G1',
    stw: { text: '목표 설정', sentiment: 'positive' },
    throughput: { text: '높음', sentiment: 'positive' },
    memory: { text: '중간 (5–10%)', sentiment: 'neutral' },
    workload: '범용 서버',
  },
  {
    name: 'ZGC',
    stw: { text: '1 ms 이하', sentiment: 'positive' },
    throughput: { text: '약간 감소', sentiment: 'neutral' },
    memory: { text: '높음', sentiment: 'negative' },
    workload: '대형 힙 · 저지연',
  },
  {
    name: 'Shenandoah',
    stw: { text: '수 ms 이하', sentiment: 'positive' },
    throughput: { text: '약간 감소', sentiment: 'neutral' },
    memory: { text: '중간–높음', sentiment: 'negative' },
    workload: '저지연',
  },
]

const DOT_COLORS: Record<Sentiment, string> = {
  positive: 'bg-viz-confirmed',
  negative: 'bg-viz-blocked',
  neutral: 'bg-viz-waiting',
}

function SentimentCell({ text, sentiment }: Cell) {
  return (
    <div className="flex items-start gap-2">
      <span
        className={`mt-1.5 inline-block size-2 shrink-0 rounded-full ${DOT_COLORS[sentiment]}`}
        aria-hidden="true"
      />
      <span className="text-muted-foreground">{text}</span>
    </div>
  )
}

export function GCAlgorithmMatrix() {
  return (
    <VisualContainer
      title="GC 알고리즘 트레이드오프"
      description="STW를 줄이면 CPU·메모리를 더 씁니다. 어느 축을 희생할지가 선택의 전부입니다."
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-2 pr-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                알고리즘
              </th>
              <th className="px-3 pb-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                STW
              </th>
              <th className="px-3 pb-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                처리량
              </th>
              <th className="px-3 pb-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                메모리
              </th>
              <th className="pb-2 pl-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                적합 워크로드
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr
                key={row.name}
                className="border-b border-border/40 last:border-0"
              >
                <td className="whitespace-nowrap py-2.5 pr-3 font-semibold text-foreground">
                  {row.name}
                </td>
                <td className="px-3 py-2.5">
                  <SentimentCell {...row.stw} />
                </td>
                <td className="px-3 py-2.5">
                  <SentimentCell {...row.throughput} />
                </td>
                <td className="px-3 py-2.5">
                  <SentimentCell {...row.memory} />
                </td>
                <td className="py-2.5 pl-3 text-muted-foreground">
                  {row.workload}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block size-2 rounded-full bg-viz-confirmed"
            aria-hidden="true"
          />
          유리
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block size-2 rounded-full bg-viz-blocked"
            aria-hidden="true"
          />
          비용 큼
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block size-2 rounded-full bg-viz-waiting"
            aria-hidden="true"
          />
          조건부
        </span>
      </div>
    </VisualContainer>
  )
}
