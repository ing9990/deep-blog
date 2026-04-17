'use client'

import Link from 'next/link'
import { ReadingTime } from './ReadingTime'
import { formatDate } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface PostMetaProps {
  tags: readonly string[]
  date: string
  readingTime: number
}

export function PostMeta({ tags, date, readingTime }: PostMetaProps) {
  const { lang } = useTranslation()
  const formattedDate = formatDate(date, lang)
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <Link
            key={tag}
            href={`/tags/${encodeURIComponent(tag)}`}
            className="text-[length:var(--text-meta)] font-medium text-primary hover:underline"
          >
            #{tag}
          </Link>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[length:var(--text-meta)] text-muted-foreground">
        <time dateTime={date}>{formattedDate}</time>
        <span aria-hidden="true">·</span>
        <ReadingTime minutes={readingTime} />
      </div>
    </div>
  )
}
