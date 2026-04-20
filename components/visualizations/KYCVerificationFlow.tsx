import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'

interface Axis {
  index: string
  name: string
  sub: string[]
  state: VizState
}

interface Outcome {
  label: string
  condition: string
  state: VizState
}

const AXES: Axis[] = [
  {
    index: '①',
    name: 'Identity',
    sub: ['본인 인증', '정부 DB · Bureau'],
    state: 'comparing',
  },
  {
    index: '②',
    name: 'Document',
    sub: ['MRZ · 홀로그램', '전자여권 NFC'],
    state: 'comparing',
  },
  {
    index: '③',
    name: 'Biometric',
    sub: ['Face Match', 'Liveness'],
    state: 'comparing',
  },
  {
    index: '④',
    name: 'Screening',
    sub: ['Sanctions · PEP', 'Adverse Media'],
    state: 'comparing',
  },
]

const OUTCOMES: Outcome[] = [
  { label: 'Low', condition: '자동 승인', state: 'confirmed' },
  { label: 'Medium', condition: '추가 서류 · 수동 심사', state: 'waiting' },
  { label: 'High', condition: '거절 · EDD 발동', state: 'blocked' },
]

export function KYCVerificationFlow() {
  return (
    <VisualContainer
      title="KYC 4축 검증 + Risk Scoring 분기"
      description="4축이 병렬로 작동해 Defense in Depth를 구성하고, 결과가 Risk Scoring으로 수렴해 고객 등급으로 분기됩니다"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {AXES.map((axis) => (
            <div
              key={axis.name}
              className={`rounded-[var(--radius-card)] border-2 p-3 ${vizStateClasses(axis.state)}`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
                {axis.index} {axis.name}
              </p>
              <ul className="mt-2 space-y-1 text-[11.5px] text-muted-foreground">
                {axis.sub.map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <span className="inline-block size-1 rounded-full bg-muted-foreground/60" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex justify-center text-muted-foreground" aria-hidden="true">
          <span className="text-lg leading-none">↓</span>
        </div>

        <div className="flex justify-center">
          <div
            className={`rounded-[var(--radius-card)] border-2 px-6 py-2.5 text-sm font-semibold ${vizStateClasses('pivot')}`}
          >
            Risk Scoring (가중 합산)
          </div>
        </div>

        <div className="flex justify-center text-muted-foreground" aria-hidden="true">
          <span className="text-lg leading-none">↙</span>
          <span className="mx-8 text-lg leading-none">↓</span>
          <span className="text-lg leading-none">↘</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {OUTCOMES.map((outcome) => (
            <div
              key={outcome.label}
              className={`rounded-[var(--radius-card)] border p-3 ${vizStateClasses(outcome.state)}`}
            >
              <p className="text-[12px] font-semibold">{outcome.label} Risk</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                {outcome.condition}
              </p>
            </div>
          ))}
        </div>

        <p className="border-t border-border/40 pt-3 text-[12px] leading-relaxed text-muted-foreground">
          한 축이 뚫려도 다른 축에서 걸러집니다. 훔친 신분증으로 Identity를 통과해도 Liveness
          Detection에서 실사용자 아님이 드러나면 High Risk로 차단됩니다.
        </p>
      </div>
    </VisualContainer>
  )
}
