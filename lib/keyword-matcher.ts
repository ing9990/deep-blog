export interface Match {
  start: number
  end: number
  keyword: string
  slug: string
}

const HANGUL = /[\uAC00-\uD7A3]/
const LATIN_BOUNDARY = /[A-Za-z0-9_]/

export function hasBoundary(
  text: string,
  keyword: string,
  start: number,
): boolean {
  const end = start + keyword.length
  const prev = start > 0 ? text[start - 1] : ''
  const next = end < text.length ? text[end] : ''

  const firstChar = keyword[0]
  const lastChar = keyword[keyword.length - 1]

  const prevOk =
    LATIN_BOUNDARY.test(firstChar) ? !LATIN_BOUNDARY.test(prev) :
    HANGUL.test(firstChar)         ? !HANGUL.test(prev) :
    true

  const nextOk =
    LATIN_BOUNDARY.test(lastChar) ? !LATIN_BOUNDARY.test(next) :
    HANGUL.test(lastChar)         ? true :  // Relaxed for Korean particles
    true

  return prevOk && nextOk
}

export function findMatches(
  text: string,
  keywordsByLength: readonly string[],
  keywordToSlug: ReadonlyMap<string, string>,
  excludeSlug: string,
): Match[] {
  const matches: Match[] = []
  const claimed = new Array<boolean>(text.length).fill(false)
  const haystack = text.toLowerCase()

  for (const keyword of keywordsByLength) {
    if (keyword.length === 0) continue  // guard: empty keyword would loop forever in indexOf
    const slug = keywordToSlug.get(keyword)
    if (!slug || slug === excludeSlug) continue

    const needle = keyword.toLowerCase()
    let searchFrom = 0

    while (true) {
      const idx = haystack.indexOf(needle, searchFrom)
      if (idx === -1) break

      const end = idx + keyword.length

      let overlap = false
      for (let i = idx; i < end; i++) {
        if (claimed[i]) {
          overlap = true
          break
        }
      }
      if (overlap) {
        searchFrom = idx + 1
        continue
      }

      if (!hasBoundary(text, keyword, idx)) {
        searchFrom = idx + 1
        continue
      }

      matches.push({
        start: idx,
        end,
        keyword: text.slice(idx, end),
        slug,
      })
      for (let i = idx; i < end; i++) claimed[i] = true
      searchFrom = end
    }
  }

  return matches.sort((a, b) => a.start - b.start)
}
