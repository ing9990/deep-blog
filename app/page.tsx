import Link from 'next/link'
import { getAllPosts } from '@/lib/posts'

export default function HomePage() {
  const posts = getAllPosts()
  return (
    <main className="mx-auto max-w-[720px] px-4 py-12">
      <h1 className="text-2xl font-bold">Backend Notes (Phase 1)</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Phase 2에서 인덱스 페이지 디자인이 도입됩니다.
      </p>
      <ul className="mt-6 space-y-2">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={post.url} className="underline">
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
