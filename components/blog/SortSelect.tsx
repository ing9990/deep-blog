'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SortKey } from '@/lib/filters'
import { useTranslation } from '@/lib/i18n/useTranslation'
import type { MessageKey } from '@/lib/i18n/messages'

interface SortSelectProps {
  value: SortKey
  onChange: (next: SortKey) => void
}

const LABEL_KEYS: Record<SortKey, MessageKey> = {
  latest: 'sort.latest',
  oldest: 'sort.oldest',
  title:  'sort.title',
}

const isSortKey = (s: string): s is SortKey => s in LABEL_KEYS

export function SortSelect({ value, onChange }: SortSelectProps) {
  const { t } = useTranslation()
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (isSortKey(next)) onChange(next)
      }}
    >
      <SelectTrigger className="h-9 w-[120px] text-[length:var(--text-button)]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(LABEL_KEYS) as SortKey[]).map((key) => (
          <SelectItem key={key} value={key}>
            {t(LABEL_KEYS[key])}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
