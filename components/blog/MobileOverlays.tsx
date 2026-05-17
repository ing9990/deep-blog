'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import { useMobileUI } from '@/components/providers/MobileUIProvider'
import { CategoryNav } from './CategoryNav'
import { TableOfContents } from './TableOfContents'
import { searchPosts } from '@/lib/filters'
import type { CardPost, ClientPost } from '@/lib/client-post'
import { useTranslation } from '@/lib/i18n/useTranslation'

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
      <div className="flex h-full min-h-0 w-full flex-col px-4 pb-6 pt-20 pl-[max(env(safe-area-inset-left),1rem)]">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <CategoryNav posts={posts} currentSlug={currentSlug} onLinkClick={closeNav} />
        </div>
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
  const { lang } = useTranslation()
  const [query, setQuery] = useState('')
  const [searchIndex, setSearchIndex] = useState<ClientPost[] | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const ref = useDialogEffect(searchOpen, closeSearch)

  /* Lazy-load the full-text index on first open. Its plainBody blob stays
     off the first page load and arrives only when search is actually used. */
  useEffect(() => {
    if (!searchOpen || searchIndex) return
    let cancelled = false
    fetch('/search-index')
      .then((res) => (res.ok ? (res.json() as Promise<ClientPost[]>) : null))
      .then((data) => {
        if (!cancelled && data) setSearchIndex(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [searchOpen, searchIndex])

  /* rAF focus — 10ms setTimeout was unreliable on iOS Safari */
  useEffect(() => {
    if (searchOpen) {
      setQuery('')
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [searchOpen])

  /* Shrink dialog when virtual keyboard appears */
  useEffect(() => {
    if (!searchOpen) return
    const vv = window.visualViewport
    const dialog = ref.current
    if (!vv || !dialog) return

    const update = () => {
      dialog.style.maxHeight = `${vv.height - 24}px`
    }

    update()
    vv.addEventListener('resize', update)
    return () => {
      vv.removeEventListener('resize', update)
      dialog.style.maxHeight = ''
    }
  }, [searchOpen, ref])

  /* iOS Safari body scroll lock */
  useEffect(() => {
    if (!searchOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [searchOpen])

  const results = useMemo(() => {
    // searchIndex (ClientPost[], with plainBody) is a superset of CardPost,
    // so it is assignable to CardPost[]. Until it loads, fall back to the
    // light card list so search still matches title/summary/tags.
    const source: CardPost[] = searchIndex ?? posts
    const trimmed = query.trim()
    if (!trimmed) return source.slice(0, 8)
    return searchPosts(source, trimmed).slice(0, 12)
  }, [searchIndex, posts, query])

  const handleSelect = useCallback(() => {
    inputRef.current?.blur()
    closeSearch()
  }, [closeSearch])

  return (
    <dialog
      ref={ref}
      aria-label="검색"
      onClick={(e) => {
        if (e.target === ref.current) closeSearch()
      }}
      className="fixed inset-x-0 top-3 mx-auto mb-auto h-[min(85dvh,540px)] w-[min(calc(100vw-1.5rem),640px)] rounded-xl border border-border bg-background p-0 text-foreground shadow-xl open:flex sm:inset-0 sm:m-auto backdrop:bg-black/50 backdrop:backdrop-blur-sm"
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
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            className="min-w-0 flex-1 bg-transparent text-[length:var(--text-search-input)] outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={closeSearch}
            aria-label="닫기"
            className="-mr-1 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          {results.length === 0 ? (
            <li className="p-6 text-center text-[length:var(--text-body-sm)] text-muted-foreground">
              검색 결과가 없습니다.
            </li>
          ) : (
            results.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/posts/${post.slug}`}
                  onClick={handleSelect}
                  className="block rounded-md px-3 py-3 transition-colors hover:bg-muted active:bg-muted"
                >
                  <div className="text-[length:var(--text-search-title)] font-medium text-foreground">
                    {post.title[lang]}
                  </div>
                  <div className="mt-0.5 line-clamp-1 text-[length:var(--text-search-summary)] text-muted-foreground">
                    {post.summary[lang]}
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
