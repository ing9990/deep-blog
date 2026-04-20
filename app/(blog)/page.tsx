import { getAllPosts } from '@/lib/posts'
import type { SortKey } from '@/lib/filters'
import { CATEGORY_IDS, type CategoryId } from '@/lib/categories'
import { BlogHomeClient } from '@/components/blog/BlogHomeClient'
import { IndexFilterProvider } from '@/components/blog/IndexFilterContext'
import { IndexCategoryNav } from '@/components/blog/IndexCategoryNav'
import { DocShell } from '@/components/layout/DocShell'

export default async function IndexPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; cat?: string; sort?: string }>
}) {
  const { tag, cat, sort } = await searchParams
  const allPosts = getAllPosts()

  const validSort: SortKey =
    sort === 'oldest' || sort === 'title' ? sort : 'latest'

  const validCategory: CategoryId | undefined =
    cat && (CATEGORY_IDS as readonly string[]).includes(cat)
      ? (cat as CategoryId)
      : undefined

  return (
    <IndexFilterProvider
      initialCategory={validCategory}
      initialTag={tag}
      initialSort={validSort}
    >
      <DocShell leftSlot={<IndexCategoryNav allPosts={allPosts} />}>
        <BlogHomeClient allPosts={allPosts} />
      </DocShell>
    </IndexFilterProvider>
  )
}
