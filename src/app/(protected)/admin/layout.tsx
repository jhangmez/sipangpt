import { AppSidebar } from '@Components/(private)/Sidebar//app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Suspense } from 'react'
import Loading from './loading'
import { auth } from '@root/auth'
import { notFound } from 'next/navigation'
import { Provider } from './provider'

const shortTitle = 'Admin dashboard'
const description = 'Administrador'
const sipangpt = ' | SipánGPT'
const title = `${shortTitle}${sipangpt}`
const imageUrl = `https://jhangmez.vercel.app/api/og2?title=${shortTitle}&description=${description}`

export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'article',
    url: 'https://sipangpt.xyz/',
    images: [{ url: imageUrl }]
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [imageUrl]
  }
}

export default async function LayoutPage({
  children
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    notFound()
  }

  return (
    <Provider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </SidebarInset>
      </SidebarProvider>
    </Provider>
  )
}
