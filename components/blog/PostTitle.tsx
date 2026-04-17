'use client'

import { useTranslation } from '@/lib/i18n/useTranslation'

interface PostTitleProps {
  title: { ko: string; en: string }
}

export function PostTitle({ title }: PostTitleProps) {
  const { lang } = useTranslation()
  return (
    <h1 className="mt-4 text-[length:var(--text-h1)] font-bold leading-[var(--leading-snug)] tracking-[var(--tracking-tighter)]">
      {title[lang]}
    </h1>
  )
}
