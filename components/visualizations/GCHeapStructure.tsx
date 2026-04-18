import { vizStateClasses } from './common/colors'
import { VisualContainer } from './common/VisualContainer'

export function GCHeapStructure() {
  return (
    <VisualContainer
      title="JVM 힙 구조"
      description="Young에서 태어나 Survivor를 거쳐 Old로 승격되는 공간적 구조"
    >
      <div className="space-y-4">
        <div>
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Young Generation
            </span>
            <span className="text-[11px] text-muted-foreground">
              짧게 사는 객체 · 전체 힙의 약 1/3
            </span>
          </div>
          <div className="grid grid-cols-[8fr_1fr_1fr] gap-1">
            <div
              className={`flex h-20 flex-col items-center justify-center rounded-md border-2 ${vizStateClasses('comparing')}`}
            >
              <div className="text-sm font-bold">Eden</div>
              <div className="text-[10px] opacity-80">새 객체 할당</div>
            </div>
            <div
              className={`flex h-20 flex-col items-center justify-center rounded-md border-2 ${vizStateClasses('confirmed')}`}
            >
              <div className="text-sm font-bold">S0</div>
              <div className="text-[9px] opacity-80">생존</div>
            </div>
            <div
              className={`flex h-20 flex-col items-center justify-center rounded-md border-2 ${vizStateClasses('confirmed')}`}
            >
              <div className="text-sm font-bold">S1</div>
              <div className="text-[9px] opacity-80">생존</div>
            </div>
          </div>
        </div>

        <div
          className="flex flex-col items-center gap-1 text-muted-foreground"
          aria-hidden="true"
        >
          <span className="text-[11px]">age ≥ threshold → Old로 승격</span>
          <span className="text-base leading-none">↓</span>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Old Generation
            </span>
            <span className="text-[11px] text-muted-foreground">
              장수 객체 · 전체 힙의 약 2/3
            </span>
          </div>
          <div
            className={`flex h-16 items-center justify-center rounded-md border-2 ${vizStateClasses('pivot')}`}
          >
            <div className="text-center">
              <div className="text-sm font-bold">Old</div>
              <div className="text-[10px] opacity-80">
                오래 살아남은 객체 + 대용량 객체 직접 할당
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span
              className={`inline-block size-2 rounded-sm border ${vizStateClasses('comparing')}`}
              aria-hidden="true"
            />
            신규 할당
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className={`inline-block size-2 rounded-sm border ${vizStateClasses('confirmed')}`}
              aria-hidden="true"
            />
            생존 버퍼
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className={`inline-block size-2 rounded-sm border ${vizStateClasses('pivot')}`}
              aria-hidden="true"
            />
            승격된 객체
          </span>
        </div>
      </div>
    </VisualContainer>
  )
}
