import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'

interface AmlTool {
  name: string
  note: string
  state: VizState
  focus?: boolean
}

interface DueDiligenceStep {
  abbr: string
  full: string
  applies: string
  state: VizState
}

const AML_TOOLS: AmlTool[] = [
  { name: 'KYC', note: '고객 신원 확인', state: 'pivot', focus: true },
  { name: 'KYB', note: '법인 + UBO 추적', state: 'comparing' },
  { name: 'Transaction Monitoring', note: '거래 패턴 이상 감지', state: 'waiting' },
  { name: 'SAR · STR', note: '의심거래 보고', state: 'waiting' },
  { name: 'Record Keeping', note: '거래 기록 보존', state: 'waiting' },
]

const DD_STEPS: DueDiligenceStep[] = [
  { abbr: 'SDD', full: 'Simplified', applies: '저위험 (상장사 · 공공기관)', state: 'confirmed' },
  { abbr: 'CDD', full: 'Standard', applies: '일반 고객 (대부분)', state: 'comparing' },
  { abbr: 'EDD', full: 'Enhanced', applies: '고위험 (PEP · 대규모 거래)', state: 'blocked' },
]

export function AMLTermsHierarchy() {
  return (
    <VisualContainer
      title="AML ⊃ KYC ⊃ SDD · CDD · EDD"
      description="AML은 상위 목표이고 KYC는 그 수단 중 하나입니다. KYC 안에서도 고객 리스크에 따라 실사 강도가 달라집니다"
    >
      <div className="space-y-5">
        <div className="rounded-[var(--radius-panel)] border-2 border-dashed border-border p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            AML (Anti-Money Laundering) · 상위 목표
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {AML_TOOLS.map((tool) => (
              <div
                key={tool.name}
                className={`rounded-[var(--radius-card)] border p-2.5 ${vizStateClasses(tool.state)} ${
                  tool.focus ? 'ring-2 ring-offset-2 ring-offset-background' : ''
                }`}
              >
                <p className="text-[12px] font-semibold">{tool.name}</p>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                  {tool.note}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center text-muted-foreground" aria-hidden="true">
          <span className="text-lg leading-none">↓ Zoom into KYC</span>
        </div>

        <div className="rounded-[var(--radius-panel)] border-2 border-dashed border-border p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            KYC · 고객 리스크에 따른 실사 강도 (Risk-Based Approach)
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {DD_STEPS.map((step) => (
              <div
                key={step.abbr}
                className={`rounded-[var(--radius-card)] border p-3 ${vizStateClasses(step.state)}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold">{step.abbr}</p>
                  <p className="text-[10.5px] uppercase tracking-wider opacity-70">
                    {step.full}
                  </p>
                </div>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
                  {step.applies}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="border-t border-border/40 pt-3 text-[12px] leading-relaxed text-muted-foreground">
          KYB는 KYC의 법인 버전으로, 추가로 UBO (Ultimate Beneficial Owner, 25% 이상 지분을 가진
          실소유주)까지 추적합니다. 파나마 페이퍼스 이후 전세계 UBO 규제가 급격히 강화되었습니다.
        </p>
      </div>
    </VisualContainer>
  )
}
