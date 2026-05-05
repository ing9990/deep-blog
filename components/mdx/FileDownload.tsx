import { Download, FileText } from 'lucide-react'

interface FileDownloadProps {
  href: string
  name: string
  size?: string
  download?: string | boolean
}

export function FileDownload({
  href,
  name,
  size,
  download = true,
}: FileDownloadProps) {
  const isExternal = /^https?:\/\//.test(href)
  const downloadAttr =
    typeof download === 'string' ? download : download ? '' : undefined

  return (
    <a
      href={href}
      download={isExternal ? undefined : downloadAttr}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      title={name}
      aria-label={`${name} 다운로드`}
      className="group my-6 inline-flex w-fit items-center gap-4 rounded-[var(--radius-card)] border border-border bg-muted/30 px-5 py-3.5 no-underline shadow-[var(--shadow-card)] transition-all hover:border-border-strong hover:bg-muted hover:shadow-[var(--shadow-card-hover)]"
    >
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-chip)] bg-primary/10">
        <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="font-medium leading-tight text-foreground">
          {name}
        </span>
        {size ? (
          <span className="text-[length:var(--text-sm)] leading-tight text-muted-foreground">
            {size}
          </span>
        ) : null}
      </span>
      <Download
        className="ml-2 h-4 w-4 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
        aria-hidden="true"
      />
    </a>
  )
}
