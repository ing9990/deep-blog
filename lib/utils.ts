import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { SortKey } from './filters'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function buildPostsUrl(params: {
  tag?: string
  query?: string
  sort?: SortKey
  matched?: readonly string[]
}): string {
  const sp = new URLSearchParams()
  if (params.tag) sp.set('tag', params.tag)
  if (params.query?.trim()) sp.set('q', params.query.trim())
  if (params.sort && params.sort !== 'latest') sp.set('sort', params.sort)
  if (params.matched && params.matched.length > 0) {
    sp.set('matched', params.matched.join(','))
  }
  const qs = sp.toString()
  return qs ? `/?${qs}` : '/'
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd}`
}
