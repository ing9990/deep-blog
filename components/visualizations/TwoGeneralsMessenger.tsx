'use client'

import { useState } from 'react'
import { Send, Swords, User2, Skull } from 'lucide-react'
import { VisualContainer } from './common/VisualContainer'
import { vizStateClasses } from './common/colors'
import { cn } from '@/lib/utils'

interface Attempt {
  id: number
  direction: 'AtoB' | 'BtoA'
  depth: number
  delivered: boolean
  description: string
}

interface TwoGeneralsMessengerProps {
  description?: string
}

const DELIVERY_SUCCESS_RATE = 0.6

export function TwoGeneralsMessenger({ description }: TwoGeneralsMessengerProps) {
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [nextId, setNextId] = useState(1)

  const lastDelivered = attempts.filter((a) => a.delivered).slice(-1)[0]
  const confirmedDepth = lastDelivered ? lastDelivered.depth : 0
  const nextDirection: 'AtoB' | 'BtoA' = confirmedDepth % 2 === 0 ? 'AtoB' : 'BtoA'
  const nextDepth = confirmedDepth + 1

  const labelForDepth = (depth: number, direction: 'AtoB' | 'BtoA'): string => {
    if (depth === 1) return '"내일 6시 공격"'
    if (depth === 2) return '"알았다. 6시에 공격하겠다"'
    if (depth === 3) return '"너의 ACK를 받았다"'
    const who = direction === 'AtoB' ? 'A' : 'B'
    return `${who}의 ACK 체인 ${depth}단계`
  }

  const attemptSend = (): void => {
    const delivered = Math.random() < DELIVERY_SUCCESS_RATE
    const label = labelForDepth(nextDepth, nextDirection)
    const sender = nextDirection === 'AtoB' ? '장군 A' : '장군 B'
    const receiver = nextDirection === 'AtoB' ? '장군 B' : '장군 A'
    const description = delivered
      ? `${sender} → ${receiver}: ${label} 도달. 하지만 ${sender}는 도달했는지 모른다.`
      : `${sender} → ${receiver}: ${label} 소실. ${receiver}는 아무것도 모른다.`
    setAttempts((prev) => [
      ...prev,
      { id: nextId, direction: nextDirection, depth: nextDepth, delivered, description },
    ])
    setNextId((n) => n + 1)
  }

  const reset = (): void => {
    setAttempts([])
    setNextId(1)
  }

  const lostCount = attempts.filter((a) => !a.delivered).length
  const hasAttempts = attempts.length > 0

  return (
    <VisualContainer
      title="Two Generals' Messenger"
      description={description ?? '메시지를 반복해서 보내보세요. 아무리 많이 보내도 보낸 쪽은 상대가 받았는지 확신할 수 없습니다.'}
      onReset={hasAttempts ? reset : undefined}
    >
      <div className="flex items-end justify-between gap-3 rounded-[12px] border border-border bg-muted/30 p-4">
        <div className="flex flex-col items-center gap-2">
          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-full border-2',
              vizStateClasses('pivot'),
            )}
            aria-label="장군 A"
          >
            <User2 className="h-7 w-7" aria-hidden="true" />
          </div>
          <span className="text-xs font-semibold text-foreground">장군 A</span>
          <span className="text-[11px] text-muted-foreground">왼쪽 언덕</span>
        </div>

        <div className="flex flex-1 flex-col items-center gap-2">
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full border-2',
              vizStateClasses('blocked'),
            )}
            aria-label="적 계곡"
          >
            <Swords className="h-6 w-6" aria-hidden="true" />
          </div>
          <span className="text-xs font-semibold text-foreground">적 계곡</span>
          <span className="text-[11px] text-muted-foreground">부하가 잡힐 수 있는 구간</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-full border-2',
              vizStateClasses('comparing'),
            )}
            aria-label="장군 B"
          >
            <User2 className="h-7 w-7" aria-hidden="true" />
          </div>
          <span className="text-xs font-semibold text-foreground">장군 B</span>
          <span className="text-[11px] text-muted-foreground">오른쪽 언덕</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-[10px] border border-border bg-background p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            확정된 ACK 체인
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {confirmedDepth}단계
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            다음 필요: {nextDepth}단계 (끝없이 증가)
          </p>
        </div>
        <div className="rounded-[10px] border border-border bg-background p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            누적 소실 메시지
          </p>
          <p className="mt-1 flex items-baseline gap-1 text-lg font-semibold text-foreground">
            {lostCount}
            <Skull className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            전송 성공률 약 {Math.round(DELIVERY_SUCCESS_RATE * 100)}%
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={attemptSend}
          className="inline-flex items-center gap-2 rounded-[10px] border border-border bg-foreground px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          다음 메시지 보내기 ({nextDirection === 'AtoB' ? 'A → B' : 'B → A'})
        </button>
      </div>

      {attempts.length > 0 && (
        <div className="mt-4 max-h-48 overflow-y-auto rounded-[10px] border border-border bg-background">
          <ul className="divide-y divide-border">
            {attempts
              .slice()
              .reverse()
              .map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-3 py-2 text-[13px]">
                  <span
                    className={cn(
                      'mt-0.5 inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                      a.delivered
                        ? vizStateClasses('confirmed')
                        : vizStateClasses('blocked'),
                    )}
                  >
                    #{a.id} {a.delivered ? '도달' : '소실'}
                  </span>
                  <span className="leading-relaxed text-foreground">{a.description}</span>
                </li>
              ))}
          </ul>
        </div>
      )}

      <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
        결론: 체인이 길어져도 마지막으로 보낸 쪽은 항상 상대가 받았는지 확신할 수 없습니다. 이것이 Two Generals{"'"} Problem의 핵심 불가능성입니다.
      </p>
    </VisualContainer>
  )
}
