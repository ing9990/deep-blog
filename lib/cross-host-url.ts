/**
 * Cross-host URL constants for navigating between the three deployed hosts
 * (apex landing, blog, books). In production these point at the canonical
 * domains; in dev they fall back to *.localhost so that local navigation
 * stays inside the running dev server.
 *
 * Use these for **navigation links rendered in the UI**. SEO-related URLs
 * (canonical, og:url, sitemap) must keep the production domain — those are
 * intentionally hardcoded in metadata blocks and should NOT use this helper.
 */

const isDev = process.env.NODE_ENV !== 'production'

const DEV_PORT = 3010

export const APEX_URL = isDev
  ? `http://localhost:${DEV_PORT}/landing`
  : 'https://ing9990.com'

export const BLOG_URL = isDev
  ? `http://blog.localhost:${DEV_PORT}`
  : 'https://deep.ing9990.com'

export const BOOKS_URL = isDev
  ? `http://books.localhost:${DEV_PORT}`
  : 'https://books.ing9990.com'
