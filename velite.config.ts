import { defineConfig, defineCollection, s } from 'velite'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import { transformerNotationHighlight } from '@shikijs/transformers'
import { calculateReadingTime } from './lib/reading-time'
import remarkAutoLink from './plugins/remark-auto-link'
import { KEYWORD_MAP, KEYWORDS_BY_LENGTH } from './lib/generated/keyword-map'

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
  title: s.string().min(1).max(120),
  slug: s.string().min(3).max(200).regex(slugRegex, 'slug must be lowercase (a-z, 0-9, hyphens only)'),
  date: s.isodate(),
  updatedAt: s.isodate().optional(),
  tags: s.array(s.string().min(1)).min(1).max(5),
  keywords: s.array(s.string().min(1)).min(1),
  summary: s.string().min(10).max(300),
  series: s.string().optional(),
  seriesOrder: s.number().int().positive().optional(),
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
    ],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypePrettyCode,
        {
          theme: { light: 'github-light', dark: 'github-dark' },
          keepBackground: false,
          defaultLang: 'plaintext',
          transformers: [transformerNotationHighlight()],
        },
      ],
    ],
  },
})
