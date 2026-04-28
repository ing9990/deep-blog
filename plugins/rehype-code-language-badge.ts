import type { Plugin } from 'unified'
import { visitParents } from 'unist-util-visit-parents'

/*
 * rehype-code-language-badge
 * --------------------------
 * Runs after rehype-pretty-code. For every <figure data-rehype-pretty-
 * code-figure>, reads the raw language from the nested <code data-
 * language="..."> token, normalizes long identifiers to short 2-4 char
 * tokens (typescript → ts, python → py, ...), and mirrors that value
 * onto the <figcaption> as data-language. It also prepends a small
 * <span class="code-lang-icon" data-lang data-len> inside the figcaption
 * so CSS can render a VS-Code-style file-type icon to the left of the
 * filename. The `data-len` attribute picks a font-size bucket so 2/3/4
 * character tokens all stay legible inside the same 22x22 square.
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
  groovy:     'gvy',
  properties: 'props',
  proto:      'pb',
  nasm:       'asm',
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

// Velite's MDX pipeline surfaces hast element properties with their HTML-
// style hyphenated keys (e.g. "data-rehype-pretty-code-figure") rather than
// the camelCase DOM form used elsewhere in the hast ecosystem. These helpers
// let the plugin read/write properties under either shape so it survives a
// future upstream pipeline change.
function hasProp(properties: Record<string, unknown>, ...names: string[]): boolean {
  for (const n of names) {
    if (Object.prototype.hasOwnProperty.call(properties, n)) return true
  }
  return false
}

function readProp(properties: Record<string, unknown>, ...names: string[]): unknown {
  for (const n of names) {
    if (Object.prototype.hasOwnProperty.call(properties, n)) return properties[n]
  }
  return undefined
}

const rehypeCodeLanguageBadge: Plugin<[], HastElement> = () => (tree) => {
  visitParents(tree as unknown as Parameters<typeof visitParents>[0], 'element', (node: unknown) => {
    const el = node as HastElement
    if (el.tagName !== 'figure') return
    if (!el.properties) return
    // Velite's MDX pipeline surfaces hast properties with their HTML-style
    // hyphenated keys (e.g. "data-rehype-pretty-code-figure"), not the
    // camelCase DOM form. Accept both so the plugin stays portable if the
    // pipeline changes.
    if (!hasProp(el.properties, 'data-rehype-pretty-code-figure', 'dataRehypePrettyCodeFigure')) return

    const code = findCodeElement(el)
    const rawLang = code?.properties
      ? readProp(code.properties, 'data-language', 'dataLanguage')
      : undefined
    if (typeof rawLang !== 'string' || rawLang === '' || rawLang === 'plaintext') return

    const normalized = LANG_MAP[rawLang.toLowerCase()] ?? rawLang
    const iconText = normalized.toUpperCase()
    const iconLen = Math.min(iconText.length, 4)

    for (const child of el.children) {
      if (isElement(child) && child.tagName === 'figcaption') {
        // Write normalized value back on whichever key form is already in
        // use so we don't leave both variants on the same node.
        const existing = child.properties ?? {}
        const useHyphen = Object.prototype.hasOwnProperty.call(existing, 'data-language')
        const langKey = useHyphen ? 'data-language' : 'dataLanguage'
        child.properties = { ...existing, [langKey]: normalized }

        const alreadyInjected = child.children.some(
          (c) => {
            if (!isElement(c)) return false
            const cls = c.properties?.className ?? c.properties?.['class']
            if (Array.isArray(cls)) return (cls as string[]).includes('code-lang-icon')
            if (typeof cls === 'string') return cls.split(/\s+/).includes('code-lang-icon')
            return false
          },
        )
        if (alreadyInjected) continue

        const iconSpan: HastElement = {
          type: 'element',
          tagName: 'span',
          properties: useHyphen
            ? {
                class: 'code-lang-icon',
                'data-lang': normalized,
                'data-len': String(iconLen),
                'aria-hidden': 'true',
              }
            : {
                className: ['code-lang-icon'],
                dataLang: normalized,
                dataLen: String(iconLen),
                ariaHidden: 'true',
              },
          children: [{ type: 'text', value: iconText }],
        }
        child.children = [iconSpan, ...child.children]
      }
    }
  })
}

export default rehypeCodeLanguageBadge
