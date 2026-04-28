export type TrackStatus = 'done' | 'in-progress' | 'planned'

export type TrackCtaKind = 'blog' | 'concept'

export interface TrackCta {
  kind: TrackCtaKind
  label: string
  href: string
  /** When set, the CTA is dropped if the slug is missing from content/posts. */
  postSlug?: string
}

export interface Track {
  id: string
  /** Short topic label (e.g. "주문 동시성"). */
  topic: string
  /** 2~3 line solution trace. Recruiter-scannable, no jargon. */
  trace: string
  status: TrackStatus
  /** Buttons rendered under the trace, primary first. */
  ctas: TrackCta[]
}
