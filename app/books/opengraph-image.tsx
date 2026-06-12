import { ImageResponse } from 'next/og'
import { OG_SIZE, OG_COLORS, getOgAccent, loadOgFonts } from '@/lib/og'

export const alt = 'DEEP · 책 — 읽고 정리한 책들'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image() {
  const accent = getOgAccent('books')

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 36,
          backgroundColor: OG_COLORS.background,
          backgroundImage: `radial-gradient(circle at 50% 0%, ${accent}26 0%, transparent 55%)`,
          fontFamily: 'Paperlogy',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            fontSize: 120,
            fontWeight: 700,
            color: OG_COLORS.foreground,
            letterSpacing: '0.18em',
          }}
        >
          DEEP
          <span style={{ color: accent, letterSpacing: 0, fontWeight: 500 }}>· 책</span>
        </div>
        <div style={{ width: 96, height: 8, backgroundColor: accent, borderRadius: 4 }} />
        <div
          style={{
            fontSize: 36,
            fontWeight: 500,
            color: OG_COLORS.muted,
            wordBreak: 'keep-all',
          }}
        >
          읽고 정리한 책들 — 각 책에서 정리한 글로 이어집니다
        </div>
        <div style={{ fontSize: 28, fontWeight: 500, color: `${OG_COLORS.muted}99` }}>
          books.ing9990.com
        </div>
      </div>
    ),
    {
      ...size,
      fonts: await loadOgFonts(),
    },
  )
}
