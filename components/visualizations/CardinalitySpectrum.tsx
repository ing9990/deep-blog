import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'

interface Entry {
  column: string
  cardinality: string
  groupSize: string
  barPct: number
  state: VizState
}

const DATA: Entry[] = [
  {
    column: 'id',
    cardinality: '2억',
    groupSize: '1건',
    barPct: 2,
    state: 'confirmed',
  },
  {
    column: 'user_id',
    cardinality: '500만',
    groupSize: '40건',
    barPct: 6,
    state: 'comparing',
  },
  {
    column: 'created_at',
    cardinality: '~수십만',
    groupSize: '~600건',
    barPct: 18,
    state: 'highlight',
  },
  {
    column: 'status',
    cardinality: '3',
    groupSize: '6,667만건',
    barPct: 75,
    state: 'pivot',
  },
  {
    column: 'gender',
    cardinality: '2',
    groupSize: '1억건',
    barPct: 100,
    state: 'blocked',
  },
]

export function CardinalitySpectrum() {
  return (
    <VisualContainer
      title="컬럼별 카디널리티 비교"
      description="막대가 길수록 한 그룹에 많은 행이 몰립니다 (N ÷ K)"
    >
      <div className="space-y-3">
        {DATA.map((d) => (
          <div key={d.column} className="space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <code
                  className={`inline-block rounded-md border px-1.5 py-0.5 text-[13px] font-semibold leading-tight ${vizStateClasses(d.state)}`}
                >
                  {d.column}
                </code>
                <span className="text-[11px] text-muted-foreground">
                  고유값 {d.cardinality}
                </span>
              </div>
              <span className="text-[13px] font-medium tabular-nums text-foreground">
                {d.groupSize}
                <span className="font-normal text-muted-foreground">/그룹</span>
              </span>
            </div>

            <div className="h-5 rounded-md bg-muted/30">
              <div
                className={`h-full rounded-md border ${vizStateClasses(d.state)}`}
                style={{ width: `${d.barPct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </VisualContainer>
  )
}
