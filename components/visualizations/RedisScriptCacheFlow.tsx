'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses, type VizState } from './common/colors'

interface Snapshot {
  client: { label: string; state: VizState }
  cache: { entries: Array<{ sha: string; hit: boolean }>; state: VizState }
  exec: { label: string; state: VizState }
  arrow: 'c2cache' | 'cache2c' | 'c2exec' | 'cache2exec' | 'exec2cache' | 'none'
  note: string
}

const SHA = 'fcf6c1e8...'

function computeSnapshots(): Snapshot[] {
  const snaps: Snapshot[] = []

  snaps.push({
    client: { label: '대기 중', state: 'waiting' },
    cache: { entries: [], state: 'waiting' },
    exec: { label: '유휴', state: 'waiting' },
    arrow: 'none',
    note: '초기 상태. 스크립트 캐시는 비어 있습니다.',
  })

  snaps.push({
    client: { label: `EVALSHA\n${SHA}`, state: 'comparing' },
    cache: { entries: [], state: 'waiting' },
    exec: { label: '유휴', state: 'waiting' },
    arrow: 'c2cache',
    note: '클라이언트가 EVALSHA로 캐시된 스크립트를 호출합니다.',
  })

  snaps.push({
    client: { label: '대기 중', state: 'waiting' },
    cache: { entries: [], state: 'blocked' },
    exec: { label: '유휴', state: 'waiting' },
    arrow: 'none',
    note: `캐시에서 SHA1 "${SHA}" 검색. 발견되지 않음 (cache miss).`,
  })

  snaps.push({
    client: { label: 'NOSCRIPT 수신\n(라이브러리가 자동 처리)', state: 'blocked' },
    cache: { entries: [], state: 'waiting' },
    exec: { label: '유휴', state: 'waiting' },
    arrow: 'cache2c',
    note: 'Redis가 NOSCRIPT 에러로 응답. 클라이언트 라이브러리가 자동 폴백을 시작합니다.',
  })

  snaps.push({
    client: { label: 'EVAL <원본 스크립트>', state: 'comparing' },
    cache: { entries: [], state: 'waiting' },
    exec: { label: '유휴', state: 'waiting' },
    arrow: 'c2exec',
    note: '라이브러리가 EVAL로 폴백. 스크립트 본문을 통째로 전송합니다.',
  })

  snaps.push({
    client: { label: '대기 중', state: 'waiting' },
    cache: { entries: [{ sha: SHA, hit: true }], state: 'pivot' },
    exec: { label: '컴파일 + 실행', state: 'comparing' },
    arrow: 'exec2cache',
    note: 'Redis가 스크립트를 컴파일해 SHA1로 캐시에 저장하고 실행. 단일 스레드 위에서 다른 명령은 모두 블로킹.',
  })

  snaps.push({
    client: { label: '결과 수신 ✓', state: 'confirmed' },
    cache: { entries: [{ sha: SHA, hit: false }], state: 'confirmed' },
    exec: { label: '실행 완료', state: 'confirmed' },
    arrow: 'cache2c',
    note: '실행 결과가 클라이언트로 반환됩니다. 캐시에는 컴파일된 함수가 영구 저장 (SCRIPT FLUSH 또는 재시작까지).',
  })

  snaps.push({
    client: { label: `EVALSHA\n${SHA}\n(두 번째 호출)`, state: 'comparing' },
    cache: { entries: [{ sha: SHA, hit: true }], state: 'pivot' },
    exec: { label: '유휴', state: 'waiting' },
    arrow: 'c2cache',
    note: '두 번째 호출. 다시 EVALSHA로 시도합니다.',
  })

  snaps.push({
    client: { label: '대기 중', state: 'waiting' },
    cache: { entries: [{ sha: SHA, hit: true }], state: 'confirmed' },
    exec: { label: '캐시 함수 실행', state: 'comparing' },
    arrow: 'cache2exec',
    note: 'cache hit. 컴파일된 함수가 곧바로 실행됩니다. EVAL 폴백 없이 한 번의 RTT로 처리.',
  })

  snaps.push({
    client: { label: '결과 수신 ✓', state: 'confirmed' },
    cache: { entries: [{ sha: SHA, hit: false }], state: 'confirmed' },
    exec: { label: '실행 완료', state: 'confirmed' },
    arrow: 'cache2c',
    note: '결과 반환. 이후의 모든 호출은 캐시 hit이 유지되는 동안 EVALSHA 한 번으로 끝납니다.',
  })

  return snaps
}

interface RedisScriptCacheFlowProps {
  description?: string
}

export function RedisScriptCacheFlow({
  description = 'EVALSHA가 캐시 미스를 만나 NOSCRIPT 폴백 후 EVAL로 캐시 등록되고, 두 번째 호출부터 캐시 hit으로 처리되는 과정을 단계별로 따라가 보세요.',
}: RedisScriptCacheFlowProps) {
  const snapshots = useMemo(computeSnapshots, [])
  const controller = useStepController(snapshots.length)
  const current = snapshots[controller.step]

  return (
    <VisualContainer title="EVAL/EVALSHA 캐시 흐름" description={description}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <BoxColumn label="Client">
          <ClientBox snapshot={current} />
        </BoxColumn>

        <BoxColumn label="Redis: Script Cache">
          <CacheBox snapshot={current} />
        </BoxColumn>

        <BoxColumn label="Redis: Exec Engine">
          <ExecBox snapshot={current} />
        </BoxColumn>
      </div>

      <FlowIndicator active={current.arrow} />

      <StepController {...controller} stepDescription={current.note} />

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <LegendDot state="comparing" label="진행 중" />
        <LegendDot state="confirmed" label="완료" />
        <LegendDot state="blocked" label="실패/미스" />
        <LegendDot state="pivot" label="새로 캐시됨" />
        <LegendDot state="waiting" label="대기" />
      </div>
    </VisualContainer>
  )
}

interface BoxColumnProps {
  label: string
  children: React.ReactNode
}

function BoxColumn({ label, children }: BoxColumnProps) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  )
}

function ClientBox({ snapshot }: { snapshot: Snapshot }) {
  return (
    <div
      className={cn(
        'flex min-h-[92px] items-center justify-center rounded-[10px] border-2 p-3 text-center text-[12px] font-medium leading-snug whitespace-pre-line transition-all duration-300 motion-reduce:transition-none',
        vizStateClasses(snapshot.client.state),
      )}
    >
      {snapshot.client.label}
    </div>
  )
}

function CacheBox({ snapshot }: { snapshot: Snapshot }) {
  const empty = snapshot.cache.entries.length === 0
  return (
    <div
      className={cn(
        'min-h-[92px] rounded-[10px] border-2 p-2.5 transition-all duration-300 motion-reduce:transition-none',
        vizStateClasses(snapshot.cache.state),
      )}
    >
      {empty ? (
        <div className="flex h-full min-h-[68px] items-center justify-center text-[11px] italic opacity-70">
          비어 있음
        </div>
      ) : (
        <div className="space-y-1.5">
          {snapshot.cache.entries.map((row) => (
            <div
              key={row.sha}
              className={cn(
                'rounded-[6px] border-2 p-2 text-[11px] leading-snug transition-all duration-300 motion-reduce:transition-none',
                vizStateClasses(row.hit ? 'pivot' : 'confirmed'),
              )}
            >
              <div className="font-mono font-semibold">SHA1: {row.sha}</div>
              <div className="mt-0.5 font-mono text-[10px] opacity-80">
                compiled lua function
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ExecBox({ snapshot }: { snapshot: Snapshot }) {
  return (
    <div
      className={cn(
        'flex min-h-[92px] items-center justify-center rounded-[10px] border-2 p-3 text-center text-[12px] font-medium leading-snug transition-all duration-300 motion-reduce:transition-none',
        vizStateClasses(snapshot.exec.state),
      )}
    >
      {snapshot.exec.label}
    </div>
  )
}

function FlowIndicator({ active }: { active: Snapshot['arrow'] }) {
  const ARROW_LABEL: Record<Snapshot['arrow'], string | null> = {
    c2cache: 'Client → Cache (SHA1 조회)',
    cache2c: 'Cache → Client (응답 또는 NOSCRIPT)',
    c2exec: 'Client → Exec (EVAL 폴백)',
    cache2exec: 'Cache → Exec (캐시 hit, 컴파일된 함수 실행)',
    exec2cache: 'Exec → Cache (컴파일 결과 등록)',
    none: null,
  }
  const label = ARROW_LABEL[active]
  if (!label) {
    return (
      <div className="mt-3 h-6 text-center text-[11px] italic text-muted-foreground/50">
        흐름 대기 중
      </div>
    )
  }
  return (
    <div className="mt-3 flex h-6 items-center justify-center text-[11px] font-medium text-primary">
      → {label}
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
