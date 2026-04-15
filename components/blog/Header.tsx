import { HeaderActions } from './HeaderActions'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-screen-2xl pl-[max(env(safe-area-inset-left),1rem)] pr-[max(env(safe-area-inset-right),1rem)] sm:pl-[max(env(safe-area-inset-left),1.5rem)] sm:pr-[max(env(safe-area-inset-right),1.5rem)] md:pl-[max(env(safe-area-inset-left),2rem)] md:pr-[max(env(safe-area-inset-right),2rem)]">
        <HeaderActions />
      </div>
    </header>
  )
}
