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
    card: 'summary',
    title: 'DEEP',
    description: '기술 주제를 최대한 이해하기 쉽게 정리하는 블로그',
  },
  alternates: {
    canonical: SITE_URL,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={`${paperlogy.variable} ${pretendard.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
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
