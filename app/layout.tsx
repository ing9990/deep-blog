import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Backend Notes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-white text-neutral-900 antialiased">{children}</body>
    </html>
  )
}
