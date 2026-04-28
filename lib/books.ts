import { books as rawBooks } from '#site/content'
import { getAllPosts, type Post } from './posts'

export type Book = (typeof rawBooks)[number]

export function getAllBooks(): Book[] {
  return rawBooks
    .filter((b) => !b.draft)
    .slice()
    .sort((a, b) => b.readDate.localeCompare(a.readDate))
}

export function getBookBySlug(slug: string): Book | undefined {
  return getAllBooks().find((b) => b.slug === slug)
}

export function getAllBookSlugs(): string[] {
  return getAllBooks().map((b) => b.slug)
}

export function getPostsByBook(bookSlug: string): Post[] {
  return getAllPosts()
    .filter((p) => p.book === bookSlug)
    .sort((a, b) => {
      const ao = a.bookOrder
      const bo = b.bookOrder
      if (ao != null && bo != null) return ao - bo
      if (ao != null) return -1
      if (bo != null) return 1
      return a.date.localeCompare(b.date)
    })
}

export function getBookByPostSlug(postSlug: string): Book | undefined {
  const post = getAllPosts().find((p) => p.slug === postSlug)
  if (!post?.book) return undefined
  return getBookBySlug(post.book)
}

export interface BookPosition {
  book: Book
  index: number
  total: number
  prev?: Post
  next?: Post
}

export function getBookPosition(postSlug: string): BookPosition | undefined {
  const book = getBookByPostSlug(postSlug)
  if (!book) return undefined
  const siblings = getPostsByBook(book.slug)
  const index = siblings.findIndex((p) => p.slug === postSlug)
  if (index === -1) return undefined
  return {
    book,
    index,
    total: siblings.length,
    prev: index > 0 ? siblings[index - 1] : undefined,
    next: index < siblings.length - 1 ? siblings[index + 1] : undefined,
  }
}
