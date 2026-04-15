import { getAllPosts } from '@/lib/posts'
import type { SortKey } from '@/lib/filters'
import { CATEGORY_IDS, type CategoryId } from '@/lib/categories'
import { BlogHomeClient } from '@/components/blog/BlogHomeClient'
import { HeroIntro } from '@/components/blog/HeroIntro'
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
    <>
      <HeroIntro />
      <DocShell showCategoryNav={false}>
        <section className="mb-4">
          <h1 className="text-[32px] font-bold tracking-[-0.02em] md:text-[40px]">
            DEEP
          </h1>
        </section>

        <BlogHomeClient
          allPosts={allPosts}
          initialTag={tag}
          initialCategory={validCategory}
          initialSort={validSort}
        />
      </DocShell>
    </>
  )
}
