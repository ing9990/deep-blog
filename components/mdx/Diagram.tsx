'use client'

import DOMPurify from 'dompurify'
import { useEffect, useId, useState, type ReactNode } from 'react'
import { useTheme } from 'next-themes'

interface DiagramProps {
  children?: ReactNode
  code?: string
  caption?: string
}

let mermaidPromise: Promise<typeof import('mermaid').default> | null = null
function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((m) => m.default)
  }
  return mermaidPromise
}

function nodeToString(node: ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(nodeToString).join('')
  if (node && typeof node === 'object' && 'props' in node) {
    const props = (node as { props?: { children?: ReactNode } }).props
    return nodeToString(props?.children)
  }
  return ''
}

export function Diagram({ children, code, caption }: DiagramProps) {
  const source = (code ?? nodeToString(children)).trim()
  const { resolvedTheme } = useTheme()
  const reactId = useId()
  const renderId = `mmd-${reactId.replace(/[^a-zA-Z0-9]/g, '')}`
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!source) return
    let alive = true
    loadMermaid()
      .then(async (mermaid) => {
        mermaid.initialize({
          startOnLoad: false,
          theme: resolvedTheme === 'dark' ? 'dark' : 'default',
          securityLevel: 'strict',
          fontFamily: 'inherit',
        })
        const { svg: rendered } = await mermaid.render(renderId, source)
        if (!alive) return
        const sanitized = DOMPurify.sanitize(rendered, {
          USE_PROFILES: { svg: true, svgFilters: true },
          ADD_TAGS: ['foreignObject'],
        })
        setSvg(sanitized)
        setError(null)
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      alive = false
    }
  }, [source, resolvedTheme, renderId])

  return (
    <figure className="my-6 overflow-x-auto rounded-[var(--radius-panel)] border border-border bg-card p-4">
      {svg ? (
        <div
          className="flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : error ? (
        <pre className="text-sm text-destructive whitespace-pre-wrap">{error}</pre>
      ) : (
        <pre className="text-sm text-muted-foreground whitespace-pre-wrap">{source}</pre>
      )}
      {caption ? (
        <figcaption className="mt-3 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}
