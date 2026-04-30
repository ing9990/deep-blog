import { notFound } from 'next/navigation'
import { getAllPosts } from '@/lib/posts'
import { extractAllTags, filterByTag, sortPosts } from '@/lib/filters'
import type { Language } from '@/components/providers/SettingsProvider'
import { PostList } from '@/components/blog/PostList'
import { TagPageHeader } from '@/components/blog/TagPageHeader'
import { DocShell } from '@/components/layout/DocShell'

export function generateStaticParams(): Array<{ tag: string }> {
  const allTags = extractAllTags(getAllPosts())
  return allTags.map(({ tag }) => ({ tag }))
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>
}) {
  const { tag: rawTag } = await params
  const tag = decodeURIComponent(rawTag)
  const posts = sortPosts(filterByTag(getAllPosts(), tag), 'latest', 'ko' as Language)
  if (posts.length === 0) notFound()

  return (
    <DocShell>
      <TagPageHeader tag={tag} count={posts.length} />
      <div className="mt-8">
        <PostList posts={posts} />
      </div>
    </DocShell>
  )
}
