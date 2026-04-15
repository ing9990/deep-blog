import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { MobileUIProvider } from '@/components/providers/MobileUIProvider'
import { Header } from '@/components/blog/Header'
import { Footer } from '@/components/blog/Footer'
import { MobileOverlays } from '@/components/blog/MobileOverlays'
import { getAllPosts } from '@/lib/posts'
import { toClientPost } from '@/lib/client-post'
import 'katex/dist/katex.min.css'
import './globals.css'

const paperlogy = localFont({
  src: [
    { path: '../public/fonts/paperlogy/Paperlogy-1Thin.ttf', weight: '100', style: 'normal' },
    { path: '../public/fonts/paperlogy/Paperlogy-2ExtraLight.ttf', weight: '200', style: 'normal' },
    { path: '../public/fonts/paperlogy/Paperlogy-3Light.ttf', weight: '300', style: 'normal' },
    { path: '../public/fonts/paperlogy/Paperlogy-4Regular.ttf', weight: '400', style: 'normal' },
    { path: '../public/fonts/paperlogy/Paperlogy-5Medium.ttf', weight: '500', style: 'normal' },
    { path: '../public/fonts/paperlogy/Paperlogy-6SemiBold.ttf', weight: '600', style: 'normal' },
    { path: '../public/fonts/paperlogy/Paperlogy-7Bold.ttf', weight: '700', style: 'normal' },
    { path: '../public/fonts/paperlogy/Paperlogy-8ExtraBold.ttf', weight: '800', style: 'normal' },
    { path: '../public/fonts/paperlogy/Paperlogy-9Black.ttf', weight: '900', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-paperlogy',
})

const pretendard = localFont({
  src: '../public/fonts/PretendardVariable.woff2',
  display: 'swap',
  variable: '--font-pretendard',
  weight: '100 900',
})

const jetbrainsMono = localFont({
  src: '../public/fonts/JetBrainsMono-Variable.ttf',
  display: 'swap',
  variable: '--font-jetbrains-mono',
  weight: '100 800',
})

export const metadata: Metadata = {
  title: 'DEEP',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const clientPosts = getAllPosts().map(toClientPost)

  return (
    <html lang="ko" className={`${paperlogy.variable} ${pretendard.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <MobileUIProvider posts={clientPosts}>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <MobileOverlays />
          </MobileUIProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
