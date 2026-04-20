'use client'

import { useRef, useState } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'

interface CodeFigureProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode
}

export function CodeFigure({ children, ...props }: CodeFigureProps) {
  const figureRef = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const pre = figureRef.current?.querySelector('pre')
    if (!pre) return
    try {
      await navigator.clipboard.writeText(pre.textContent ?? '')
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard denied — silently ignore
    }
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
