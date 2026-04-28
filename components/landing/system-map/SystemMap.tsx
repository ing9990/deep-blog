import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { getAllSlugs } from '@/lib/posts'
import { BLOG_URL } from '@/lib/cross-host-url'

import { tracks } from './data/tracks'
import { TrackCard } from './TrackCard'

const BLOG_CATEGORY_URL = `${BLOG_URL}/?cat=mini-coupang-backend`

export function SystemMap() {
  const existingSlugs = new Set(getAllSlugs())

  return (
    <section aria-label="미니쿠팡에서 풀어낸 문제들" className="w-full">
      <div className="mx-auto w-full max-w-4xl px-6">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="font-mono text-[length:var(--text-2xs)] font-semibold uppercase tracking-[var(--tracking-wider)] text-muted-foreground">
            Building log · mini-coupang
          </div>
          <Link
            href={BLOG_CATEGORY_URL}
            className="group inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[length:var(--text-sm)] text-muted-foreground transition-colors hover:border-border-strong hover:bg-accent hover:text-foreground"
          >
            <span>전체 보기</span>
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </header>

        <div className="space-y-5">
          {tracks.map((t) => (
            <TrackCard key={t.id} track={t} existingSlugs={existingSlugs} />
          ))}
        </div>
      </div>
    </section>
  )
}
