// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { Document } from 'flexsearch'
import {
  SEARCH_INDEX_CONFIG,
  loadAndBuildIndex,
  type SearchDoc,
  type SerializedIndex,
  type StorageLike,
} from '@/lib/search-index'

function makeInMemoryStorage(): StorageLike {
  const store = new Map<string, string>()
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
  }
}

async function exportIndex(docs: SearchDoc[]): Promise<SerializedIndex> {
  const index = new Document<SearchDoc>(SEARCH_INDEX_CONFIG)
  for (const doc of docs) index.add(doc)
  const exported: SerializedIndex = {}
  await index.export((key, data) => {
    exported[String(key)] = data as unknown as string
  })
  return exported
}

const SAMPLE_DOCS: SearchDoc[] = [
  {
    slug: 'quick-sort',
    title: 'Quick Sort 완전 정복',
    summary: '분할 정복 기반 정렬 알고리즘',
    body: '피벗을 기준으로 배열을 분할하는 알고리즘입니다',
    tags: 'Algorithm Sorting',
    keywords: 'QuickSort Pivot Partition',
  },
  {
    slug: 'b-tree-structure',
    title: 'B-Tree 구조와 동작',
    summary: 'B-Tree의 노드 분할과 병합 원리',
    body: '데이터베이스 인덱스에 널리 쓰이는 자료구조',
    tags: 'Database Index',
    keywords: 'B-Tree Node Split',
  },
]

describe('loadAndBuildIndex — roundtrip', () => {
  it('fetches and builds index on first call', async () => {
    const exported = await exportIndex(SAMPLE_DOCS)
    const fetchFn = async (): Promise<Response> =>
      new Response(JSON.stringify(exported), { status: 200 })
    const storage = makeInMemoryStorage()

    const index = await loadAndBuildIndex({ fetchFn, storage })

    const results = index.search('Quick Sort', { limit: 5 })
    expect(results.length).toBeGreaterThan(0)
  })

  it('caches serialized data in storage on first call', async () => {
    const exported = await exportIndex(SAMPLE_DOCS)
    const fetchFn = async (): Promise<Response> =>
      new Response(JSON.stringify(exported), { status: 200 })
    const storage = makeInMemoryStorage()

    await loadAndBuildIndex({ fetchFn, storage })

    const cached = storage.getItem('backend-notes:search-index:v1')
    expect(cached).not.toBeNull()
    const parsed = JSON.parse(cached!)
    expect(Object.keys(parsed).length).toBeGreaterThan(0)
  })

  it('reuses cached data on second call without re-fetching', async () => {
    const exported = await exportIndex(SAMPLE_DOCS)
    let fetchCount = 0
    const fetchFn = async (): Promise<Response> => {
      fetchCount++
      return new Response(JSON.stringify(exported), { status: 200 })
    }
    const storage = makeInMemoryStorage()

    await loadAndBuildIndex({ fetchFn, storage })
    await loadAndBuildIndex({ fetchFn, storage })

    expect(fetchCount).toBe(1)
  })

  it('throws when fetch fails and no cache exists', async () => {
    const fetchFn = async (): Promise<Response> =>
      new Response('not found', { status: 404 })
    const storage = makeInMemoryStorage()

    await expect(loadAndBuildIndex({ fetchFn, storage })).rejects.toThrow(
      /search-index fetch failed: 404/,
    )
  })

  it('index can search body text across documents', async () => {
    const exported = await exportIndex(SAMPLE_DOCS)
    const fetchFn = async (): Promise<Response> =>
      new Response(JSON.stringify(exported), { status: 200 })
    const storage = makeInMemoryStorage()

    const index = await loadAndBuildIndex({ fetchFn, storage })
    const results = index.search('분할')

    const allSlugs = new Set<string>()
    for (const fieldResult of results) {
      for (const slug of fieldResult.result) allSlugs.add(String(slug))
    }
    expect(allSlugs.has('quick-sort')).toBe(true)
  })
})
