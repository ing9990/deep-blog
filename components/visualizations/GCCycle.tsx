'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses, type VizState } from './common/colors'

interface GCObj {
  id: string
  age: number
}

interface HeapState {
  eden: GCObj[]
  s0: GCObj[]
  s1: GCObj[]
  old: GCObj[]
}

interface Snapshot {
  heap: HeapState
  alive: Set<string>
  garbage: Set<string>
  moving: Set<string>
  promoting: Set<string>
  note: string
}

const EDEN_CAP = 5
const SURV_CAP = 4
const OLD_CAP = 6

const NONE = new Set<string>()

function o(id: string, age = 0): GCObj {
  return { id, age }
}

function computeSnapshots(): Snapshot[] {
  const snaps: Snapshot[] = []

  snaps.push({
    heap: { eden: [], s0: [], s1: [], old: [] },
    alive: NONE, garbage: NONE, moving: NONE, promoting: NONE,
    note: '새 JVM이 시작되었습니다. 힙이 비어 있습니다.',
  })

  snaps.push({
    heap: { eden: [o('A'), o('B'), o('C'), o('D'), o('E')], s0: [], s1: [], old: [] },
    alive: NONE, garbage: NONE, moving: NONE, promoting: NONE,
    note: 'new 키워드로 객체 5개가 Eden에 할당됩니다.',
  })

  snaps.push({
    heap: { eden: [o('A'), o('B'), o('C'), o('D'), o('E')], s0: [], s1: [], old: [] },
    alive: new Set(['A', 'C', 'E']),
    garbage: new Set(['B', 'D']),
    moving: NONE, promoting: NONE,
    note: 'Eden이 가득 찼습니다. Minor GC가 시작되어 살아있는 객체(A, C, E)를 Mark합니다.',
  })

  snaps.push({
    heap: { eden: [], s0: [o('A', 1), o('C', 1), o('E', 1)], s1: [], old: [] },
    alive: NONE, garbage: NONE,
    moving: new Set(['A', 'C', 'E']),
    promoting: NONE,
    note: '살아남은 객체를 Survivor 0으로 복사합니다. age가 1로 증가합니다.',
  })

  snaps.push({
    heap: {
      eden: [o('F'), o('G'), o('H'), o('I'), o('J')],
      s0: [o('A', 1), o('C', 1), o('E', 1)], s1: [], old: [],
    },
    alive: NONE, garbage: NONE, moving: NONE, promoting: NONE,
    note: '새 객체 5개가 Eden에 할당됩니다.',
  })

  snaps.push({
    heap: {
      eden: [o('F'), o('G'), o('H'), o('I'), o('J')],
      s0: [o('A', 1), o('C', 1), o('E', 1)], s1: [], old: [],
    },
    alive: new Set(['F', 'H', 'A', 'E']),
    garbage: new Set(['G', 'I', 'J', 'C']),
    moving: NONE, promoting: NONE,
    note: '두 번째 Minor GC. Eden과 S0을 함께 Mark합니다.',
  })

  snaps.push({
    heap: {
      eden: [], s0: [],
      s1: [o('F', 1), o('H', 1), o('A', 2), o('E', 2)], old: [],
    },
    alive: NONE, garbage: NONE,
    moving: new Set(['F', 'H', 'A', 'E']),
    promoting: NONE,
    note: '생존 객체를 Survivor 1로 복사합니다. A와 E는 age 2가 됩니다.',
  })

  snaps.push({
    heap: {
      eden: [o('K'), o('L'), o('M'), o('N')], s0: [],
      s1: [o('F', 1), o('H', 1), o('A', 2), o('E', 2)], old: [],
    },
    alive: NONE, garbage: NONE, moving: NONE, promoting: NONE,
    note: '새 객체가 Eden에 할당됩니다.',
  })

  snaps.push({
    heap: {
      eden: [o('K'), o('L'), o('M'), o('N')], s0: [],
      s1: [o('F', 1), o('H', 1), o('A', 2), o('E', 2)], old: [],
    },
    alive: new Set(['K', 'M', 'F', 'A', 'E']),
    garbage: new Set(['L', 'N', 'H']),
    moving: NONE, promoting: NONE,
    note: '세 번째 Minor GC. A와 E는 age 3에 도달합니다.',
  })

  snaps.push({
    heap: {
      eden: [], s0: [o('K', 1), o('M', 1), o('F', 2)],
      s1: [], old: [o('A', 3), o('E', 3)],
    },
    alive: NONE, garbage: NONE,
    moving: new Set(['K', 'M', 'F']),
    promoting: new Set(['A', 'E']),
    note: 'age 임계치 도달. A와 E가 Old Generation으로 승격됩니다.',
  })

  snaps.push({
    heap: {
      eden: [o('T'), o('U')], s0: [], s1: [],
      old: [o('A', 3), o('E', 3), o('P', 4), o('Q', 3), o('R', 5)],
    },
    alive: NONE, garbage: NONE, moving: NONE, promoting: NONE,
    note: 'Old 영역에 승격된 객체가 계속 쌓입니다.',
  })

  snaps.push({
    heap: {
      eden: [o('T'), o('U')], s0: [], s1: [],
      old: [o('A', 3), o('E', 3), o('P', 4), o('Q', 3), o('R', 5)],
    },
    alive: new Set(['A', 'R']),
    garbage: new Set(['E', 'P', 'Q']),
    moving: NONE, promoting: NONE,
    note: 'Old 임계치 도달. Full GC가 전체 힙을 Mark합니다. Stop-the-World 발생.',
  })

  snaps.push({
    heap: {
      eden: [o('T'), o('U')], s0: [], s1: [],
      old: [o('A', 3), o('R', 5)],
    },
    alive: NONE, garbage: NONE, moving: NONE, promoting: NONE,
    note: 'Full GC 완료. Old의 가비지가 회수되고 메모리가 Compact됩니다.',
  })

  return snaps
}

interface GCCycleProps {
  description?: string
}

export function GCCycle({
  description = '객체가 Eden에서 생성되고, Minor GC를 거쳐 Survivor → Old로 이동하는 과정을 단계별로 확인하세요.',
}: GCCycleProps) {
  const snapshots = useMemo(computeSnapshots, [])
  const controller = useStepController(snapshots.length)
  const current = snapshots[controller.step]

  return (
    <VisualContainer title="세대별 GC 사이클" description={description}>
      <div className="space-y-3">
        <div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Young Generation
          </div>
          <div className="grid grid-cols-[2fr_1fr_1fr] gap-2">
            <Region label="Eden" objects={current.heap.eden} capacity={EDEN_CAP} snapshot={current} />
            <Region label="S0" objects={current.heap.s0} capacity={SURV_CAP} snapshot={current} />
            <Region label="S1" objects={current.heap.s1} capacity={SURV_CAP} snapshot={current} />
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Old Generation
          </div>
          <Region label="Old" objects={current.heap.old} capacity={OLD_CAP} snapshot={current} />
        </div>
      </div>

      <StepController {...controller} stepDescription={current.note} />

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <LegendDot state="confirmed" label="살아있음" />
        <LegendDot state="blocked" label="가비지" />
        <LegendDot state="comparing" label="복사 중" />
        <LegendDot state="pivot" label="승격" />
      </div>
    </VisualContainer>
  )
}

interface RegionProps {
  label: string
  objects: GCObj[]
  capacity: number
  snapshot: Snapshot
}

function Region({ label, objects, capacity, snapshot }: RegionProps) {
  const empty = Math.max(0, capacity - objects.length)
  return (
    <div className="rounded-[10px] border border-border bg-muted/20 p-2.5">
      <div className="mb-2 text-[11px] font-semibold text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {objects.map((obj) => (
          <ObjBox key={obj.id} obj={obj} snapshot={snapshot} />
        ))}
        {Array.from({ length: empty }, (_, i) => (
          <div
            key={`e-${i}`}
            className="h-8 w-8 rounded-[6px] border-2 border-dashed border-border/40"
          />
        ))}
      </div>
    </div>
  )
}

function ObjBox({ obj, snapshot }: { obj: GCObj; snapshot: Snapshot }) {
  const state: VizState = snapshot.promoting.has(obj.id)
    ? 'pivot'
    : snapshot.garbage.has(obj.id)
      ? 'blocked'
      : snapshot.moving.has(obj.id)
        ? 'comparing'
        : snapshot.alive.has(obj.id)
          ? 'confirmed'
          : 'waiting'

  return (
    <div
      className={cn(
        'relative flex h-8 w-8 items-center justify-center rounded-[6px] border-2 text-[11px] font-bold transition-all duration-300 motion-reduce:transition-none',
        vizStateClasses(state),
      )}
    >
      {obj.id}
      {obj.age > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-border bg-background text-[8px] font-semibold text-foreground">
          {obj.age}
        </span>
      )}
    </div>
  )
}

function LegendDot({ state, label }: { state: VizState; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn('inline-block h-3 w-3 rounded-sm border-2', vizStateClasses(state))}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}
