import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllSlugs, getPostBySlug } from '@/lib/posts'
import { MDXContent } from '@/components/mdx/MDXContent'
import { PostMeta } from '@/components/blog/PostMeta'
import { RecentPostsSection } from '@/components/blog/RecentPostsSection'
import { flattenToc, type VeliteTocEntry } from '@/lib/toc'
import { getRecentPosts } from '@/lib/related-posts'
import { DocShell } from '@/components/layout/DocShell'
import { PostTitle } from '@/components/blog/PostTitle'

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  const url = `https://ing9990.com/posts/${post.slug}`

  return {
    title: post.title.ko,
    description: post.summary.ko,
    keywords: post.tags,
    openGraph: {
      type: 'article',
      title: post.title.ko,
      description: post.summary.ko,
      url,
      publishedTime: post.date,
    },
    twitter: {
      card: 'summary',
      title: post.title.ko,
      description: post.summary.ko,
    },
    alternates: {
      canonical: url,
    },
  }
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
        className="mb-10 inline-flex items-center gap-1.5 text-[length:var(--text-nav-item)] text-muted-foreground transition-colors hover:text-foreground"
      >
        ← 목록으로
      </Link>

      <article className="min-w-0">
        <PostMeta tags={post.tags} date={post.date} readingTime={post.readingTime} />
        <PostTitle title={post.title} />
        <hr className="my-8 border-border" />
        <div className="prose-kr min-w-0">
          <MDXContent code={post.body} />
        </div>
      </article>

      <RecentPostsSection posts={recentPosts} />
    </DocShell>
  )
}
