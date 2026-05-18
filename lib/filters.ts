// lib/filters.ts
import type { Post } from './posts'
import type { Language } from '@/components/providers/SettingsProvider'

export type SortKey = 'latest' | 'oldest' | 'title'

export interface PostFilters {
  tag?: string
  query?: string
  sort?: SortKey
}

export function filterByTag<T extends Pick<Post, 'tags'>>(
  posts: readonly T[],
  tag?: string,
): T[] {
  if (!tag) return posts.slice()
  const needle = tag.toLowerCase()
  return posts.filter((p) => p.tags.some((t) => t.toLowerCase() === needle))
}

type Searchable = Pick<Post, 'title' | 'summary'>

// Search matches the title and summary only — tags, keywords, and the
// full-text plainBody are intentionally excluded from the query surface.
export function searchPosts<T extends Searchable>(
  posts: readonly T[],
  query?: string,
): T[] {
  const q = query?.trim().toLowerCase()
  if (!q) return posts.slice()
  return posts.filter((p) => {
    if (p.title.ko.toLowerCase().includes(q)) return true
    if (p.title.en.toLowerCase().includes(q)) return true
    if (p.summary.ko.toLowerCase().includes(q)) return true
    if (p.summary.en.toLowerCase().includes(q)) return true
    return false
  })
}

// Korean-aware collator for tag sorting (language-independent).
const koCollator = new Intl.Collator('ko', { sensitivity: 'base' })

export function sortPosts<T extends Pick<Post, 'date' | 'title'>>(
  posts: readonly T[],
  sort: SortKey | undefined,
  lang: Language,
): T[] {
  const out = posts.slice()
  const key = sort ?? 'latest'
  switch (key) {
    case 'latest':
      return out.sort((a, b) => b.date.localeCompare(a.date))
    case 'oldest':
      return out.sort((a, b) => a.date.localeCompare(b.date))
    case 'title': {
      const collator = new Intl.Collator(lang, { sensitivity: 'base' })
      return out.sort((a, b) => collator.compare(a.title[lang], b.title[lang]))
    }
  }
}

export function applyFilters<
  T extends Searchable & Pick<Post, 'tags' | 'date'>,
>(posts: readonly T[], filters: PostFilters, lang: Language): T[] {
  const afterTag = filterByTag(posts, filters.tag)
  const afterSearch = searchPosts(afterTag, filters.query)
  return sortPosts(afterSearch, filters.sort, lang)
}

export function extractAllTags<T extends Pick<Post, 'tags'>>(
  posts: readonly T[],
): Array<{ tag: string; count: number }> {
  const map = new Map<string, number>()
  for (const p of posts) {
    for (const tag of p.tags) {
      map.set(tag, (map.get(tag) ?? 0) + 1)
    }
  }
  return Array.from(map.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || koCollator.compare(a.tag, b.tag))
}
