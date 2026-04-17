'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface TagPageHeaderProps {
  tag: string
  count: number
}

export function TagPageHeader({ tag, count }: TagPageHeaderProps) {
  const { t } = useTranslation()
  return (
    <div>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        {t('tag.page.back')}
      </Link>
      <h1 className="mt-6 text-[32px] font-bold tracking-[-0.02em] md:text-[40px]">
        #{tag}
      </h1>
      <p className="mt-3 text-[15px] text-muted-foreground">{t('tag.page.count', { n: count })}</p>
    </div>
  )
}
