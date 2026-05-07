import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'
import { cn } from '@/lib/utils'

interface ExternalSegment {
  label: string
  size: number
  kind: 'used' | 'free'
  color?: VizState
}

const EXTERNAL_SEGMENTS: ExternalSegment[] = [
  { label: 'A', size: 100, kind: 'used', color: 'pivot' },
  { label: '빈', size: 50, kind: 'free' },
  { label: 'C', size: 80, kind: 'used', color: 'comparing' },
  { label: '빈', size: 70, kind: 'free' },
  { label: 'E', size: 120, kind: 'used', color: 'confirmed' },
  { label: '빈', size: 200, kind: 'free' },
]

const EXTERNAL_TOTAL = EXTERNAL_SEGMENTS.reduce((s, b) => s + b.size, 0)

export function FragmentationTypeContrast() {
  return (
    <VisualContainer
      title="외부 단편화와 내부 단편화"
      description="블록 바깥의 빈 자리(외부)와 블록 안의 자투리(내부)는 서로 다른 자리에서 생긴다"
    >
      <div className="space-y-6">
        <ExternalPanel />
        <Divider />
        <InternalPanel />
      </div>
    </VisualContainer>
  )
}

function ExternalPanel() {
  return (
    <div className="space-y-2">
      <PanelTitle subtitle="External Fragmentation">외부 단편화</PanelTitle>
      <div
        className="flex h-12 w-full overflow-hidden rounded-[var(--radius-card)] border border-border bg-muted/30"
        role="img"
        aria-label="외부 단편화 — 블록 사이에 빈 자리들이 흩어진 메모리"
      >
        {EXTERNAL_SEGMENTS.map((b, i) => {
          const widthPct = (b.size / EXTERNAL_TOTAL) * 100
          const isFree = b.kind === 'free'
          const colorClass =
            isFree || !b.color
              ? 'bg-muted/50 text-muted-foreground'
              : vizStateClasses(b.color)
          return (
            <div
              key={i}
              style={{ width: `${widthPct}%` }}
              className={cn(
                'flex h-full items-center justify-center overflow-hidden border-r border-background/60 text-[length:var(--text-meta)] font-medium tabular-nums last:border-r-0',
                colorClass,
              )}
            >
              <span className="truncate px-1">
                {isFree ? `빈 ${b.size}B` : `${b.label} ${b.size}B`}
              </span>
            </div>
          )
        })}
      </div>
      <p className="text-[length:var(--text-caption)] text-muted-foreground">
        빈 자리 합계 320B · 가장 큰 연속 빈 자리 200B → 250B 객체는 받을 수 없다
      </p>
    </div>
  )
}

function InternalPanel() {
  const used = 17
  const waste = 15
  const total = used + waste
  return (
    <div className="space-y-2">
      <PanelTitle subtitle="Internal Fragmentation">내부 단편화</PanelTitle>
      <div
        className="flex h-12 w-full overflow-hidden rounded-[var(--radius-card)] border border-border bg-muted/30"
        role="img"
        aria-label="내부 단편화 — 할당된 32B 블록 안에 17B 사용과 15B 자투리"
      >
        <div
          style={{ width: `${(used / total) * 100}%` }}
          className={cn(
            'flex h-full items-center justify-center overflow-hidden border-r border-background/60 text-[length:var(--text-meta)] font-medium tabular-nums',
            vizStateClasses('highlight'),
          )}
        >
          <span className="truncate px-1">사용 17B</span>
        </div>
        <div
          style={{
            width: `${(waste / total) * 100}%`,
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent 0 4px, color-mix(in oklab, var(--foreground) 12%, transparent) 4px 8px)',
          }}
          className="flex h-full items-center justify-center overflow-hidden bg-muted/40 text-[length:var(--text-meta)] font-medium tabular-nums text-muted-foreground"
        >
          <span className="truncate px-1">자투리 15B</span>
        </div>
      </div>
      <p className="text-[length:var(--text-caption)] text-muted-foreground">
        요청 17B → 할당기가 사이즈 클래스 단위로 32B 블록을 떼어 줌 → 15B가 죽은 자투리로 묶임
      </p>
    </div>
  )
}

interface PanelTitleProps {
  children: string
  subtitle: string
}

function PanelTitle({ children, subtitle }: PanelTitleProps) {
  return (
    <div className="flex items-baseline gap-2">
      <h4 className="text-[length:var(--text-h5)] font-semibold text-foreground">{children}</h4>
      <span className="text-[length:var(--text-caption)] text-muted-foreground">{subtitle}</span>
    </div>
  )
}

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[length:var(--text-caption)] text-muted-foreground">
        블록 바깥의 빈 자리 ↔ 블록 안의 자투리
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}
