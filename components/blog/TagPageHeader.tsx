import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface TagPageHeaderProps {
  tag: string
  count: number
}

export function TagPageHeader({ tag, count }: TagPageHeaderProps) {
  return (
    <div>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        전체 글 목록
      </Link>
      <h1 className="mt-6 text-[32px] font-bold tracking-[-0.02em] md:text-[40px]">
        #{tag}
      </h1>
      <p className="mt-3 text-[15px] text-muted-foreground">{count}개 글</p>
    </div>
  )
}
