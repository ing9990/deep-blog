// lib/filters.ts
import type { Post } from './posts'

export type SortKey = 'latest' | 'oldest' | 'title'

export interface PostFilters {
  tag?: string
  query?: string
  sort?: SortKey
  matched?: readonly string[]
}

export function filterByTag<T extends Pick<Post, 'tags'>>(
  posts: readonly T[],
  tag?: string,
): T[] {
  if (!tag) return posts.slice()
  const needle = tag.toLowerCase()
  return posts.filter((p) => p.tags.some((t) => t.toLowerCase() === needle))
}

export function filterByMatched<T extends Pick<Post, 'slug'>>(
  posts: readonly T[],
  matched?: readonly string[],
): T[] {
  if (matched === undefined) return posts.slice()
  const allow = new Set(matched)
  return posts.filter((p) => allow.has(p.slug))
}

export function searchPosts<
  T extends Pick<Post, 'title' | 'summary' | 'tags' | 'keywords'>,
>(posts: readonly T[], query?: string): T[] {
  const q = query?.trim().toLowerCase()
  if (!q) return posts.slice()
  return posts.filter((p) => {
    if (p.title.toLowerCase().includes(q)) return true
    if (p.summary.toLowerCase().includes(q)) return true
    if (p.tags.some((t) => t.toLowerCase().includes(q))) return true
    if (p.keywords.some((k) => k.toLowerCase().includes(q))) return true
    return false
  })
}

// Korean-aware collator for title and tag sorting.
// sensitivity: 'base' treats 'Spring' and 'spring' as equal, which is the intended
// behavior for sorted display — users don't care about case in listings.
const koCollator = new Intl.Collator('ko', { sensitivity: 'base' })

export function sortPosts<T extends Pick<Post, 'date' | 'title'>>(
  posts: readonly T[],
  sort?: SortKey,
): T[] {
  const out = posts.slice()
  const key = sort ?? 'latest'
  switch (key) {
    case 'latest':
      return out.sort((a, b) => b.date.localeCompare(a.date))
    case 'oldest':
      return out.sort((a, b) => a.date.localeCompare(b.date))
    case 'title':
      return out.sort((a, b) => koCollator.compare(a.title, b.title))
  }
}

export function applyFilters<
  T extends Pick<Post, 'slug' | 'tags' | 'title' | 'summary' | 'keywords' | 'date'>,
>(posts: readonly T[], filters: PostFilters): T[] {
  const afterMatched = filterByMatched(posts, filters.matched)
  const afterTag = filterByTag(afterMatched, filters.tag)
  const afterSearch = searchPosts(afterTag, filters.query)
  return sortPosts(afterSearch, filters.sort)
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
