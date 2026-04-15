'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses } from './common/colors'

interface QuickSortProps {
  initial?: number[]
  description?: string
}

interface Snapshot {
  array: number[]
  pivotIndex: number | null
  comparing: number[]
  sorted: Set<number>
  note: string
}

function quickSortSnapshots(initial: number[]): Snapshot[] {
  const snapshots: Snapshot[] = []
  const arr = initial.slice()
  const sorted = new Set<number>()

  snapshots.push({
    array: arr.slice(),
    pivotIndex: null,
    comparing: [],
    sorted: new Set(sorted),
    note: '초기 배열입니다.',
  })

  function partition(lo: number, hi: number): number {
    const pivotIndex = hi
    snapshots.push({
      array: arr.slice(),
      pivotIndex,
      comparing: [],
      sorted: new Set(sorted),
      note: `피벗 선택: arr[${pivotIndex}] = ${arr[pivotIndex]}`,
    })

    let i = lo - 1
    for (let j = lo; j < hi; j++) {
      snapshots.push({
        array: arr.slice(),
        pivotIndex,
        comparing: [j],
        sorted: new Set(sorted),
        note: `arr[${j}] = ${arr[j]} 와 피벗 ${arr[pivotIndex]} 비교`,
      })
      if (arr[j] <= arr[pivotIndex]) {
        i++
        if (i !== j) {
          ;[arr[i], arr[j]] = [arr[j], arr[i]]
          snapshots.push({
            array: arr.slice(),
            pivotIndex,
            comparing: [i, j],
            sorted: new Set(sorted),
            note: `arr[${i}] 와 arr[${j}] 를 교환`,
          })
        }
      }
    }
    i++
    ;[arr[i], arr[hi]] = [arr[hi], arr[i]]
    sorted.add(i)
    snapshots.push({
      array: arr.slice(),
      pivotIndex: i,
      comparing: [],
      sorted: new Set(sorted),
      note: `피벗을 최종 위치 ${i} 로 이동. 이 위치는 확정됩니다.`,
    })
    return i
  }

  function sort(lo: number, hi: number): void {
    if (lo >= hi) {
      if (lo === hi) sorted.add(lo)
      return
    }
    const p = partition(lo, hi)
    sort(lo, p - 1)
    sort(p + 1, hi)
  }

  sort(0, arr.length - 1)

  snapshots.push({
    array: arr.slice(),
    pivotIndex: null,
    comparing: [],
    sorted: new Set(Array.from({ length: arr.length }, (_, i) => i)),
    note: '정렬 완료!',
  })

  return snapshots
}

export function QuickSort({
  initial = [38, 27, 43, 3, 9, 82, 10],
  description = '피벗을 기준으로 배열이 분할되는 과정을 단계별로 확인하세요.',
}: QuickSortProps) {
  const snapshots = useMemo(() => quickSortSnapshots(initial), [initial])
  const controller = useStepController(snapshots.length)
  const current = snapshots[controller.step]
  const maxValue = Math.max(...initial)

  return (
    <VisualContainer title="Quick Sort 분할 과정" description={description}>
      <div className="flex min-h-[180px] items-end justify-center gap-2 rounded-[10px] bg-muted/40 p-4">
        {current.array.map((value, idx) => {
          const isPivot = idx === current.pivotIndex
          const isComparing = current.comparing.includes(idx)
          const isSorted = current.sorted.has(idx)

          const stateClass = isPivot
            ? vizStateClasses('pivot')
            : isComparing
              ? vizStateClasses('comparing')
              : isSorted
                ? vizStateClasses('confirmed')
                : 'border-border bg-background text-foreground'

          return (
            <div key={idx} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex w-10 items-end justify-center rounded-[6px] border-2 text-[13px] font-semibold transition-all duration-300',
                  stateClass,
                )}
                style={{ height: `${(value / maxValue) * 100 + 32}px` }}
              >
                <span className="pb-1">{value}</span>
              </div>
              <span className="text-[11px] text-muted-foreground">{idx}</span>
            </div>
          )
        })}
      </div>

      <StepController
        {...controller}
        stepDescription={current.note}
        showSpeedSlider={false}
        showProgressBar={false}
      />

      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
        <LegendDot stateClass="bg-viz-pivot-bg border-viz-pivot" label="피벗" />
        <LegendDot stateClass="bg-viz-comparing-bg border-viz-comparing" label="비교 중" />
        <LegendDot stateClass="bg-viz-confirmed-bg border-viz-confirmed" label="확정" />
      </div>
    </VisualContainer>
  )
}

function LegendDot({ stateClass, label }: { stateClass: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn('inline-block h-3 w-3 rounded-sm border-2', stateClass)}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}
