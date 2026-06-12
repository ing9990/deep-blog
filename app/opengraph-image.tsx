import { ImageResponse } from 'next/og'
import { OG_SIZE, OG_COLORS, loadOgFonts } from '@/lib/og'

export const alt = 'DEEP — 기술 주제를 최대한 이해하기 쉽게 정리하는 블로그'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image() {
  const accent = '#818cf8'

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
            fontSize: 132,
            fontWeight: 700,
            color: OG_COLORS.foreground,
            letterSpacing: '0.18em',
          }}
        >
          DEEP
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
          기술 주제를 최대한 이해하기 쉽게 정리하는 블로그
        </div>
        <div style={{ fontSize: 28, fontWeight: 500, color: `${OG_COLORS.muted}99` }}>
          deep.ing9990.com
        </div>
      </div>
    ),
    {
      ...size,
      fonts: await loadOgFonts(),
    },
  )
}
