// components/blog/RecentPostsSection.tsx
'use client'

import type { Post } from '@/lib/posts'
import { useSettings } from '@/components/providers/SettingsProvider'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { PostCardTimeline } from './PostCardTimeline'
import { PostCardFloating } from './PostCardFloating'

interface RecentPostsSectionProps {
  posts: Post[]
}

function toDateKey(date: string): string {
  const d = new Date(date)
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`
}

export function RecentPostsSection({ posts }: RecentPostsSectionProps) {
  const { t } = useTranslation()
  const { settings } = useSettings()

  if (posts.length === 0) return null

  return (
    <section className="mt-16 border-t border-border pt-12">
      <h2 className="text-[length:var(--text-h3)] font-semibold text-foreground">
        {t('post.recent')}
      </h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {settings.cardLayout === 'timeline'
          ? posts.map((post, i) => {
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
            })
          : posts.map((post) => <PostCardFloating key={post.slug} post={post} />)
        }
      </div>
    </section>
  )
}
