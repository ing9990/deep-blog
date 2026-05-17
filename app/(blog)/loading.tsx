import { Loader2 } from 'lucide-react'

// Route-level loading boundary for the (blog) group.
//
// Without this file, App Router blocks a navigation until the destination
// RSC payload fully arrives, leaving the previous page frozen with no
// feedback. This spinner gives an instant visual response on every
// transition: the post list screen and entering a post from the list.
export default function Loading() {
  return (
    <div
      className="flex min-h-[60vh] w-full items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <Loader2
        className="h-8 w-8 animate-spin text-muted-foreground"
        aria-hidden="true"
      />
      <span className="sr-only">페이지를 불러오는 중입니다</span>
    </div>
  )
}
