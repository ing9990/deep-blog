'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { SLUG_TO_ENTRY } from '@/lib/generated/keyword-map'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface KeywordLinkProps {
  href: string
  children: ReactNode
}

export function KeywordLink({ href, children }: KeywordLinkProps) {
  const { lang } = useTranslation()
  const slug = href.replace(/^\/posts\//, '')
  const entry = SLUG_TO_ENTRY.get(slug)

  return (
    <>
      <span className="hidden md:contents">
        <Popover>
          <PopoverTrigger asChild>
            <Link
              href={href}
              className="keyword-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {children}
            </Link>
          </PopoverTrigger>
          {entry && (
            <PopoverContent
              side="top"
              align="start"
              sideOffset={6}
              className="w-[320px] p-4"
            >
              <p className="text-sm font-semibold leading-tight text-foreground">
                {entry.title[lang]}
              </p>
              <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
                {entry.summary[lang]}
              </p>
            </PopoverContent>
          )}
        </Popover>
      </span>

      <Link
        href={href}
        className="keyword-link md:hidden"
      >
        {children}
      </Link>
    </>
  )
}
