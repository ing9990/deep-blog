import Link from 'next/link'
import { ReadingTime } from './ReadingTime'
import { formatDate } from '@/lib/utils'

interface PostMetaProps {
  tags: readonly string[]
  date: string
  readingTime: number
}

export function PostMeta({ tags, date, readingTime }: PostMetaProps) {
  const formattedDate = formatDate(date)
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <Link
            key={tag}
            href={`/tags/${encodeURIComponent(tag)}`}
            className="text-xs font-medium text-primary hover:underline"
          >
            #{tag}
          </Link>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[13px] text-muted-foreground">
        <time dateTime={date}>{formattedDate}</time>
        <span aria-hidden="true">·</span>
        <ReadingTime minutes={readingTime} />
      </div>
    </div>
  )
}

