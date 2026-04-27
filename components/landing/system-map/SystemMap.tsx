import { getAllSlugs } from '@/lib/posts'

import { tracks } from './data/tracks'
import { TrackCard } from './TrackCard'

const BLOG_CATEGORY_URL =
  'https://deep.ing9990.com/?cat=mini-coupang-backend'

export function SystemMap() {
  const existingSlugs = new Set(getAllSlugs())

  return (
    <section aria-label="미니쿠팡에서 풀어낸 문제들" className="w-full">
      <div className="mx-auto w-full max-w-4xl px-6">
        <header className="mb-10 border-b border-border pb-8">
          <div className="mb-2 font-mono text-[length:var(--text-2xs)] font-semibold uppercase tracking-[var(--tracking-wider)] text-muted-foreground">
            Building log · mini-coupang
          </div>
          <h2 className="text-balance text-3xl font-bold leading-[var(--leading-tight)] tracking-tight md:text-4xl">
            풀어낸 문제들
          </h2>
        </header>

        <div className="space-y-5">
          {tracks.map((t) => (
            <TrackCard key={t.id} track={t} existingSlugs={existingSlugs} />
          ))}
        </div>

        <footer
          className="mt-14 rounded-xl border border-dashed border-border bg-muted/30 px-5 py-4 text-[length:var(--text-sm)] leading-[var(--leading-relaxed)] text-muted-foreground"
          style={{ fontFamily: 'var(--font-reading)' }}
        >
          <b className="text-foreground">계속 추가됩니다.</b> 기능별 글은 블로그{' '}
          <a
            href={BLOG_CATEGORY_URL}
            className="rounded border border-border bg-background px-1 py-[1px] font-mono text-[length:var(--text-xs)] underline-offset-2 hover:underline"
            style={{ color: 'var(--code-inline-fg)' }}
          >
            mini-coupang-backend
          </a>{' '}
          카테고리로 묶입니다. 선택과 측정은 코드와 커밋에 그대로 남습니다.
        </footer>
      </div>
    </section>
  )
}
