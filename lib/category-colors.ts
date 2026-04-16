import type { CategoryId } from './categories'

export interface CategoryColor {
  accent: string
  tint: string
  darkTint: string
}

export const CATEGORY_COLORS: Record<CategoryId, CategoryColor> = {
  'computer-science': { accent: '#7C3AED', tint: '#F5F3FF', darkTint: '#1E1147' },
  language:           { accent: '#2563EB', tint: '#EFF6FF', darkTint: '#0F1E3D' },
  database:           { accent: '#059669', tint: '#ECFDF5', darkTint: '#042F1F' },
  frameworks:         { accent: '#0891B2', tint: '#ECFEFF', darkTint: '#0C2D3D' },
  library:            { accent: '#DC2626', tint: '#FEF2F2', darkTint: '#2B0A0A' },
  knowledge:          { accent: '#D97706', tint: '#FFFBEB', darkTint: '#3B2D05' },
  etc:                { accent: '#DB2777', tint: '#FDF2F8', darkTint: '#2B0A1A' },
}
