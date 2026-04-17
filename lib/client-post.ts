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
