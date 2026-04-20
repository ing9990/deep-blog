import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const APEX_HOST = 'ing9990.com'
const BLOG_HOST = 'deep.ing9990.com'
const WWW_HOST = `www.${APEX_HOST}`

export function middleware(req: NextRequest) {
  const hostname = (req.headers.get('host') ?? '').split(':')[0]
  const { pathname } = req.nextUrl

  // Local dev: no host-based rewriting. Route group layouts handle UI.
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return NextResponse.next()
  }

  // www canonicalization
  if (hostname === WWW_HOST) {
    const url = new URL(req.url)
    url.host = APEX_HOST
    return NextResponse.redirect(url, 301)
  }

  // Apex (ing9990.com): landing at root, blog traffic redirected to deep.*
  if (hostname === APEX_HOST) {
    // Canonical: /landing is internal only. Direct hits → /
    if (pathname === '/landing' || pathname.startsWith('/landing/')) {
      const url = new URL(req.url)
      url.pathname = '/'
      return NextResponse.redirect(url, 301)
    }
    // Root → landing (internal rewrite preserves the apex URL in the address bar)
    if (pathname === '/') {
      const url = req.nextUrl.clone()
      url.pathname = '/landing'
      return NextResponse.rewrite(url)
    }
    // Any other path on apex belongs to the blog. 301 preserves SEO for legacy
    // /posts/*, /tags/* URLs indexed before the subdomain split.
    const url = new URL(req.url)
    url.host = BLOG_HOST
    return NextResponse.redirect(url, 301)
  }

  // Blog (deep.ing9990.com): landing should not be reachable here.
  if (hostname === BLOG_HOST) {
    if (pathname === '/landing' || pathname.startsWith('/landing/')) {
      const url = new URL(req.url)
      url.host = APEX_HOST
      url.pathname = '/'
      return NextResponse.redirect(url, 301)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Run on all routes except Next internals, API, and files with extensions
    // (favicon.ico, robots.txt, sitemap.xml, *.png, *.woff2, etc).
    '/((?!api|_next/static|_next/image|.*\\..*).*)',
  ],
}
