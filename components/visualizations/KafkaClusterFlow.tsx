'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses, type VizState } from './common/colors'

interface ClusterFlowProps {
  description?: string
}

type PartitionId = 0 | 1 | 2
type BrokerId = 0 | 1 | 2
type ProducerId = 'order' | 'product'
type Stage = 'produce' | 'append' | 'replicate' | 'advance-hw' | 'consume'

interface ReplicaState {
  log: (string | null)[]
  leo: number
}

interface PartitionState {
  leader: BrokerId
  replicas: ReplicaState[]
  hw: number
}

interface ConsumerState {
  id: string
  partition: PartitionId
  lastReadOffset: number
}

interface ActiveMessage {
  producer: ProducerId
  key: string
  value: string
  target: PartitionId
  hashNote: string
}

interface Snapshot {
  partitions: [PartitionState, PartitionState, PartitionState]
  consumers: [ConsumerState, ConsumerState, ConsumerState]
  activeMessage: ActiveMessage | null
  activeStage: Stage | null
  activePartition: PartitionId | null
  activeBrokerSet: BrokerId[]
  activeConsumer: PartitionId | null
  note: string
}

const LOG_SLOTS = 4
const PRODUCER_LABEL: Record<ProducerId, string> = {
  order: 'order-service',
  product: 'product-service',
}

function emptyReplica(): ReplicaState {
  return { log: Array(LOG_SLOTS).fill(null), leo: 0 }
}

function emptyPartition(leader: BrokerId): PartitionState {
  return {
    leader,
    replicas: [emptyReplica(), emptyReplica(), emptyReplica()],
    hw: 0,
  }
}

function append(r: ReplicaState, msg: string): ReplicaState {
  if (r.leo >= LOG_SLOTS) return r
  const log = r.log.slice()
  log[r.leo] = msg
  return { log, leo: r.leo + 1 }
}

function clonePartition(p: PartitionState): PartitionState {
  return {
    leader: p.leader,
    replicas: p.replicas.map((r) => ({ log: r.log.slice(), leo: r.leo })),
    hw: p.hw,
  }
}

function clonePartitions(
  ps: [PartitionState, PartitionState, PartitionState],
): [PartitionState, PartitionState, PartitionState] {
  return [clonePartition(ps[0]), clonePartition(ps[1]), clonePartition(ps[2])]
}

function cloneConsumers(
  cs: [ConsumerState, ConsumerState, ConsumerState],
): [ConsumerState, ConsumerState, ConsumerState] {
  return [{ ...cs[0] }, { ...cs[1] }, { ...cs[2] }]
}

function computeHw(p: PartitionState): number {
  return Math.min(...p.replicas.map((r) => r.leo))
}

function buildSnapshots(): Snapshot[] {
  const snaps: Snapshot[] = []

  const partitions: [PartitionState, PartitionState, PartitionState] = [
    emptyPartition(0),
    emptyPartition(1),
    emptyPartition(2),
  ]
  const consumers: [ConsumerState, ConsumerState, ConsumerState] = [
    { id: 'C0', partition: 0, lastReadOffset: 0 },
    { id: 'C1', partition: 1, lastReadOffset: 0 },
    { id: 'C2', partition: 2, lastReadOffset: 0 },
  ]

  const push = (patch: Partial<Snapshot> & Pick<Snapshot, 'note'>) => {
    snaps.push({
      partitions: clonePartitions(partitions),
      consumers: cloneConsumers(consumers),
      activeMessage: null,
      activeStage: null,
      activePartition: null,
      activeBrokerSet: [],
      activeConsumer: null,
      ...patch,
    })
  }

  push({
    note: '클러스터 초기 상태. 3개 Broker에 각 Partition이 1 Leader + 2 Follower로 분산 배치 (p0 Leader=B0, p1 Leader=B1, p2 Leader=B2). 모든 로그 비어 있고 LEO·HW·consumer offset 모두 0.',
  })

  const msg1: ActiveMessage = {
    producer: 'order',
    key: 'order-42',
    value: 'a',
    target: 1,
    hashNote: "hash('order-42') % 3 = 1",
  }
  push({
    activeMessage: msg1,
    activeStage: 'produce',
    activePartition: 1,
    note: "order-service가 key='order-42' value='a' 발행. Partitioner가 hash(key) % 3 = 1 로 p1 선택.",
  })

  partitions[1].replicas[1] = append(partitions[1].replicas[1], 'a')
  push({
    activeMessage: msg1,
    activeStage: 'append',
    activePartition: 1,
    activeBrokerSet: [1],
    note: 'p1 Leader(B1)가 offset 0에 append. Leader replica LEO=1. Follower는 아직이라 HW=0 유지 → "a"는 아직 unsafe.',
  })

  partitions[1].replicas[0] = append(partitions[1].replicas[0], 'a')
  partitions[1].replicas[2] = append(partitions[1].replicas[2], 'a')
  push({
    activeStage: 'replicate',
    activePartition: 1,
    activeBrokerSet: [0, 2],
    note: 'p1 Follower(B0, B2)가 Leader에게 Fetch 요청을 보내 offset 0의 "a" 수신. 3개 replica 모두 LEO=1.',
  })

  partitions[1].hw = computeHw(partitions[1])
  consumers[1].lastReadOffset = partitions[1].hw
  push({
    activeStage: 'advance-hw',
    activePartition: 1,
    activeConsumer: 1,
    note: 'ISR 전체가 offset 0 보유 → HW = min(1,1,1) = 1. C1(=p1 담당)이 HW까지 읽음 → offset 0 의 "a" 처리 완료.',
  })

  const msg2: ActiveMessage = {
    producer: 'product',
    key: 'sku-77',
    value: 'b',
    target: 2,
    hashNote: "hash('sku-77') % 3 = 2",
  }
  push({
    activeMessage: msg2,
    activeStage: 'produce',
    activePartition: 2,
    note: "product-service가 key='sku-77' value='b' 발행. hash(key) % 3 = 2 → p2로 라우팅 (Leader=B2).",
  })

  partitions[2].replicas[2] = append(partitions[2].replicas[2], 'b')
  partitions[2].replicas[0] = append(partitions[2].replicas[0], 'b')
  partitions[2].replicas[1] = append(partitions[2].replicas[1], 'b')
  partitions[2].hw = 1
  consumers[2].lastReadOffset = 1
  push({
    activeStage: 'consume',
    activePartition: 2,
    activeBrokerSet: [0, 1, 2],
    activeConsumer: 2,
    note: 'p2 Leader(B2) append → Follower(B0, B1) 복제 → HW=1 → C2 가 "b" consume. 앞 사이클과 같은 과정을 한 스텝으로 압축 표기.',
  })

  const msg3: ActiveMessage = {
    producer: 'order',
    key: 'order-42',
    value: 'c',
    target: 1,
    hashNote: "hash('order-42') % 3 = 1 (동일 key → 동일 partition)",
  }
  push({
    activeMessage: msg3,
    activeStage: 'produce',
    activePartition: 1,
    note: "order-service가 key='order-42' value='c' 재발행. 같은 key의 해시는 동일하므로 다시 p1로 라우팅 → \"같은 key의 이벤트는 같은 파티션\"이 순서 보장의 핵심.",
  })

  partitions[1].replicas[1] = append(partitions[1].replicas[1], 'c')
  push({
    activeMessage: msg3,
    activeStage: 'append',
    activePartition: 1,
    activeBrokerSet: [1],
    note: 'p1 Leader append → LEO=2 ("a","c"). Follower는 fetch 전이라 LEO=1에 머묾 → HW=1 유지, "c"는 아직 unsafe.',
  })

  partitions[1].replicas[0] = append(partitions[1].replicas[0], 'c')
  partitions[1].replicas[2] = append(partitions[1].replicas[2], 'c')
  partitions[1].hw = 2
  consumers[1].lastReadOffset = 2
  push({
    activeStage: 'consume',
    activePartition: 1,
    activeBrokerSet: [0, 2],
    activeConsumer: 1,
    note: 'p1 Follower 따라잡음 → 모든 replica LEO=2 → HW=2. C1이 offset 1의 "c"까지 consume. 같은 key 이벤트가 producer 순서대로 단일 consumer에게 도달.',
  })

  const msg4: ActiveMessage = {
    producer: 'product',
    key: 'sku-99',
    value: 'd',
    target: 0,
    hashNote: "hash('sku-99') % 3 = 0",
  }
  partitions[0].replicas[0] = append(partitions[0].replicas[0], 'd')
  partitions[0].replicas[1] = append(partitions[0].replicas[1], 'd')
  partitions[0].replicas[2] = append(partitions[0].replicas[2], 'd')
  partitions[0].hw = 1
  consumers[0].lastReadOffset = 1
  push({
    activeMessage: msg4,
    activeStage: 'consume',
    activePartition: 0,
    activeBrokerSet: [0, 1, 2],
    activeConsumer: 0,
    note: "product-service가 key='sku-99' 발행 → p0 라우팅. Leader(B0) append → Follower 복제 → HW=1 → C0 consume. p0에도 첫 이벤트 기록.",
  })

  push({
    note: '최종 상태. p0=["d"], p1=["a","c"], p2=["b"]. Sharding: 메시지가 key 해시로 파티션 분산. Durability: 각 파티션 3 replica 복제. Ordering: 같은 key는 항상 같은 파티션에 순서 기록. Safety: consumer는 HW 이하만 가시.',
  })

  return snaps
}

export function KafkaClusterFlow({
  description = '2 Producer × 3 Partition × RF=3 × 3 Consumer 의 end-to-end 흐름. 각 스텝에서 hash 라우팅, 각 replica의 LEO, 파티션별 HW, consumer offset이 어떻게 움직이는지 따라가세요.',
}: ClusterFlowProps) {
  const snapshots = useMemo(() => buildSnapshots(), [])
  const controller = useStepController(snapshots.length)
  const current = snapshots[controller.step]

  return (
    <VisualContainer
      title="Kafka Cluster: 분산 · 복제 · 소비 전 과정"
      description={description}
    >
      <div className="space-y-3">
        <ProducersRow
          activeProducer={current.activeMessage?.producer ?? null}
          activeMessage={current.activeStage === 'produce' ? current.activeMessage : null}
        />

        <ClusterPane
          partitions={current.partitions}
          activePartition={current.activePartition}
          activeBrokerSet={current.activeBrokerSet}
          activeStage={current.activeStage}
          activeMessage={current.activeMessage}
        />

        <ConsumersRow
          consumers={current.consumers}
          activeConsumer={current.activeConsumer}
          activeStage={current.activeStage}
        />
      </div>

      <StepController {...controller} stepDescription={current.note} />

      <Legend />
    </VisualContainer>
  )
}

function ProducersRow({
  activeProducer,
  activeMessage,
}: {
  activeProducer: ProducerId | null
  activeMessage: ActiveMessage | null
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4">
      <ProducerCard id="order" isActive={activeProducer === 'order'} message={activeMessage?.producer === 'order' ? activeMessage : null} />
      <ProducerCard id="product" isActive={activeProducer === 'product'} message={activeMessage?.producer === 'product' ? activeMessage : null} />
    </div>
  )
}

function ProducerCard({
  id,
  isActive,
  message,
}: {
  id: ProducerId
  isActive: boolean
  message: ActiveMessage | null
}) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border-2 bg-background p-2 transition-all duration-300 motion-reduce:transition-none sm:p-3',
        isActive ? 'border-viz-pivot bg-viz-pivot-bg' : 'border-border',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-semibold text-foreground sm:text-[13px]">
          {PRODUCER_LABEL[id]}
        </span>
        <span className="rounded-[var(--radius-chip)] bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          Producer
        </span>
      </div>
      {message ? (
        <div className="mt-2 space-y-1 text-[11px]">
          <div className="font-mono text-foreground">
            <span className="text-muted-foreground">key=</span>
            <span className="font-semibold">&quot;{message.key}&quot;</span>
            <span className="text-muted-foreground"> value=</span>
            <span className="font-semibold">&quot;{message.value}&quot;</span>
          </div>
          <div className="rounded-[var(--radius-chip)] bg-viz-highlight-bg px-2 py-1 font-mono text-[10px] text-viz-highlight-fg">
            → {message.hashNote} → p{message.target}
          </div>
        </div>
      ) : (
        <div className="mt-2 text-[11px] text-muted-foreground">대기 중</div>
      )}
    </div>
  )
}

function ClusterPane({
  partitions,
  activePartition,
  activeBrokerSet,
  activeStage,
  activeMessage,
}: {
  partitions: [PartitionState, PartitionState, PartitionState]
  activePartition: PartitionId | null
  activeBrokerSet: BrokerId[]
  activeStage: Stage | null
  activeMessage: ActiveMessage | null
}) {
  return (
    <div className="rounded-[var(--radius-panel)] border-2 border-dashed border-border bg-muted/30 p-2 sm:p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Kafka Cluster (3 Brokers × 3 Partitions × RF=3)
        </span>
        <span className="hidden text-[10px] text-muted-foreground sm:inline">
          B0, B1, B2 = 각 Broker 의 replica
        </span>
      </div>
      <div className="space-y-2">
        {([0, 1, 2] as PartitionId[]).map((pid) => {
          const isActive = activePartition === pid
          const incoming =
            isActive && activeStage === 'produce' && activeMessage ? activeMessage : null
          return (
            <PartitionRow
              key={pid}
              partitionId={pid}
              partition={partitions[pid]}
              isActive={isActive}
              activeBrokerSet={isActive ? activeBrokerSet : []}
              activeStage={isActive ? activeStage : null}
              incomingMessage={incoming}
            />
          )
        })}
      </div>
    </div>
  )
}

function PartitionRow({
  partitionId,
  partition,
  isActive,
  activeBrokerSet,
  activeStage,
  incomingMessage,
}: {
  partitionId: PartitionId
  partition: PartitionState
  isActive: boolean
  activeBrokerSet: BrokerId[]
  activeStage: Stage | null
  incomingMessage: ActiveMessage | null
}) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border-2 bg-background p-2 transition-all duration-300 motion-reduce:transition-none',
        isActive ? 'border-viz-pivot' : 'border-border',
      )}
    >
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-semibold text-foreground">Partition {partitionId}</span>
        <span className="rounded-[var(--radius-chip)] bg-viz-confirmed-bg px-2 py-0.5 font-mono text-[10px] font-semibold text-viz-confirmed-fg">
          HW={partition.hw}
        </span>
        {incomingMessage && (
          <span className="ml-auto rounded-[var(--radius-chip)] bg-viz-pivot-bg px-2 py-0.5 font-mono text-[10px] font-semibold text-viz-pivot-fg">
            ← {incomingMessage.value} 도착
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {([0, 1, 2] as BrokerId[]).map((bid) => (
          <ReplicaCard
            key={bid}
            brokerId={bid}
            isLeader={partition.leader === bid}
            replica={partition.replicas[bid]}
            hw={partition.hw}
            isActive={activeBrokerSet.includes(bid)}
            activeStage={activeStage}
          />
        ))}
      </div>
    </div>
  )
}

function ReplicaCard({
  brokerId,
  isLeader,
  replica,
  hw,
  isActive,
  activeStage,
}: {
  brokerId: BrokerId
  isLeader: boolean
  replica: ReplicaState
  hw: number
  isActive: boolean
  activeStage: Stage | null
}) {
  const leoHighlighted =
    isActive && (activeStage === 'append' || activeStage === 'replicate' || activeStage === 'consume')
  return (
    <div
      className={cn(
        'rounded-[var(--radius-chip)] border-2 bg-background p-1.5 transition-all duration-300 motion-reduce:transition-none',
        isActive
          ? 'border-viz-comparing bg-viz-comparing-bg/40'
          : isLeader
            ? 'border-viz-highlight/70'
            : 'border-border',
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-1">
        <span className="font-mono text-[10px] font-semibold text-foreground">B{brokerId}</span>
        <span
          className={cn(
            'rounded-[3px] px-1 py-0.5 font-mono text-[9px] font-bold uppercase',
            isLeader
              ? 'bg-viz-highlight-bg text-viz-highlight-fg'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {isLeader ? 'L' : 'F'}
        </span>
      </div>
      <div className="mb-1 flex gap-0.5">
        {replica.log.map((msg, idx) => {
          const state: VizState =
            msg === null ? 'waiting' : idx < hw ? 'confirmed' : 'comparing'
          return (
            <div
              key={idx}
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-[3px] border text-[10px] font-mono font-semibold sm:h-6 sm:w-6',
                vizStateClasses(state),
              )}
              aria-label={`broker ${brokerId} offset ${idx}: ${msg ?? '비어있음'}`}
            >
              {msg ?? ''}
            </div>
          )
        })}
      </div>
      <div
        className={cn(
          'rounded-[3px] px-1 py-0.5 text-center font-mono text-[10px] font-semibold',
          leoHighlighted
            ? 'bg-viz-comparing-bg text-viz-comparing-fg'
            : 'bg-muted text-muted-foreground',
        )}
      >
        LEO={replica.leo}
      </div>
    </div>
  )
}

function ConsumersRow({
  consumers,
  activeConsumer,
  activeStage,
}: {
  consumers: [ConsumerState, ConsumerState, ConsumerState]
  activeConsumer: PartitionId | null
  activeStage: Stage | null
}) {
  return (
    <div>
      <div className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Consumer Group (1:1 assignment)
      </div>
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {consumers.map((c) => {
          const isActive = activeConsumer === c.partition && activeStage !== null
          return (
            <div
              key={c.id}
              className={cn(
                'rounded-[var(--radius-card)] border-2 bg-background p-2 transition-all duration-300 motion-reduce:transition-none',
                isActive ? 'border-viz-pivot bg-viz-pivot-bg' : 'border-border',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-semibold text-foreground">{c.id}</span>
                <span className="rounded-[var(--radius-chip)] bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                  ← p{c.partition}
                </span>
              </div>
              <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                read offset:{' '}
                <span className="font-semibold text-foreground">
                  {c.lastReadOffset === 0 ? '(아직 없음)' : `0..${c.lastReadOffset - 1}`}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-muted-foreground">
      <LegendDot state="confirmed" label="HW 이하 (safe · consumer 가시)" />
      <LegendDot state="comparing" label="LEO 위 (in-flight · unsafe)" />
      <LegendDot state="waiting" label="빈 슬롯" />
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-[3px] border-2 border-viz-highlight/70 bg-background" aria-hidden="true" />
        Leader replica
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-[3px] border-2 border-viz-pivot bg-viz-pivot-bg" aria-hidden="true" />
        현재 active 요소
      </span>
    </div>
  )
}

function LegendDot({ state, label }: { state: VizState; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn('inline-block h-3 w-3 rounded-[3px] border-2', vizStateClasses(state))}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}
