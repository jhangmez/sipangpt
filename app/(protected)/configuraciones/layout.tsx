import * as React from 'react'
import { getAuthenticatedUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SettingsSidebar } from '@/components/settings-sidebar'
import { SettingsHeader } from '@/components/configuraciones/settings-header'

export default async function ConfiguracionesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect('/login')
  }

  return (
    <SidebarProvider defaultOpen>
      <div className='flex h-screen w-screen overflow-hidden bg-background'>
        {/* Sidebar de Configuraciones */}
        <SettingsSidebar user={user} />

        {/* Contenido Principal con Header de Configuraciones */}
        <SidebarInset className='flex flex-1 flex-col h-full overflow-hidden'>
          <div className='flex flex-1 flex-col h-full overflow-hidden p-3 sm:p-4'>
            {/* Header sin selector de modelos */}
            <SettingsHeader />

            {/* Vista activa con scroll independiente */}
            <main className='flex-1 overflow-y-auto pt-4 px-2 sm:px-6 pb-12 font-exo'>
              <div className='max-w-4xl mx-auto space-y-6'>
                {children}
              </div>
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
