import { VisualContainer } from './common/VisualContainer'

type Sentiment = 'positive' | 'negative' | 'neutral'

interface Row {
  area: string
  high: { text: string; sentiment: Sentiment }
  low: { text: string; sentiment: Sentiment }
}

const ROWS: Row[] = [
  {
    area: '인덱스',
    high: { text: '소수 행만 매칭 → 효율적', sentiment: 'positive' },
    low: { text: '대량 행 매칭 → 인덱스 의미 없음', sentiment: 'negative' },
  },
  {
    area: '캐시 키',
    high: { text: '키가 많아 메모리 부담 ↑', sentiment: 'negative' },
    low: { text: '적중률 높지만 한 키에 부하 집중', sentiment: 'neutral' },
  },
  {
    area: '파티셔닝',
    high: { text: '균등 분산', sentiment: 'positive' },
    low: { text: '핫스팟 위험', sentiment: 'negative' },
  },
  {
    area: '모니터링 라벨',
    high: { text: '시계열 폭발 위험', sentiment: 'negative' },
    low: { text: '안전하지만 세분화 불가', sentiment: 'neutral' },
  },
]

const DOT_COLORS: Record<Sentiment, string> = {
  positive: 'bg-viz-confirmed',
  negative: 'bg-viz-blocked',
  neutral: 'bg-viz-waiting',
}

function SentimentCell({
  text,
  sentiment,
}: {
  text: string
  sentiment: Sentiment
}) {
  return (
    <div className="flex items-start gap-2">
      <span
        className={`mt-1.5 inline-block size-2 shrink-0 rounded-full ${DOT_COLORS[sentiment]}`}
      />
      <span className="text-muted-foreground">{text}</span>
    </div>
  )
}

export function CardinalityTradeoff() {
  return (
    <VisualContainer
      title="카디널리티 트레이드오프"
      description="높다고 항상 좋은 것도, 낮다고 항상 나쁜 것도 아닙니다"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-2 pr-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                영역
              </th>
              <th className="pb-2 px-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                높은 카디널리티
              </th>
              <th className="pb-2 pl-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                낮은 카디널리티
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr
                key={row.area}
                className="border-b border-border/40 last:border-0"
              >
                <td className="whitespace-nowrap py-2.5 pr-3 font-medium text-foreground">
                  {row.area}
                </td>
                <td className="px-3 py-2.5">
                  <SentimentCell {...row.high} />
                </td>
                <td className="py-2.5 pl-3">
                  <SentimentCell {...row.low} />
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
          주의 필요
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-viz-waiting" />
          조건부
        </span>
      </div>
    </VisualContainer>
  )
}
