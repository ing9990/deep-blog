import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  Boxes,
  Code2,
  Cpu,
  Database,
  GitFork,
  Lightbulb,
  Sparkles,
} from 'lucide-react'
import type { CategoryId } from './categories'

export const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  'computer-science': Cpu,
  'data-structure': GitFork,
  language: Code2,
  database: Database,
  frameworks: Boxes,
  library: BookOpen,
  knowledge: Lightbulb,
  etc: Sparkles,
}
