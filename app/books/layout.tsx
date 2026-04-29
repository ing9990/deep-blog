import Link from 'next/link'
import type { Metadata } from 'next'
import { BookOpen, Sparkles } from 'lucide-react'
import { getCrossHostUrls } from '@/lib/cross-host-url'

export const metadata: Metadata = {
  title: 'DEEP · 책',
  description: '읽고 정리한 책들. 각 책에서 정리한 글로 이어집니다.',
  openGraph: {
    title: 'DEEP · 책',
    description: '읽고 정리한 책들.',
    url: 'https://books.ing9990.com',
    siteName: 'DEEP',
    locale: 'ko_KR',
    type: 'website',
  },
  alternates: {
    canonical: 'https://books.ing9990.com',
  },
}

export default async function BooksLayout({ children }: { children: React.ReactNode }) {
  const { apex: apexUrl, blog: blogUrl } = await getCrossHostUrls()
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="text-lg">DEEP</span>
          <span className="text-sm font-medium text-muted-foreground">/ 책</span>
        </Link>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Link
            href={apexUrl}
            className="rounded-md px-3 py-1.5 transition-colors hover:bg-accent hover:text-foreground"
          >
            홈
          </Link>
          <Link
            href={blogUrl}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-primary-foreground transition-opacity hover:opacity-90"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            <span>블로그</span>
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-6 pb-16">{children}</main>
    </div>
  )
}
