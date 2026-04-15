'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ClientPost } from '@/lib/client-post'
import type { FlatTocItem } from '@/lib/toc'

interface MobileUIState {
  posts: ClientPost[]

  navOpen: boolean
  tocOpen: boolean
  searchOpen: boolean

  openNav: () => void
  closeNav: () => void
  openToc: () => void
  closeToc: () => void
  openSearch: () => void
  closeSearch: () => void

  tocItems: FlatTocItem[] | null
  setTocItems: (items: FlatTocItem[] | null) => void

  currentSlug: string | null
  setCurrentSlug: (slug: string | null) => void
}

const MobileUIContext = createContext<MobileUIState | null>(null)

export function useMobileUI(): MobileUIState {
  const ctx = useContext(MobileUIContext)
  if (!ctx) {
    throw new Error('useMobileUI must be used within <MobileUIProvider>')
  }
  return ctx
}

interface MobileUIProviderProps {
  posts: ClientPost[]
  children: ReactNode
}

export function MobileUIProvider({ posts, children }: MobileUIProviderProps) {
  const [navOpen, setNavOpen] = useState(false)
  const [tocOpen, setTocOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [tocItems, setTocItemsState] = useState<FlatTocItem[] | null>(null)
  const [currentSlug, setCurrentSlugState] = useState<string | null>(null)

  const openNav = useCallback(() => setNavOpen(true), [])
  const closeNav = useCallback(() => setNavOpen(false), [])
  const openToc = useCallback(() => setTocOpen(true), [])
  const closeToc = useCallback(() => setTocOpen(false), [])
  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])
  const setTocItems = useCallback(
    (items: FlatTocItem[] | null) => setTocItemsState(items),
    [],
  )
  const setCurrentSlug = useCallback(
    (slug: string | null) => setCurrentSlugState(slug),
    [],
  )

  const value = useMemo<MobileUIState>(
    () => ({
      posts,
      navOpen,
      tocOpen,
      searchOpen,
      openNav,
      closeNav,
      openToc,
      closeToc,
      openSearch,
      closeSearch,
      tocItems,
      setTocItems,
      currentSlug,
      setCurrentSlug,
    }),
    [
      posts,
      navOpen,
      tocOpen,
      searchOpen,
      openNav,
      closeNav,
      openToc,
      closeToc,
      openSearch,
      closeSearch,
      tocItems,
      setTocItems,
      currentSlug,
      setCurrentSlug,
    ],
  )

  return (
    <MobileUIContext.Provider value={value}>{children}</MobileUIContext.Provider>
  )
}
