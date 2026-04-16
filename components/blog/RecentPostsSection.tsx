// components/blog/RecentPostsSection.tsx
'use client'

import type { Post } from '@/lib/posts'
import { useSettings } from '@/components/providers/SettingsProvider'
import { PostCardEditorial } from './PostCardEditorial'
import { PostCardTimeline } from './PostCardTimeline'
import { PostCardFloating } from './PostCardFloating'

interface RecentPostsSectionProps {
  posts: Post[]
}

export function RecentPostsSection({ posts }: RecentPostsSectionProps) {
  const { settings } = useSettings()

  if (posts.length === 0) return null

  return (
    <section className="mt-16 border-t border-border pt-12">
      <h2 className="text-[20px] font-semibold text-foreground md:text-[22px]">
        최근 글
      </h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {settings.cardLayout === 'timeline'
          ? posts.map((post, i) => (
              <PostCardTimeline key={post.slug} post={post} isLast={i === posts.length - 1} />
            ))
          : settings.cardLayout === 'floating'
            ? posts.map((post) => <PostCardFloating key={post.slug} post={post} />)
            : posts.map((post) => <PostCardEditorial key={post.slug} post={post} />)
        }
      </div>
    </section>
  )
}
