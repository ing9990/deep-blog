import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  BookOpen,
  Boxes,
  Cpu,
  Database,
  Leaf,
  Lightbulb,
  Package,
  Server,
  Ship,
} from 'lucide-react'
import type { CategoryId } from './categories'

export const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  books: BookOpen,
  'mini-coupang': Package,
  'spring-boot': Leaf,
  database: Database,
  redis: Boxes,
  kafka: Activity,
  kubernetes: Ship,
  infrastructure: Server,
  knowledge: Lightbulb,
  'computer-science': Cpu,
}
