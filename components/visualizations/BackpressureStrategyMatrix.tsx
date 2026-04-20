import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'

interface Strategy {
  name: string
  tagline: string
  mechanism: string
  examples: string[]
  philosophy: string
  state: VizState
}

const STRATEGIES: Strategy[] = [
  {
    name: 'Buffer',
    tagline: '일단 쌓아둔다',
    mechanism: '유한 메모리 안에 누적. 다른 세 전략의 무대이자 출발점.',
    examples: ['모든 큐의 기본값', 'OS 소켓 수신 버퍼'],
    philosophy: '"언젠간 처리하겠지"',
    state: 'waiting',
  },
  {
    name: 'Drop',
    tagline: '버린다',
    mechanism: 'drop-oldest / drop-newest / 샘플링. 데이터 유실을 명시적으로 허용.',
    examples: ['UDP', 'Hystrix circuit breaker', 'StatsD 샘플링'],
    philosophy: '"늦은 데이터보다 없는 데이터가 낫다"',
    state: 'blocked',
  },
  {
    name: 'Block',
    tagline: '멈춘다',
    mechanism: '생산자 호출을 소비자가 받을 때까지 잠재운다. 스레드를 소모.',
    examples: ['`BlockingQueue.put()`', 'TCP `write()` 블로킹'],
    philosophy: '"네가 받을 때까지 나 대기"',
    state: 'pivot',
  },
  {
    name: 'Signal',
    tagline: '협상한다',
    mechanism: '소비자가 capacity를 먼저 알림 → 생산자가 그 범위만 전송. pull 기반.',
    examples: ['TCP 수신 윈도우', 'Reactive `request(n)`', 'Kafka `poll(max)`'],
    philosophy: '"지금 N개 받을 수 있어"',
    state: 'confirmed',
  },
]

function InlineCode({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('`') && part.endsWith('`') ? (
          <code
            key={i}
            className="rounded-[var(--radius-chip)] bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

export function BackpressureStrategyMatrix() {
  return (
    <VisualContainer
      title="Backpressure 네 가지 전략"
      description="생산자가 소비자보다 빠를 때 가능한 선택은 논리적으로 이 넷뿐입니다"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {STRATEGIES.map((s) => (
          <div
            key={s.name}
            className={`rounded-[var(--radius-card)] border p-3.5 ${vizStateClasses(s.state)}`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[15px] font-bold tracking-tight">
                {s.name}
              </span>
              <span className="text-[11px] opacity-80">{s.tagline}</span>
            </div>

            <p className="mt-2 text-[12px] leading-relaxed opacity-90">
              {s.mechanism}
            </p>

            <ul className="mt-2.5 space-y-0.5 text-[11px] opacity-80">
              {s.examples.map((ex) => (
                <li key={ex} className="flex items-start gap-1.5">
                  <span className="mt-1.5 inline-block size-1 shrink-0 rounded-full bg-current opacity-60" />
                  <InlineCode text={ex} />
                </li>
              ))}
            </ul>

            <p className="mt-2.5 border-t border-current/20 pt-2 text-[11px] italic opacity-70">
              {s.philosophy}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-3 border-t border-border/40 pt-3 text-[11px] leading-relaxed text-muted-foreground">
        Buffer는 다른 세 전략의 <strong className="text-foreground">무대</strong>입니다.
        버퍼가 가득 찼을 때 Drop · Block · Signal 중 무엇을 선택할지가 실제 설계의 쟁점입니다.
      </p>
    </VisualContainer>
  )
}
