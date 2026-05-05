import { Download, FileText } from 'lucide-react'

interface FileDownloadProps {
  href: string
  name: string
  description?: string
  size?: string
  download?: string | boolean
}

export function FileDownload({
  href,
  name,
  description,
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
      className="my-6 flex items-center gap-4 rounded-[var(--radius-panel)] border border-border bg-muted/40 p-4 no-underline transition-colors hover:bg-muted hover:border-border-strong"
    >
      <FileText
        className="h-10 w-10 flex-shrink-0 text-primary"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="m-0 font-semibold text-foreground">{name}</p>
        {description ? (
          <p className="m-0 mt-1 text-[length:var(--text-callout-body)] text-muted-foreground">
            {description}
          </p>
        ) : null}
        {size ? (
          <p className="m-0 mt-1 text-[length:var(--text-sm)] text-muted-foreground">
            {size}
          </p>
        ) : null}
      </div>
      <Download
        className="h-5 w-5 flex-shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
    </a>
  )
}
