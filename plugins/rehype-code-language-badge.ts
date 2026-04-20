import type { Plugin } from 'unified'
import { visitParents } from 'unist-util-visit-parents'

/*
 * rehype-code-language-badge
 * --------------------------
 * Runs after rehype-pretty-code. For every <figure data-rehype-pretty-
 * code-figure>, reads the raw language from the nested <code data-
 * language="..."> token, normalizes long identifiers to short 2-3 char
 * badge tokens (typescript → ts, python → py, ...), and mirrors that
 * value onto the <figcaption> so CSS can surface it via `attr(data-
 * language)` on `::before`.
 *
 * The mapping is intentionally conservative. Unknown languages pass
 * through unchanged so rarely-used identifiers still get a readable
 * badge (e.g. "elixir" stays "elixir" until added here).
 */

const LANG_MAP: Record<string, string> = {
  typescript: 'ts',
  javascript: 'js',
  python:     'py',
  kotlin:     'kt',
  bash:       'sh',
  shell:      'sh',
  zsh:        'sh',
  rust:       'rs',
  markdown:   'md',
  yaml:       'yml',
  plaintext:  'txt',
  text:       'txt',
  csharp:     'cs',
}

interface HastElement {
  type: 'element'
  tagName: string
  properties?: Record<string, unknown>
  children: HastNode[]
}

interface HastText {
  type: 'text'
  value: string
}

type HastNode = HastElement | HastText | { type: string; children?: HastNode[] }

function isElement(node: HastNode): node is HastElement {
  return node.type === 'element'
}

function findCodeElement(node: HastElement): HastElement | undefined {
  for (const child of node.children) {
    if (!isElement(child)) continue
    if (child.tagName === 'code') return child
    const nested = findCodeElement(child)
    if (nested) return nested
  }
  return undefined
}

const rehypeCodeLanguageBadge: Plugin<[], HastElement> = () => (tree) => {
  visitParents(tree as unknown as Parameters<typeof visitParents>[0], 'element', (node: unknown) => {
    const el = node as HastElement
    if (el.tagName !== 'figure') return
    if (!el.properties) return
    if (!Object.prototype.hasOwnProperty.call(el.properties, 'dataRehypePrettyCodeFigure')) return

    const code = findCodeElement(el)
    const rawLang = code?.properties?.dataLanguage
    if (typeof rawLang !== 'string' || rawLang === '' || rawLang === 'plaintext') return

    const normalized = LANG_MAP[rawLang.toLowerCase()] ?? rawLang

    for (const child of el.children) {
      if (isElement(child) && child.tagName === 'figcaption') {
        child.properties = { ...(child.properties ?? {}), dataLanguage: normalized }
      }
    }
  })
}

export default rehypeCodeLanguageBadge
