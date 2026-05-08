import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const APEX_HOST = 'ing9990.com'
const BLOG_HOST = 'deep.ing9990.com'
const BOOKS_HOST = 'books.ing9990.com'
const WWW_HOST = `www.${APEX_HOST}`
const BOOKS_HOST_LOCAL = 'books.localhost'

// books.* host: external URL has no /books prefix, but internal Next.js routes
// live under /books/*. This rewrite makes the prod host transparent and lets
// local dev mirror it via books.localhost.
function rewriteBooksHost(req: NextRequest, pathname: string) {
  const internal = req.nextUrl.clone()
  internal.pathname = pathname === '/' ? '/books' : `/books${pathname}`
  return NextResponse.rewrite(internal)
}

// Redirect /books-prefixed paths on apex/blog hosts to the canonical books host.
function redirectToBooksHost(req: NextRequest, pathname: string) {
  const url = new URL(req.url)
  url.host = BOOKS_HOST
  url.pathname = pathname === '/books' ? '/' : pathname.slice('/books'.length)
  return NextResponse.redirect(url, 301)
}

export function middleware(req: NextRequest) {
  const hostname = (req.headers.get('host') ?? '').split(':')[0]
  const { pathname } = req.nextUrl

  // Local dev: books.localhost mirrors prod host rewrite.
  // Other *.localhost hosts pass through and Next.js file-system routing applies.
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    if (hostname === BOOKS_HOST_LOCAL) {
      // Strip /books prefix from URL bar for canonical form.
      if (pathname === '/books' || pathname.startsWith('/books/')) {
        const url = new URL(req.url)
        url.pathname = pathname === '/books' ? '/' : pathname.slice('/books'.length)
        return NextResponse.redirect(url, 301)
      }
      return rewriteBooksHost(req, pathname)
    }
    return NextResponse.next()
  }

  // www canonicalization
  if (hostname === WWW_HOST) {
    const url = new URL(req.url)
    url.host = APEX_HOST
    return NextResponse.redirect(url, 301)
  }

  // Apex (ing9990.com): all traffic redirects to blog, except /books which
  // canonicalizes onto the books host.
  if (hostname === APEX_HOST) {
    if (pathname === '/books' || pathname.startsWith('/books/')) {
      return redirectToBooksHost(req, pathname)
    }
    const url = new URL(req.url)
    url.host = BLOG_HOST
    return NextResponse.redirect(url, 301)
  }

  // Blog (deep.ing9990.com): books should not be reachable here.
  if (hostname === BLOG_HOST) {
    if (pathname === '/books' || pathname.startsWith('/books/')) {
      return redirectToBooksHost(req, pathname)
    }
  }

  // Books (books.ing9990.com): only book routes; everything else canonicalizes.
  if (hostname === BOOKS_HOST) {
    if (pathname.startsWith('/posts/') || pathname.startsWith('/tags/')) {
      const url = new URL(req.url)
      url.host = BLOG_HOST
      return NextResponse.redirect(url, 301)
    }
    if (pathname === '/books' || pathname.startsWith('/books/')) {
      const url = new URL(req.url)
      url.pathname = pathname === '/books' ? '/' : pathname.slice('/books'.length)
      return NextResponse.redirect(url, 301)
    }
    return rewriteBooksHost(req, pathname)
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
