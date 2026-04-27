import { ArrowUpRight, BookOpen } from 'lucide-react'

import { cn } from '@/lib/utils'

import type { Track, TrackCta, TrackStatus } from './types'

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.084-.729.084-.729 1.205.084 1.838 1.237 1.838 1.237 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.604-2.665-.3-5.467-1.332-5.467-5.93 0-1.31.468-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

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
  const Icon =
    cta.kind === 'github'
      ? GithubIcon
      : cta.kind === 'concept'
        ? BookOpen
        : ArrowUpRight

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
