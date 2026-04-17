// components/blog/PostList.tsx
'use client'

import { useSettings } from '@/components/providers/SettingsProvider'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { PostCardEditorial } from './PostCardEditorial'
import { PostCardTimeline } from './PostCardTimeline'
import { PostCardFloating } from './PostCardFloating'
import type { Post } from '@/lib/posts'

function toDateKey(date: string): string {
  const d = new Date(date)
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`
}

export function PostList({ posts }: { posts: Post[] }) {
  const { t } = useTranslation()
  const { settings } = useSettings()

  if (posts.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-dashed border-border py-16 text-center">
        <p className="text-sm text-muted-foreground">
          {t('index.empty')}
        </p>
      </div>
    )
  }

  if (settings.cardLayout === 'timeline') {
    return (
      <div className="mt-6 space-y-3">
        {posts.map((post, i) => {
          const dateKey = toDateKey(post.date)
          const prevKey = i > 0 ? toDateKey(posts[i - 1].date) : null
          return (
            <PostCardTimeline
              key={post.slug}
              post={post}
              isFirst={i === 0}
              isLast={i === posts.length - 1}
              showDate={dateKey !== prevKey}
            />
          )
        })}
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
