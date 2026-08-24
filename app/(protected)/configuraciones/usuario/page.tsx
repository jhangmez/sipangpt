import * as React from 'react'
import { getAuthenticatedUser } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { UserProfileForm } from '@/components/configuraciones/user-profile-form'

export default async function UsuarioSettingsPage() {
  const authUser = await getAuthenticatedUser()
  if (!authUser) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
    },
  })

  if (!user) redirect('/login')

  return (
    <div className='space-y-6'>
      <div className='space-y-1 font-exo'>
        <h1 className='font-frances text-2xl font-bold text-foreground'>
          Perfil de Usuario
        </h1>
        <p className='text-xs text-muted-foreground'>
          Gestiona tu identidad y tus datos de acceso en SipánGPT.
        </p>
      </div>

      <UserProfileForm user={user} />
    </div>
  )
}
