// lib/search-index.ts
import type { IndexOptionsForDocumentSearch, Document as FlexDocument } from 'flexsearch'
import FlexSearch from 'flexsearch'

// FlexSearch 0.7 ships as CJS; its named exports live on the default object.
// Named ESM import (`import { Document }`) fails under tsx/Node ESM interop.
// We pull Document off the default object and cast to the correct type.
const { Document } = FlexSearch as unknown as {
  Document: new <T>(options: unknown) => FlexDocument<T>
}

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

const STORAGE_KEY = 'backend-notes:search-index:v1'

/**
 * Minimal Storage interface — enough to test with an in-memory object.
 * sessionStorage satisfies this in the browser.
 */
export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/**
 * Load the serialized FlexSearch index (from storage cache or fetch),
 * rebuild a Document instance, and return it. Keeps the dependency on
 * the global `fetch` and `sessionStorage` injectable so the function is
 * unit-testable.
 *
 * - First call fetches `/search-index.json`, caches the JSON blob in
 *   storage, and rebuilds the FlexSearch Document.
 * - Subsequent calls in the same session skip the fetch.
 *
 * Throws if fetch fails and no cache is available; callers should
 * catch and fall back to the substring search in lib/filters.ts.
 */
export async function loadAndBuildIndex(
  options: {
    fetchFn?: typeof fetch
    storage?: StorageLike | null
    url?: string
  } = {},
): Promise<FlexDocument<SearchDoc>> {
  const fetchFn = options.fetchFn ?? fetch
  const storage =
    options.storage === undefined
      ? typeof sessionStorage !== 'undefined'
        ? sessionStorage
        : null
      : options.storage
  const url = options.url ?? '/search-index.json'

  let serialized: SerializedIndex

  const cached = storage?.getItem(STORAGE_KEY) ?? null
  if (cached) {
    serialized = JSON.parse(cached) as SerializedIndex
  } else {
    const res = await fetchFn(url)
    if (!res.ok) {
      throw new Error(`search-index fetch failed: ${res.status}`)
    }
    serialized = (await res.json()) as SerializedIndex
    storage?.setItem(STORAGE_KEY, JSON.stringify(serialized))
  }

  const index = new Document<SearchDoc>(SEARCH_INDEX_CONFIG)
  for (const [key, data] of Object.entries(serialized)) {
    // FlexSearch 0.7 types declare import(id, document: T) but at runtime
    // it accepts the serialized string chunk produced by export(). Cast needed.
    index.import(key, data as unknown as SearchDoc)
  }
  return index
}
