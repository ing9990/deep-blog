import { posts as rawPosts } from '#site/content'

export type Post = (typeof rawPosts)[number]

export function getAllPosts(): Post[] {
  return rawPosts
    .filter((p) => !p.draft)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function getPostBySlug(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug)
}

export function getAllSlugs(): string[] {
  return getAllPosts().map((p) => p.slug)
}
