// components/blog/PostList.tsx
'use client'

import { useSettings } from '@/components/providers/SettingsProvider'
import { PostCardEditorial } from './PostCardEditorial'
import { PostCardTimeline } from './PostCardTimeline'
import { PostCardFloating } from './PostCardFloating'
import type { Post } from '@/lib/posts'

export function PostList({ posts }: { posts: Post[] }) {
  const { settings } = useSettings()

  if (posts.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-dashed border-border py-16 text-center">
        <p className="text-sm text-muted-foreground">
          조건에 맞는 글이 없습니다. 필터를 조정해보세요.
        </p>
      </div>
    )
  }

  if (settings.cardLayout === 'timeline') {
    return (
      <div className="mt-6 space-y-3">
        {posts.map((post, i) => (
          <PostCardTimeline
            key={post.slug}
            post={post}
            isLast={i === posts.length - 1}
          />
        ))}
      </div>
    )
  }

  const Card =
    settings.cardLayout === 'floating' ? PostCardFloating : PostCardEditorial

  return (
    <div className="mt-6 space-y-3">
      {posts.map((post) => (
        <Card key={post.slug} post={post} />
      ))}
    </div>
  )
}
