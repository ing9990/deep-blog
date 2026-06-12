import { ImageResponse } from 'next/og'
import { notFound } from 'next/navigation'
import { getBookBySlug } from '@/lib/books'
import {
  OG_SIZE,
  OG_COLORS,
  getOgAccent,
  loadOgFonts,
  loadBookCoverDataUri,
  truncateOgTitle,
} from '@/lib/og'

export const alt = 'DEEP 책 정리 미리보기 카드'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const book = getBookBySlug(slug)
  if (!book) notFound()

  const accent = getOgAccent('books')
  const coverSrc = await loadBookCoverDataUri(book.cover)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 64,
          padding: '72px 80px',
          backgroundColor: OG_COLORS.background,
          backgroundImage: `radial-gradient(circle at 85% 8%, ${accent}26 0%, transparent 45%)`,
          fontFamily: 'Paperlogy',
        }}
      >
        {coverSrc ? (
          <img
            src={coverSrc}
            alt=""
            width={300}
            height={450}
            style={{
              width: 300,
              height: 450,
              objectFit: 'cover',
              borderRadius: 12,
              border: `2px solid ${accent}66`,
            }}
          />
        ) : null}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: 450,
            flexGrow: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              fontSize: 36,
              fontWeight: 700,
              color: OG_COLORS.foreground,
              letterSpacing: '0.12em',
            }}
          >
            DEEP
            <span style={{ color: accent, letterSpacing: 0, fontWeight: 500 }}>· 책</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ width: 88, height: 8, backgroundColor: accent, borderRadius: 4 }} />
            <div
              style={{
                fontSize: 56,
                fontWeight: 700,
                color: OG_COLORS.foreground,
                lineHeight: 1.3,
                wordBreak: 'keep-all',
              }}
            >
              {truncateOgTitle(book.title.ko, 48)}
            </div>
            <div style={{ fontSize: 30, fontWeight: 500, color: OG_COLORS.muted }}>
              {book.author}
            </div>
          </div>

          <div style={{ fontSize: 28, fontWeight: 500, color: OG_COLORS.muted }}>
            books.ing9990.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: await loadOgFonts(),
    },
  )
}
