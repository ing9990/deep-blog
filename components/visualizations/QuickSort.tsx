'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const current = snapshots[step]
  const maxStep = snapshots.length - 1

  useEffect(() => {
    if (!playing) return
    if (step >= maxStep) {
      setPlaying(false)
      return
    }
    const handle = setTimeout(() => setStep((s) => Math.min(maxStep, s + 1)), 800)
    return () => clearTimeout(handle)
  }, [playing, step, maxStep])

  const maxValue = Math.max(...initial)

  return (
    <figure className="not-prose my-8 rounded-[14px] border border-border bg-background p-5">
      <figcaption className="mb-4">
        <p className="text-sm font-semibold text-foreground">Quick Sort 분할 과정</p>
        <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
      </figcaption>

      <div className="flex min-h-[180px] items-end justify-center gap-2 rounded-[10px] bg-muted/40 p-4">
        {current.array.map((value, idx) => {
          const isPivot = idx === current.pivotIndex
          const isComparing = current.comparing.includes(idx)
          const isSorted = current.sorted.has(idx)
          return (
            <div key={idx} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex items-end justify-center rounded-[6px] border-2 transition-all duration-300',
                  'w-10 text-[13px] font-semibold',
                  isPivot && 'border-amber-500 bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-100',
                  isComparing && !isPivot && 'border-blue-500 bg-blue-100 text-blue-950 dark:bg-blue-950/60 dark:text-blue-100',
                  isSorted && !isPivot && !isComparing && 'border-emerald-500 bg-emerald-100 text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-100',
                  !isPivot && !isComparing && !isSorted && 'border-border bg-background text-foreground',
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

      <div className="mt-4 rounded-[10px] border border-border bg-muted/30 p-3 text-[13px] leading-relaxed text-foreground">
        <span className="font-semibold">Step {step} / {maxStep}:</span> {current.note}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setStep(0)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
            disabled={step === 0 && !playing}
            aria-label="처음으로 리셋"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
            disabled={step === 0}
            aria-label="이전 단계"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
            disabled={step >= maxStep}
            aria-label={playing ? '일시정지' : '자동 재생'}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(maxStep, s + 1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
            disabled={step >= maxStep}
            aria-label="다음 단계"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <LegendDot className="border-amber-500 bg-amber-100 dark:bg-amber-950/60" label="피벗" />
          <LegendDot className="border-blue-500 bg-blue-100 dark:bg-blue-950/60" label="비교 중" />
          <LegendDot className="border-emerald-500 bg-emerald-100 dark:bg-emerald-950/60" label="확정" />
        </div>
      </div>
    </figure>
  )
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('inline-block h-3 w-3 rounded-sm border-2', className)} aria-hidden="true" />
      {label}
    </span>
  )
}
