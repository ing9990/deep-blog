'use client'

import { useSettings } from '@/components/providers/SettingsProvider'
import { translate, type MessageKey } from './messages'

export function useTranslation() {
  const { settings } = useSettings()
  const lang = settings.language
  const t = (key: MessageKey, params?: Record<string, string | number>) =>
    translate(key, lang, params)
  return { t, lang }
}
