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

export interface Settings {
  cardLayout: CardLayout
}

const DEFAULT_SETTINGS: Settings = {
  cardLayout: 'editorial',
}

const STORAGE_KEY = 'deep-settings'

interface SettingsContextValue {
  settings: Settings
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  updateSetting: () => {},
})

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext)
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<Settings>
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // quota exceeded — ignore silently
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setSettings(loadSettings())
    setHydrated(true)
  }, [])

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

  const contextValue: SettingsContextValue = { settings, updateSetting }

  // hydrated 전에도 children을 렌더링 (default 값으로). Flash 최소화.
  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  )
}
