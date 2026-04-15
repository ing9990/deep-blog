import type { ReactNode } from 'react'
import { TableOfContents } from '@/components/blog/TableOfContents'
import { CategoryNav } from '@/components/blog/CategoryNav'
import { DocShellRegister } from './DocShellRegister'
import { getAllPosts } from '@/lib/posts'
import { toClientPost } from '@/lib/client-post'
import type { FlatTocItem } from '@/lib/toc'

interface DocShellProps {
  children: ReactNode
  toc?: FlatTocItem[]
  currentSlug?: string
  showCategoryNav?: boolean
}

export function DocShell({
  children,
  toc,
  currentSlug,
  showCategoryNav = true,
}: DocShellProps) {
  const hasToc = !!toc && toc.length > 0

  const posts = getAllPosts().map(toClientPost)

  return (
    <>
      <DocShellRegister
        toc={toc ?? null}
        currentSlug={currentSlug ?? null}
      />
      <div className="mx-auto max-w-screen-2xl pl-[max(env(safe-area-inset-left),1rem)] pr-[max(env(safe-area-inset-right),1rem)] sm:pl-[max(env(safe-area-inset-left),1.5rem)] sm:pr-[max(env(safe-area-inset-right),1.5rem)] md:pl-[max(env(safe-area-inset-left),2rem)] md:pr-[max(env(safe-area-inset-right),2rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-[288px_minmax(0,1fr)_224px] lg:gap-12">
          {showCategoryNav ? (
            <div className="hidden lg:block">
              <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto py-16 pr-2">
                <CategoryNav posts={posts} currentSlug={currentSlug} />
              </div>
            </div>
          ) : (
            <div className="hidden lg:block" aria-hidden />
          )}

          <main className="min-w-0 py-12 lg:py-16">{children}</main>

          {hasToc ? (
            <aside className="hidden lg:block" aria-label="목차 사이드바">
              <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto py-16 pr-2">
                <TableOfContents items={toc!} />
              </div>
            </aside>
          ) : (
            <div className="hidden lg:block" aria-hidden />
          )}
        </div>
      </div>
    </>
  )
}
