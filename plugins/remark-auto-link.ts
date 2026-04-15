// plugins/remark-auto-link.ts
import { basename, extname } from 'node:path'
import type { Plugin } from 'unified'
import type { Root, Text, Link, Parent, PhrasingContent } from 'mdast'
import { visitParents, SKIP } from 'unist-util-visit-parents'
import { findMatches, type Match } from '../lib/keyword-matcher'

export interface RemarkAutoLinkOptions {
  keywordsByLength: readonly string[]
  keywordToSlug: ReadonlyMap<string, string>
}

const EXCLUDED_ANCESTOR_TYPES = new Set<string>(['link', 'inlineCode', 'code'])

const remarkAutoLink: Plugin<[RemarkAutoLinkOptions], Root> = (options) => {
  const { keywordsByLength, keywordToSlug } = options

  return (tree, file) => {
    const filePath = (file?.history?.[0] ?? (file as unknown as { path?: string })?.path ?? '') as string
    const currentSlug = filePath ? basename(filePath, extname(filePath)) : ''

    const usedKeywords = new Set<string>()

    visitParents(tree, 'text', (node: Text, ancestors: Parent[]) => {
      if (ancestors.some((a) => EXCLUDED_ANCESTOR_TYPES.has(a.type))) return

      const matches = findMatches(node.value, keywordsByLength, keywordToSlug, currentSlug)
      if (matches.length === 0) return

      const uniqueMatches = matches.filter((m) => {
        const key = m.keyword.toLowerCase()
        if (usedKeywords.has(key)) return false
        usedKeywords.add(key)
        return true
      })
      if (uniqueMatches.length === 0) return

      const newNodes = splitTextNode(node, uniqueMatches)
      const directParent = ancestors[ancestors.length - 1]
      // Text nodes only appear inside phrasing contexts, and findMatches
      // already filtered out code/link ancestors above. Narrow children
      // to PhrasingContent[] so splice accepts Text | Link inserts.
      const children = directParent.children as PhrasingContent[]
      const index = children.indexOf(node)
      if (index === -1) return

      children.splice(index, 1, ...newNodes)

      return [SKIP, index + newNodes.length]
    })
  }
}

function splitTextNode(node: Text, matches: readonly Match[]): Array<Text | Link> {
  const result: Array<Text | Link> = []
  let cursor = 0

  for (const match of matches) {
    if (match.start > cursor) {
      result.push({ type: 'text', value: node.value.slice(cursor, match.start) })
    }
    result.push({
      type: 'link',
      url: `/posts/${match.slug}`,
      title: null,
      children: [{ type: 'text', value: match.keyword }],
      data: {
        hProperties: {
          'data-keyword-link': 'true',
        },
      },
    })
    cursor = match.end
  }

  if (cursor < node.value.length) {
    result.push({ type: 'text', value: node.value.slice(cursor) })
  }

  return result
}

export default remarkAutoLink
