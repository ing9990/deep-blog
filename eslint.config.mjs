import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'eslint/config'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// eslint-config-next@15 ships only the legacy eslintrc format, so it loads
// through FlatCompat until the Next 16 upgrade exposes flat entry points.
const compat = new FlatCompat({ baseDirectory: __dirname })

export default defineConfig([
  {
    // `next lint` only covered app/components/lib by default; `eslint .`
    // walks everything, so generated/external trees are excluded explicitly.
    ignores: [
      '.next/**',
      '.velite/**',
      '.worktrees/**',
      'mini-coupang/**',
      'lib/generated/**',
      'public/**',
      'next-env.d.ts',
    ],
  },
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/(?:^|[\\s'\"`])text-\\[(?!length:var\\()/]",
          message:
            'Typography arbitrary 값 금지. --text-* 토큰 사용: text-[length:var(--text-body)] 등. (docs/design-tokens.md)',
        },
        {
          selector: "Literal[value=/(?:^|[\\s'\"`])(?:leading|tracking)-\\[(?!var\\()/]",
          message:
            'leading/tracking arbitrary 값 금지. --leading-* / --tracking-* 토큰 사용: leading-[var(--leading-normal)], tracking-[var(--tracking-tight)] 등.',
        },
        {
          selector: "Literal[value=/(?:^|[\\s'\"`])z-\\[(?!var\\()/]",
          message: 'z-index arbitrary 값 금지. --z-* 토큰 사용: z-[var(--z-header)] 등.',
        },
        {
          selector: "Literal[value=/(?:^|[\\s'\"`])z-(10|20|30|40|50|60|70|80|90|100)\\b/]",
          message: 'z-index Tailwind 숫자 유틸 금지 (PR2 이후). --z-* 토큰 사용: z-[var(--z-header)] 등.',
        },
        {
          selector: "Literal[value=/(?:^|[\\s'\"`])rounded-\\[[0-9]/]",
          message:
            'radius arbitrary 값 금지. --radius-chip/card/panel/overlay 사용: rounded-[var(--radius-card)] 등. Tailwind 기본(rounded-md/lg/xl)은 허용.',
        },
        {
          selector:
            "Literal[value=/(?:^|[\\s'\"`])(?:bg|text|border|ring|fill|stroke|decoration|outline)-\\[#[0-9a-fA-F]/]",
          message:
            'Hex color arbitrary 값 금지. shadcn semantic (bg-background 등) 또는 --callout-*/--viz-*/--keyword 등 사용.',
        },
        {
          selector: "Literal[value=/shadow-\\[0[_\\s].*rgba?\\(/]",
          message:
            'rgba shadow arbitrary 값 금지. --shadow-card/card-hover/fab 사용: shadow-[var(--shadow-card)] 등.',
        },
      ],
    },
  },
  {
    files: ['components/visualizations/**/*.tsx'],
    ignores: ['components/visualizations/common/**/*.tsx'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    // tests build element-like objects with children-in-props on purpose:
    // that is the exact shape the MDX runtime hands to extractTabs.
    files: ['tests/**/*.ts'],
    rules: {
      'react/no-children-prop': 'off',
    },
  },
])
