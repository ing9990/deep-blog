'use client'

import { AlignRight } from 'lucide-react'
import { useMobileUI } from '@/components/providers/MobileUIProvider'
import { useTranslation } from '@/lib/i18n/useTranslation'

/**
 * Floating "clip" that tabs onto the right edge of the viewport on mobile
 * post pages. Replaces the old header-inline TOC button which pushed the
 * header row past device-width and surfaced as a horizontal drag.
 *
 * Visual: pill that bleeds off the right edge — flat right side (border
 * removed + rounded-l-full only) reads as a tab clipped to the page.
 * Icon + short label, mobile-only (lg:hidden), hidden automatically when
 * no TOC items are registered for the current page.
 */
export function MobilePostTocFab() {
  const { openToc, tocItems } = useMobileUI()
  const { t } = useTranslation()

  if (!tocItems || tocItems.length === 0) return null

  return (
    <button
      type="button"
      onClick={openToc}
      aria-label={t('header.open.toc')}
      className="fixed right-0 top-[calc(var(--layout-header-height)+2rem)] z-[var(--z-fab)]
                 inline-flex h-10 items-center gap-1.5
                 rounded-l-full border border-r-0 border-border
                 bg-background/90 pl-3 pr-3
                 text-[length:var(--text-meta)] font-medium text-muted-foreground
                 shadow-[var(--shadow-card)] backdrop-blur-md
                 transition-colors hover:text-foreground active:bg-muted
                 lg:hidden"
    >
      <AlignRight className="h-4 w-4" aria-hidden="true" />
      <span>{t('toc.label')}</span>
    </button>
  )
}
