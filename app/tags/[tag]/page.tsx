import { notFound } from 'next/navigation'
import { getAllPosts } from '@/lib/posts'
import { extractAllTags, filterByTag, sortPosts } from '@/lib/filters'
import { PostList } from '@/components/blog/PostList'
import { TagPageHeader } from '@/components/blog/TagPageHeader'

export function generateStaticParams(): Array<{ tag: string }> {
  const allTags = extractAllTags(getAllPosts())
  return allTags.map(({ tag }) => ({ tag: encodeURIComponent(tag) }))
}

export const dynamicParams = false

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>
}) {
  const { tag: rawTag } = await params
  const tag = decodeURIComponent(rawTag)
  const posts = sortPosts(filterByTag(getAllPosts(), tag), 'latest')
  if (posts.length === 0) notFound()

  return (
    <div className="mx-auto max-w-[1080px] px-5 py-20 md:px-12">
      <TagPageHeader tag={tag} count={posts.length} />
      <div className="mt-8">
        <PostList posts={posts} />
      </div>
    </div>
  )
}
