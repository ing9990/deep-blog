import { vizStateClasses } from './common/colors'
import { VisualContainer } from './common/VisualContainer'
import { cn } from '@/lib/utils'

const PLAINTEXT = 'P@ssw0rd!'
const ENCODED = 'UEBzc3cwcmQh'

export function Base64RoundTrip() {
  return (
    <VisualContainer
      title="base64는 가역 변환이다"
      description="평문을 base64로 인코딩해도, 키 없이 누구나 같은 평문으로 되돌릴 수 있다"
    >
      <div className="space-y-4">
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <ValuePanel label="평문" value={PLAINTEXT} state="pivot" />
          <StepArrow caption="base64 인코딩" />
          <ValuePanel label="base64 인코딩 결과" value={ENCODED} state="comparing" />
          <StepArrow caption="base64 디코딩 · 키 불필요" />
          <ValuePanel label="평문 (복원됨)" value={PLAINTEXT} state="pivot" />
        </div>
        <div
          className={cn(
            'rounded-[var(--radius-card)] border px-4 py-3 text-[length:var(--text-caption)] leading-relaxed',
            vizStateClasses('blocked'),
          )}
          role="note"
        >
          암호화는 키를 가진 쪽만 평문으로 되돌릴 수 있다. base64 디코딩에는 키가 없으므로,
          인코딩 결과를 손에 넣은 사람은 누구나 평문을 복원한다.
        </div>
      </div>
    </VisualContainer>
  )
}

interface ValuePanelProps {
  label: string
  value: string
  state: 'pivot' | 'comparing'
}

function ValuePanel({ label, value, state }: ValuePanelProps) {
  return (
    <div className="flex-1 space-y-1.5">
      <p className="text-[length:var(--text-caption)] font-medium text-muted-foreground">
        {label}
      </p>
      <div
        className={cn(
          'rounded-[var(--radius-chip)] border px-3 py-2 text-center font-mono text-[length:var(--text-meta)] break-all',
          vizStateClasses(state),
        )}
        role="img"
        aria-label={`${label}: ${value}`}
      >
        {value}
      </div>
    </div>
  )
}

function StepArrow({ caption }: { caption: string }) {
  return (
    <div className="flex flex-shrink-0 flex-col items-center justify-center px-1">
      <span aria-hidden="true" className="text-muted-foreground sm:hidden">
        ↓
      </span>
      <span aria-hidden="true" className="hidden text-muted-foreground sm:inline">
        →
      </span>
      <span className="mt-0.5 max-w-[7rem] text-center text-[length:var(--text-caption)] leading-tight text-muted-foreground">
        {caption}
      </span>
    </div>
  )
}
