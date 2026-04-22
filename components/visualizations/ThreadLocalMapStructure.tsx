import { VisualContainer } from './common/VisualContainer'
import { vizStateClasses } from './common/colors'
import { cn } from '@/lib/utils'

interface ThreadColumn {
  id: string
  label: string
  value: string
}

const THREADS: ThreadColumn[] = [
  { id: 'thread-1', label: 'Thread-1 (http-nio-1)', value: '42' },
  { id: 'thread-2', label: 'Thread-2 (http-nio-2)', value: '77' },
  { id: 'thread-3', label: 'Thread-3 (http-nio-3)', value: '11' },
]

export function ThreadLocalMapStructure() {
  return (
    <VisualContainer
      title="ThreadLocal 저장 구조"
      description="ThreadLocal 인스턴스는 프로세스 전체에 하나이고, 실제 값은 각 Thread 객체의 Map에 따로 저장됩니다"
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            'w-full max-w-md rounded-[var(--radius-card)] border-2 px-4 py-3 text-center',
            vizStateClasses('highlight'),
          )}
        >
          <p className="font-mono text-sm font-semibold">
            ThreadLocal&lt;Long&gt; USER_ID
          </p>
          <p className="mt-1 text-[11px] opacity-80">
            프로세스당 1개 인스턴스 / Map의 key로만 사용
          </p>
        </div>

        <div className="flex w-full items-center justify-around gap-4">
          {THREADS.map((t) => (
            <div
              key={`arrow-${t.id}`}
              className="flex flex-col items-center text-[10px] text-muted-foreground"
            >
              <span>WeakReference</span>
              <span className="text-lg leading-none">↓</span>
              <span className="italic">as key</span>
            </div>
          ))}
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
          {THREADS.map((t) => (
            <div
              key={t.id}
              className={cn(
                'rounded-[var(--radius-card)] border p-3',
                vizStateClasses('waiting'),
              )}
            >
              <p className="font-mono text-xs font-semibold">{t.label}</p>
              <div className="mt-2 rounded-[var(--radius-chip)] border border-border bg-background p-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  threadLocals: ThreadLocalMap
                </p>
                <div
                  className={cn(
                    'mt-2 rounded-[var(--radius-chip)] border px-2 py-1.5',
                    vizStateClasses('confirmed'),
                  )}
                >
                  <p className="font-mono text-[11px]">
                    Entry[i]
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] opacity-80">
                    key: weak(USER_ID)
                  </p>
                  <p className="font-mono text-[10px] opacity-80">
                    value: <span className="font-semibold">{t.value}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-4 border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-viz-highlight" />
            공유 ThreadLocal 인스턴스
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-viz-waiting" />
            Thread 객체
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-viz-confirmed" />
            각 Thread의 Entry (value는 strong)
          </span>
        </div>
      </div>
    </VisualContainer>
  )
}
