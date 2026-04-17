'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type CardLayout = 'editorial' | 'timeline' | 'floating'
export type Language = 'en' | 'ko'
export type FontSize = 'small' | 'normal' | 'large'

export interface Settings {
  cardLayout: CardLayout
  language: Language
  fontSize: FontSize
}

const DEFAULT_SETTINGS: Settings = {
  cardLayout: 'timeline',
  language: 'en',
  fontSize: 'normal',
}

const STORAGE_KEY = 'deep-settings'

interface SettingsContextValue {
  settings: Settings
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  hydrated: boolean
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  updateSetting: () => {},
  hydrated: false,
})

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext)
}

function normalizeLanguage(value: unknown): Language {
  return value === 'ko' || value === 'en' ? value : 'ko'
}

function normalizeCardLayout(value: unknown): CardLayout {
  return value === 'editorial' || value === 'timeline' || value === 'floating'
    ? value
    : 'timeline'
}

export function normalizeFontSize(value: unknown): FontSize {
  return value === 'small' || value === 'normal' || value === 'large'
    ? value
    : 'normal'
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<Record<keyof Settings, unknown>>
    return {
      cardLayout: normalizeCardLayout(parsed.cardLayout),
      language: normalizeLanguage(parsed.language),
      fontSize: normalizeFontSize(parsed.fontSize),
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // quota exceeded: ignore silently
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setSettings(loadSettings())
    setHydrated(true)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.fontSize = settings.fontSize
  }, [settings.fontSize])

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value }
        saveSettings(next)
        return next
      })
    },
    [],
  )

  const contextValue: SettingsContextValue = { settings, updateSetting, hydrated }

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  )
}
