import Link from 'next/link'
import type { Post } from '@/lib/posts'
import { formatDate } from '@/lib/utils'

export function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group block rounded-lg border border-border bg-background p-6 transition-colors hover:border-border-strong hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="mb-2 flex flex-wrap gap-1.5">
        {post.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="text-xs font-medium text-muted-foreground">
            #{tag}
          </span>
        ))}
      </div>
      <h2 className="text-[18px] font-semibold leading-[1.4] tracking-[-0.01em] text-foreground transition-colors group-hover:text-primary">
        {post.title}
      </h2>
      <p className="mt-2 line-clamp-2 text-[15px] leading-[1.7] text-muted-foreground">
        {post.summary}
      </p>
      <time className="mt-4 block text-[13px] text-muted-foreground" dateTime={post.date}>
        {formatDate(post.date)}
      </time>
    </Link>
  )
}

