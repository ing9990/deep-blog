import { ArrowUpRight, BookOpen } from 'lucide-react'

import type { Track, TrackCta } from './types'

interface Props {
  track: Track
  /** Slugs that actually exist under content/posts/*.mdx. */
  existingSlugs: Set<string>
}

export function TrackCard({ track, existingSlugs }: Props) {
  const primary = track.ctas.find(
    (c) => !c.postSlug || existingSlugs.has(c.postSlug),
  )

  return (
    <article className="rounded-xl border border-border bg-popover px-5 py-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)] md:px-6 md:py-5">
      <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <h3
          className="min-w-0 flex-1 text-[length:var(--text-md)] font-semibold tracking-tight text-foreground md:text-[length:var(--text-lg)]"
          style={{ fontFamily: 'var(--font-reading)' }}
        >
          {track.topic}
        </h3>
        {primary ? <DetailLink cta={primary} /> : null}
      </header>
    </article>
  )
}

function DetailLink({ cta }: { cta: TrackCta }) {
  const Icon = cta.kind === 'concept' ? BookOpen : ArrowUpRight

  return (
    <a
      href={cta.href}
      target="_blank"
      rel="noreferrer"
      aria-label={`${cta.label} 자세히 보기`}
      className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[length:var(--text-sm)] font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>자세히 보기</span>
      <ArrowUpRight
        className="h-3.5 w-3.5 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
        aria-hidden="true"
      />
    </a>
  )
}
