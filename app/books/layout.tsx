import Link from 'next/link'
import type { Metadata } from 'next'
import { BookOpen, Sparkles } from 'lucide-react'
import { getCrossHostUrls } from '@/lib/cross-host-url'
import { ThemeToggle } from '@/components/blog/ThemeToggle'
import { SettingsFab } from '@/components/layout/SettingsFab'

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
  const { blog: blogUrl } = await getCrossHostUrls()
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="text-lg">DEEP</span>
          <span className="text-sm font-medium text-muted-foreground">/ 책</span>
        </Link>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href={blogUrl}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-primary-foreground transition-opacity hover:opacity-90"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            <span>블로그</span>
          </Link>
          <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
          <ThemeToggle />
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-6 pb-16">{children}</main>
      <SettingsFab />
    </div>
  )
}
