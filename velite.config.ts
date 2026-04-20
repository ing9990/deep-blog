import { defineConfig, defineCollection, s } from 'velite'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import { transformerNotationHighlight } from '@shikijs/transformers'
import { calculateReadingTime } from './lib/reading-time'
import { extractPlainText } from './lib/plain-text'
import remarkAutoLink from './plugins/remark-auto-link'
import rehypeCodeLanguageBadge from './plugins/rehype-code-language-badge'
import { KEYWORD_MAP, KEYWORDS_BY_LENGTH } from './lib/generated/keyword-map'
import { CATEGORY_IDS } from './lib/categories'

// Build keywordToSlug from the generated map (lowercase keys → slug strings)
const keywordToSlug = new Map(
  Array.from(KEYWORD_MAP.entries()).map(([kw, entry]) => [kw, entry.slug]),
)

// Slug regex: lowercase letters, numbers, hyphens only (no uppercase).
// Used in the unit-testable frontmatter schema. The collection schema uses
// s.slug() which additionally deduplicates at Velite build time.
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// Base shape (ZodObject) — used by both the exported schema and the collection.
// Uses a plain regex for slug so the exported schema is unit-testable without
// a Velite build context (s.slug() requires meta.config at parse time).
const postFrontmatterShape = s.object({
  title: s.object({
    ko: s.string().min(1).max(120),
    en: s.string().min(1).max(120),
  }),
  slug: s.string().min(3).max(200).regex(slugRegex, 'slug must be lowercase (a-z, 0-9, hyphens only)'),
  date: s.isodate(),
  updatedAt: s.isodate().optional(),
  tags: s
    .array(
      s
        .string()
        .min(1)
        .regex(/^[^/?#]+$/, 'tag must not contain / ? # (URL-unsafe for /tags/[tag] route)'),
    )
    .min(1)
    .max(5),
  keywords: s.array(s.string().min(1)).min(1),
  summary: s.object({
    ko: s.string().min(10).max(300),
    en: s.string().min(10).max(300),
  }),
  category: s.enum(CATEGORY_IDS),
  series: s.string().optional(),
  seriesOrder: s.number().int().positive().optional(),
  // project-backed 포스트가 참조하는 services/*  도메인 서비스 이름들.
  // Mode C 포스트가 서비스 샌드박스와 양방향 링크를 만들 때 사용.
  // 값: lowercase-kebab-case, 실제 /services/<name>-service/ 디렉토리 이름과 일치.
  relatedServices: s
    .array(
      s
        .string()
        .min(1)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'relatedServices must be lowercase kebab-case (matches services/<name>-service/ directory)'),
    )
    .max(5)
    .optional(),
  draft: s.boolean().default(false),
})

// Frontmatter-only schema — unit-testable without a Velite build.
// No fields that depend on MDX compilation.
export const postFrontmatterSchema = postFrontmatterShape.refine(
  (data) => data.slug === data.slug.toLowerCase(),
  { message: 'slug must be lowercase', path: ['slug'] },
)

// Full collection schema — extends frontmatter with Velite-only fields
// (body compiled from MDX, toc extracted at build time) and a derived url.
// Uses s.slug() for build-time duplicate slug detection.
const posts = defineCollection({
  name: 'Post',
  pattern: 'posts/**/*.mdx',
  schema: postFrontmatterShape
    .extend({
      slug: s.slug('post'),
      body: s.mdx(),
      toc: s.toc(),
      readingTime: s.custom<number>().transform((_, { meta }) =>
        calculateReadingTime(typeof meta.content === 'string' ? meta.content : ''),
      ),
      plainBody: s.custom<string>().transform((_, { meta }) =>
        extractPlainText(typeof meta.content === 'string' ? meta.content : ''),
      ),
    })
    .refine(
      (data) => data.slug === data.slug.toLowerCase(),
      { message: 'slug must be lowercase', path: ['slug'] },
    )
    .transform((data) => ({
      ...data,
      url: `/posts/${data.slug}`,
    })),
})

export default defineConfig({
  root: 'content',
  output: {
    data: '.velite',
    assets: 'public/static',
    base: '/static/',
    clean: true,
  },
  collections: { posts },
  mdx: {
    remarkPlugins: [
      [remarkAutoLink, { keywordsByLength: KEYWORDS_BY_LENGTH, keywordToSlug }],
      remarkMath,
    ],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypePrettyCode,
        {
          theme: {
            'atom-light':    'one-light',
            'atom-dark':     'one-dark-pro',
            'github-light':  'github-light',
            'github-dark':   'github-dark',
            'vitesse-light': 'vitesse-light',
            'vitesse-dark':  'vitesse-dark',
          },
          keepBackground: false,
          defaultLang: 'plaintext',
          transformers: [transformerNotationHighlight()],
        },
      ],
      rehypeCodeLanguageBadge,
      [rehypeKatex, { strict: false, output: 'html' }],
    ],
  },
})
