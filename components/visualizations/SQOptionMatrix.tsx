import { VisualContainer } from './common/VisualContainer'

type Sentiment = 'positive' | 'negative' | 'neutral'

interface Cell {
  text: string
  sentiment: Sentiment
}

interface Row {
  option: string
  memory: Cell
  qps: Cell
  recall: Cell
}

const ROWS: Row[] = [
  {
    option: 'quantile = 0.99',
    memory: { text: '영향 적음', sentiment: 'neutral' },
    qps: { text: '영향 적음', sentiment: 'neutral' },
    recall: { text: '분포가 맞으면 우호', sentiment: 'positive' },
  },
  {
    option: 'always_ram = true',
    memory: { text: '절약 실현', sentiment: 'positive' },
    qps: { text: 'page fault 제거', sentiment: 'positive' },
    recall: { text: '영향 없음', sentiment: 'neutral' },
  },
  {
    option: '원본 on_disk = true',
    memory: { text: '추가 절약', sentiment: 'positive' },
    qps: { text: 'rescore 시 살짝 저하', sentiment: 'negative' },
    recall: { text: '영향 없음', sentiment: 'neutral' },
  },
  {
    option: 'rescore = true',
    memory: { text: '영향 없음', sentiment: 'neutral' },
    qps: { text: '살짝 저하', sentiment: 'negative' },
    recall: { text: '회복', sentiment: 'positive' },
  },
  {
    option: 'oversampling 상향',
    memory: { text: '영향 없음', sentiment: 'neutral' },
    qps: { text: '후보 폭↑으로 저하', sentiment: 'negative' },
    recall: { text: '추가 회복', sentiment: 'positive' },
  },
  {
    option: 'ignore = true (쿼리)',
    memory: { text: '영향 없음', sentiment: 'neutral' },
    qps: { text: 'fp32 연산으로 저하', sentiment: 'negative' },
    recall: { text: '원본 그대로', sentiment: 'positive' },
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
      />
      <span className="text-muted-foreground">{text}</span>
    </div>
  )
}

export function SQOptionMatrix() {
  return (
    <VisualContainer
      title="SQ 옵션이 움직이는 3축"
      description="각 옵션이 메모리, QPS, Recall 중 어느 축을 유리하게 혹은 불리하게 만드는지"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-2 pr-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                옵션
              </th>
              <th className="pb-2 px-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                메모리
              </th>
              <th className="pb-2 px-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                QPS
              </th>
              <th className="pb-2 pl-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Recall
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr
                key={row.option}
                className="border-b border-border/40 last:border-0"
              >
                <td className="whitespace-nowrap py-2.5 pr-3 font-mono text-[12px] font-medium text-foreground">
                  {row.option}
                </td>
                <td className="px-3 py-2.5">
                  <SentimentCell {...row.memory} />
                </td>
                <td className="px-3 py-2.5">
                  <SentimentCell {...row.qps} />
                </td>
                <td className="py-2.5 pl-3">
                  <SentimentCell {...row.recall} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center gap-4 border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-viz-confirmed" />
          유리
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-viz-blocked" />
          저하
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-viz-waiting" />
          중립
        </span>
      </div>
    </VisualContainer>
  )
}
