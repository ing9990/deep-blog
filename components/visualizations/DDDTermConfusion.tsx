import { vizStateClasses } from './common/colors'
import { VisualContainer } from './common/VisualContainer'

interface TeamInterpretation {
  team: string
  meaning: string
}

const INTERPRETATIONS: TeamInterpretation[] = [
  { team: '결제팀', meaning: '결제 대기 중인 장바구니' },
  { team: '물류팀', meaning: '포장되어 출고 직전의 상자' },
  { team: 'CS팀', meaning: '환불 가능 여부를 가진 거래 기록' },
]

export function DDDTermConfusion() {
  return (
    <VisualContainer
      title="같은 단어, 다른 의미"
      description="Ubiquitous Language가 없을 때 한 단어가 팀마다 다른 개념으로 해석됩니다"
    >
      <div className="space-y-4">
        <div className="flex justify-center">
          <div
            className={`rounded-[var(--radius-card)] border px-5 py-2.5 text-sm font-semibold ${vizStateClasses('highlight')}`}
          >
            &quot;주문&quot;
          </div>
        </div>

        <div className="flex justify-center text-muted-foreground" aria-hidden="true">
          <span className="text-lg leading-none">↙</span>
          <span className="mx-8 text-lg leading-none">↓</span>
          <span className="text-lg leading-none">↘</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {INTERPRETATIONS.map((entry) => (
            <div
              key={entry.team}
              className={`rounded-[var(--radius-card)] border p-3 ${vizStateClasses('comparing')}`}
            >
              <p className="text-[13px] font-semibold">{entry.team}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                {entry.meaning}
              </p>
            </div>
          ))}
        </div>

        <p className="border-t border-border/40 pt-3 text-[12px] leading-relaxed text-muted-foreground">
          회의에서 모두 &quot;주문&quot;을 말하지만 서로 다른 것을 떠올립니다. 이 혼선이 코드로
          옮겨지면 <code className="font-mono text-[11.5px]">OrderService</code>가 세 팀의
          요구를 동시에 처리하려다 분기 로직으로 부풀어 오릅니다.
        </p>
      </div>
    </VisualContainer>
  )
}
