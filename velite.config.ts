import { defineConfig, defineCollection, s } from 'velite'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import { transformerNotationHighlight } from '@shikijs/transformers'
import { calculateReadingTime } from './lib/reading-time'
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
  // 이 글이 정리하고 있는 책의 slug (content/books/<slug>.mdx).
  // 같은 book 값을 가진 포스트들은 책 상세 페이지에서 한 시리즈로 묶이고,
  // 포스트 본문 상하단에 책 컨텍스트 pill / prev-next 가 자동 렌더된다.
  book: s
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'book must be lowercase kebab-case (matches content/books/<slug>.mdx)')
    .optional(),
  // 같은 book 안에서의 명시적 정렬 순서. 미지정 시 publishedAt 오름차순.
  bookOrder: s.number().int().positive().optional(),
  // 글 헤더(제목과 본문 사이)에 작은 파일 칩으로 노출되는 첨부 자료.
  // 책 카테고리의 BookContextPill과 같은 위치에 렌더된다.
  attachments: s
    .array(
      s.object({
        name: s.string().min(1).max(120),
        href: s.string().min(1),
        size: s.string().optional(),
      }),
    )
    .max(5)
    .optional(),
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

// Books collection — 사용자가 정리한 책 메타데이터.
// 파일 경로: content/books/<slug>.mdx
// 본문(MDX)은 책 전체에 대한 사용자 코멘트로, 책 상세 페이지 상단에 렌더된다.
// 본문 없이 frontmatter만 있어도 유효하다.
const bookFrontmatterShape = s.object({
  title: s.object({
    ko: s.string().min(1).max(120),
    en: s.string().min(1).max(120),
  }),
  slug: s.string().min(2).max(120).regex(slugRegex, 'slug must be lowercase (a-z, 0-9, hyphens only)'),
  author: s.string().min(1).max(120),
  cover: s
    .string()
    .regex(/^\/books\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/, 'cover must be /books/<slug>.<jpg|png|webp>'),
  readDate: s.isodate(),
  summary: s.object({
    ko: s.string().min(1).max(300),
    en: s.string().min(1).max(300),
  }),
  isbn: s.string().optional(),
  draft: s.boolean().default(false),
})

const books = defineCollection({
  name: 'Book',
  pattern: 'books/**/*.mdx',
  schema: bookFrontmatterShape
    .extend({
      slug: s.slug('book'),
      body: s.mdx(),
    })
    .refine(
      (data) => data.slug === data.slug.toLowerCase(),
      { message: 'slug must be lowercase', path: ['slug'] },
    )
    .transform((data) => ({
      ...data,
      url: `/books/${data.slug}`,
    })),
})

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
  collections: { posts, books },
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
