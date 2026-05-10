import type { ReactNode } from 'react'
import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'
import { cn } from '@/lib/utils'

export function PodCompositionViz() {
  return (
    <VisualContainer
      title="Pod의 두 가지 구성"
      description="컨테이너가 1개든 N개든, 외부에서 Pod은 IP 1개를 가진 한 단위로 보인다"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <SingleContainerPanel />
        <MultiContainerPanel />
      </div>
    </VisualContainer>
  )
}

function SingleContainerPanel() {
  return (
    <div className="space-y-3">
      <PanelTitle subtitle="Single-container">단일 컨테이너 Pod</PanelTitle>
      <PodBox podIp="10.244.0.5">
        <ContainerBox state="confirmed" name="nginx" port="80" />
      </PodBox>
      <ExternalCaption>외부 → Pod IP 1개 → 컨테이너 1개</ExternalCaption>
    </div>
  )
}

function MultiContainerPanel() {
  return (
    <div className="space-y-3">
      <PanelTitle subtitle="Sidecar pattern">멀티 컨테이너 Pod</PanelTitle>
      <PodBox podIp="10.244.0.6">
        <ContainerBox state="confirmed" name="app" port="8080" />
        <LocalhostBridge />
        <ContainerBox state="comparing" name="log-agent" />
      </PodBox>
      <ExternalCaption>같은 IP를 공유하고 localhost로 직접 통신</ExternalCaption>
    </div>
  )
}

interface PodBoxProps {
  podIp: string
  children: ReactNode
}

function PodBox({ podIp, children }: PodBoxProps) {
  return (
    <div
      className="rounded-[var(--radius-card)] border-2 border-dashed border-border bg-muted/20 p-4"
      role="img"
      aria-label={`Pod 경계 — IP ${podIp}`}
    >
      <div className="mb-3 flex items-center justify-between text-[length:var(--text-meta)] font-medium">
        <span className="text-foreground">Pod</span>
        <span className="rounded-[var(--radius-chip)] border border-border bg-background px-2 py-0.5 font-mono text-muted-foreground">
          {podIp}
        </span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

interface ContainerBoxProps {
  state: VizState
  name: string
  port?: string
}

function ContainerBox({ state, name, port }: ContainerBoxProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-[var(--radius-card)] border px-3 py-2 text-[length:var(--text-meta)]',
        vizStateClasses(state),
      )}
    >
      <span className="font-medium font-mono">{name}</span>
      {port && <span className="font-mono opacity-80">:{port}</span>}
    </div>
  )
}

function LocalhostBridge() {
  return (
    <div className="flex items-center justify-center gap-2 px-3 text-[length:var(--text-caption)] text-muted-foreground">
      <span aria-hidden="true">↕</span>
      <span className="font-mono">localhost</span>
    </div>
  )
}

function ExternalCaption({ children }: { children: ReactNode }) {
  return (
    <p className="text-[length:var(--text-caption)] text-muted-foreground">{children}</p>
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
