import { describe, it, expect } from 'vitest'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import matter from 'gray-matter'

const POSTS_DIR = join(process.cwd(), 'content', 'posts')

interface TagOccurrence {
  tag: string
  file: string
}

async function collectTagOccurrences(): Promise<TagOccurrence[]> {
  const files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith('.mdx'))
  const occurrences: TagOccurrence[] = []
  for (const file of files) {
    const raw = await readFile(join(POSTS_DIR, file), 'utf8')
    const { data } = matter(raw)
    const tags: unknown = data.tags
    if (!Array.isArray(tags)) continue
    for (const tag of tags) {
      if (typeof tag === 'string') occurrences.push({ tag, file })
    }
  }
  return occurrences
}

describe('tag consistency across all posts', () => {
  // /tags/[tag] generates one page per distinct casing, so `backend` and
  // `Backend` split a topic across two URLs. Past regression: 9 tag groups
  // (backend/Backend, kafka/Kafka, ...) drifted apart before 2026-06-12.
  it('has no two tags that differ only by case', async () => {
    const occurrences = await collectTagOccurrences()
    const byLower = new Map<string, Map<string, string[]>>()
    for (const { tag, file } of occurrences) {
      const lower = tag.toLowerCase()
      const variants = byLower.get(lower) ?? new Map<string, string[]>()
      const files = variants.get(tag) ?? []
      files.push(file)
      variants.set(tag, files)
      byLower.set(lower, variants)
    }

    const conflicts: string[] = []
    for (const [lower, variants] of byLower) {
      if (variants.size > 1) {
        const detail = [...variants.entries()]
          .map(([variant, files]) => `"${variant}" (${files.length}: ${files.slice(0, 3).join(', ')}…)`)
          .join(' vs ')
        conflicts.push(`${lower}: ${detail}`)
      }
    }

    expect(conflicts, `case-variant tags found:\n${conflicts.join('\n')}`).toEqual([])
  })

  it('has no tags with leading or trailing whitespace', async () => {
    const occurrences = await collectTagOccurrences()
    const padded = occurrences.filter(({ tag }) => tag !== tag.trim())
    expect(padded, `padded tags: ${JSON.stringify(padded)}`).toEqual([])
  })
})
