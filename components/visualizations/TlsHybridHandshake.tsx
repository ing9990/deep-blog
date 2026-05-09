import { vizStateClasses } from './common/colors'
import { VisualContainer } from './common/VisualContainer'
import { cn } from '@/lib/utils'

interface Step {
  n: number
  from: 'client' | 'server'
  label: string
  detail: string
}

const HANDSHAKE_STEPS: Step[] = [
  {
    n: 1,
    from: 'client',
    label: 'ClientHello',
    detail: '지원하는 암호 슈트와 임시 공개 값 g^a 전송',
  },
  {
    n: 2,
    from: 'server',
    label: 'ServerHello + 인증서',
    detail: '서버 공개 키와 CA 서명, 임시 공개 값 g^b 전송',
  },
  {
    n: 3,
    from: 'client',
    label: 'Pre-master 합의',
    detail: '양쪽이 g^ab를 각자 계산. 도청자는 g·g^a·g^b만 봄',
  },
  {
    n: 4,
    from: 'client',
    label: 'Finished',
    detail: '세션 키 (g^ab에서 파생) 확정. 핸드셰이크 종료',
  },
]

const APP_STEPS: Step[] = [
  {
    n: 5,
    from: 'client',
    label: 'GET /api/users',
    detail: 'AES-GCM으로 본문 암호화',
  },
  {
    n: 6,
    from: 'server',
    label: '200 OK + 본문',
    detail: '같은 세션 키로 응답 암호화',
  },
]

export function TlsHybridHandshake() {
  return (
    <VisualContainer
      title="TLS의 hybrid 사용"
      description="비대칭은 핸드셰이크 동안만, 본문 통신은 전부 대칭"
    >
      <div className="space-y-6">
        <Phase
          title="핸드셰이크 (비대칭)"
          subtitle="Asymmetric — ECDHE 키 교환"
          color="pivot"
          steps={HANDSHAKE_STEPS}
          summary="수십 KB 정도의 메시지에서만 비대칭 연산을 쓴다"
        />
        <Divider />
        <Phase
          title="애플리케이션 데이터 (대칭)"
          subtitle="Symmetric — AES-GCM"
          color="confirmed"
          steps={APP_STEPS}
          summary="세션이 끝날 때까지 모든 본문은 같은 세션 키로 대칭 암호화"
        />
      </div>
    </VisualContainer>
  )
}

interface PhaseProps {
  title: string
  subtitle: string
  color: 'pivot' | 'confirmed'
  steps: Step[]
  summary: string
}

function Phase({ title, subtitle, color, steps, summary }: PhaseProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <h4 className="text-[length:var(--text-h5)] font-semibold text-foreground">
          {title}
        </h4>
        <span className="text-[length:var(--text-caption)] text-muted-foreground">
          {subtitle}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="w-10 pb-2 pr-2 text-left text-[length:var(--text-meta)] font-semibold uppercase tracking-[var(--tracking-wider)] text-muted-foreground">
                #
              </th>
              <th className="w-24 pb-2 px-2 text-left text-[length:var(--text-meta)] font-semibold uppercase tracking-[var(--tracking-wider)] text-muted-foreground">
                방향
              </th>
              <th className="pb-2 px-2 text-left text-[length:var(--text-meta)] font-semibold uppercase tracking-[var(--tracking-wider)] text-muted-foreground">
                메시지
              </th>
              <th className="pb-2 pl-2 text-left text-[length:var(--text-meta)] font-semibold uppercase tracking-[var(--tracking-wider)] text-muted-foreground">
                설명
              </th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step) => (
              <tr
                key={step.n}
                className="border-b border-border/40 last:border-0"
              >
                <td className="py-2 pr-2 align-top">
                  <span
                    className={cn(
                      'inline-flex size-6 items-center justify-center rounded-full border text-[length:var(--text-meta)] font-semibold tabular-nums',
                      vizStateClasses(color),
                    )}
                  >
                    {step.n}
                  </span>
                </td>
                <td className="py-2 px-2 align-top">
                  <DirectionArrow from={step.from} />
                </td>
                <td className="py-2 px-2 align-top font-medium text-foreground">
                  {step.label}
                </td>
                <td className="py-2 pl-2 align-top text-muted-foreground">
                  {step.detail}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[length:var(--text-caption)] text-muted-foreground">
        {summary}
      </p>
    </div>
  )
}

function DirectionArrow({ from }: { from: 'client' | 'server' }) {
  const isClient = from === 'client'
  const left = isClient ? 'C' : 'S'
  const right = isClient ? 'S' : 'C'
  const arrow = isClient ? '→' : '←'
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[length:var(--text-meta)] tabular-nums text-muted-foreground">
      <span className="font-semibold text-foreground">{left}</span>
      <span aria-hidden="true">{arrow}</span>
      <span className="font-semibold text-foreground">{right}</span>
    </span>
  )
}

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[length:var(--text-caption)] text-muted-foreground">
        세션 키 합의 → 이후 본문은 전부 대칭
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}
