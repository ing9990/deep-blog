import type { Metadata } from 'next'
import { SettingsFab } from '@/components/layout/SettingsFab'

export const metadata: Metadata = {
  title: 'DEEP · 이론과 실전 사이의 백엔드',
  description: 'CS 이론을 쉽게 풀어내는 블로그와, 같은 지식으로 쌓아가는 이커머스 백엔드 프로젝트.',
  openGraph: {
    title: 'DEEP · 이론과 실전 사이의 백엔드',
    description: '블로그로 이해하고, 코드로 증명한다.',
    url: 'https://ing9990.com',
    siteName: 'DEEP',
    locale: 'ko_KR',
    type: 'website',
  },
  alternates: {
    canonical: 'https://ing9990.com',
  },
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <SettingsFab />
    </>
  )
}
