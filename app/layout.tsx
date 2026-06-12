import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import Script from 'next/script'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { SettingsProvider } from '@/components/providers/SettingsProvider'
import { HydrationGate } from '@/components/layout/HydrationGate'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import 'katex/dist/katex.min.css'
import './globals.css'

// Only the weights actually used in CSS/Tailwind (400/500/600/700) ship.
// Each declared file is preloaded on every page, so adding a weight here
// costs ~680KB of first-load font transfer.
const paperlogy = localFont({
  src: [
    { path: '../public/fonts/paperlogy/Paperlogy-4Regular.ttf', weight: '400', style: 'normal' },
    { path: '../public/fonts/paperlogy/Paperlogy-5Medium.ttf', weight: '500', style: 'normal' },
    { path: '../public/fonts/paperlogy/Paperlogy-6SemiBold.ttf', weight: '600', style: 'normal' },
    { path: '../public/fonts/paperlogy/Paperlogy-7Bold.ttf', weight: '700', style: 'normal' },
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

const tmoneyRoundWind = localFont({
  src: [
    { path: '../public/fonts/tmoney/TmoneyRoundWind-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../public/fonts/tmoney/TmoneyRoundWind-ExtraBold.ttf', weight: '800', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-tmoney-round',
})

const SITE_URL = 'https://deep.ing9990.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'DEEP',
    template: '%s | DEEP',
  },
  description: '기술 주제를 최대한 이해하기 쉽게 정리하는 블로그',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: 'DEEP',
    title: 'DEEP',
    description: '기술 주제를 최대한 이해하기 쉽게 정리하는 블로그',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DEEP',
    description: '기술 주제를 최대한 이해하기 쉽게 정리하는 블로그',
  },
  alternates: {
    canonical: SITE_URL,
    types: {
      'application/rss+xml': `${SITE_URL}/feed.xml`,
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={`${paperlogy.variable} ${pretendard.variable} ${jetbrainsMono.variable} ${tmoneyRoundWind.variable}`} suppressHydrationWarning>
      <body>
        <Script id="settings-init" strategy="beforeInteractive">
          {`try{var d=document.documentElement;var s=localStorage.getItem('deep-settings');if(s){var p=JSON.parse(s);var f=p.fontSize;d.dataset.fontSize=(f==='small'||f==='large')?f:'small';d.dataset.codeTheme=(p.codeTheme==='floating')?'floating':'flat';var y=p.syntaxTheme;d.dataset.syntaxTheme=(y==='atom'||y==='vitesse')?y:'github'}else{d.dataset.fontSize='small';d.dataset.codeTheme='flat';d.dataset.syntaxTheme='github'}}catch(e){document.documentElement.dataset.fontSize='small';document.documentElement.dataset.codeTheme='flat';document.documentElement.dataset.syntaxTheme='github'}`}
        </Script>
        <ThemeProvider>
          <SettingsProvider>
            <HydrationGate>{children}</HydrationGate>
          </SettingsProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
