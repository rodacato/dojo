import { PublicNav } from './PublicNav'
import { PublicFooter } from './PublicFooter'

interface PublicPageLayoutProps {
  children: React.ReactNode
  /** Hide the right-side `Enter the dojo` CTA. Default is to show it on public pages. */
  hideCta?: boolean
}

export function PublicPageLayout({ children, hideCta = false }: Readonly<PublicPageLayoutProps>) {
  return (
    <div className="min-h-screen bg-page text-primary flex flex-col">
      <PublicNav action={hideCta ? 'none' : 'enter'} />
      <main className="flex-1 flex flex-col">{children}</main>
      <PublicFooter />
    </div>
  )
}
