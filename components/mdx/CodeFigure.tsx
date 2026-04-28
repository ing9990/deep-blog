'use client'

import { useRef, useState } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import { emitCopyToast } from '@/components/blog/CopyToast'

interface CodeFigureProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode
}

async function writeClipboard(text: string): Promise<boolean> {
  // Primary path: Async Clipboard API. Requires secure context + document focus.
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // fall through to legacy path
    }
  }
  // Legacy fallback: hidden textarea + execCommand('copy'). Still supported by
  // browsers that throttle the async API on focus loss or on insecure origins.
  if (typeof document === 'undefined') return false
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '0'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  document.body.removeChild(textarea)
  return ok
}

export function CodeFigure({ children, ...props }: CodeFigureProps) {
  const figureRef = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const pre = figureRef.current?.querySelector('pre')
    if (!pre) return
    const text = pre.textContent ?? ''
    const ok = await writeClipboard(text)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    }
    emitCopyToast(ok ? 'success' : 'error')
  }

  return (
    <figure ref={figureRef} {...props}>
      {children}
      <button
        type="button"
        className="code-copy-button"
        onClick={handleCopy}
        aria-label={copied ? 'Copied' : 'Copy code'}
      >
        {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
      </button>
    </figure>
  )
}
