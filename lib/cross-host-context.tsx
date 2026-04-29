'use client'

import { createContext, useContext } from 'react'
import type { CrossHostUrls } from './cross-host-url'

const CrossHostContext = createContext<CrossHostUrls | null>(null)

export function CrossHostProvider({
  value,
  children,
}: {
  value: CrossHostUrls
  children: React.ReactNode
}) {
  return <CrossHostContext.Provider value={value}>{children}</CrossHostContext.Provider>
}

export function useCrossHostUrls(): CrossHostUrls {
  const ctx = useContext(CrossHostContext)
  if (!ctx) {
    throw new Error('useCrossHostUrls must be used inside <CrossHostProvider>')
  }
  return ctx
}
