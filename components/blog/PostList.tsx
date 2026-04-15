import { PostCard } from './PostCard'
import type { Post } from '@/lib/posts'

export function PostList({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-dashed border-border py-16 text-center">
        <p className="text-sm text-muted-foreground">
          조건에 맞는 글이 없습니다. 필터를 조정해보세요.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-3">
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </div>
  )
}
