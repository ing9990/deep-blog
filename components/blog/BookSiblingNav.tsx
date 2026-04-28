import Link from 'next/link'
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react'
import type { BookPosition } from '@/lib/books'

const BOOKS_URL = 'https://books.ing9990.com'

interface BookSiblingNavProps {
  position: BookPosition
}

export function BookSiblingNav({ position }: BookSiblingNavProps) {
  const { book, prev, next } = position

  if (!prev && !next) return null

  return (
    <nav
      aria-label={`${book.title.ko} 시리즈 내 이전·다음 글`}
      className="mt-16 border-t border-border pt-8"
    >
      <Link
        href={`${BOOKS_URL}/${book.slug}`}
        className="mb-5 inline-flex items-center gap-1.5 text-[length:var(--text-meta)] text-muted-foreground transition-colors hover:text-foreground"
      >
        <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
        <span>
          {book.title.ko} <span className="text-muted-foreground/70">전체 보기</span>
        </span>
      </Link>

      <div className="grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/posts/${prev.slug}`}
            className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-px hover:border-border-strong hover:shadow-[var(--shadow-card-hover)]"
          >
            <span className="inline-flex items-center gap-1.5 text-[length:var(--text-meta)] text-muted-foreground">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              이전 글
            </span>
            <span className="mt-2 text-[length:var(--text-body)] font-medium leading-[var(--leading-snug)] text-foreground transition-colors group-hover:text-primary">
              {prev.title.ko}
            </span>
          </Link>
        ) : (
          <div aria-hidden="true" />
        )}

        {next ? (
          <Link
            href={`/posts/${next.slug}`}
            className="group flex flex-col rounded-xl border border-border bg-card p-5 text-right transition-all hover:-translate-y-px hover:border-border-strong hover:shadow-[var(--shadow-card-hover)] sm:items-end"
          >
            <span className="inline-flex items-center gap-1.5 text-[length:var(--text-meta)] text-muted-foreground">
              다음 글
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="mt-2 text-[length:var(--text-body)] font-medium leading-[var(--leading-snug)] text-foreground transition-colors group-hover:text-primary">
              {next.title.ko}
            </span>
          </Link>
        ) : (
          <div aria-hidden="true" />
        )}
      </div>
    </nav>
  )
}
