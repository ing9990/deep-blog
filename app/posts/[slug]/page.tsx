import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllSlugs, getPostBySlug } from '@/lib/posts'
import { MDXContent } from '@/components/mdx/MDXContent'
import { PostMeta } from '@/components/blog/PostMeta'
import { TableOfContents } from '@/components/blog/TableOfContents'
import { flattenToc, type VeliteTocEntry } from '@/lib/toc'

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export const dynamicParams = false

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const tocItems = flattenToc(post.toc as unknown as VeliteTocEntry[])

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-16 md:px-12">
      <Link
        href="/"
        className="mb-10 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← 목록으로
      </Link>

      {tocItems.length > 0 && (
        <details className="mb-8 rounded border border-border bg-muted/50 p-4 md:hidden">
          <summary className="cursor-pointer text-sm font-medium">목차</summary>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {tocItems.map((item) => (
              <li key={item.slug} className={item.depth === 3 ? 'pl-4' : ''}>
                <a href={`#${item.slug}`}>{item.title}</a>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="md:grid md:grid-cols-[minmax(0,800px)_minmax(0,280px)] md:gap-20">
        <article className="max-w-[800px]">
          <PostMeta tags={post.tags} date={post.date} readingTime={post.readingTime} />
          <h1 className="mt-4 text-[28px] font-bold leading-[1.3] tracking-[-0.015em] md:text-[32px]">
            {post.title}
          </h1>
          <hr className="my-8 border-border" />
          <div className="prose-kr">
            <MDXContent code={post.body} />
          </div>
        </article>

        <aside className="hidden md:block">
          <div className="sticky top-24">
            <TableOfContents items={tocItems} />
          </div>
        </aside>
      </div>
    </div>
  )
}
