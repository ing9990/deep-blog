'use client'

import { ChefHat, ClipboardList, User } from 'lucide-react'
import { useId, useMemo, useState, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import {
  SCENARIOS,
  getActivitiesActiveAt,
  type ActorRole,
  type ArrowKind,
  type ScenarioKey,
  type Step,
} from './RestaurantIOSequence.scenarios'

const ACTORS: Array<{
  role: ActorRole
  label: string
  subtitle: string
  Icon: typeof User
  tone: VizState
}> = [
  { role: 'customer-a', label: '손님 A', subtitle: '호출자', Icon: User, tone: 'comparing' },
  { role: 'customer-b', label: '손님 B', subtitle: '호출자', Icon: User, tone: 'comparing' },
  { role: 'customer-c', label: '손님 C', subtitle: '호출자', Icon: User, tone: 'comparing' },
  { role: 'staff', label: '직원', subtitle: '서버 스레드', Icon: ClipboardList, tone: 'waiting' },
  { role: 'kitchen', label: '주방', subtitle: '커널', Icon: ChefHat, tone: 'pivot' },
]

const COL_X: Record<ActorRole, number> = {
  'customer-a': 50,
  'customer-b': 150,
  'customer-c': 250,
  staff: 350,
  kitchen: 450,
}
const STEP_HEIGHT = 40 // px per step in the SVG viewBox
const SVG_TOP = 20

const ARROW_COLOR: Record<ArrowKind, string> = {
  request: 'var(--primary)',
  response: 'var(--viz-confirmed-border)',
  eagain: 'var(--viz-waiting-border)',
  bell: 'var(--viz-highlight-border)',
  free: 'var(--muted-foreground)',
}

function stepY(step: number): number {
  return SVG_TOP + step * STEP_HEIGHT
}

function vizFillStrokeStyle(state: VizState): CSSProperties {
  return {
    fill: `var(--viz-${state}-bg)`,
    stroke: `var(--viz-${state}-border)`,
    strokeWidth: 1.5,
  }
}

function actorOpacity(role: ActorRole, activeCustomer: Step['activeCustomer']): number {
  if (role === 'staff' || role === 'kitchen') return 1
  if (activeCustomer === null) return 1
  return role === activeCustomer ? 1 : 0.3
}

export interface RestaurantIOSequenceProps {
  initial?: ScenarioKey
}

export function RestaurantIOSequence({
  initial = 'sync-blocking',
}: RestaurantIOSequenceProps) {
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>(initial)
  const scenario = useMemo(
    () => SCENARIOS.find((s) => s.key === scenarioKey) ?? SCENARIOS[0],
    [scenarioKey],
  )
  const controller = useStepController(scenario.steps.length)
  const current = scenario.steps[controller.step]
  const svgHeight = SVG_TOP + scenario.steps.length * STEP_HEIGHT + 20
  const baseId = useId()
  const titleId = `${baseId}-title`
  const descId = `${baseId}-desc`

  return (
    <VisualContainer
      title="요청 → 응답 시퀀스 (음식점 비유)"
      description="손님이 주문을 보내고 음식을 받기까지의 메시지 흐름. 라이프라인 음영 = 멈춘 시간."
    >
      <div className="mb-3 flex flex-wrap gap-1">
        {SCENARIOS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => {
              setScenarioKey(s.key)
              controller.reset()
            }}
            className={cn(
              'rounded-[var(--radius-chip)] border px-3 py-1.5 text-[length:var(--text-meta)] font-medium transition-colors',
              scenarioKey === s.key
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border bg-background text-muted-foreground hover:bg-muted',
            )}
            aria-pressed={scenarioKey === s.key}
          >
            {s.axis}
          </button>
        ))}
      </div>
      <div className="mb-3 rounded-[var(--radius-card)] border border-border bg-muted/20 p-3">
        <p className="text-[length:var(--text-meta)] font-semibold text-foreground">
          {scenario.title}
        </p>
        <p className="mt-1 text-[length:var(--text-caption)] leading-relaxed text-muted-foreground">
          {scenario.subtitle}
        </p>
      </div>
      <div className="rounded-[var(--radius-card)] border border-border bg-muted/30 p-4">
        <div className="grid grid-cols-5 gap-3 mb-3">
          {ACTORS.map((a) => {
            const op = actorOpacity(a.role, current.activeCustomer)
            return (
              <div
                key={a.role}
                className="flex flex-col items-center text-center transition-opacity duration-300 motion-reduce:transition-none"
                style={{ opacity: op }}
              >
                <div className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-full border-2',
                  vizStateClasses(a.tone),
                )}>
                  <a.Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="mt-1.5 text-[length:var(--text-meta)] font-semibold text-foreground">
                  {a.label}
                </div>
                <div className="text-[length:var(--text-caption)] text-muted-foreground">
                  {a.subtitle}
                </div>
              </div>
            )
          })}
        </div>
        <svg
          viewBox={`0 0 500 ${svgHeight}`}
          className="w-full"
          role="img"
          aria-labelledby={titleId}
          aria-describedby={descId}
        >
          <title id={titleId}>
            {scenario.title} (Step {controller.step + 1} / {scenario.steps.length})
          </title>
          <desc id={descId}>{current.note}</desc>
          {/* time axis on the left */}
          <line x1={20} y1={10} x2={20} y2={svgHeight - 10} stroke="var(--muted-foreground)" strokeWidth="1" />
          <polygon points={`17,${svgHeight - 15} 23,${svgHeight - 15} 20,${svgHeight - 8}`} fill="var(--muted-foreground)" />
          <text x={20} y={6} fontSize="9" fill="var(--muted-foreground)" textAnchor="middle">시간</text>
          {/* arrowhead markers (one per kind) */}
          <defs>
            {(Object.keys(ARROW_COLOR) as ArrowKind[]).map((kind) => (
              <marker
                key={kind}
                id={`${baseId}-arrow-${kind}`}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={ARROW_COLOR[kind]} />
              </marker>
            ))}
          </defs>
          {/* per-actor groups: lifeline + activity rects with focus opacity */}
          {ACTORS.map((a) => {
            const x = COL_X[a.role]
            const op = actorOpacity(a.role, current.activeCustomer)
            return (
              <g key={a.role} opacity={op} className="transition-opacity duration-300 motion-reduce:transition-none">
                <line
                  x1={x} y1={0} x2={x} y2={svgHeight}
                  stroke="var(--border)" strokeWidth="1" strokeDasharray="3,3"
                />
                {getActivitiesActiveAt(scenario.activities[a.role], controller.step).map((act, j) => {
                  const y = stepY(act.fromStep)
                  const height = (act.toStep - act.fromStep + 1) * STEP_HEIGHT - 6
                  return (
                    <rect
                      key={`${a.role}-${j}`}
                      x={x - 6}
                      y={y - 18}
                      width={12}
                      height={height}
                      rx={2}
                      style={vizFillStrokeStyle(act.state)}
                    />
                  )
                })}
              </g>
            )
          })}
          {/* message arrows up to current step */}
          {scenario.arrows
            .filter((arrow) => arrow.atStep <= controller.step)
            .map((arrow, i) => {
              const x1 = COL_X[arrow.from]
              const x2 = COL_X[arrow.to]
              const y = stepY(arrow.atStep)
              const isCurrent = arrow.atStep === controller.step
              const opacity = isCurrent ? 1 : 0.45
              const dashArray = arrow.kind === 'eagain' ? '4,3' : undefined
              return (
                <g key={`arrow-${arrow.atStep}-${i}`} opacity={opacity}>
                  <line
                    x1={x1 + (x2 > x1 ? 6 : -6)}
                    y1={y}
                    x2={x2 - (x2 > x1 ? 6 : -6)}
                    y2={y}
                    stroke={ARROW_COLOR[arrow.kind]}
                    strokeWidth={isCurrent ? 2 : 1.25}
                    strokeDasharray={dashArray}
                    markerEnd={`url(#${baseId}-arrow-${arrow.kind})`}
                  />
                  <text
                    x={(x1 + x2) / 2}
                    y={y - 5}
                    fontSize="10"
                    fill={ARROW_COLOR[arrow.kind]}
                    textAnchor="middle"
                    fontWeight={isCurrent ? 600 : 400}
                  >
                    {arrow.label}
                  </text>
                </g>
              )
            })}
        </svg>
      </div>
      <StepController {...controller} stepDescription={current.note} />
      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-[length:var(--text-caption)] text-muted-foreground">
        <LegendDot state="blocked" label="호출자 멈춤" />
        <LegendDot state="comparing" label="처리 중" />
        <LegendDot state="pivot" label="요리 중" />
        <LegendDot state="confirmed" label="완료" />
        <LegendDot state="highlight" label="강조" />
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4" style={{ background: 'var(--primary)' }} aria-hidden="true" />
          요청
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4" style={{ background: 'var(--viz-confirmed-border)' }} aria-hidden="true" />
          응답
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 border-t border-dashed" style={{ borderColor: 'var(--viz-waiting-border)' }} aria-hidden="true" />
          EAGAIN
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4" style={{ background: 'var(--viz-highlight-border)' }} aria-hidden="true" />
          벨 알림
        </span>
      </div>
      <div className="mt-3 rounded-[var(--radius-card)] border border-border bg-background p-3">
        <p className="text-[length:var(--text-caption)] text-muted-foreground">
          <span className="font-semibold text-foreground">현실에서는</span>{' '}
          {scenario.realWorld}
        </p>
      </div>
    </VisualContainer>
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
