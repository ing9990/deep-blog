import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  Boxes,
  Code2,
  Cpu,
  Database,
  Sparkles,
} from 'lucide-react'
import type { CategoryId } from './categories'

export const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  'computer-science': Cpu,
  language: Code2,
  database: Database,
  frameworks: Boxes,
  library: BookOpen,
  etc: Sparkles,
}
