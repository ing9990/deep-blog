import type { ReactNode } from 'react'
import { vizStateClasses } from './common/colors'
import { VisualContainer } from './common/VisualContainer'
import { cn } from '@/lib/utils'

const CONFIG_ENTRIES = [
  { key: 'APP_COLOR', value: 'blue' },
  { key: 'APP_MODE', value: 'prod' },
]

export function ConfigMapInjectionViz() {
  return (
    <VisualContainer
      title="ConfigMap을 Pod에 주입하는 세 방식"
      description="같은 ConfigMap이라도 envFrom · 단일 env · Volume 중 무엇으로 주입하느냐에 따라 컨테이너 안에 들어가는 형태가 달라진다"
    >
      <div className="space-y-5">
        <SourcePanel />
        <div aria-hidden="true" className="text-center text-[length:var(--text-caption)] text-muted-foreground">
          ↓ 주입
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <ResultPanel
            method="envFrom"
            caption="모든 키 → 환경 변수 전체"
          >
            {CONFIG_ENTRIES.map((e) => (
              <EnvVarRow key={e.key} name={e.key} value={e.value} />
            ))}
          </ResultPanel>
          <ResultPanel
            method="단일 env"
            caption="키 하나 → 환경 변수 한 개"
          >
            <EnvVarRow name="APP_COLOR" value="blue" />
          </ResultPanel>
          <ResultPanel
            method="Volume"
            caption="모든 키 → 파일 (키=파일명, 값=내용)"
          >
            {CONFIG_ENTRIES.map((e) => (
              <FileRow key={e.key} path={`/etc/config/${e.key}`} content={e.value} />
            ))}
          </ResultPanel>
        </div>
      </div>
    </VisualContainer>
  )
}

function SourcePanel() {
  return (
    <div
      className="rounded-[var(--radius-card)] border border-border bg-muted/20 p-4"
      role="img"
      aria-label="ConfigMap app-config — APP_COLOR=blue, APP_MODE=prod"
    >
      <div className="mb-3 flex items-center gap-2 text-[length:var(--text-meta)] font-medium">
        <span className="text-foreground">ConfigMap</span>
        <span className="rounded-[var(--radius-chip)] border border-border bg-background px-2 py-0.5 font-mono text-muted-foreground">
          app-config
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {CONFIG_ENTRIES.map((e) => (
          <div
            key={e.key}
            className={cn(
              'flex items-center justify-between rounded-[var(--radius-chip)] border px-3 py-1.5 font-mono text-[length:var(--text-meta)]',
              vizStateClasses('pivot'),
            )}
          >
            <span>{e.key}</span>
            <span className="opacity-80">{e.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ResultPanelProps {
  method: string
  caption: string
  children: ReactNode
}

function ResultPanel({ method, caption, children }: ResultPanelProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[length:var(--text-h5)] font-semibold text-foreground">
          {method}
        </span>
      </div>
      <div
        className="rounded-[var(--radius-card)] border-2 border-dashed border-border bg-background p-3"
        role="img"
        aria-label={`${method} 주입 결과`}
      >
        <p className="mb-2 text-[length:var(--text-meta)] font-medium text-muted-foreground">
          컨테이너 안
        </p>
        <div className="space-y-1.5">{children}</div>
      </div>
      <p className="text-[length:var(--text-caption)] leading-relaxed text-muted-foreground">
        {caption}
      </p>
    </div>
  )
}

function EnvVarRow({ name, value }: { name: string; value: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-[var(--radius-chip)] border px-2.5 py-1 font-mono text-[length:var(--text-caption)]',
        vizStateClasses('confirmed'),
      )}
    >
      <span>{name}</span>
      <span className="opacity-80">={value}</span>
    </div>
  )
}

function FileRow({ path, content }: { path: string; content: string }) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-chip)] border px-2.5 py-1 font-mono text-[length:var(--text-caption)]',
        vizStateClasses('comparing'),
      )}
    >
      <div className="truncate">{path}</div>
      <div className="opacity-70">└ {content}</div>
    </div>
  )
}
