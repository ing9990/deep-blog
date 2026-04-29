import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { MDXContent } from '@/components/mdx/MDXContent'
import { getAllBookSlugs, getBookBySlug, getPostsByBook } from '@/lib/books'
import { getCrossHostUrls } from '@/lib/cross-host-url'

export function generateStaticParams() {
  return getAllBookSlugs().map((slug) => ({ slug }))
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const book = getBookBySlug(slug)
  if (!book) notFound()

  const posts = getPostsByBook(slug)
  const hasBody = book.body && book.body.trim().length > 0
  const { blog: blogUrl, books: booksUrl } = await getCrossHostUrls()

  return (
    <article className="py-8 md:py-12">
      <Link
        href={booksUrl}
        className="mb-8 inline-flex items-center gap-1.5 text-[length:var(--text-meta)] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        모든 책
      </Link>

      <header className="grid gap-8 md:grid-cols-[200px_1fr] md:gap-10 md:items-start">
        <div className="relative aspect-[2/3] w-[160px] overflow-hidden rounded-md border border-border bg-muted shadow-[var(--shadow-card)] md:w-[200px]">
          <Image
            src={book.cover}
            alt={`${book.title.ko} 표지`}
            fill
            sizes="(min-width: 768px) 200px, 160px"
            className="object-cover"
            priority
          />
        </div>

        <div>
          <h1 className="text-[length:var(--text-h2)] font-bold leading-[var(--leading-tight)] tracking-[var(--tracking-tight)] md:text-[length:var(--text-h1)]">
            {book.title.ko}
          </h1>
          <p className="mt-2 text-[length:var(--text-body)] text-muted-foreground">
            {book.author}
          </p>
          {book.summary.ko && (
            <p className="mt-4 max-w-2xl text-[length:var(--text-body)] leading-[var(--leading-relaxed)]">
              {book.summary.ko}
            </p>
          )}
        </div>
      </header>

      {hasBody && (
        <div className="prose-kr mt-12 max-w-3xl">
          <MDXContent code={book.body} />
        </div>
      )}

      <section className="mt-16">
        <h2 className="text-[length:var(--text-h3)] font-semibold tracking-[var(--tracking-tight)]">
          이 책에서 정리한 글
          {posts.length > 0 && (
            <span className="ml-2 text-[length:var(--text-body-sm)] font-normal text-muted-foreground">
              {posts.length}편
            </span>
          )}
        </h2>

        {posts.length === 0 ? (
          <p className="mt-4 text-[length:var(--text-body-sm)] text-muted-foreground">
            아직 이 책에서 정리한 글이 없습니다.
          </p>
        ) : (
          <ol className="mt-6 space-y-3">
            {posts.map((post, idx) => (
              <li key={post.slug}>
                <Link
                  href={`${blogUrl}/posts/${post.slug}`}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-all hover:-translate-y-px hover:border-border-strong hover:shadow-[var(--shadow-card-hover)]"
                >
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[length:var(--text-meta)] font-semibold tabular-nums text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[length:var(--text-body)] font-medium leading-[var(--leading-snug)] text-foreground transition-colors group-hover:text-primary">
                      {post.title.ko}
                    </p>
                  </div>
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </article>
  )
}
