// components/blog/RelatedPost.tsx
import Link from 'next/link'
import { ArrowRight, BookOpen, Compass, Layers } from 'lucide-react'
import { SLUG_TO_ENTRY } from '@/lib/generated/keyword-map'
import { cn } from '@/lib/utils'

type RelatedPostType = 'prerequisite' | 'deep-dive' | 'parallel'

interface RelatedPostProps {
  slug: string
  type?: RelatedPostType
  label?: string
}

const VARIANTS: Record<
  RelatedPostType,
  {
    icon: typeof BookOpen
    defaultLabel: string
    surfaceClass: string
    iconClass: string
  }
> = {
  prerequisite: {
    icon: BookOpen,
    defaultLabel: '먼저 읽어야 할 글',
    surfaceClass: 'border-l-4 border-l-primary',
    iconClass: 'text-primary',
  },
  'deep-dive': {
    icon: Compass,
    defaultLabel: '더 깊이 알아보기',
    surfaceClass: '',
    iconClass: 'text-keyword',
  },
  parallel: {
    // Spec §9.2: 약한 강조, 작은 카드. opacity-75 + bg-muted/40 reduces
    // the visual weight relative to deep-dive while keeping the same
    // structural footprint.
    icon: Layers,
    defaultLabel: '함께 읽으면 좋은 글',
    surfaceClass: 'opacity-75 bg-muted/40',
    iconClass: 'text-muted-foreground',
  },
}

export function RelatedPost({ slug, type = 'deep-dive', label }: RelatedPostProps) {
  const entry = SLUG_TO_ENTRY.get(slug)
  if (!entry) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[RelatedPost] No entry found for slug "${slug}". Component will not render.`)
    }
    return null
  }

  const variant = VARIANTS[type]
  const Icon = variant.icon
  const displayLabel = label ?? variant.defaultLabel

  return (
    <Link
      href={`/posts/${slug}`}
      className={cn(
        'group my-6 flex items-start gap-4 rounded-[var(--radius-panel)] border border-border bg-background p-5 transition-colors hover:border-border-strong hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        variant.surfaceClass,
      )}
    >
      <Icon
        className={cn('mt-0.5 h-5 w-5 flex-shrink-0', variant.iconClass)}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[length:var(--text-caption)] font-semibold uppercase tracking-wider text-muted-foreground">
          {displayLabel}
        </p>
        <p className="mt-1.5 text-[length:var(--text-h4)] font-semibold text-foreground transition-colors group-hover:text-primary">
          {entry.title}
        </p>
        <p className="mt-1 line-clamp-2 text-[length:var(--text-body-sm)] leading-relaxed text-muted-foreground">
          {entry.summary}
        </p>
      </div>
      <ArrowRight
        className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
        aria-hidden="true"
      />
    </Link>
  )
}
