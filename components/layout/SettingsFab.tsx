'use client'

import { useCallback, useState } from 'react'
import { Settings } from 'lucide-react'
import { SettingsPanel } from './SettingsPanel'
import { useTranslation } from '@/lib/i18n/useTranslation'

export function SettingsFab() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const handleToggle = useCallback(() => setOpen((prev) => !prev), [])
  const handleClose = useCallback(() => setOpen(false), [])

  return (
    <>
      <SettingsPanel open={open} onClose={handleClose} />
      <button
        type="button"
        onClick={handleToggle}
        className="fixed bottom-6 right-6 z-[var(--z-fab)] flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background shadow-[var(--shadow-fab)] transition-transform hover:scale-105"
        aria-label={t('settings.open')}
      >
        <Settings
          className="h-[22px] w-[22px] transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-[60deg]"
          style={{ transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </button>
    </>
  )
}
