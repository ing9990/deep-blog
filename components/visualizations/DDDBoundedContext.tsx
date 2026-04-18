import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'

interface ContextBox {
  name: string
  state: VizState
  orderFields: string[]
}

const CONTEXTS: ContextBox[] = [
  {
    name: '결제 컨텍스트',
    state: 'comparing',
    orderFields: ['결제수단', '총액', '승인상태', '결제일시'],
  },
  {
    name: '배송 컨텍스트',
    state: 'confirmed',
    orderFields: ['수취인', '주소', '운송장번호', '배송상태'],
  },
]

export function DDDBoundedContext() {
  return (
    <VisualContainer
      title="Bounded Context로 나뉜 'Order'"
      description="같은 이름이지만 컨텍스트마다 서로 다른 모델을 가집니다"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CONTEXTS.map((ctx) => (
            <div
              key={ctx.name}
              className={`rounded-[var(--radius-panel)] border-2 p-4 ${vizStateClasses(ctx.state)}`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider">
                {ctx.name}
              </p>
              <div className="mt-3 rounded-[var(--radius-card)] border border-border bg-background/60 p-3">
                <p className="text-sm font-semibold text-foreground">Order</p>
                <ul className="mt-2 space-y-1 text-[12px] text-muted-foreground">
                  {ctx.orderFields.map((field) => (
                    <li key={field} className="flex items-center gap-1.5">
                      <span className="inline-block size-1 rounded-full bg-muted-foreground/60" />
                      {field}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 text-[12px] text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span className="whitespace-nowrap">
            두 컨텍스트 간 <code className="mx-0.5 rounded bg-muted px-1 py-0.5 text-[11px]">OrderId</code>만 공유
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <p className="border-t border-border/40 pt-3 text-[12px] leading-relaxed text-muted-foreground">
          두 팀은 독립적으로 모델을 진화시킵니다. 결제팀이 필드를 추가해도 배송팀 코드는
          건드리지 않으며, 교환 지점은 최소한의 식별자로 고정됩니다.
        </p>
      </div>
    </VisualContainer>
  )
}
