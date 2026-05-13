'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { vizStateClasses } from './common/colors'

type Anomaly = 'dirty' | 'nonRepeatable' | 'phantom'
type Level = 'RU' | 'RC' | 'RR' | 'SR'

interface LevelInfo {
  key: Level
  label: string
  blocked: Anomaly[]
  allowed: Anomaly[]
  short: string
}

const ANOMALY_LABEL: Record<Anomaly, string> = {
  dirty: 'dirty read',
  nonRepeatable: 'non-repeatable read',
  phantom: 'phantom read',
}

const LEVELS: LevelInfo[] = [
  {
    key: 'RU',
    label: 'READ UNCOMMITTED',
    blocked: [],
    allowed: ['dirty', 'nonRepeatable', 'phantom'],
    short: '커밋되지 않은 변경도 그대로 보인다',
  },
  {
    key: 'RC',
    label: 'READ COMMITTED',
    blocked: ['dirty'],
    allowed: ['nonRepeatable', 'phantom'],
    short: '커밋된 값만 본다',
  },
  {
    key: 'RR',
    label: 'REPEATABLE READ',
    blocked: ['dirty', 'nonRepeatable'],
    allowed: ['phantom'],
    short: '한 트랜잭션 안에서 같은 행은 같은 값이 보인다 (ANSI 스펙 기준)',
  },
  {
    key: 'SR',
    label: 'SERIALIZABLE',
    blocked: ['dirty', 'nonRepeatable', 'phantom'],
    allowed: [],
    short: '동시 트랜잭션들이 차례로 실행된 것과 같다',
  },
]

export function IsolationLevelCards() {
  const [selected, setSelected] = useState<Level>('RU')
  const info = LEVELS.find((l) => l.key === selected)!

  return (
    <VisualContainer
      title="네 가지 격리 수준과 막히는 이상 현상"
      description="격리 수준 카드를 클릭하면 그 수준이 어떤 이상 현상을 막고 어떤 것을 막지 못하는지 보입니다. ANSI SQL 기준입니다."
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {LEVELS.map((level) => {
          const active = level.key === selected
          return (
            <button
              key={level.key}
              type="button"
              onClick={() => setSelected(level.key)}
              className={cn(
                'rounded-[var(--radius-card)] border-2 p-3 text-left transition-colors',
                active
                  ? vizStateClasses('highlight')
                  : 'border-border bg-background hover:bg-muted',
              )}
              aria-pressed={active}
            >
              <div className="text-[10px] font-bold uppercase tracking-[var(--tracking-wide)] text-muted-foreground">
                Lv {level.key}
              </div>
              <div className="mt-1 font-mono text-[11.5px] font-semibold leading-tight">
                {level.label}
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-4 rounded-[var(--radius-card)] border border-border bg-muted/30 p-3">
        <p className="text-[length:var(--text-meta)] text-muted-foreground">
          <span className="font-semibold text-foreground">{info.label}</span>: {info.short}
        </p>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-[var(--radius-card)] border-2 border-viz-confirmed bg-viz-confirmed-bg p-2">
            <div className="text-[10px] font-bold uppercase tracking-[var(--tracking-wide)] text-viz-confirmed-fg">
              막는 이상 현상
            </div>
            <ul className="mt-1 space-y-0.5">
              {info.blocked.length === 0 ? (
                <li className="text-[11.5px] text-viz-confirmed-fg opacity-70">없음</li>
              ) : (
                info.blocked.map((a) => (
                  <li key={a} className="text-[11.5px] font-mono text-viz-confirmed-fg">
                    ✓ {ANOMALY_LABEL[a]}
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-[var(--radius-card)] border-2 border-viz-blocked bg-viz-blocked-bg p-2">
            <div className="text-[10px] font-bold uppercase tracking-[var(--tracking-wide)] text-viz-blocked-fg">
              막지 못하는 이상 현상
            </div>
            <ul className="mt-1 space-y-0.5">
              {info.allowed.length === 0 ? (
                <li className="text-[11.5px] text-viz-blocked-fg opacity-70">없음</li>
              ) : (
                info.allowed.map((a) => (
                  <li key={a} className="text-[11.5px] font-mono text-viz-blocked-fg">
                    × {ANOMALY_LABEL[a]}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </VisualContainer>
  )
}
