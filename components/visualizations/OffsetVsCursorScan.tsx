import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'

const TOTAL = 50
const OFFSET = 30
const LIMIT = 10

function Row({ states }: { states: readonly VizState[] }) {
  return (
    <div className="flex flex-wrap gap-[2px]">
      {states.map((state, i) => (
        <div
          key={i}
          className={`h-4 w-4 rounded-[2px] border ${vizStateClasses(state)}`}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

function Panel({
  title,
  query,
  states,
  read,
  returned,
  skipped,
}: {
  title: string
  query: string
  states: readonly VizState[]
  read: number
  returned: number
  skipped: number
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-muted/20 p-4">
      <p className="text-[length:var(--text-h5)] font-semibold text-foreground">{title}</p>
      <code className="mt-1 block text-[12px] text-muted-foreground">{query}</code>
      <div className="mt-3">
        <Row states={states} />
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
        <div>
          <dt className="text-muted-foreground">읽은 행</dt>
          <dd className="font-semibold tabular-nums text-foreground">{read}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">버린 행</dt>
          <dd className="font-semibold tabular-nums text-foreground">{skipped}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">반환한 행</dt>
          <dd className="font-semibold tabular-nums text-foreground">{returned}</dd>
        </div>
      </dl>
    </div>
  )
}

function offsetStates(): VizState[] {
  return Array.from({ length: TOTAL }, (_, i) => {
    if (i < OFFSET) return 'blocked'
    if (i < OFFSET + LIMIT) return 'confirmed'
    return 'waiting'
  })
}

function cursorStates(): VizState[] {
  return Array.from({ length: TOTAL }, (_, i) => {
    if (i < OFFSET) return 'waiting'
    if (i < OFFSET + LIMIT) return 'confirmed'
    return 'waiting'
  })
}

export function OffsetVsCursorScan() {
  return (
    <VisualContainer
      title="OFFSET vs Cursor 내부 스캔 범위"
      description={`정렬된 50개 행에서 OFFSET=${OFFSET}, LIMIT=${LIMIT}로 가져올 때 DB가 실제로 읽는 범위`}
    >
      <div className="space-y-3">
        <Panel
          title="OFFSET / LIMIT"
          query={`ORDER BY created_at DESC LIMIT ${LIMIT} OFFSET ${OFFSET}`}
          states={offsetStates()}
          read={OFFSET + LIMIT}
          skipped={OFFSET}
          returned={LIMIT}
        />
        <Panel
          title="Cursor (Keyset)"
          query={`WHERE created_at < ? ORDER BY created_at DESC LIMIT ${LIMIT}`}
          states={cursorStates()}
          read={LIMIT}
          skipped={0}
          returned={LIMIT}
        />
        <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`inline-block h-3 w-3 rounded-[2px] border ${vizStateClasses('blocked')}`}
            />
            읽고 버림
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`inline-block h-3 w-3 rounded-[2px] border ${vizStateClasses('confirmed')}`}
            />
            반환
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`inline-block h-3 w-3 rounded-[2px] border ${vizStateClasses('waiting')}`}
            />
            읽지 않음
          </span>
        </div>
      </div>
    </VisualContainer>
  )
}
