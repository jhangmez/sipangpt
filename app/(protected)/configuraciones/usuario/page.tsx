import type { Metadata } from 'next'
import * as React from 'react'
import { getAuthenticatedUser } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { UserProfileForm } from '@/components/configuraciones/user-profile-form'
import { verifyEmailWithTokenAction } from '@/lib/actions/user-settings'
import type { UserProfileData } from '@/types'

export const metadata: Metadata = {
  title: 'Perfil de Usuario • Configuraciones',
  description: 'Gestiona tu perfil, datos de estudiante USS, validación de correo electrónico y contraseña en SipánGPT.',
}

interface UsuarioSettingsPageProps {
  searchParams: Promise<{
    verify_token?: string
  }>
}

export default async function UsuarioSettingsPage({
  searchParams,
}: UsuarioSettingsPageProps) {
  const authUser = await getAuthenticatedUser()
  if (!authUser) redirect('/login')

  const { verify_token } = await searchParams

  // Si llega un token de verificación en la URL, lo validamos automáticamente
  if (verify_token) {
    try {
      await verifyEmailWithTokenAction(verify_token)
    } catch {
      // Si falla o expira, se maneja transparentemente en la vista
    }
  }

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
      emailVerified: true,
      password: true,
      createdAt: true,
    },
  })

  if (!user) redirect('/login')

  const profileData: UserProfileData = {
    id: user.id,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    image: user.image,
    role: user.role,
    emailVerified: user.emailVerified,
    hasPassword: !!user.password,
    createdAt: user.createdAt,
  }

  return (
    <div className='space-y-6'>
      <div className='space-y-1 font-exo'>
        <h1 className='font-frances text-2xl font-bold text-foreground'>
          Perfil de Usuario
        </h1>
        <p className='text-xs text-muted-foreground'>
          Gestiona tu identidad, afiliación institucional, validación de correo y credenciales de acceso.
        </p>
      </div>

      <UserProfileForm user={profileData} />
    </div>
  )
}
