import { MobileUIProvider } from '@/components/providers/MobileUIProvider'
import { Header } from '@/components/blog/Header'
import { Footer } from '@/components/blog/Footer'
import { MobileOverlays } from '@/components/blog/MobileOverlays'
import { MobilePostTocFab } from '@/components/blog/MobilePostTocFab'
import { CopyToast } from '@/components/blog/CopyToast'
import { SettingsFab } from '@/components/layout/SettingsFab'
import { getAllPosts } from '@/lib/posts'
import { toClientPost } from '@/lib/client-post'
import { getCrossHostUrls } from '@/lib/cross-host-url'
import { CrossHostProvider } from '@/lib/cross-host-context'

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const clientPosts = getAllPosts().map(toClientPost)
  const crossHostUrls = await getCrossHostUrls()

  return (
    <CrossHostProvider value={crossHostUrls}>
      <MobileUIProvider posts={clientPosts}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <MobileOverlays />
        <MobilePostTocFab />
        <SettingsFab />
        <CopyToast />
      </MobileUIProvider>
    </CrossHostProvider>
  )
}
