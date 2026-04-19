import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const POSTS_DIR = 'content/posts'
const FORBIDDEN = /\*\*["(].*?[")]\*\*/g

type Violation = { file: string; line: number; snippet: string }

const violations: Violation[] = []
const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'))

for (const file of files) {
  const path = join(POSTS_DIR, file)
  const lines = readFileSync(path, 'utf8').split('\n')
  lines.forEach((line, idx) => {
    const matches = line.match(FORBIDDEN)
    if (!matches) return
    for (const m of matches) {
      violations.push({ file: path, line: idx + 1, snippet: m })
    }
  })
}

if (violations.length > 0) {
  console.error(`\n✗ MDX emphasis guard: ${violations.length} violation(s)\n`)
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.snippet}`)
  }
  console.error(
    '\nRule: avoid **"text"** or **(text)** patterns in body.' +
      '\n      Move quotes/parens OUTSIDE emphasis: **"X"** → "**X**".' +
      '\n      Reason: Korean particles (로/은/는/…) attaching to a closing **' +
      '\n      have rendered inconsistently in our Remark/Shiki pipeline.\n',
  )
  process.exit(1)
}

console.log(`✓ MDX emphasis guard clean (${files.length} file(s)).`)
