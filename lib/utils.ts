import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { SortKey } from './filters'
import type { CategoryId } from './categories'
import type { Language } from '@/components/providers/SettingsProvider'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function buildPostsUrl(params: {
  tag?: string
  category?: CategoryId
  sort?: SortKey
}): string {
  const sp = new URLSearchParams()
  if (params.category) sp.set('cat', params.category)
  if (params.tag) sp.set('tag', params.tag)
  if (params.sort && params.sort !== 'latest') sp.set('sort', params.sort)
  const qs = sp.toString()
  return qs ? `/?${qs}` : '/'
}

const EN_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function formatDate(iso: string, lang: Language = 'en'): string {
  const d = new Date(iso)
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth() // 0-indexed
  const day = d.getUTCDate()

  if (lang === 'ko') {
    return `${y}년 ${m + 1}월 ${day}일`
  }
  return `${EN_MONTHS[m]} ${day}, ${y}`
}
