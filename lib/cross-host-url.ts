/**
 * Cross-host URL resolution for navigating between the three deployed surfaces
 * (apex landing, blog, books).
 *
 * Resolution depends on the current request host:
 *   - Production canonical hosts (ing9990.com / deep.ing9990.com / books.ing9990.com /
 *     www.ing9990.com): route to canonical https domains.
 *   - `localhost` or `*.localhost` dev: use subdomain-based routing
 *     (matches middleware.ts behavior).
 *   - Anything else (LAN IP like 192.168.x.x:3010, custom domain, ngrok host, etc):
 *     stay on the current host. Middleware falls through there, so all surfaces
 *     coexist via filesystem path prefixes (/landing, /books).
 *
 * Use {@link getCrossHostUrls} from server components / route handlers.
 * Use {@link resolveCrossHostUrls} when you already have a host string.
 *
 * Note: SEO-related URLs (canonical, og:url, sitemap) intentionally use the
 * production domain regardless of the request and stay hardcoded in metadata
 * blocks. Do NOT use this helper for those.
 */

import { headers } from 'next/headers'

const APEX_HOST = 'ing9990.com'
const BLOG_HOST = 'deep.ing9990.com'
const BOOKS_HOST = 'books.ing9990.com'
const WWW_HOST = `www.${APEX_HOST}`

const PROD_HOSTS = new Set([APEX_HOST, BLOG_HOST, BOOKS_HOST, WWW_HOST])

export interface CrossHostUrls {
  apex: string
  blog: string
  books: string
}

const PROD_URLS: CrossHostUrls = {
  apex: `https://${APEX_HOST}`,
  blog: `https://${BLOG_HOST}`,
  books: `https://${BOOKS_HOST}`,
}

export function resolveCrossHostUrls(rawHost: string | null | undefined): CrossHostUrls {
  if (!rawHost) return PROD_URLS

  const [hostname, port] = rawHost.split(':')
  const portSuffix = port ? `:${port}` : ''

  if (PROD_HOSTS.has(hostname)) return PROD_URLS

  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return {
      apex: `http://localhost${portSuffix}/landing`,
      blog: `http://blog.localhost${portSuffix}`,
      books: `http://books.localhost${portSuffix}`,
    }
  }

  return {
    apex: `http://${rawHost}/landing`,
    blog: `http://${rawHost}`,
    books: `http://${rawHost}/books`,
  }
}

export async function getCrossHostUrls(): Promise<CrossHostUrls> {
  const h = await headers()
  return resolveCrossHostUrls(h.get('host'))
}
