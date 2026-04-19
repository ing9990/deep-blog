import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const POSTS_DIR = 'content/posts'

type Violation = {
  file: string
  line: number
  count: number
  preview: string
}

const violations: Violation[] = []
const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'))

function stripNonBody(line: string): string {
  let s = line.replace(/`[^`]*`/g, '')
  s = s.replace(/\[[^\]]*\]\([^)]*\)/g, '')
  s = s.replace(/<[^<>\s]+>/g, '')
  return s
}

// Count unescaped tildes that would pair (exclude `~~` pairs as they are
// explicit strikethrough and don't create cross-paragraph pairing).
function countPairingTildes(text: string): number {
  const collapsed = text.replace(/~~/g, '')
  let count = 0
  for (let i = 0; i < collapsed.length; i++) {
    if (collapsed[i] !== '~') continue
    if (i > 0 && collapsed[i - 1] === '\\') continue
    count++
  }
  return count
}

// For a table row line, count tildes per cell and take the maximum.
// Cells are pipe-separated; tildes in different cells don't pair.
function maxTildesPerCell(line: string): number {
  if (!line.includes('|')) return countPairingTildes(stripNonBody(line))
  const cells = line.split('|')
  let max = 0
  for (const cell of cells) {
    const count = countPairingTildes(stripNonBody(cell))
    if (count > max) max = count
  }
  return max
}

for (const file of files) {
  const path = join(POSTS_DIR, file)
  const rawLines = readFileSync(path, 'utf8').split('\n')

  let inFence = false
  let frontmatterDelimCount = 0
  let inFrontmatter = false

  rawLines.forEach((raw, idx) => {
    const line = raw

    if (line.trimStart().startsWith('---')) {
      frontmatterDelimCount++
      inFrontmatter = frontmatterDelimCount < 2
      if (frontmatterDelimCount <= 2) return
    }
    if (inFrontmatter) return

    if (line.trimStart().startsWith('```')) {
      inFence = !inFence
      return
    }
    if (inFence) return

    const count = maxTildesPerCell(line)
    if (count >= 2) {
      violations.push({
        file: path,
        line: idx + 1,
        count,
        preview: line.trim().slice(0, 160),
      })
    }
  })
}

if (violations.length > 0) {
  console.error(`\n✗ MDX tilde guard: ${violations.length} line(s) with 2+ unescaped tildes\n`)
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.count} tildes]  ${v.preview}`)
  }
  console.error(
    '\nRule: avoid 2+ unescaped `~` characters on the same line or table cell.' +
      '\n      remark-gfm pairs single tildes as strikethrough (`<del>`),' +
      '\n      so `0~100 ... 60~70` renders as "0<del>100 ... 60</del>70".' +
      '\n' +
      '\nFixes:' +
      '\n  - Numeric range:  `0~100`  →  `0에서 100` or `0–100` (en-dash, U+2013)' +
      '\n  - Korean range:   `수백~수천`  →  `수백에서 수천` or `수백부터 수천`' +
      '\n  - Step reference: `1~4`  →  `1번부터 4번까지`' +
      '\n  - If literally needed (e.g. in a code example), wrap in `` `backticks` ``.\n',
  )
  process.exit(1)
}

console.log(`✓ MDX tilde guard clean (${files.length} file(s)).`)
