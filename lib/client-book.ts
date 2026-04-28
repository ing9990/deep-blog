import type { Book } from './books'

export interface ClientBook {
  slug: string
  title: { ko: string; en: string }
  cover: string
}

export function toClientBook(book: Book): ClientBook {
  return {
    slug: book.slug,
    title: book.title,
    cover: book.cover,
  }
}
