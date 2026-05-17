import { getAllPosts } from '@/lib/posts'
import { toCardPost } from '@/lib/client-post'
import { BlogHomeClient } from '@/components/blog/BlogHomeClient'
import { IndexFilterProvider } from '@/components/blog/IndexFilterContext'
import { IndexCategoryNav } from '@/components/blog/IndexCategoryNav'
import { DocShell } from '@/components/layout/DocShell'

// Statically prerendered: no searchParams dependency. Deep-link filters
// (?cat=&tag=&sort=) are applied client-side in IndexFilterProvider, so the
// home page is served from the CDN instead of an on-demand server render.
export default function IndexPage() {
  const allPosts = getAllPosts().map(toCardPost)

  return (
    <IndexFilterProvider>
      <DocShell leftSlot={<IndexCategoryNav allPosts={allPosts} />}>
        <BlogHomeClient allPosts={allPosts} />
      </DocShell>
    </IndexFilterProvider>
  )
}
