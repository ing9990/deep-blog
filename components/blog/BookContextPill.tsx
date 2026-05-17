import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import type { BookPosition } from '@/lib/books'
import { getCrossHostUrls } from '@/lib/cross-host-url.server'

interface BookContextPillProps {
  position: BookPosition
}

export async function BookContextPill({ position }: BookContextPillProps) {
  const { book, index, total } = position
  const { books: booksUrl } = await getCrossHostUrls()
  return (
    <Link
      href={`${booksUrl}/${book.slug}`}
      className="group mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[length:var(--text-meta)] text-muted-foreground transition-colors hover:border-border-strong hover:bg-accent hover:text-foreground"
    >
      <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="font-medium">{book.title.ko}</span>
      <span className="tabular-nums">
        · {total}편 중 {index + 1}번째
      </span>
    </Link>
  )
}
