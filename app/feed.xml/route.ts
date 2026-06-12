import { getAllPosts } from '@/lib/posts'

const SITE_URL = 'https://deep.ing9990.com'
const FEED_ITEM_LIMIT = 30

export const dynamic = 'force-static'

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export function GET(): Response {
  const posts = getAllPosts().slice(0, FEED_ITEM_LIMIT)

  const items = posts
    .map((post) => {
      const url = `${SITE_URL}/posts/${post.slug}`
      const categories = post.tags
        .map((tag) => `      <category>${escapeXml(tag)}</category>`)
        .join('\n')
      return `    <item>
      <title>${escapeXml(post.title.ko)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description>${escapeXml(post.summary.ko)}</description>
${categories}
    </item>`
    })
    .join('\n')

  const lastBuildDate = posts.length > 0 ? new Date(posts[0].date).toUTCString() : new Date().toUTCString()

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>DEEP</title>
    <link>${SITE_URL}</link>
    <description>기술 주제를 최대한 이해하기 쉽게 정리하는 블로그</description>
    <language>ko</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  })
}
