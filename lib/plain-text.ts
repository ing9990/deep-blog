// lib/plain-text.ts
//
// Extracts human-readable text from raw MDX. Used at Velite build time to
// precompute a searchable `plainBody` field per post, and by tests.
//
// Strips frontmatter, JSX/HTML tags, fenced code blocks, inline code,
// KaTeX math, images, and markdown markup — leaves only body text and
// link anchor text.
export function extractPlainText(mdxContent: string): string {
  return mdxContent
    .replace(/^---[\s\S]*?\n---\n/, '')
    .replace(/<[A-Z][^>]*\/?>|<\/[A-Z][^>]*>/g, ' ')
    .replace(/<[a-z][^>]*>|<\/[a-z][^>]*>/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$\n]*\$/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_~>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
