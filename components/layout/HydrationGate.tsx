'use client'

import type { ReactNode } from 'react'
import { useSettings } from '@/components/providers/SettingsProvider'

/**
 * HydrationGate — blocks child rendering until SettingsProvider has
 * finished reading localStorage (language + fontSize + cardLayout).
 *
 * Prevents FOUC: without this, SSR/first-paint uses DEFAULT_SETTINGS
 * (en + normal) and components re-render to the user's preference
 * (e.g. ko + small) after the SettingsProvider effect runs, visibly
 * flashing the wrong language and font scale for ~100ms.
 *
 * Renders a minimal centered spinner. Disappears once `hydrated` flips
 * to true — typically within one animation frame after React hydrates.
 * Internal navigations via <Link> do NOT re-show the spinner because
 * SettingsProvider lives in the root layout and its state persists.
 */
export function HydrationGate({ children }: { children: ReactNode }) {
  const { hydrated } = useSettings()

  if (!hydrated) {
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 z-[var(--z-hero)] flex items-center justify-center bg-background"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    )
  }

  return <>{children}</>
}
