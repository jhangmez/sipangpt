import type { Metadata } from 'next'
import * as React from 'react'
import { getAuthenticatedUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { SessionsManager } from '@/components/shared/sessions-manager'

export const metadata: Metadata = {
  title: 'Dispositivos y Sesiones • Configuraciones',
  description: 'Revisa y gestiona los dispositivos y sesiones activas de tu cuenta en SipánGPT.',
}

export default async function SesionesSettingsPage() {
  const authUser = await getAuthenticatedUser()
  if (!authUser) redirect('/login')

  return (
    <div className='space-y-6'>
      <div className='space-y-1 font-exo'>
        <h1 className='font-frances text-2xl font-bold text-foreground'>
          Dispositivos y Sesiones
        </h1>
        <p className='text-xs text-muted-foreground'>
          Revisa y administra los navegadores y dispositivos donde has iniciado sesión.
        </p>
      </div>

      <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs font-exo'>
        <SessionsManager />
      </div>
    </div>
  )
}
