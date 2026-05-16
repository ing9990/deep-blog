'use client'

import { useMemo } from 'react'
import { ArrowRight, Lock, Radio, Server, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'
import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'

interface Snapshot {
  note: string
  signaling: VizState
  signalLabel: string
  peerA: VizState
  peerADetail: string
  peerB: VizState
  peerBDetail: string
  stun: VizState
  stunLabel: string
  media: 'none' | 'direct'
}

const SNAPSHOTS: Snapshot[] = [
  {
    note: 'Peer A와 Peer B가 같은 통화방에 입장했습니다. 아직 서로의 네트워크 주소도, 함께 쓸 코덱도 모릅니다.',
    signaling: 'waiting',
    signalLabel: '',
    peerA: 'waiting',
    peerADetail: '주소·코덱 미정',
    peerB: 'waiting',
    peerBDetail: '주소·코덱 미정',
    stun: 'waiting',
    stunLabel: '',
    media: 'none',
  },
  {
    note: 'Peer A가 자신이 지원하는 코덱과 후보 주소를 담은 offer SDP를 만듭니다.',
    signaling: 'waiting',
    signalLabel: '',
    peerA: 'highlight',
    peerADetail: 'offer SDP 생성',
    peerB: 'waiting',
    peerBDetail: '대기',
    stun: 'waiting',
    stunLabel: '',
    media: 'none',
  },
  {
    note: 'offer SDP가 시그널링 서버를 거쳐 Peer B에게 전달됩니다. 이 경로로는 미디어가 아니라 소개 정보만 흐릅니다.',
    signaling: 'comparing',
    signalLabel: 'offer SDP: A → B',
    peerA: 'confirmed',
    peerADetail: 'offer 전송 완료',
    peerB: 'comparing',
    peerBDetail: 'offer SDP 수신',
    stun: 'waiting',
    stunLabel: '',
    media: 'none',
  },
  {
    note: 'Peer B가 answer SDP로 응답합니다. answer도 같은 시그널링 서버를 거쳐 돌아가고, 이제 양쪽이 상대의 코덱과 후보 주소를 압니다.',
    signaling: 'comparing',
    signalLabel: 'answer SDP: B → A',
    peerA: 'comparing',
    peerADetail: 'answer SDP 수신',
    peerB: 'confirmed',
    peerBDetail: 'answer 전송 완료',
    stun: 'waiting',
    stunLabel: '',
    media: 'none',
  },
  {
    note: '양쪽 피어가 STUN 서버에 바깥에서 보이는 자기 주소를 묻습니다. NAT 뒤의 사설 주소 대신 쓸 공인 주소(candidate)를 확보합니다.',
    signaling: 'waiting',
    signalLabel: '',
    peerA: 'comparing',
    peerADetail: '공인 주소 질의',
    peerB: 'comparing',
    peerBDetail: '공인 주소 질의',
    stun: 'highlight',
    stunLabel: 'STUN: 공인 주소 응답',
    media: 'none',
  },
  {
    note: 'ICE가 모은 후보 주소들(사설·STUN·TURN)을 짝지어 동시에 연결을 시도합니다. 통하는 조합 중 가장 좋은 경로를 찾습니다.',
    signaling: 'waiting',
    signalLabel: '',
    peerA: 'comparing',
    peerADetail: 'ICE 경로 시도',
    peerB: 'comparing',
    peerBDetail: 'ICE 경로 시도',
    stun: 'waiting',
    stunLabel: '',
    media: 'none',
  },
  {
    note: 'NAT을 직접 통과하는 경로가 성공했습니다. 모든 직접 경로가 막히면 TURN 서버가 미디어를 중계하는 경로로 폴백합니다.',
    signaling: 'waiting',
    signalLabel: '',
    peerA: 'confirmed',
    peerADetail: '직접 경로 확정',
    peerB: 'confirmed',
    peerBDetail: '직접 경로 확정',
    stun: 'waiting',
    stunLabel: '',
    media: 'direct',
  },
  {
    note: 'DTLS 핸드셰이크로 암호화 키를 교환하고, 영상·음성·데이터가 SRTP로 암호화되어 A와 B 사이를 직접 흐릅니다. 시그널링 서버는 더 이상 관여하지 않습니다.',
    signaling: 'waiting',
    signalLabel: '',
    peerA: 'confirmed',
    peerADetail: '미디어 송수신',
    peerB: 'confirmed',
    peerBDetail: '미디어 송수신',
    stun: 'waiting',
    stunLabel: '',
    media: 'direct',
  },
]

interface WebRtcConnectionFlowProps {
  description?: string
}

export function WebRtcConnectionFlow({
  description = 'offer·answer 교환부터 NAT 통과, P2P 미디어 전송까지 WebRTC 연결이 맺어지는 과정을 단계별로 따라갑니다.',
}: WebRtcConnectionFlowProps) {
  const controller = useStepController(SNAPSHOTS.length)
  const s = useMemo(() => SNAPSHOTS[controller.step], [controller.step])

  return (
    <VisualContainer title="WebRTC 연결 수립" description={description} onReset={controller.reset}>
      <div className="flex flex-col items-center gap-2">
        <Box
          state={s.signaling}
          icon={<Server className="h-4 w-4" aria-hidden="true" />}
          title="시그널링 서버"
          subtitle="WebSocket · STOMP"
        />

        <Channel label={s.signalLabel} fallback="소개 정보(SDP) 운반 경로" />

        <div className="grid w-full grid-cols-2 gap-3">
          <Box
            state={s.peerA}
            icon={<Wifi className="h-4 w-4" aria-hidden="true" />}
            title="Peer A"
            subtitle="NAT 뒤 브라우저"
            detail={s.peerADetail}
          />
          <Box
            state={s.peerB}
            icon={<Wifi className="h-4 w-4" aria-hidden="true" />}
            title="Peer B"
            subtitle="NAT 뒤 브라우저"
            detail={s.peerBDetail}
          />
        </div>

        <Channel label={s.stunLabel} fallback="공인 주소 확인·중계 경로" />

        <Box
          state={s.stun}
          icon={<Radio className="h-4 w-4" aria-hidden="true" />}
          title="STUN / TURN 서버"
          subtitle="공인 주소 응답 · 미디어 중계"
        />

        <MediaBar mode={s.media} />
      </div>

      <StepController {...controller} stepDescription={s.note} />

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <LegendDot state="highlight" label="현재 동작" />
        <LegendDot state="comparing" label="처리 중" />
        <LegendDot state="confirmed" label="완료" />
        <LegendDot state="waiting" label="대기" />
      </div>
    </VisualContainer>
  )
}

interface BoxProps {
  state: VizState
  icon: React.ReactNode
  title: string
  subtitle: string
  detail?: string
}

function Box({ state, icon, title, subtitle, detail }: BoxProps) {
  return (
    <div
      className={cn(
        'w-full rounded-[10px] border-2 px-4 py-3 text-center transition-colors',
        vizStateClasses(state),
      )}
    >
      <div className="flex items-center justify-center gap-1.5 text-[14px] font-semibold">
        {icon}
        {title}
      </div>
      <div className="mt-0.5 text-[11px] opacity-85">{subtitle}</div>
      {detail && (
        <div className="mt-2 inline-block rounded-[6px] bg-background/40 px-2 py-1 font-mono text-[11px]">
          {detail}
        </div>
      )}
    </div>
  )
}

function Channel({ label, fallback }: { label: string; fallback: string }) {
  const active = label.length > 0
  return (
    <div className="flex flex-col items-center">
      <span
        className={cn(
          'h-4 w-px',
          active ? 'bg-primary' : 'bg-border',
        )}
        aria-hidden="true"
      />
      <span
        className={cn(
          'rounded-[6px] border px-2 py-0.5 text-[11px]',
          active
            ? 'border-primary/40 bg-primary/10 font-medium text-foreground'
            : 'border-dashed border-border text-muted-foreground',
        )}
      >
        {active ? label : fallback}
      </span>
      <span
        className={cn(
          'h-4 w-px',
          active ? 'bg-primary' : 'bg-border',
        )}
        aria-hidden="true"
      />
    </div>
  )
}

function MediaBar({ mode }: { mode: 'none' | 'direct' }) {
  const active = mode === 'direct'
  return (
    <div
      className={cn(
        'mt-2 w-full rounded-[10px] border px-4 py-3 text-center',
        active
          ? cn('border-2', vizStateClasses('confirmed'))
          : 'border-dashed border-border bg-muted/30',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center gap-2 text-[12px] font-medium',
          active ? '' : 'text-muted-foreground',
        )}
      >
        {active ? (
          <Lock className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        )}
        <span>{active ? 'P2P 직접 연결 · 영상·음성·데이터 직접 전송' : 'P2P 미디어 경로 (아직 미연결)'}</span>
      </div>
      <div
        className={cn(
          'mt-1 text-[11px]',
          active ? 'opacity-85' : 'text-muted-foreground',
        )}
      >
        {active
          ? 'DTLS로 키 교환 후 SRTP 암호화 · 서버를 거치지 않음'
          : '연결이 맺어지면 이 경로로 미디어가 흐릅니다'}
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
