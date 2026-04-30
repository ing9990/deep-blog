import { BookCover } from '@/components/books/BookCover'
import { getAllBooks } from '@/lib/books'
import { getCrossHostUrls } from '@/lib/cross-host-url'

const PREVIEW_COUNT = 6

export async function BooksReadingPanel() {
  const books = getAllBooks().slice(0, PREVIEW_COUNT)
  const { books: booksUrl } = await getCrossHostUrls()

  if (books.length === 0) return null

  return (
    <section aria-label="최근 정리한 책" className="w-full">
      <div className="mx-auto w-full max-w-4xl px-6">
        <ul className="-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 sm:mx-0 sm:flex-wrap sm:gap-x-6 sm:gap-y-8 sm:overflow-visible sm:px-0 sm:pb-0">
          {books.map((book) => (
            <li
              key={book.slug}
              className="w-[120px] shrink-0 snap-start sm:w-[130px] md:w-[140px]"
            >
              <BookCover
                book={book}
                href={`${booksUrl}/${book.slug}`}
                sizes="(min-width: 768px) 140px, (min-width: 640px) 130px, 120px"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
