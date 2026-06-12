import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/posts'
import { getAllBooks } from '@/lib/books'
import { extractAllTags } from '@/lib/filters'

const SITE_URL = 'https://deep.ing9990.com'
const BOOKS_URL = 'https://books.ing9990.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const allPosts = getAllPosts()

  const posts = allPosts.map((post) => ({
    url: `${SITE_URL}/posts/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const tags = extractAllTags(allPosts).map(({ tag }) => ({
    url: `${SITE_URL}/tags/${encodeURIComponent(tag)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.3,
  }))

  // Cross-host entries are valid here: books.ing9990.com/robots.txt serves
  // app/robots.ts, which points crawlers at this sitemap on the blog host.
  const books = getAllBooks().map((book) => ({
    url: `${BOOKS_URL}/${book.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    ...posts,
    ...tags,
    ...books,
  ]
}
