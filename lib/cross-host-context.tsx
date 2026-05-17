'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import {
  PROD_URLS,
  resolveCrossHostUrls,
  type CrossHostUrls,
} from './cross-host-url'

const CrossHostContext = createContext<CrossHostUrls | null>(null)

export function CrossHostProvider({
  value,
  children,
}: {
  /**
   * Optional server-resolved URLs. When omitted (the statically rendered
   * blog surface), the provider resolves from the live host on the client:
   * SSR and the first client render use PROD_URLS so hydration matches, and
   * a dev/LAN host is corrected in an effect.
   */
  value?: CrossHostUrls
  children: React.ReactNode
}) {
  const [clientUrls, setClientUrls] = useState<CrossHostUrls>(PROD_URLS)

  useEffect(() => {
    if (value) return
    setClientUrls(resolveCrossHostUrls(window.location.host))
  }, [value])

  return (
    <CrossHostContext.Provider value={value ?? clientUrls}>
      {children}
    </CrossHostContext.Provider>
  )
}

export function useCrossHostUrls(): CrossHostUrls {
  const ctx = useContext(CrossHostContext)
  if (!ctx) {
    throw new Error('useCrossHostUrls must be used inside <CrossHostProvider>')
  }
  return ctx
}
