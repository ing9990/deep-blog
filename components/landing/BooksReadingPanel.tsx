import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { BookCover } from '@/components/books/BookCover'
import { getAllBooks } from '@/lib/books'
import { BOOKS_URL } from '@/lib/cross-host-url'

const PREVIEW_COUNT = 6

export function BooksReadingPanel() {
  const books = getAllBooks().slice(0, PREVIEW_COUNT)

  if (books.length === 0) return null

  return (
    <section aria-label="최근 정리한 책" className="w-full">
      <div className="mx-auto w-full max-w-4xl px-6">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="font-mono text-[length:var(--text-2xs)] font-semibold uppercase tracking-[var(--tracking-wider)] text-muted-foreground">
            Reading log · books
          </div>
          <Link
            href={BOOKS_URL}
            className="group inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[length:var(--text-sm)] text-muted-foreground transition-colors hover:border-border-strong hover:bg-accent hover:text-foreground"
          >
            <span>전체 보기</span>
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </header>

        {/* Flex layout: covers stay fixed-width and left-aligned regardless of count.
            Mobile: horizontal scroll. Tablet+: wraps if many. */}
        <ul className="-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 sm:mx-0 sm:flex-wrap sm:gap-x-6 sm:gap-y-8 sm:overflow-visible sm:px-0 sm:pb-0">
          {books.map((book) => (
            <li
              key={book.slug}
              className="w-[120px] shrink-0 snap-start sm:w-[130px] md:w-[140px]"
            >
              <BookCover
                book={book}
                href={`${BOOKS_URL}/${book.slug}`}
                sizes="(min-width: 768px) 140px, (min-width: 640px) 130px, 120px"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
