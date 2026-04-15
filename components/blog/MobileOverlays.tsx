'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import { useMobileUI } from '@/components/providers/MobileUIProvider'
import { CategoryNav } from './CategoryNav'
import { TableOfContents } from './TableOfContents'
import { searchPosts } from '@/lib/filters'

export function MobileOverlays() {
  return (
    <>
      <NavDrawer />
      <TocDrawer />
      <SearchDialog />
    </>
  )
}

function useDialogEffect(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const handler = () => onClose()
    dialog.addEventListener('close', handler)
    return () => dialog.removeEventListener('close', handler)
  }, [onClose])

  return ref
}

function NavDrawer() {
  const { navOpen, closeNav, posts, currentSlug } = useMobileUI()
  const ref = useDialogEffect(navOpen, closeNav)

  return (
    <dialog
      ref={ref}
      aria-label="카테고리"
      onClick={(e) => {
        if (e.target === ref.current) closeNav()
      }}
      className="fixed inset-y-0 left-0 m-0 h-[100dvh] w-[85%] max-w-80 border-0 bg-background p-0 text-foreground open:flex backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto px-4 pb-6 pt-20 pl-[max(env(safe-area-inset-left),1rem)]">
        <CategoryNav posts={posts} currentSlug={currentSlug} onLinkClick={closeNav} />
      </div>
    </dialog>
  )
}

function TocDrawer() {
  const { tocOpen, closeToc, tocItems } = useMobileUI()
  const ref = useDialogEffect(tocOpen, closeToc)

  if (!tocItems || tocItems.length === 0) return null

  return (
    <dialog
      ref={ref}
      aria-label="목차"
      onClick={(e) => {
        if (e.target === ref.current) closeToc()
      }}
      className="fixed inset-y-0 left-auto right-0 m-0 h-[100dvh] w-[85%] max-w-80 border-0 bg-background p-0 text-foreground open:flex backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto px-5 pb-6 pt-20 pr-[max(env(safe-area-inset-right),1.25rem)]">
        <TableOfContents items={tocItems} />
      </div>
    </dialog>
  )
}

function SearchDialog() {
  const { searchOpen, closeSearch, posts } = useMobileUI()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const ref = useDialogEffect(searchOpen, closeSearch)

  useEffect(() => {
    if (searchOpen) {
      setQuery('')
      const id = window.setTimeout(() => inputRef.current?.focus(), 10)
      return () => window.clearTimeout(id)
    }
  }, [searchOpen])

  const results = useMemo(() => {
    const trimmed = query.trim()
    if (!trimmed) return posts.slice(0, 8)
    return searchPosts(posts, trimmed).slice(0, 12)
  }, [posts, query])

  return (
    <dialog
      ref={ref}
      aria-label="검색"
      onClick={(e) => {
        if (e.target === ref.current) closeSearch()
      }}
      className="fixed inset-0 m-auto h-[min(85vh,540px)] w-[min(calc(100vw-2rem),640px)] rounded-xl border border-border bg-background p-0 text-foreground shadow-xl open:flex backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="flex h-full min-h-0 w-full flex-col">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search
            className="h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색어를 입력하세요..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={closeSearch}
            aria-label="닫기"
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="p-6 text-center text-sm text-muted-foreground">
              검색 결과가 없습니다.
            </li>
          ) : (
            results.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/posts/${post.slug}`}
                  onClick={closeSearch}
                  className="block rounded-md px-3 py-2.5 transition-colors hover:bg-muted"
                >
                  <div className="text-sm font-medium text-foreground">
                    {post.title}
                  </div>
                  <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {post.summary}
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </dialog>
  )
}
