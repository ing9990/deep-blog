'use client'

import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { buildPostsUrl } from '@/lib/utils'
import type { SortKey } from '@/lib/filters'

interface SortSelectProps {
  value: SortKey
  currentTag?: string
  currentQuery?: string
}

const LABELS: Record<SortKey, string> = {
  latest: '최신순',
  oldest: '오래된순',
  title: '제목순',
}

const isSortKey = (s: string): s is SortKey => s in LABELS

export function SortSelect({ value, currentTag, currentQuery }: SortSelectProps) {
  const router = useRouter()

  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (!isSortKey(next)) return
        router.push(
          buildPostsUrl({
            tag: currentTag,
            query: currentQuery,
            sort: next,
          }),
          { scroll: false },
        )
      }}
    >
      <SelectTrigger className="h-9 w-[120px] text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(LABELS) as SortKey[]).map((key) => (
          <SelectItem key={key} value={key}>
            {LABELS[key]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
