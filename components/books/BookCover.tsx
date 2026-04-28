import Image from 'next/image'
import Link from 'next/link'
import type { Book } from '@/lib/books'

interface BookCoverProps {
  book: Book
  href: string
  sizes?: string
  showMeta?: boolean
}

export function BookCover({
  book,
  href,
  sizes = '(min-width: 1024px) 18vw, (min-width: 768px) 22vw, (min-width: 640px) 30vw, 45vw',
  showMeta = true,
}: BookCoverProps) {
  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md border border-border bg-muted shadow-[var(--shadow-card)] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-card-hover)]">
        <Image
          src={book.cover}
          alt={`${book.title.ko} 표지`}
          fill
          sizes={sizes}
          className="object-cover"
        />
      </div>
      {showMeta && (
        <div className="mt-3">
          <p className="line-clamp-2 text-[length:var(--text-body-sm)] font-medium leading-[var(--leading-snug)] text-foreground transition-colors group-hover:text-primary">
            {book.title.ko}
          </p>
          <p className="mt-0.5 text-[length:var(--text-meta)] text-muted-foreground">
            {book.author}
          </p>
        </div>
      )}
    </Link>
  )
}
