import type { ReactNode } from 'react'
import { AppHeader } from './AppHeader'
import { BottomNav } from './BottomNav'
import { OfflineBanner } from './OfflineBanner'
import { Sidebar } from './Sidebar'

export function AppChrome({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-dvh bg-page">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <AppHeader />
        <OfflineBanner />
        <main
          id="main"
          tabIndex={-1}
          className="flex-1 min-w-0 focus:outline-none pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0"
        >
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
