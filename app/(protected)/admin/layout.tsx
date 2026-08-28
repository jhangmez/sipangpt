import type * as React from 'react'
import { requireRole } from '@/lib/session'
import { Role } from '@/lib/prisma'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AdminSidebar } from '@/components/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  // Guard de rol estricto: solo permite acceso a usuarios con rol ADMIN
  const user = await requireRole(Role.ADMIN)

  return (
    <SidebarProvider defaultOpen>
      <div className='flex h-screen w-screen overflow-hidden bg-background'>
        {/* Sidebar Especializado de Administración */}
        <AdminSidebar user={user} />

        {/* Contenido Principal con Header de Administración */}
        <SidebarInset className='flex flex-1 flex-col h-full overflow-hidden'>
          <div className='flex flex-1 flex-col h-full overflow-hidden p-3 sm:p-4'>
            {/* Header sin selector de modelos */}
            <AdminHeader />

            {/* Vista activa con scroll e independencia de layout */}
            <main className='flex-1 overflow-y-auto pt-3 px-3 sm:px-5 pb-6 font-exo min-h-0 flex flex-col'>
              <div className='w-full flex-1 flex flex-col min-h-0 space-y-5'>{children}</div>
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}


