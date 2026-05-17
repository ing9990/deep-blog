/**
 * Cross-host URL resolution for navigating between the deployed surfaces
 * (blog, books).
 *
 * Resolution depends on the current request host:
 *   - Production canonical hosts (ing9990.com / deep.ing9990.com / books.ing9990.com /
 *     www.ing9990.com): route to canonical https domains.
 *   - `localhost` or `*.localhost` dev: use subdomain-based routing
 *     (matches middleware.ts behavior).
 *   - Anything else (LAN IP like 192.168.x.x:3010, custom domain, ngrok host, etc):
 *     stay on the current host. Middleware falls through there, so all surfaces
 *     coexist via filesystem path prefixes (/books).
 *
 * This module is pure (no next/headers) so client components may import
 * {@link resolveCrossHostUrls} and {@link PROD_URLS}. The server-only
 * {@link getCrossHostUrls} helper that reads request headers lives in
 * `cross-host-url.server.ts`.
 *
 * Note: SEO-related URLs (canonical, og:url, sitemap) intentionally use the
 * production domain regardless of the request and stay hardcoded in metadata
 * blocks. Do NOT use this helper for those.
 */

const APEX_HOST = 'ing9990.com'
const BLOG_HOST = 'deep.ing9990.com'
const BOOKS_HOST = 'books.ing9990.com'
const WWW_HOST = `www.${APEX_HOST}`

const PROD_HOSTS = new Set([APEX_HOST, BLOG_HOST, BOOKS_HOST, WWW_HOST])

export interface CrossHostUrls {
  blog: string
  books: string
}

export const PROD_URLS: CrossHostUrls = {
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
      blog: `http://blog.localhost${portSuffix}`,
      books: `http://books.localhost${portSuffix}`,
    }
  }

  return {
    blog: `http://${rawHost}`,
    books: `http://${rawHost}/books`,
  }
}
