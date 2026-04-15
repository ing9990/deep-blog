// lib/search-index.ts
import type { IndexOptionsForDocumentSearch } from 'flexsearch'

/**
 * One document indexed by FlexSearch. `body` is the plain-text extraction
 * from the raw MDX content; `tags` and `keywords` are joined with spaces
 * so FlexSearch treats them as a single tokenized field.
 */
export interface SearchDoc {
  slug: string
  title: string
  summary: string
  body: string
  tags: string
  keywords: string
}

/**
 * FlexSearch Document configuration shared by the build-time generator
 * and the client-side loader. Field resolution values reflect relevance
 * signal strength: title match is strongest (resolution 9), body match
 * is weakest (resolution 5, prone to noise).
 *
 * See spec §4.1 for the weighting rationale. FlexSearch 0.7 does not
 * support explicit `weight` property; relevance is determined by field
 * order, resolution, and the `boost` callback during search.
 */
export const SEARCH_INDEX_CONFIG: IndexOptionsForDocumentSearch<SearchDoc, false> = {
  document: {
    id: 'slug',
    index: [
      { field: 'title', tokenize: 'forward', resolution: 9 },
      { field: 'summary', tokenize: 'forward', resolution: 7 },
      { field: 'tags', tokenize: 'forward', resolution: 5 },
      { field: 'keywords', tokenize: 'forward', resolution: 5 },
      { field: 'body', tokenize: 'forward', resolution: 5 },
    ],
  },
}

/**
 * Serialized FlexSearch index — what `public/search-index.json` contains.
 * FlexSearch's `Document.export(callback)` emits a key/value pair per
 * internal index chunk; we collect them into this flat map.
 */
export type SerializedIndex = Record<string, string>

/**
 * Strip all MDX syntax to produce a plain-text string suitable for
 * FlexSearch. Removes frontmatter, JSX tags, code blocks, inline code,
 * KaTeX math, images, and markdown markup — leaves only human-readable
 * body text and link anchor text.
 *
 * Used by both the build-time script and its unit tests. Keeping it in
 * this shared module avoids duplication and lets tests run without
 * touching the filesystem.
 */
export function extractPlainText(mdxContent: string): string {
  return mdxContent
    .replace(/^---[\s\S]*?\n---\n/, '')
    .replace(/<[A-Z][^>]*\/?>|<\/[A-Z][^>]*>/g, ' ')
    .replace(/<[a-z][^>]*>|<\/[a-z][^>]*>/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$\n]*\$/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_~>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
