'use client'

import { useTranslation } from '@/lib/i18n/useTranslation'

export function ReadingTime({ minutes }: { minutes: number }) {
  const { t } = useTranslation()
  return <span>{t('post.reading.time', { n: minutes })}</span>
}
