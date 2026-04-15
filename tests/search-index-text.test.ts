import { describe, it, expect } from 'vitest'
import { extractPlainText } from '@/lib/search-index'

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
    const input = '평균 $O(n \\log n)$ 이며\n\n$$T(n) = 2T(n/2) + O(n)$$\n\n최악 $O(n^2)$'
    expect(extractPlainText(input)).toBe('평균 이며 최악')
  })

  it('removes image markdown', () => {
    const input = '앞 ![alt text](/img.png) 뒤'
    expect(extractPlainText(input)).toBe('앞 뒤')
  })

  it('preserves link anchor text but drops URLs', () => {
    const input = '[B-Tree 글](/posts/b-tree-structure)을 참고'
    expect(extractPlainText(input)).toBe('B-Tree 글을 참고')
  })

  it('strips markdown emphasis/heading markers', () => {
    const input = '## 제목\n\n**굵게** _기울임_ ~취소선~'
    expect(extractPlainText(input)).toBe('제목 굵게 기울임 취소선')
  })

  it('collapses whitespace runs to single spaces', () => {
    const input = 'a   b\n\n\nc\t\td'
    expect(extractPlainText(input)).toBe('a b c d')
  })

  it('returns empty string for empty input', () => {
    expect(extractPlainText('')).toBe('')
  })
})
