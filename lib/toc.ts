// lib/toc.ts

export interface VeliteTocEntry {
  title: string
  url: string
  items: VeliteTocEntry[]
}

export interface FlatTocItem {
  title: string
  slug: string
  depth: 2 | 3
}

export function flattenToc(entries: VeliteTocEntry[]): FlatTocItem[] {
  const out: FlatTocItem[] = []
  for (const h2 of entries) {
    out.push({ title: h2.title, slug: stripHash(h2.url), depth: 2 })
    for (const h3 of h2.items) {
      out.push({ title: h3.title, slug: stripHash(h3.url), depth: 3 })
    }
  }
  return out
}

function stripHash(url: string): string {
  return url.replace(/^#/, '')
}
