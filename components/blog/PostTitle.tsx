'use client'

import { useTranslation } from '@/lib/i18n/useTranslation'

interface PostTitleProps {
  title: { ko: string; en: string }
}

export function PostTitle({ title }: PostTitleProps) {
  const { lang } = useTranslation()
  return (
    <h1 className="mt-4 text-[28px] font-bold leading-[1.3] tracking-[-0.015em] md:text-[32px]">
      {title[lang]}
    </h1>
  )
}
