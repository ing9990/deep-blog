import { ArrowUpRight, BookOpen } from 'lucide-react'

import { cn } from '@/lib/utils'

import type { Track, TrackCta, TrackStatus } from './types'

interface Props {
  track: Track
  /** Slugs that actually exist under content/posts/*.mdx. */
  existingSlugs: Set<string>
}

export function TrackCard({ track, existingSlugs }: Props) {
  const ctas = track.ctas.filter(
    (c) => !c.postSlug || existingSlugs.has(c.postSlug),
  )
  const [primary, ...rest] = ctas

  return (
    <article className="rounded-xl border border-border bg-popover px-5 py-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)] md:px-6 md:py-5">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <h3
          className="text-[length:var(--text-md)] font-semibold tracking-tight text-foreground md:text-[length:var(--text-lg)]"
          style={{ fontFamily: 'var(--font-reading)' }}
        >
          {track.topic}
        </h3>
        <StatusPill status={track.status} />
      </header>

      <p
        className="mb-4 text-[length:var(--text-sm)] leading-[var(--leading-relaxed)] text-muted-foreground md:text-[length:var(--text-md)]"
        style={{ fontFamily: 'var(--font-reading)' }}
      >
        {track.trace}
      </p>

      {ctas.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {primary ? <CtaButton cta={primary} variant="primary" /> : null}
          {rest.map((c) => (
            <CtaButton key={c.href} cta={c} variant="secondary" />
          ))}
        </div>
      ) : null}
    </article>
  )
}

function CtaButton({
  cta,
  variant,
}: {
  cta: TrackCta
  variant: 'primary' | 'secondary'
}) {
  const Icon = cta.kind === 'concept' ? BookOpen : ArrowUpRight

  return (
    <a
      href={cta.href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        'group inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[length:var(--text-sm)] font-medium transition-colors',
        variant === 'primary'
          ? 'bg-primary text-primary-foreground hover:opacity-90'
          : 'border border-border bg-background text-foreground hover:bg-accent',
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{cta.label}</span>
      <ArrowUpRight
        className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        aria-hidden="true"
      />
    </a>
  )
}

function StatusPill({ status }: { status: TrackStatus }) {
  const map: Record<TrackStatus, { cls: string; label: string }> = {
    done: {
      cls: 'border-viz-confirmed/40 bg-viz-confirmed-bg text-viz-confirmed-fg',
      label: 'done',
    },
    'in-progress': {
      cls: 'border-primary/40 bg-primary/10 text-primary',
      label: 'in progress',
    },
    planned: {
      cls: 'border-border bg-muted text-muted-foreground',
      label: 'planned',
    },
  }
  const s = map[status]
  return (
    <span
      className={cn(
        'shrink-0 rounded-full border px-2 py-[2px] font-mono text-[length:var(--text-2xs)] uppercase tracking-[var(--tracking-wide)]',
        s.cls,
      )}
    >
      {s.label}
    </span>
  )
}
