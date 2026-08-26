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

            {/* Vista activa con scroll independiente */}
            <main className='flex-1 overflow-y-auto pt-4 px-2 sm:px-6 pb-12 font-exo'>
              <div className='max-w-5xl mx-auto space-y-6'>{children}</div>
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
