import type { CSSProperties } from 'react'
import type { CategoryId } from './categories'

export interface CategoryColor {
  accent: string
  tint: string
  darkTint: string
}

export const CATEGORY_COLORS: Record<CategoryId, CategoryColor> = {
  'computer-science': { accent: '#7C3AED', tint: '#F5F3FF', darkTint: '#1E1147' },
  'language-backend': { accent: '#2563EB', tint: '#EFF6FF', darkTint: '#0F1E3D' },
  database:           { accent: '#059669', tint: '#ECFDF5', darkTint: '#042F1F' },
  infrastructure:     { accent: '#DC2626', tint: '#FEF2F2', darkTint: '#2B0A0A' },
  knowledge:          { accent: '#A3E635', tint: '#F7FEE7', darkTint: '#1F2D05' },
  'mini-coupang-backend': { accent: '#F97316', tint: '#FFF7ED', darkTint: '#3D1E05' },
  etc:                { accent: '#DB2777', tint: '#FDF2F8', darkTint: '#2B0A1A' },
}

/** 카테고리 컬러를 CSS custom properties로 주입하는 인라인 스타일 반환. */
export function categoryStyle(id: CategoryId): CSSProperties {
  const c = CATEGORY_COLORS[id]
  return {
    '--cat-accent': c.accent,
    '--cat-tint': c.tint,
    '--cat-dark-tint': c.darkTint,
  } as CSSProperties
}
