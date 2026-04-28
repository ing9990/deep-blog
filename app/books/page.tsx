import { BookCover } from '@/components/books/BookCover'
import { getAllBooks } from '@/lib/books'

export default function BooksIndexPage() {
  const books = getAllBooks()

  return (
    <section className="py-8 md:py-12">
      <header className="mb-12 max-w-2xl">
        <h1 className="text-[length:var(--text-h2)] font-bold leading-[var(--leading-tight)] tracking-[var(--tracking-tight)] md:text-[length:var(--text-h1)]">
          읽고 정리한 책
        </h1>
        <p className="mt-3 text-[length:var(--text-body)] leading-[var(--leading-relaxed)] text-muted-foreground">
          표지를 누르면 그 책에서 정리한 글로 이어집니다.
        </p>
      </header>

      {books.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="text-[length:var(--text-body)] font-medium">아직 정리한 책이 없습니다.</p>
          <p className="mt-2 text-[length:var(--text-body-sm)] text-muted-foreground">
            <code className="rounded bg-muted px-1.5 py-0.5 text-[length:var(--text-code-inline)]">
              content/books/
            </code>
            에 책을 추가하면 여기에 표시됩니다.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {books.map((book) => (
            <li key={book.slug}>
              <BookCover book={book} href={`/${book.slug}`} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
