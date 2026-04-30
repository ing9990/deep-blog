interface Props {
  title: string
}

export function NextPostTeaser({ title }: Props) {
  return (
    <article className="rounded-xl border border-dashed border-border bg-popover/40 px-5 py-1.5 transition-colors md:px-6 md:py-2">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h3 className="min-w-0 flex-1 text-[length:var(--text-md)] font-semibold tracking-tight text-muted-foreground">
          <span className="mr-2 font-mono text-[length:var(--text-2xs)] font-semibold uppercase tracking-[var(--tracking-wider)] text-muted-foreground/80">
            다음 글
          </span>
          {title}
        </h3>
        <span
          aria-hidden="true"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-border bg-background/40 px-3 py-1.5 text-[length:var(--text-sm)] font-medium text-muted-foreground"
        >
          준비 중
        </span>
      </header>
    </article>
  )
}
