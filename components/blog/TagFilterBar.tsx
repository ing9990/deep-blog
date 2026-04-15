'use client'

import { TagChip } from './TagChip'

interface TagFilterBarProps {
  allTags: Array<{ tag: string; count: number }>
  selected?: string
  onToggle: (tag: string | undefined) => void
}

export function TagFilterBar({ allTags, selected, onToggle }: TagFilterBarProps) {
  function toggle(tag?: string) {
    onToggle(selected === tag ? undefined : tag)
  }

  return (
    <div className="mt-8 flex flex-wrap gap-2">
      <TagChip label="All" active={!selected} onClick={() => toggle(undefined)} />
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
