import { cn } from '@/lib/utils'
import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'

type Group = 'less' | 'pivot' | 'greater'

interface Cell {
  value: number
  group: Group
}

const CELLS: Cell[] = [
  { value: 3, group: 'less' },
  { value: 9, group: 'less' },
  { value: 10, group: 'less' },
  { value: 27, group: 'pivot' },
  { value: 38, group: 'greater' },
  { value: 43, group: 'greater' },
  { value: 82, group: 'greater' },
]

const GROUP_STATE: Record<Group, VizState> = {
  less: 'comparing',
  pivot: 'pivot',
  greater: 'confirmed',
}

export function QuickSortPivot() {
  return (
    <VisualContainer
      title="피벗 기준 분할"
      description="피벗 27을 기준으로 좌측은 더 작은 값, 우측은 더 큰 값으로 분리됩니다"
    >
      <div className="grid grid-cols-7 gap-1.5">
        {CELLS.map((cell) => (
          <div
            key={cell.value}
            className={cn(
              'flex aspect-square items-center justify-center rounded-md border-2 text-sm font-semibold tabular-nums sm:text-base',
              vizStateClasses(GROUP_STATE[cell.group]),
            )}
          >
            {cell.value}
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1.5 text-center text-[11px] text-muted-foreground">
        <span className="col-span-3">피벗보다 작은 값</span>
        <span className="col-span-1 font-semibold text-foreground">피벗</span>
        <span className="col-span-3">피벗보다 큰 값</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm bg-viz-comparing" />
          less
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm bg-viz-pivot" />
          pivot
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm bg-viz-confirmed" />
          greater
        </span>
      </div>
    </VisualContainer>
  )
}
