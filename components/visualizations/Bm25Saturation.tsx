import { VisualContainer } from './common/VisualContainer'

const TF_POINTS = [0, 0.25, 0.5, 1, 1.5, 2, 3, 4, 6, 8, 10, 14, 20]

const CURVES = [
  { k1: 0.5, color: 'blocked', label: 'k₁ = 0.5 (빠른 포화)' },
  { k1: 1.2, color: 'pivot', label: 'k₁ = 1.2 (Lucene 기본)' },
  { k1: 2.0, color: 'comparing', label: 'k₁ = 2.0 (완만한 포화)' },
] as const

function contribution(f: number, k1: number): number {
  if (f === 0) return 0
  return (f * (k1 + 1)) / (f + k1)
}

const TF_MAX = 20
const Y_MAX = 3
const X_START = 12
const X_END = 96
const Y_BOTTOM = 50
const Y_TOP = 8

function xCoord(f: number) {
  return X_START + (f / TF_MAX) * (X_END - X_START)
}

function yCoord(v: number) {
  return Y_BOTTOM - (v / Y_MAX) * (Y_BOTTOM - Y_TOP)
}

function buildPath(k1: number): string {
  return TF_POINTS.map((f, i) => {
    const x = xCoord(f)
    const y = yCoord(contribution(f, k1))
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')
}

export function Bm25Saturation() {
  return (
    <VisualContainer
      title="k₁에 따른 TF 포화 곡선"
      description="같은 단어가 문서에 f번 등장했을 때의 기여도. k₁이 작을수록 더 빨리 포화점에 도달하고, 추가 등장의 가치가 빠르게 사라집니다."
    >
      <svg
        viewBox="0 0 100 62"
        className="h-64 w-full rounded-[var(--radius-card)] border border-border bg-background"
        aria-label="BM25의 TF 포화 곡선 비교 (k1=0.5, 1.2, 2.0)"
      >
        <line
          x1={X_START}
          y1={Y_BOTTOM}
          x2={X_END}
          y2={Y_BOTTOM}
          className="stroke-border"
          strokeWidth="0.3"
        />
        <line
          x1={X_START}
          y1={Y_BOTTOM}
          x2={X_START}
          y2={Y_TOP}
          className="stroke-border"
          strokeWidth="0.3"
        />

        {[1, 2, 3].map((v) => (
          <g key={v}>
            <line
              x1={X_START}
              x2={X_END}
              y1={yCoord(v)}
              y2={yCoord(v)}
              className="stroke-border"
              strokeWidth="0.15"
              strokeDasharray="0.8 1.2"
            />
            <text
              x={X_START - 1.5}
              y={yCoord(v) + 1.2}
              textAnchor="end"
              fontSize="3"
              className="fill-muted-foreground"
            >
              {v}
            </text>
          </g>
        ))}

        {[0, 5, 10, 15, 20].map((f) => (
          <text
            key={f}
            x={xCoord(f)}
            y={Y_BOTTOM + 4}
            textAnchor="middle"
            fontSize="3"
            className="fill-muted-foreground"
          >
            {f}
          </text>
        ))}

        <text
          x={(X_START + X_END) / 2}
          y={Y_BOTTOM + 10}
          textAnchor="middle"
          fontSize="3.2"
          className="fill-foreground"
        >
          f (단어 등장 횟수)
        </text>
        <text
          x={3}
          y={(Y_TOP + Y_BOTTOM) / 2}
          textAnchor="middle"
          fontSize="3.2"
          className="fill-foreground"
          transform={`rotate(-90, 3, ${(Y_TOP + Y_BOTTOM) / 2})`}
        >
          TF 기여도
        </text>

        {CURVES.map((c) => (
          <path
            key={c.k1}
            d={buildPath(c.k1)}
            className={`stroke-viz-${c.color}`}
            strokeWidth={c.k1 === 1.2 ? '0.9' : '0.55'}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
      </svg>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        {CURVES.map((c) => (
          <div key={c.k1} className="flex items-center gap-2">
            <span
              className={`inline-block h-[3px] w-5 rounded-full bg-viz-${c.color}`}
              aria-hidden="true"
            />
            <span className="text-[length:var(--text-caption)] text-muted-foreground">
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </VisualContainer>
  )
}
