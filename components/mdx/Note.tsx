import type { ReactNode } from 'react'

interface NoteProps {
  title?: string
  children: ReactNode
}

export function Note({ title = 'Good to know', children }: NoteProps) {
  return (
    <aside className="note" role="note">
      <p className="note-title">{title}</p>
      <div className="note-body">{children}</div>
    </aside>
  )
}
