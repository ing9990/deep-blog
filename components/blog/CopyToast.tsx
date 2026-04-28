'use client'

import { useEffect, useState } from 'react'
import { Check, AlertCircle } from 'lucide-react'

type ToastKind = 'success' | 'error'

interface ToastDetail {
  kind: ToastKind
}

const EVENT_NAME = 'deep:copy-toast'
const VISIBLE_MS = 1800

export function emitCopyToast(kind: ToastKind) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<ToastDetail>(EVENT_NAME, { detail: { kind } }))
}

export function CopyToast() {
  const [state, setState] = useState<ToastKind | null>(null)

  useEffect(() => {
    let timeoutId: number | undefined
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ToastDetail>).detail
      if (!detail) return
      setState(detail.kind)
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => setState(null), VISIBLE_MS)
    }
    window.addEventListener(EVENT_NAME, handler)
    return () => {
      window.removeEventListener(EVENT_NAME, handler)
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    }
  }, [])

  if (state === null) return null

  const isSuccess = state === 'success'
  return (
    <div
      className={`copy-toast copy-toast--${state}`}
      role="status"
      aria-live="polite"
    >
      {isSuccess ? (
        <Check size={16} aria-hidden className="copy-toast__icon" />
      ) : (
        <AlertCircle size={16} aria-hidden className="copy-toast__icon" />
      )}
      <span>{isSuccess ? '클립보드에 복사되었어요' : '복사하지 못했어요'}</span>
    </div>
  )
}
