'use client'

import { TagChip } from './TagChip'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface TagFilterBarProps {
  allTags: Array<{ tag: string; count: number }>
  selected?: string
  onToggle: (tag: string | undefined) => void
}

export function TagFilterBar({ allTags, selected, onToggle }: TagFilterBarProps) {
  const { t } = useTranslation()

  function toggle(tag?: string) {
    onToggle(selected === tag ? undefined : tag)
  }

  return (
    <div className="mt-8 flex flex-wrap gap-2">
      <TagChip label={t('tag.filter.all')} active={!selected} onClick={() => toggle(undefined)} />
      {allTags.map(({ tag, count }) => (
        <TagChip
          key={tag}
          label={tag}
          count={count}
          active={selected === tag}
          onClick={() => toggle(tag)}
        />
      ))}
    </div>
  )
}
