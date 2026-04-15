'use client'

import { useEffect } from 'react'
import { useMobileUI } from '@/components/providers/MobileUIProvider'
import type { FlatTocItem } from '@/lib/toc'

interface DocShellRegisterProps {
  toc: FlatTocItem[] | null
  currentSlug: string | null
}

export function DocShellRegister({ toc, currentSlug }: DocShellRegisterProps) {
  const { setTocItems, setCurrentSlug } = useMobileUI()

  useEffect(() => {
    setTocItems(toc)
    return () => setTocItems(null)
  }, [toc, setTocItems])

  useEffect(() => {
    setCurrentSlug(currentSlug)
    return () => setCurrentSlug(null)
  }, [currentSlug, setCurrentSlug])

  return null
}
