import type { LucideIcon } from 'lucide-react'
import {
  Code2,
  Cpu,
  Database,
  Lightbulb,
  Package,
  Server,
  Sparkles,
} from 'lucide-react'
import type { CategoryId } from './categories'

export const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  'computer-science': Cpu,
  'language-backend': Code2,
  database: Database,
  infrastructure: Server,
  knowledge: Lightbulb,
  'mini-coupang-backend': Package,
  etc: Sparkles,
}
