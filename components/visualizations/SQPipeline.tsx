'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses, type VizState } from './common/colors'

interface StageState {
  state: VizState
  lines: string[]
}

interface Snapshot {
  storage: StageState
  quantizer: StageState
  search: StageState
  note: string
}

function computeSnapshots(): Snapshot[] {
  const snaps: Snapshot[] = []

  snaps.push({
    storage: {
      state: 'waiting',
      lines: ['fp32 벡터 3개', 'dim = 4'],
    },
    quantizer: {
      state: 'waiting',
      lines: ['min, max 미정', 'quantile = 0.99'],
    },
    search: {
      state: 'waiting',
      lines: ['대기'],
    },
    note: '초기 상태입니다. Collection에 fp32 벡터가 저장되어 있고, 양자화는 아직 실행되지 않았습니다.',
  })

  snaps.push({
    storage: {
      state: 'comparing',
      lines: ['v1 = [0.08, -0.12, 0.85, 0.03]', 'v2 = [0.05, -0.01, 0.91, 0.02]', 'v3 = [0.11, -0.09, 0.88, 0.04]'],
    },
    quantizer: {
      state: 'comparing',
      lines: ['분포 스캔', '0.5% 꼬리 clip'],
    },
    search: {
      state: 'waiting',
      lines: ['대기'],
    },
    note: 'Quantizer가 모든 벡터 원소 값을 훑어 분포를 수집합니다. quantile 0.99로 상하위 0.5% 이상치를 잘라낼 준비를 합니다.',
  })

  snaps.push({
    storage: {
      state: 'waiting',
      lines: ['fp32 벡터 3개'],
    },
    quantizer: {
      state: 'confirmed',
      lines: ['min = -0.12', 'max = 0.91', '256 구간 확정'],
    },
    search: {
      state: 'waiting',
      lines: ['대기'],
    },
    note: 'min/max가 결정되어 fp32 값을 int8 256 구간에 매핑할 준비가 끝났습니다. 이 파라미터는 collection 전체가 공유합니다.',
  })

  snaps.push({
    storage: {
      state: 'confirmed',
      lines: ['v1 int8 = [24, -34, 125, 10]', 'v2 int8 = [15, -2, 127, 7]', 'v3 int8 = [32, -25, 126, 14]'],
    },
    quantizer: {
      state: 'confirmed',
      lines: ['q = round((x − min) /', '    (max − min) × 255) − 128'],
    },
    search: {
      state: 'waiting',
      lines: ['대기'],
    },
    note: '선형 매핑 공식으로 각 fp32 원소를 int8 값으로 변환합니다. 벡터당 메모리가 fp32 대비 1/4로 줄었고, int8 SIMD 연산이 가능해졌습니다.',
  })

  snaps.push({
    storage: {
      state: 'waiting',
      lines: ['int8 벡터', 'RAM 상주'],
    },
    quantizer: {
      state: 'comparing',
      lines: ['쿼리 도착', '같은 min/max 적용'],
    },
    search: {
      state: 'comparing',
      lines: ['query int8', '= [20, −5, 120, 8]'],
    },
    note: '쿼리 벡터도 저장 시 사용한 동일 min/max로 int8 변환됩니다. 저장과 쿼리의 스케일이 일치해야 거리 계산이 의미를 갖습니다.',
  })

  snaps.push({
    storage: {
      state: 'confirmed',
      lines: ['int8 벡터', '거리 계산 대상'],
    },
    quantizer: {
      state: 'waiting',
      lines: ['대기'],
    },
    search: {
      state: 'comparing',
      lines: ['AVX SIMD', 'top-20 후보', '(oversampling=2.0)'],
    },
    note: 'HNSW 그래프를 탐색하며 int8 SIMD 명령으로 거리 계산. oversampling 2.0이므로 최종 top-10이 아닌 top-20을 1차 후보로 뽑습니다.',
  })

  snaps.push({
    storage: {
      state: 'comparing',
      lines: ['원본 fp32', '20개 로드'],
    },
    quantizer: {
      state: 'waiting',
      lines: ['대기'],
    },
    search: {
      state: 'confirmed',
      lines: ['fp32로 재정렬', '→ 최종 top-10'],
    },
    note: 'rescore=true이므로 1차 후보 20개의 원본 fp32를 로드해 정확한 거리로 재정렬합니다. int8 근사로 흔들린 순위가 fp32-only와 거의 같게 복구됩니다.',
  })

  return snaps
}

export function SQPipeline() {
  const snapshots = useMemo(() => computeSnapshots(), [])
  const controller = useStepController(snapshots.length)
  const current = snapshots[controller.step]

  return (
    <VisualContainer
      title="Scalar Quantization 3단 파이프라인"
      description="분포 스캔, fp32에서 int8 매핑, int8 탐색 + rescore가 각 단계에서 무엇을 하는지"
      onReset={controller.step !== 0 ? controller.reset : undefined}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StageBox title="저장소" state={current.storage.state} lines={current.storage.lines} />
        <StageBox title="양자화기" state={current.quantizer.state} lines={current.quantizer.lines} />
        <StageBox title="검색" state={current.search.state} lines={current.search.lines} />
      </div>

      <StepController {...controller} stepDescription={current.note} />
    </VisualContainer>
  )
}

interface StageBoxProps {
  title: string
  state: VizState
  lines: string[]
}

function StageBox({ title, state, lines }: StageBoxProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border p-3 transition-colors',
        vizStateClasses(state),
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
        {title}
      </p>
      <div className="mt-2 min-h-[3.5rem] space-y-1 font-mono text-[11px] leading-relaxed">
        {lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  )
}
