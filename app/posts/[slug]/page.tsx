import { notFound } from 'next/navigation'
import { getAllSlugs, getPostBySlug } from '@/lib/posts'
import { MDXContent } from '@/components/mdx/MDXContent'

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

  return (
    <article className="prose prose-neutral mx-auto max-w-[720px] px-4 py-12">
      <header className="not-prose mb-8">
        <div className="mb-3 flex gap-2 text-xs text-neutral-500">
          {post.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
        <time className="mt-2 block text-sm text-neutral-500">{post.date}</time>
      </header>
      <MDXContent code={post.body} />
    </article>
  )
}
