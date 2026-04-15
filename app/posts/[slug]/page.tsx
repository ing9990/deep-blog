import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllSlugs, getPostBySlug } from '@/lib/posts'
import { MDXContent } from '@/components/mdx/MDXContent'
import { PostMeta } from '@/components/blog/PostMeta'
import { RecentPostsSection } from '@/components/blog/RecentPostsSection'
import { flattenToc, type VeliteTocEntry } from '@/lib/toc'
import { getRecentPosts } from '@/lib/related-posts'
import { DocShell } from '@/components/layout/DocShell'

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const recentPosts = getRecentPosts(slug, 4)
  const tocItems = flattenToc(post.toc as unknown as VeliteTocEntry[])

  return (
    <DocShell toc={tocItems} currentSlug={slug}>
      <Link
        href="/"
        className="mb-10 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← 목록으로
      </Link>

      <article className="min-w-0">
        <PostMeta tags={post.tags} date={post.date} readingTime={post.readingTime} />
        <h1 className="mt-4 text-[28px] font-bold leading-[1.3] tracking-[-0.015em] md:text-[32px]">
          {post.title}
        </h1>
        <hr className="my-8 border-border" />
        <div className="prose-kr min-w-0">
          <MDXContent code={post.body} />
        </div>
      </article>

      <RecentPostsSection posts={recentPosts} />
    </DocShell>
  )
}
