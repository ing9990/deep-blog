// tests/remark-auto-link.test.ts
import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { VFile } from 'vfile'
import remarkAutoLink from '@/plugins/remark-auto-link'

const keywordToSlug = new Map<string, string>([
  ['b-tree', 'b-tree-structure'],
  ['kafka', 'kafka-basics'],
  ['kafka consumer group', 'kafka-consumer-group'],
  ['인덱스', 'database-index'],
])
const keywordsByLength = [
  'kafka consumer group',
  'b-tree',
  'kafka',
  '인덱스',
]

function run(markdown: string, filePath: string): string {
  const file = new VFile({ path: filePath, value: markdown })
  const processed = unified()
    .use(remarkParse)
    .use(remarkAutoLink, { keywordsByLength, keywordToSlug })
    .use(remarkStringify)
    .processSync(file)
  return String(processed)
}

describe('remark-auto-link', () => {
  it('replaces a Latin keyword in plain text with a link', () => {
    const out = run('use B-Tree for speed', 'content/posts/speed.mdx')
    expect(out).toMatch(/\[B-Tree\]\(\/posts\/b-tree-structure\)/)
  })

  it('replaces a Hangul keyword with a following particle', () => {
    const out = run('인덱스를 설명합니다', 'content/posts/intro.mdx')
    expect(out).toMatch(/\[인덱스\]\(\/posts\/database-index\)/)
  })

  it('skips keywords inside inline code', () => {
    const out = run('use `B-Tree` carefully', 'content/posts/intro.mdx')
    expect(out).not.toMatch(/\[B-Tree\]\(/)
    expect(out).toContain('`B-Tree`')
  })

  it('skips keywords inside fenced code blocks', () => {
    const md = 'see below\n\n```\nB-Tree example\n```\n'
    const out = run(md, 'content/posts/intro.mdx')
    expect(out).not.toMatch(/\[B-Tree\]\(/)
  })

  it('skips keywords already inside a link', () => {
    const out = run('[existing B-Tree](https://example.com)', 'content/posts/intro.mdx')
    expect(out).toContain('[existing B-Tree](https://example.com)')
    expect(out).not.toMatch(/\/posts\/b-tree-structure/)
  })

  it('does not link a keyword whose slug matches currentSlug (self-link)', () => {
    const out = run('use B-Tree for speed', 'content/posts/b-tree-structure.mdx')
    expect(out).not.toMatch(/\/posts\/b-tree-structure/)
    expect(out).toContain('B-Tree')
  })

  it('links only the first occurrence of a repeated keyword', () => {
    const out = run('B-Tree is fast. B-Tree again.', 'content/posts/intro.mdx')
    const matches = out.match(/\[B-Tree\]\(\/posts\/b-tree-structure\)/g) ?? []
    expect(matches).toHaveLength(1)
    expect(out).toMatch(/B-Tree again\./)
  })

  it('prefers the longer keyword in greedy matching', () => {
    const out = run('Kafka Consumer Group rebalance', 'content/posts/intro.mdx')
    expect(out).toMatch(/\[Kafka Consumer Group\]\(\/posts\/kafka-consumer-group\)/)
    expect(out).not.toMatch(/\[Kafka\]\(\/posts\/kafka-basics\)/)
  })

  it('inserts data-keyword-link attribute on generated links', () => {
    const tree = unified()
      .use(remarkParse)
      .parse(new VFile({ path: 'content/posts/intro.mdx', value: 'use B-Tree' }))
    const transformed = unified()
      .use(remarkAutoLink, { keywordsByLength, keywordToSlug })
      .runSync(tree, new VFile({ path: 'content/posts/intro.mdx', value: 'use B-Tree' }))

    let found = false
    function walk(node: unknown): void {
      if (
        node !== null &&
        typeof node === 'object' &&
        'type' in node &&
        (node as { type: string }).type === 'link' &&
        'data' in node &&
        (node as { data?: { hProperties?: Record<string, string> } }).data?.hProperties?.['data-keyword-link'] === 'true'
      ) {
        found = true
      }
      if (node !== null && typeof node === 'object' && 'children' in node) {
        const children = (node as { children?: unknown[] }).children
        if (Array.isArray(children)) children.forEach(walk)
      }
    }
    walk(transformed)
    expect(found).toBe(true)
  })

  it('handles multiple distinct keywords in the same text node', () => {
    const out = run('인덱스를 설명하고 B-Tree도 참고', 'content/posts/intro.mdx')
    expect(out).toMatch(/\[인덱스\]\(\/posts\/database-index\)/)
    expect(out).toMatch(/\[B-Tree\]\(\/posts\/b-tree-structure\)/)
  })
})
