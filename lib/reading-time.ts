/**
 * 한국어 기준 분당 500자. 마크다운 문법과 코드 블록을 제거한 후 글자 수를 세어 분 단위로 반환.
 */
export function calculateReadingTime(content: string): number {
  const plain = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_\[\]()!>]/g, '')
    .replace(/\s+/g, '')
  const chars = plain.length
  return Math.max(1, Math.ceil(chars / 500))
}
