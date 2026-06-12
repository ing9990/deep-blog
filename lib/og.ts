import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { CategoryId } from './categories'

/** Shared canvas size for every opengraph-image route (the OG standard ratio). */
export const OG_SIZE = { width: 1200, height: 630 }

/** Ink background + neutral tones shared by all OG cards. */
export const OG_COLORS = {
  background: '#0a0f1e',
  foreground: '#f4f6fb',
  muted: '#8b93a7',
}

/**
 * Satori needs raw hex values, so this mirrors lib/category-colors.ts
 * (Tailwind classes) with the dark-mode 400-series hex equivalents.
 */
const OG_CATEGORY_ACCENTS: Partial<Record<CategoryId, string>> = {
  'spring-boot': '#34d399',
  redis: '#f87171',
  'mini-coupang': '#fb923c',
  knowledge: '#fde047',
  books: '#a78bfa',
  database: '#38bdf8',
  kafka: '#22d3ee',
  kubernetes: '#60a5fa',
  infrastructure: '#94a3b8',
  'computer-science': '#e879f9',
}

/** Falls back to the site keyword indigo when a category has no accent. */
export function getOgAccent(category: CategoryId): string {
  return OG_CATEGORY_ACCENTS[category] ?? '#818cf8'
}

/**
 * Loads the two Paperlogy weights used on OG cards. Build-time only —
 * opengraph-image routes run in the Node runtime during static generation.
 */
export async function loadOgFonts(): Promise<
  { name: string; data: Buffer; weight: 500 | 700; style: 'normal' }[]
> {
  const dir = join(process.cwd(), 'public', 'fonts', 'paperlogy')
  const [medium, bold] = await Promise.all([
    readFile(join(dir, 'Paperlogy-5Medium.ttf')),
    readFile(join(dir, 'Paperlogy-7Bold.ttf')),
  ])
  return [
    { name: 'Paperlogy', data: medium, weight: 500, style: 'normal' },
    { name: 'Paperlogy', data: bold, weight: 700, style: 'normal' },
  ]
}

/** Keeps Satori layout single-pass: hard-truncate instead of CSS line clamping. */
export function truncateOgTitle(title: string, max = 64): string {
  return title.length > max ? `${title.slice(0, max - 1)}…` : title
}
