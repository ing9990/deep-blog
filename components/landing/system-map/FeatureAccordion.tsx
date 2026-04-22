'use client'

import { ArrowUpRight, ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

import type { Feature, FeatureStatus } from './types'

const BLOG_URL = 'https://deep.ing9990.com'

interface Props {
  feature: Feature
  /** Slugs that actually exist under content/posts/*.mdx. Used to gate "자세히 →". */
  existingSlugs: Set<string>
  /** On initial render, open the first feature of the first domain for scent. */
  defaultOpen?: boolean
}

export function FeatureAccordion({ feature, existingSlugs, defaultOpen }: Props) {
  return (
    <details
      className="group rounded-xl border border-border bg-popover shadow-[var(--shadow-card)] open:shadow-[var(--shadow-card-hover)]"
      open={defaultOpen}
    >
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center gap-3 px-5 py-4',
          'rounded-xl transition-colors hover:bg-muted/40',
          '[&::-webkit-details-marker]:hidden',
        )}
      >
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-0 -rotate-90"
          aria-hidden="true"
        />
        <h3
          className="flex-1 text-[length:var(--text-base)] font-semibold leading-[var(--leading-snug)] text-foreground"
          style={{ fontFamily: 'var(--font-reading)' }}
        >
          {feature.requirement}
        </h3>
        {feature.status ? <StatusPill status={feature.status} /> : null}
        {feature.tags && feature.tags.length > 0 ? (
          <div className="hidden shrink-0 items-center gap-1 md:flex">
            {feature.tags.slice(0, 3).map((t) => (
              <TagChip key={t} label={t} />
            ))}
            {feature.tags.length > 3 ? (
              <span className="font-mono text-[length:var(--text-2xs)] text-muted-foreground">
                +{feature.tags.length - 3}
              </span>
            ) : null}
          </div>
        ) : null}
      </summary>

      <div
        className="space-y-6 border-t border-border px-5 pt-5 pb-5"
        style={{ fontFamily: 'var(--font-reading)' }}
      >
        <Section title="아키텍처">
          <p className="text-[length:var(--text-md)] leading-[var(--leading-relaxed)] text-foreground/90">
            {feature.architecture}
          </p>
        </Section>

        {feature.choices.length > 0 ? (
          <Section title="선택 사항 · 근거">
            <ul className="space-y-3">
              {feature.choices.map((c, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-border bg-background px-4 py-3.5"
                >
                  <div className="text-[length:var(--text-md)] font-semibold leading-[var(--leading-snug)] text-foreground">
                    {c.text}
                  </div>
                  <div className="mt-2 flex gap-2 text-[length:var(--text-sm)] leading-[var(--leading-relaxed)] text-muted-foreground">
                    <span
                      className="mt-[2px] shrink-0 font-mono text-foreground/40"
                      aria-hidden="true"
                    >
                      ↳
                    </span>
                    <span>{c.reason}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {feature.challenges.length > 0 ? (
          <Section title="고민한 문제">
            <ul className="space-y-3">
              {feature.challenges.map((ch, i) => {
                const hasPost = !!ch.postSlug && existingSlugs.has(ch.postSlug)
                return (
                  <li
                    key={i}
                    className="rounded-lg border border-l-[3px] border-border border-l-primary/70 bg-background px-4 py-3.5"
                  >
                    <div className="flex flex-wrap items-start gap-2">
                      <div className="flex-1 text-[length:var(--text-md)] font-semibold leading-[var(--leading-snug)] text-foreground">
                        {ch.problem}
                      </div>
                      {hasPost ? (
                        <a
                          href={`${BLOG_URL}/posts/${ch.postSlug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[length:var(--text-xs)] font-medium text-primary-foreground transition-opacity hover:opacity-90"
                        >
                          자세히
                          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      ) : null}
                    </div>
                    <div className="mt-2 flex gap-2 text-[length:var(--text-sm)] leading-[var(--leading-relaxed)] text-muted-foreground">
                      <span
                        className="mt-[2px] shrink-0 font-mono text-primary/70"
                        aria-hidden="true"
                      >
                        →
                      </span>
                      <span>{ch.solution}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </Section>
        ) : null}
      </div>
    </details>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2 font-mono text-[length:var(--text-2xs)] font-semibold uppercase tracking-[var(--tracking-wider)] text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  )
}

function StatusPill({ status }: { status: FeatureStatus }) {
  const style: Record<FeatureStatus, { cls: string; label: string }> = {
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
  const s = style[status]
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

function TagChip({ label }: { label: string }) {
  return (
    <span className="rounded border border-border bg-background px-1.5 py-[1px] font-mono text-[length:var(--text-2xs)] text-muted-foreground">
      {label}
    </span>
  )
}
