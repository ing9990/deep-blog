// scripts/generate-search-index.ts
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import FlexSearch from 'flexsearch'
import {
  SEARCH_INDEX_CONFIG,
  extractPlainText,
  type SearchDoc,
  type SerializedIndex,
} from '../lib/search-index'

// FlexSearch ships as CJS; its named exports live on the default object.
// We cast to a minimal interface to avoid pulling in the full @types/flexsearch
// ambient declarations which don't reflect the actual runtime shape.
interface FlexSearchDocument<T> {
  add(doc: T): void
  export(callback: (key: unknown, data: unknown) => void): Promise<void>
}
interface FlexSearchStatic {
  Document: new <T>(options: unknown) => FlexSearchDocument<T>
}
const { Document } = FlexSearch as unknown as FlexSearchStatic

const POSTS_DIR = path.resolve(process.cwd(), 'content/posts')
const OUTPUT_PATH = path.resolve(process.cwd(), 'public/search-index.json')

interface Frontmatter {
  slug: string
  title: string
  summary: string
  tags: string[]
  keywords: string[]
  draft?: boolean
}

async function scanMdxFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await scanMdxFiles(full)))
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      files.push(full)
    }
  }
  return files
}

async function toSearchDoc(filePath: string): Promise<SearchDoc | null> {
  const raw = await readFile(filePath, 'utf8')
  const parsed = matter(raw)
  const fm = parsed.data as Frontmatter
  if (fm.draft) return null
  return {
    slug: fm.slug,
    title: fm.title,
    summary: fm.summary,
    body: extractPlainText(parsed.content),
    tags: fm.tags.join(' '),
    keywords: fm.keywords.join(' '),
  }
}

async function main(): Promise<void> {
  const files = await scanMdxFiles(POSTS_DIR)
  const docs: SearchDoc[] = []
  for (const file of files) {
    const doc = await toSearchDoc(file)
    if (doc) docs.push(doc)
  }

  const index = new Document<SearchDoc>(SEARCH_INDEX_CONFIG)
  for (const doc of docs) index.add(doc)

  // FlexSearch 0.7 Document.export() returns a Promise that resolves only
  // after all internal index chunks have been passed to the callback.
  // The callback itself fires asynchronously (microtask per chunk), so we
  // must await the returned Promise before writing.
  const exported: SerializedIndex = {}
  await index.export((key, data) => {
    if (data !== undefined) {
      exported[String(key)] = data as string
    }
  })

  const outDir = path.dirname(OUTPUT_PATH)
  if (!existsSync(outDir)) await mkdir(outDir, { recursive: true })
  await writeFile(OUTPUT_PATH, JSON.stringify(exported))

  console.log(
    `[search-index] indexed ${docs.length} posts → ${path.relative(process.cwd(), OUTPUT_PATH)}`,
  )
}

main().catch((err) => {
  console.error('[search-index] generation failed:', err)
  process.exit(1)
})
