import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Header } from '@/components/blog/Header'
import { Footer } from '@/components/blog/Footer'
import './globals.css'

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
  title: 'Backend Notes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={`${pretendard.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
