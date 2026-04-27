#!/usr/bin/env tsx
/**
 * Body-text의 "..." 인용을 <E>...</E>로 일괄 변환.
 *
 * 회피 대상:
 * - frontmatter (앞부분 --- ... ---)
 * - fenced code block (```)
 * - inline code (`...`)
 * - JSX attribute (= 직후의 ")
 *
 * 사용:
 *   pnpm tsx scripts/convert-quotes-to-e.ts content/posts/foo.mdx [bar.mdx ...]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { argv, exit } from 'node:process'

const PH_OPEN = ''
const PH_CLOSE = ''

function maskInlineCode(line: string): { masked: string; spans: string[] } {
  const spans: string[] = []
  const masked = line.replace(/`[^`\n]*`/g, (m) => {
    spans.push(m)
    return `${PH_OPEN}${spans.length - 1}${PH_CLOSE}`
  })
  return { masked, spans }
}

function restoreInlineCode(line: string, spans: string[]): string {
  return line.replace(
    new RegExp(`${PH_OPEN}(\\d+)${PH_CLOSE}`, 'g'),
    (_, idx) => spans[Number(idx)],
  )
}

function convertLine(line: string): { line: string; count: number } {
  const { masked, spans } = maskInlineCode(line)
  let count = 0

  const converted = masked.replace(/"([^"\n]+)"/g, (full, inner, offset) => {
    const prev = offset > 0 ? masked[offset - 1] : ''
    if (prev === '=') return full
    count += 1
    return `<E>${inner}</E>`
  })

  return { line: restoreInlineCode(converted, spans), count }
}

function convertFile(path: string): number {
  const content = readFileSync(path, 'utf-8')
  const lines = content.split('\n')

  let inFrontmatter = false
  let inCodeBlock = false
  let totalCount = 0
  const out: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (i === 0 && trimmed === '---') {
      inFrontmatter = true
      out.push(line)
      continue
    }
    if (inFrontmatter) {
      if (trimmed === '---') inFrontmatter = false
      out.push(line)
      continue
    }

    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      out.push(line)
      continue
    }
    if (inCodeBlock) {
      out.push(line)
      continue
    }

    const { line: converted, count } = convertLine(line)
    totalCount += count
    out.push(converted)
  }

  if (totalCount > 0) {
    writeFileSync(path, out.join('\n'))
  }
  return totalCount
}

const files = argv.slice(2)
if (files.length === 0) {
  console.error('사용법: pnpm tsx scripts/convert-quotes-to-e.ts <file.mdx> [...]')
  exit(1)
}

let grandTotal = 0
for (const f of files) {
  const n = convertFile(f)
  grandTotal += n
  console.log(`${f}: ${n}개 변환`)
}
console.log(`\n총 ${grandTotal}개 변환 (${files.length}개 파일)`)
