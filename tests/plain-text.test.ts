import { describe, it, expect } from 'vitest'
import { extractPlainText } from '@/lib/plain-text'

describe('extractPlainText', () => {
  it('strips frontmatter block at the start', () => {
    const input = `---\ntitle: Hello\ndate: 2026-04-15\n---\n\n본문입니다.`
    expect(extractPlainText(input)).toBe('본문입니다.')
  })

  it('removes JSX components (capitalized tag names)', () => {
    const input = '텍스트 <Callout type="info">안쪽</Callout> 뒤에 <QuickSort /> 끝'
    expect(extractPlainText(input)).toBe('텍스트 안쪽 뒤에 끝')
  })

  it('removes HTML tags (lowercase tag names)', () => {
    const input = '텍스트 <div>안쪽</div> 끝'
    expect(extractPlainText(input)).toBe('텍스트 안쪽 끝')
  })

  it('removes fenced code blocks entirely', () => {
    const input = '설명\n```python\nprint("hello")\n```\n뒤에'
    expect(extractPlainText(input)).toBe('설명 뒤에')
  })

  it('removes inline code spans', () => {
    const input = 'foo `bar` baz'
    expect(extractPlainText(input)).toBe('foo baz')
  })

  it('removes inline and block KaTeX math', () => {
    const input = '평균 $O(n \\log n)$ 이며 $$T(n) = 2T(n/2)$$ 최악'
    expect(extractPlainText(input)).toBe('평균 이며 최악')
  })

  it('removes markdown images', () => {
    const input = '앞 ![alt](/img.png) 뒤'
    expect(extractPlainText(input)).toBe('앞 뒤')
  })

  it('keeps anchor text from links but drops the href', () => {
    const input = '[B-Tree](/posts/b-tree) 글을 참고'
    expect(extractPlainText(input)).toBe('B-Tree 글을 참고')
  })

  it('removes common markdown punctuation markers', () => {
    const input = '## 제목\n**굵게** _기울임_ ~취소선~'
    expect(extractPlainText(input)).toBe('제목 굵게 기울임 취소선')
  })

  it('collapses whitespace to single spaces and trims', () => {
    const input = '  a\n\n  b   c\td  '
    expect(extractPlainText(input)).toBe('a b c d')
  })

  it('returns empty string for empty input', () => {
    expect(extractPlainText('')).toBe('')
  })
})
