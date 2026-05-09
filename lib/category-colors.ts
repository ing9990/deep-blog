import type { CategoryId } from './categories'

/**
 * 카테고리별 텍스트/아이콘 컬러 클래스. 본문/카드/배경에는 적용하지 않고
 * 카테고리 라벨과 그 옆 아이콘에만 사용한다. 라이트/다크 모드 두 클래스를 묶어 반환.
 *
 * 컬러가 정의되지 않은 카테고리는 빈 문자열이라 기존 색(`text-muted-foreground` 등)이
 * 그대로 적용된다.
 */
export const CATEGORY_COLORS: Partial<Record<CategoryId, string>> = {
  'spring-boot': 'text-emerald-600 dark:text-emerald-400',
  redis: 'text-red-600 dark:text-red-400',
  'mini-coupang': 'text-orange-500 dark:text-orange-400',
  knowledge: 'text-yellow-500 dark:text-yellow-300',
  books: 'text-violet-600 dark:text-violet-400',
  database: 'text-sky-600 dark:text-sky-400',
  kafka: 'text-cyan-600 dark:text-cyan-400',
  kubernetes: 'text-blue-600 dark:text-blue-400',
  infrastructure: 'text-slate-500 dark:text-slate-400',
  'computer-science': 'text-fuchsia-600 dark:text-fuchsia-400',
}

export function getCategoryColor(id: CategoryId): string {
  return CATEGORY_COLORS[id] ?? ''
}
