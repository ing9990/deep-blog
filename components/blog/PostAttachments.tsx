import { FileText } from 'lucide-react'

interface Attachment {
  name: string
  href: string
  size?: string
}

interface PostAttachmentsProps {
  items: Attachment[] | undefined
}

export function PostAttachments({ items }: PostAttachmentsProps) {
  if (!items || items.length === 0) return null

  return (
    <ul className="mt-3 flex list-none flex-col gap-1.5 p-0">
      {items.map((item) => {
        const isExternal = /^https?:\/\//.test(item.href)
        return (
          <li
            key={item.href}
            className="flex items-center gap-1.5 text-[length:var(--text-meta)]"
          >
            <FileText
              className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <a
              href={item.href}
              download={isExternal ? undefined : ''}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className="font-medium text-keyword underline-offset-2 hover:underline"
            >
              {item.name}
            </a>
            {item.size ? (
              <span className="text-muted-foreground">· {item.size}</span>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
