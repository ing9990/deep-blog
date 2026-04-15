// components/visualizations/common/colors.ts

/**
 * Single source of truth for visualization state names.
 *
 * Adding a new state requires 4 coordinated edits:
 *   1. app/globals.css :root — add --viz-<state>-{border,bg,fg}
 *   2. app/globals.css [data-theme="dark"] — add the same 3 variables
 *   3. app/globals.css @theme inline — add --color-viz-<state>{,-bg,-fg}
 *   4. This file — append to VIZ_STATES below
 *
 * Extension guide:
 *   docs/superpowers/specs/2026-04-15-phase-4-visualization-framework.md §6.6
 */
export const VIZ_STATES = [
  'pivot',
  'comparing',
  'confirmed',
  'blocked',
  'waiting',
  'highlight',
] as const

export type VizState = (typeof VIZ_STATES)[number]

/**
 * Returns the Tailwind utility class triple (border + bg + fg) for a state.
 * Uses literal template strings so Tailwind's content scanner picks them up.
 */
export function vizStateClasses(state: VizState): string {
  switch (state) {
    case 'pivot':
      return 'border-viz-pivot bg-viz-pivot-bg text-viz-pivot-fg'
    case 'comparing':
      return 'border-viz-comparing bg-viz-comparing-bg text-viz-comparing-fg'
    case 'confirmed':
      return 'border-viz-confirmed bg-viz-confirmed-bg text-viz-confirmed-fg'
    case 'blocked':
      return 'border-viz-blocked bg-viz-blocked-bg text-viz-blocked-fg'
    case 'waiting':
      return 'border-viz-waiting bg-viz-waiting-bg text-viz-waiting-fg'
    case 'highlight':
      return 'border-viz-highlight bg-viz-highlight-bg text-viz-highlight-fg'
  }
}
