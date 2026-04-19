'use client'

import Link from 'next/link'
import { useCallback, useEffect } from 'react'
import { Menu, Search } from 'lucide-react'
import { GithubMark } from './GithubMark'
import { useMobileUI } from '@/components/providers/MobileUIProvider'
import { ThemeToggle } from './ThemeToggle'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { cn } from '@/lib/utils'

export function HeaderActions() {
  const { t, lang } = useTranslation()
  const openSettings = useCallback(() => {
    window.dispatchEvent(new CustomEvent('deep-settings-open'))
  }, [])
  const { openNav, openSearch } = useMobileUI()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        openSearch()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openSearch])

  return (
    <div className="flex h-16 items-center gap-3 lg:grid lg:grid-cols-[288px_minmax(0,1fr)_224px] lg:gap-12">
      <div className="flex shrink-0 items-center lg:min-w-0">
        <button
          type="button"
          onClick={openNav}
          aria-label={t('header.open.nav')}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3 lg:ml-0 lg:w-full">
        <Link
          href="/"
          className="flex shrink-0 items-center font-bold tracking-tight"
        >
          <span className="text-[length:var(--text-xl)]">DEEP</span>
        </Link>

        <button
          type="button"
          onClick={openSearch}
          aria-label={t('header.open.search')}
          className="mx-auto inline-flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-muted/40 text-[length:var(--text-search-input)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:h-auto md:w-[180px] md:justify-start md:px-3 md:py-2 lg:w-[220px] xl:w-[280px]"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="hidden md:inline">{t('header.search.placeholder')}</span>
          <kbd className="ml-auto hidden rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[length:var(--text-hint)] text-muted-foreground md:inline">
            ⌘K
          </kbd>
        </button>

        <nav
          aria-label={t('header.site.actions')}
          className="flex shrink-0 items-center gap-0.5"
        >
          <a
            href="https://github.com/ing9990"
            target="_blank"
            rel="noreferrer"
            aria-label={t('header.open.github')}
            className="group inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-muted hover:text-foreground active:scale-95"
          >
            <GithubMark className="h-[18px] w-[18px] transition-transform duration-300 ease-out group-hover:-rotate-12" />
          </a>
          <span aria-hidden="true" className="mx-2 h-5 w-px bg-border" />
          <ThemeToggle />
          <span aria-hidden="true" className="mx-2 h-5 w-px bg-border" />
          <button
            type="button"
            onClick={openSettings}
            aria-label={t('header.open.settings')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <span
              aria-hidden="true"
              className={cn(
                'text-[length:var(--text-menu)] font-bold leading-none',
                lang === 'en' ? 'font-mono' : 'font-sans',
              )}
            >
              {lang === 'ko' ? '가' : 'A'}
            </span>
          </button>
        </nav>
      </div>
    </div>
  )
}
