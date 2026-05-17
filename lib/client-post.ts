import type { Post } from '@/lib/posts'
import type { CategoryId } from '@/lib/categories'

export interface ClientPost {
  slug: string
  title: { ko: string; en: string }
  summary: { ko: string; en: string }
  tags: string[]
  keywords: string[]
  plainBody: string
  category: CategoryId
  date: string
}

export function toClientPost(post: Post): ClientPost {
  return {
    slug: post.slug,
    title: post.title,
    summary: post.summary,
    tags: post.tags,
    keywords: post.keywords,
    plainBody: post.plainBody,
    category: post.category,
    date: post.date,
  }
}

/**
 * Lightweight shape for post cards and category navigation.
 *
 * Card UIs (PostList, PostCardFloating/Timeline, IndexCategoryNav,
 * RecentPostsSection) only render title/summary/date/tags/category, and the
 * index filter helpers need title/summary/tags/keywords/date. None of them
 * touch the compiled MDX `body` (~11 MB across all posts). Passing full `Post`
 * objects to those client components serializes every `body` into the RSC
 * payload. `CardPost` carries only what the cards and filters need.
 */
export interface CardPost {
  slug: string
  title: { ko: string; en: string }
  summary: { ko: string; en: string }
  tags: string[]
  keywords: string[]
  category: CategoryId
  date: string
}

export function toCardPost(post: Post): CardPost {
  return {
    slug: post.slug,
    title: post.title,
    summary: post.summary,
    tags: post.tags,
    keywords: post.keywords,
    category: post.category,
    date: post.date,
  }
}
