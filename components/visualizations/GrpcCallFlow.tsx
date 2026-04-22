import { ArrowDown, ArrowLeftRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'

interface GrpcCallFlowProps {
  description?: string
}

export function GrpcCallFlow({
  description = '`.proto` 파일이 어떻게 서버 스텁과 클라이언트 스텁으로 갈라지고, 런타임에서 HTTP/2 + Protobuf 바이너리로 통신하는지 한눈에 보여줍니다.',
}: GrpcCallFlowProps) {
  return (
    <VisualContainer title="gRPC 호출 흐름" description={description}>
      <div className="flex flex-col items-center gap-3">
        <Stage
          state="pivot"
          title="user.proto"
          subtitle="계약서: service / rpc / message 선언"
          mono
        />

        <Connector label="protoc + grpc 플러그인" />

        <Stage
          state="confirmed"
          title="생성된 코드"
          subtitle="메시지 POJO · Server ImplBase · Client Stub"
        />

        <Connector label="동일 .proto에서 양쪽 동시 생성" />

        <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
          <Stage
            state="highlight"
            title="Server"
            subtitle="ImplBase 상속 + @GrpcService"
            body="getUser(req, observer) { ... }"
          />
          <Stage
            state="highlight"
            title="Client"
            subtitle="@GrpcClient로 Stub 주입"
            body="stub.getUser(request)"
          />
        </div>

        <RuntimeBar />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <LegendDot state="pivot" label="계약(.proto)" />
        <LegendDot state="confirmed" label="자동 생성 코드" />
        <LegendDot state="highlight" label="개발자 작성" />
      </div>
    </VisualContainer>
  )
}

interface StageProps {
  state: VizState
  title: string
  subtitle?: string
  body?: string
  mono?: boolean
}

function Stage({ state, title, subtitle, body, mono }: StageProps) {
  return (
    <div
      className={cn(
        'w-full rounded-[10px] border-2 px-4 py-3 text-center',
        vizStateClasses(state),
      )}
    >
      <div
        className={cn(
          'text-[14px] font-semibold',
          mono && 'font-mono',
        )}
      >
        {title}
      </div>
      {subtitle && (
        <div className="mt-1 text-[11px] opacity-85">{subtitle}</div>
      )}
      {body && (
        <div className="mt-2 inline-block rounded-[6px] bg-background/40 px-2 py-1 font-mono text-[11px]">
          {body}
        </div>
      )}
    </div>
  )
}

function Connector({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center text-muted-foreground">
      <ArrowDown className="h-4 w-4" aria-hidden="true" />
      <span className="mt-0.5 text-[11px]">{label}</span>
    </div>
  )
}

function RuntimeBar() {
  return (
    <div className="mt-2 w-full rounded-[10px] border border-dashed border-border bg-muted/30 px-4 py-3">
      <div className="flex items-center justify-center gap-2 text-[12px] font-medium text-foreground">
        <ArrowLeftRight className="h-4 w-4 text-primary" aria-hidden="true" />
        <span>HTTP/2 stream + Protobuf binary</span>
      </div>
      <div className="mt-1 text-center text-[11px] text-muted-foreground">
        한 TCP 연결 위에서 멀티플렉싱 · 양방향 스트리밍 가능
      </div>
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
