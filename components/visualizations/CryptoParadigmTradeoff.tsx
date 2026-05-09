import { VisualContainer } from './common/VisualContainer'

type Sentiment = 'positive' | 'negative' | 'neutral'

interface Row {
  area: string
  symmetric: { text: string; sentiment: Sentiment }
  asymmetric: { text: string; sentiment: Sentiment }
}

const ROWS: Row[] = [
  {
    area: '처리량',
    symmetric: { text: 'AES-NI로 GB/s 단위', sentiment: 'positive' },
    asymmetric: { text: 'RSA-2048 수십 KB/s', sentiment: 'negative' },
  },
  {
    area: '키 길이 (동일 보안)',
    symmetric: { text: '128–256 bit', sentiment: 'positive' },
    asymmetric: { text: 'RSA 2048–4096 bit, ECC 256 bit', sentiment: 'neutral' },
  },
  {
    area: '키 분배',
    symmetric: { text: '먼저 안전한 채널이 필요', sentiment: 'negative' },
    asymmetric: { text: '공개 키만 배포하면 됨', sentiment: 'positive' },
  },
  {
    area: 'N자 통신 키 개수',
    symmetric: { text: 'n(n-1)/2개 키 폭발', sentiment: 'negative' },
    asymmetric: { text: '각자 한 쌍이면 충분', sentiment: 'positive' },
  },
  {
    area: '디지털 서명',
    symmetric: { text: '서명자 = 검증자만 가능 (MAC)', sentiment: 'neutral' },
    asymmetric: { text: '한 사람이 서명, 누구나 검증', sentiment: 'positive' },
  },
  {
    area: '양자 컴퓨터 위협',
    symmetric: { text: '키 길이 두 배로 대응 가능', sentiment: 'positive' },
    asymmetric: { text: 'Shor 알고리즘으로 깨짐', sentiment: 'negative' },
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

export function CryptoParadigmTradeoff() {
  return (
    <VisualContainer
      title="대칭과 비대칭의 트레이드오프"
      description="한쪽이 다른 쪽을 대체하지 못합니다. 영역마다 유리한 패러다임이 다릅니다"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-2 pr-3 text-left text-[length:var(--text-meta)] font-semibold uppercase tracking-[var(--tracking-wider)] text-muted-foreground">
                영역
              </th>
              <th className="pb-2 px-3 text-left text-[length:var(--text-meta)] font-semibold uppercase tracking-[var(--tracking-wider)] text-muted-foreground">
                대칭 (AES, ChaCha20)
              </th>
              <th className="pb-2 pl-3 text-left text-[length:var(--text-meta)] font-semibold uppercase tracking-[var(--tracking-wider)] text-muted-foreground">
                비대칭 (RSA, ECC)
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
                  <SentimentCell {...row.symmetric} />
                </td>
                <td className="py-2.5 pl-3">
                  <SentimentCell {...row.asymmetric} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center gap-4 border-t border-border/40 pt-2 text-[length:var(--text-meta)] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-viz-confirmed" />
          유리
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-viz-blocked" />
          불리
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-viz-waiting" />
          조건부
        </span>
      </div>
    </VisualContainer>
  )
}
