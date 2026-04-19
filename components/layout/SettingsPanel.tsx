// components/layout/SettingsPanel.tsx
'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import {
  useSettings,
  type CardLayout,
  type CodeTheme,
  type FontSize,
  type Language,
  type SyntaxTheme,
} from '@/components/providers/SettingsProvider'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { cn } from '@/lib/utils'
import type { MessageKey } from '@/lib/i18n/messages'

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
}

const LAYOUT_OPTIONS: { value: CardLayout; labelKey: MessageKey }[] = [
  { value: 'timeline',  labelKey: 'settings.layout.timeline' },
  { value: 'editorial', labelKey: 'settings.layout.editorial' },
  { value: 'floating',  labelKey: 'settings.layout.floating' },
]

const LANGUAGE_OPTIONS: { value: Language; labelKey: MessageKey }[] = [
  { value: 'ko', labelKey: 'settings.lang.ko' },
  { value: 'en', labelKey: 'settings.lang.en' },
]

const FONT_SIZE_OPTIONS: { value: FontSize; labelKey: MessageKey }[] = [
  { value: 'small',  labelKey: 'settings.font.small' },
  { value: 'normal', labelKey: 'settings.font.normal' },
  { value: 'large',  labelKey: 'settings.font.large' },
]

const CODE_THEME_OPTIONS: { value: CodeTheme; labelKey: MessageKey }[] = [
  { value: 'floating', labelKey: 'settings.code.floating' },
  { value: 'rail',     labelKey: 'settings.code.rail' },
]

const SYNTAX_THEME_OPTIONS: { value: SyntaxTheme; labelKey: MessageKey }[] = [
  { value: 'atom',    labelKey: 'settings.syntax.atom' },
  { value: 'github',  labelKey: 'settings.syntax.github' },
  { value: 'vitesse', labelKey: 'settings.syntax.vitesse' },
]

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { settings, updateSetting } = useSettings()
  const { t, lang } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)

  // ESC close
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Outside click close. The SettingsFab wrapper is excluded so clicking
  // the FAB while the panel is open lets the button's onClick run as a
  // genuine toggle instead of being pre-closed by this handler.
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Element | null
      if (panelRef.current && !panelRef.current.contains(target)) {
        if (target?.closest('[data-settings-fab-wrapper]')) return
        onClose()
      }
    }
    const id = requestAnimationFrame(() => {
      document.addEventListener('mousedown', handleClick)
    })
    return () => {
      cancelAnimationFrame(id)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={t('settings.title')}
      className="fixed bottom-24 right-6 z-[var(--z-panel)] w-[var(--layout-panel-width)] origin-bottom-right animate-[panel-in_0.25s_cubic-bezier(0.22,1,0.36,1)_both] rounded-2xl border border-border bg-background shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 pb-3 pt-4">
        <h3 className="text-[length:var(--text-settings-title)] font-bold tracking-tight">{t('settings.title')}</h3>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
          aria-label={t('settings.close')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="py-2">
        {/* Theme Section */}
        <div className="px-5 py-3">
          <div className="mb-2.5 text-[length:var(--text-settings-header)] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('settings.theme')}
          </div>
          <div className="flex gap-2">
            {LAYOUT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateSetting('cardLayout', opt.value)}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1.5 rounded-xl border-[1.5px] px-2 py-2.5 transition-all',
                  settings.cardLayout === opt.value
                    ? 'border-primary bg-accent'
                    : 'border-border bg-background hover:border-border-strong hover:bg-muted',
                )}
              >
                <LayoutMiniIcon layout={opt.value} active={settings.cardLayout === opt.value} />
                <span className="text-[length:var(--text-caption)] font-semibold">{t(opt.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Language Section */}
        <div className="px-5 py-3">
          <div className="mb-2.5 text-[length:var(--text-settings-header)] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('settings.language')}
          </div>
          <div className="flex gap-2">
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateSetting('language', opt.value)}
                className={cn(
                  'flex-1 rounded-lg border-[1.5px] px-3 py-2 text-[length:var(--text-button)] font-semibold transition-all',
                  lang === opt.value
                    ? 'border-primary bg-accent text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-border-strong',
                )}
              >
                {t(opt.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Font Size Section */}
        <div className="px-5 py-3">
          <div className="mb-2.5 text-[length:var(--text-settings-header)] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('settings.font')}
          </div>
          <div className="flex gap-2">
            {FONT_SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateSetting('fontSize', opt.value)}
                className={cn(
                  'flex-1 rounded-lg border-[1.5px] px-3 py-2 text-[length:var(--text-button)] font-semibold transition-all',
                  settings.fontSize === opt.value
                    ? 'border-primary bg-accent text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-border-strong',
                )}
              >
                {t(opt.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Code Block Theme Section */}
        <div className="px-5 py-3">
          <div className="mb-2.5 text-[length:var(--text-settings-header)] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('settings.code')}
          </div>
          <div className="flex gap-2">
            {CODE_THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateSetting('codeTheme', opt.value)}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1.5 rounded-xl border-[1.5px] px-2 py-2.5 transition-all',
                  settings.codeTheme === opt.value
                    ? 'border-primary bg-accent'
                    : 'border-border bg-background hover:border-border-strong hover:bg-muted',
                )}
              >
                <CodeThemeMiniIcon theme={opt.value} active={settings.codeTheme === opt.value} />
                <span className="text-[length:var(--text-caption)] font-semibold">{t(opt.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Syntax Theme Section */}
        <div className="px-5 py-3">
          <div className="mb-2.5 text-[length:var(--text-settings-header)] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('settings.syntax')}
          </div>
          <div className="flex gap-2">
            {SYNTAX_THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateSetting('syntaxTheme', opt.value)}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1.5 rounded-xl border-[1.5px] px-2 py-2.5 transition-all',
                  settings.syntaxTheme === opt.value
                    ? 'border-primary bg-accent'
                    : 'border-border bg-background hover:border-border-strong hover:bg-muted',
                )}
              >
                <SyntaxThemeMiniIcon theme={opt.value} active={settings.syntaxTheme === opt.value} />
                <span className="text-[length:var(--text-caption)] font-semibold">{t(opt.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* Mini wireframe icons for each layout option */
function LayoutMiniIcon({ layout, active }: { layout: CardLayout; active: boolean }) {
  const barColor = active ? 'bg-primary' : 'bg-muted-foreground/30'
  const dotColor = active ? 'bg-primary' : 'bg-muted-foreground/30'

  if (layout === 'editorial') {
    return (
      <div className="flex h-7 w-9 items-stretch overflow-hidden rounded">
        <div className={cn('w-[3px] shrink-0 rounded-l', barColor)} />
        <div className="flex flex-1 flex-col justify-center gap-1 pl-1.5 pr-1">
          <div className={cn('h-[3px] w-full rounded-full', barColor)} />
          <div className={cn('h-[2px] w-3/4 rounded-full', barColor, 'opacity-50')} />
        </div>
      </div>
    )
  }

  if (layout === 'timeline') {
    return (
      <div className="flex h-7 w-9 items-center gap-1 rounded px-1">
        <div className={cn('h-2.5 w-2.5 shrink-0 rounded-full border-2', active ? 'border-primary' : 'border-muted-foreground/30')} />
        <div className="flex flex-1 flex-col justify-center gap-1">
          <div className={cn('h-[3px] w-full rounded-full', barColor)} />
          <div className={cn('h-[2px] w-3/4 rounded-full', barColor, 'opacity-50')} />
        </div>
      </div>
    )
  }

  // floating
  return (
    <div className="flex h-7 w-9 items-center gap-1.5 rounded px-1">
      <div className={cn('h-3 w-3 shrink-0 rounded', dotColor)} />
      <div className="flex flex-1 flex-col justify-center gap-1">
        <div className={cn('h-[3px] w-full rounded-full', barColor)} />
        <div className={cn('h-[2px] w-3/4 rounded-full', barColor, 'opacity-50')} />
      </div>
    </div>
  )
}

/* Mini wireframe icons for each code block theme.
   Each depicts: (top filename treatment) + (3 code lines) so the distinct
   chrome of each theme reads at a glance. */
function CodeThemeMiniIcon({ theme, active }: { theme: CodeTheme; active: boolean }) {
  const lineColor = active ? 'bg-primary' : 'bg-muted-foreground/30'
  const captionColor = active ? 'bg-primary' : 'bg-muted-foreground/40'

  if (theme === 'floating') {
    // Detached caption above + borderless tinted block
    return (
      <div className="flex h-7 w-9 flex-col gap-1">
        <div className={cn('h-[2px] w-2 rounded-full', captionColor)} />
        <div className={cn('flex flex-1 flex-col justify-center gap-[3px] rounded px-1', active ? 'bg-primary/15' : 'bg-muted-foreground/15')}>
          <div className={cn('h-[2px] w-full rounded-full', lineColor)} />
          <div className={cn('h-[2px] w-3/4 rounded-full', lineColor, 'opacity-60')} />
        </div>
      </div>
    )
  }

  // rail — caption above + left accent rail
  return (
    <div className="flex h-7 w-9 flex-col gap-1">
      <div className={cn('h-[2px] w-2 rounded-full', captionColor)} />
      <div className="flex flex-1 items-stretch">
        <div className={cn('w-[2px] shrink-0', active ? 'bg-primary' : 'bg-muted-foreground/50')} />
        <div className={cn('flex flex-1 flex-col justify-center gap-[3px] rounded-r pl-1.5 pr-1', active ? 'bg-primary/10' : 'bg-muted-foreground/10')}>
          <div className={cn('h-[2px] w-full rounded-full', lineColor)} />
          <div className={cn('h-[2px] w-3/4 rounded-full', lineColor, 'opacity-60')} />
        </div>
      </div>
    </div>
  )
}

/* Mini palette swatches for each syntax theme. Each card shows three
   dots in the theme's signature keyword/fn/string colors so the user
   can preview the feel before selecting. Tokens defined in globals.css
   (--syntax-preview-{theme}-{slot}); not reused anywhere else. */
function SyntaxThemeMiniIcon({ theme, active }: { theme: SyntaxTheme; active: boolean }) {
  const slots: Record<SyntaxTheme, readonly [string, string, string]> = {
    atom: [
      'bg-[var(--syntax-preview-atom-keyword)]',
      'bg-[var(--syntax-preview-atom-fn)]',
      'bg-[var(--syntax-preview-atom-str)]',
    ],
    github: [
      'bg-[var(--syntax-preview-github-keyword)]',
      'bg-[var(--syntax-preview-github-fn)]',
      'bg-[var(--syntax-preview-github-str)]',
    ],
    vitesse: [
      'bg-[var(--syntax-preview-vitesse-keyword)]',
      'bg-[var(--syntax-preview-vitesse-fn)]',
      'bg-[var(--syntax-preview-vitesse-str)]',
    ],
  }
  const [keyword, fn, str] = slots[theme]
  return (
    <div className={cn('flex h-7 w-9 items-center justify-center gap-[3px] rounded', active ? 'opacity-100' : 'opacity-80')}>
      <span className={cn('h-2.5 w-2.5 rounded-full', keyword)} />
      <span className={cn('h-2.5 w-2.5 rounded-full', fn)} />
      <span className={cn('h-2.5 w-2.5 rounded-full', str)} />
    </div>
  )
}
