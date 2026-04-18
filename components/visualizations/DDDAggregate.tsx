import { vizStateClasses } from './common/colors'
import { VisualContainer } from './common/VisualContainer'

interface InternalEntity {
  name: string
  role: string
}

const INTERNALS: InternalEntity[] = [
  { name: 'OrderLine', role: '주문 라인 항목' },
  { name: 'ShippingAddress', role: '배송 주소 (Value Object)' },
]

const EXTERNAL_CALLS = [
  { label: 'order.addLine(item)', allowed: true },
  { label: 'order.cancel()', allowed: true },
  { label: 'orderLine.setQuantity(5)', allowed: false },
]

export function DDDAggregate() {
  return (
    <VisualContainer
      title="Aggregate 경계와 접근 규칙"
      description="외부는 Aggregate Root를 통해서만 내부 Entity에 접근할 수 있습니다"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr]">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            외부 호출
          </p>
          <ul className="space-y-1.5">
            {EXTERNAL_CALLS.map((call) => (
              <li
                key={call.label}
                className={`flex items-center gap-2 rounded-[var(--radius-card)] border px-2.5 py-1.5 text-[12px] ${
                  call.allowed
                    ? vizStateClasses('confirmed')
                    : vizStateClasses('blocked')
                }`}
              >
                <span aria-hidden="true" className="font-mono text-[13px]">
                  {call.allowed ? '→' : '✕'}
                </span>
                <code className="font-mono text-[11.5px]">{call.label}</code>
              </li>
            ))}
          </ul>
        </div>

        <div
          className={`rounded-[var(--radius-panel)] border-2 border-dashed p-4 ${vizStateClasses('highlight')}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider">
            Order Aggregate
          </p>

          <div
            className={`mt-3 rounded-[var(--radius-card)] border-2 p-3 ${vizStateClasses('highlight')}`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">Order</p>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Aggregate Root
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              불변식 검증의 관문. 모든 라인 수량 합 = 총액.
            </p>
          </div>

          <div className="mt-3 space-y-2">
            {INTERNALS.map((entity) => (
              <div
                key={entity.name}
                className={`rounded-[var(--radius-card)] border p-2.5 ${vizStateClasses('confirmed')}`}
              >
                <p className="text-[13px] font-semibold text-foreground">
                  {entity.name}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {entity.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 border-t border-border/40 pt-3 text-[12px] leading-relaxed text-muted-foreground">
        `orderLine.setQuantity(5)`처럼 내부 Entity를 외부에서 직접 호출하면 Aggregate Root가
        검증하는 불변식이 깨질 수 있습니다. 외부 세계에 노출되는 표면적을 Root 하나로 좁혀
        규칙이 한 곳에 모이도록 합니다.
      </p>
    </VisualContainer>
  )
}
