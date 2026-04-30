import { getAllSlugs } from '@/lib/posts'
import { getCrossHostUrls } from '@/lib/cross-host-url'

import { NextPostTeaser } from './NextPostTeaser'
import { tracks } from './data/tracks'
import { TrackCard } from './TrackCard'

export async function SystemMap() {
  const existingSlugs = new Set(getAllSlugs())
  const { blog: blogUrl } = await getCrossHostUrls()

  const tracksWithAbsoluteHrefs = tracks.map((t) => ({
    ...t,
    ctas: t.ctas.map((c) => ({ ...c, href: `${blogUrl}${c.href}` })),
  }))

  return (
    <section aria-label="미니쿠팡에서 풀어낸 문제들" className="w-full">
      <div className="mx-auto w-full max-w-4xl px-6">
        <div className="space-y-5">
          {tracksWithAbsoluteHrefs.map((t) => (
            <TrackCard key={t.id} track={t} existingSlugs={existingSlugs} />
          ))}
          <NextPostTeaser title="상품 검색에 하이브리드 검색 적용하기: gRPC, semantic search" />
        </div>
      </div>
    </section>
  )
}
