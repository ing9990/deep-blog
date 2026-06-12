import { ImageResponse } from 'next/og'
import { notFound } from 'next/navigation'
import { getPostBySlug } from '@/lib/posts'
import { getCategory } from '@/lib/categories'
import { formatDate } from '@/lib/utils'
import { OG_SIZE, OG_COLORS, getOgAccent, loadOgFonts, truncateOgTitle } from '@/lib/og'

export const alt = 'DEEP 글 미리보기 카드'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const accent = getOgAccent(post.category)
  const categoryLabel = getCategory(post.category).label.ko

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          backgroundColor: OG_COLORS.background,
          backgroundImage: `radial-gradient(circle at 85% 8%, ${accent}26 0%, transparent 45%)`,
          fontFamily: 'Paperlogy',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              fontSize: 40,
              fontWeight: 700,
              color: OG_COLORS.foreground,
              letterSpacing: '0.12em',
            }}
          >
            DEEP
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: 26,
              fontWeight: 500,
              color: accent,
              border: `2px solid ${accent}66`,
              borderRadius: 9999,
              padding: '10px 28px',
            }}
          >
            {categoryLabel}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
          }}
        >
          <div style={{ width: 88, height: 8, backgroundColor: accent, borderRadius: 4 }} />
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: OG_COLORS.foreground,
              lineHeight: 1.25,
              wordBreak: 'keep-all',
            }}
          >
            {truncateOgTitle(post.title.ko)}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 28,
            fontWeight: 500,
            color: OG_COLORS.muted,
          }}
        >
          <div>deep.ing9990.com</div>
          <div>{formatDate(post.date, 'ko')}</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: await loadOgFonts(),
    },
  )
}
