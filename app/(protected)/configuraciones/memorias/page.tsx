import * as React from 'react'
import { getAuthenticatedUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getUserMemories } from '@/lib/actions/user-settings'
import { MemoriesManager } from '@/components/configuraciones/memories-manager'

export default async function MemoriasSettingsPage() {
  const authUser = await getAuthenticatedUser()
  if (!authUser) redirect('/login')

  const memories = await getUserMemories()

  return (
    <div className='space-y-6'>
      <div className='space-y-1 font-exo'>
        <h1 className='font-frances text-2xl font-bold text-foreground'>
          Recuerdos y Memoria de IA
        </h1>
        <p className='text-xs text-muted-foreground'>
          Gestiona los hechos y preferencias que SipánGPT utiliza para contextualizar tus conversaciones.
        </p>
      </div>

      <MemoriesManager initialMemories={memories} />
    </div>
  )
}
