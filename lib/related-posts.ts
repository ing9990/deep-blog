import { getAllPosts, type Post } from './posts'

/**
 * Returns the N most recently published posts, excluding the given slug.
 * Relies on getAllPosts() returning draft-free posts sorted latest-first.
 * If fewer than N posts remain after exclusion, returns all available.
 */
export function getRecentPosts(excludeSlug: string, n = 4): Post[] {
  return getAllPosts()
    .filter((p) => p.slug !== excludeSlug)
    .slice(0, n)
}
