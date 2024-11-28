import { AppSidebar } from '@Components/(private)/Sidebar//app-sidebar'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Suspense } from 'react'
import Loading from './loading'

export default function LayoutPage({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </SidebarInset>
    </SidebarProvider>
  )
}
