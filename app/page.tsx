import { getAllPosts } from '@/lib/posts'
import { applyFilters, extractAllTags, type SortKey } from '@/lib/filters'
import { PostList } from '@/components/blog/PostList'
import { SearchBar } from '@/components/blog/SearchBar'
import { TagFilterBar } from '@/components/blog/TagFilterBar'
import { SortSelect } from '@/components/blog/SortSelect'

export default async function IndexPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string; sort?: string }>
}) {
  const { tag, q, sort } = await searchParams
  const allPosts = getAllPosts()
  const allTags = extractAllTags(allPosts)

  const validSort: SortKey =
    sort === 'oldest' || sort === 'title' ? sort : 'latest'

  const filtered = applyFilters(allPosts, {
    tag,
    query: q,
    sort: validSort,
  })

  return (
    <div className="mx-auto max-w-[1080px] px-5 py-20 md:px-12">
      <section className="mb-4">
        <h1 className="text-[32px] font-bold tracking-[-0.02em] md:text-[40px]">
          Backend Notes
        </h1>
        <p className="mt-3 text-[17px] text-muted-foreground">
          백엔드 엔지니어의 학습 기록
        </p>
      </section>

      <SearchBar defaultQuery={q} currentTag={tag} currentSort={validSort} />

      <TagFilterBar
        allTags={allTags}
        selected={tag}
        currentQuery={q}
        currentSort={validSort}
      />

      <div className="mt-8 flex items-center justify-between text-sm text-muted-foreground">
        <span>전체 {filtered.length}개 글</span>
        <SortSelect value={validSort} currentTag={tag} currentQuery={q} />
      </div>

      <PostList posts={filtered} />
    </div>
  )
}
