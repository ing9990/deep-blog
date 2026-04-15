import { describe, it, expect } from 'vitest'
import { tmpdir } from 'node:os'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import path from 'node:path'
import { toSearchDoc } from '../scripts/generate-search-index'

async function writeTempFile(
  content: string,
  name = 'sample.mdx',
): Promise<{ path: string; cleanup: () => Promise<void> }> {
  const dir = await mkdtemp(path.join(tmpdir(), 'search-index-test-'))
  const filePath = path.join(dir, name)
  await writeFile(filePath, content)
  return {
    path: filePath,
    cleanup: async () => {
      await rm(dir, { recursive: true, force: true })
    },
  }
}

describe('toSearchDoc', () => {
  it('builds a SearchDoc from a minimal valid MDX file', async () => {
    const content = `---
title: "Hello World"
slug: "hello-world"
date: 2026-04-15
tags: ["Backend", "Database"]
keywords: ["B-Tree", "Index"]
summary: "짧은 요약입니다."
---

본문 내용입니다.`
    const { path: filePath, cleanup } = await writeTempFile(content)
    try {
      const doc = await toSearchDoc(filePath)
      expect(doc).not.toBeNull()
      expect(doc!.slug).toBe('hello-world')
      expect(doc!.title).toBe('Hello World')
      expect(doc!.summary).toBe('짧은 요약입니다.')
      expect(doc!.body).toBe('본문 내용입니다.')
    } finally {
      await cleanup()
    }
  })

  it('joins tags array into space-delimited string', async () => {
    const content = `---
title: "T"
slug: "t"
date: 2026-04-15
tags: ["Backend", "Database", "Kafka"]
keywords: ["k1"]
summary: "aaaaaaaaaaaa"
---

body`
    const { path: filePath, cleanup } = await writeTempFile(content)
    try {
      const doc = await toSearchDoc(filePath)
      expect(doc!.tags).toBe('Backend Database Kafka')
    } finally {
      await cleanup()
    }
  })

  it('joins keywords array into space-delimited string', async () => {
    const content = `---
title: "T"
slug: "t"
date: 2026-04-15
tags: ["x"]
keywords: ["B-Tree", "Hash Index"]
summary: "aaaaaaaaaaaa"
---

body`
    const { path: filePath, cleanup } = await writeTempFile(content)
    try {
      const doc = await toSearchDoc(filePath)
      expect(doc!.keywords).toBe('B-Tree Hash Index')
    } finally {
      await cleanup()
    }
  })

  it('returns null for drafts', async () => {
    const content = `---
title: "Draft"
slug: "draft"
date: 2026-04-15
tags: ["x"]
keywords: ["k"]
summary: "aaaaaaaaaaaa"
draft: true
---

body`
    const { path: filePath, cleanup } = await writeTempFile(content)
    try {
      const doc = await toSearchDoc(filePath)
      expect(doc).toBeNull()
    } finally {
      await cleanup()
    }
  })

  it('strips code blocks from body', async () => {
    const content = `---
title: "T"
slug: "t"
date: 2026-04-15
tags: ["x"]
keywords: ["k"]
summary: "aaaaaaaaaaaa"
---

설명
\`\`\`python
print("hello")
\`\`\`
뒤에`
    const { path: filePath, cleanup } = await writeTempFile(content)
    try {
      const doc = await toSearchDoc(filePath)
      expect(doc!.body).toBe('설명 뒤에')
    } finally {
      await cleanup()
    }
  })

  it('strips JSX components from body', async () => {
    const content = `---
title: "T"
slug: "t"
date: 2026-04-15
tags: ["x"]
keywords: ["k"]
summary: "aaaaaaaaaaaa"
---

앞 <Callout type="info">안</Callout> 뒤`
    const { path: filePath, cleanup } = await writeTempFile(content)
    try {
      const doc = await toSearchDoc(filePath)
      expect(doc!.body).toBe('앞 안 뒤')
    } finally {
      await cleanup()
    }
  })
})
