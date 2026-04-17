import { ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'

interface LeafRow {
  cells: string[]
  state: VizState | 'idle'
}

const SECONDARY_HEADERS = ['from_address', 'block_id', 'PK']
const SECONDARY_ROWS: LeafRow[] = [
  { cells: ['0xA1f3…', '1042', '7821'], state: 'idle' },
  { cells: ['0xA1f3…', '1039', '3456'], state: 'comparing' },
  { cells: ['0xA1f3…', '1035', '9012'], state: 'idle' },
]

const CLUSTERED_HEADERS = ['PK', 'from', 'to', 'block', 'value']
const CLUSTERED_ROWS: LeafRow[] = [
  { cells: ['3455', '0xB2…', '0xC4…', '1038', '0.3 ETH'], state: 'idle' },
  { cells: ['3456', '0xA1…', '0xD7…', '1039', '0.5 ETH'], state: 'confirmed' },
  { cells: ['3457', '0xE9…', '0xF1…', '1040', '0.1 ETH'], state: 'idle' },
]

function LeafTable({
  title,
  subtitle,
  headers,
  rows,
  pkColumnIndex,
  caption,
}: {
  title: string
  subtitle: string
  headers: string[]
  rows: LeafRow[]
  pkColumnIndex: number
  caption: string
}) {
  return (
    <div className="rounded-[10px] border border-border bg-muted/20">
      <div className="border-b border-border px-4 py-3">
        <p className="text-[13px] font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>
      </div>

      <div className="overflow-x-auto p-3">
        <table className="w-full text-[12px] tabular-nums">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    'pb-2 pr-3 text-left text-[10px] font-semibold uppercase tracking-wider',
                    i === pkColumnIndex
                      ? 'text-viz-comparing-fg'
                      : 'text-muted-foreground',
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => {
              const isHighlighted = row.state !== 'idle'
              return (
                <tr
                  key={rowIdx}
                  className={cn(
                    'rounded-md',
                    isHighlighted
                      ? cn('border', vizStateClasses(row.state as VizState))
                      : 'text-muted-foreground',
                  )}
                >
                  {row.cells.map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className={cn(
                        'whitespace-nowrap px-2 py-2 first:pl-3 last:pr-3',
                        isHighlighted && 'font-semibold',
                        cellIdx === pkColumnIndex &&
                          'text-viz-comparing-fg dark:text-viz-comparing-fg',
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border/60 px-4 py-2 text-[11px] text-muted-foreground">
        {caption}
      </div>
    </div>
  )
}

export function SecondaryIndexLookup() {
  return (
    <VisualContainer
      title="세컨더리 인덱스의 이중 탐색"
      description="리프에서 PK를 꺼낸 뒤 클러스터드 인덱스를 한 번 더 탐색해야 실제 행을 읽을 수 있습니다"
    >
      <LeafTable
        title="세컨더리 인덱스 리프 노드"
        subtitle="(from_address, block_id DESC)"
        headers={SECONDARY_HEADERS}
        rows={SECONDARY_ROWS}
        pkColumnIndex={2}
        caption="리프에는 인덱스 키 + PK만 저장 (행 데이터 없음)"
      />

      <div className="my-4 flex flex-col items-center gap-1.5">
        <ArrowDown
          className="h-5 w-5 text-viz-comparing"
          aria-hidden="true"
        />
        <div
          className={cn(
            'rounded-full border px-3 py-1 text-[12px] font-semibold',
            vizStateClasses('comparing'),
          )}
        >
          PK = 3456 으로 재탐색
        </div>
        <p className="text-[11px] text-muted-foreground">
          O(log n), 3~4회 페이지 접근
        </p>
      </div>

      <LeafTable
        title="클러스터드 인덱스 리프 노드"
        subtitle="PK 기반 B+Tree, 실제 행 데이터 저장"
        headers={CLUSTERED_HEADERS}
        rows={CLUSTERED_ROWS}
        pkColumnIndex={0}
        caption="리프에 실제 행 데이터 전체가 저장됨"
      />
    </VisualContainer>
  )
}
