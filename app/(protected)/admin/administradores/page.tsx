import type { Metadata } from 'next'
import * as React from 'react'
import { getAdministratorsData } from '@/lib/actions/admin-invitations'
import { AdministratorsManager } from '@/components/admin/administrators-manager'

export const metadata: Metadata = {
  title: 'Equipo de Administradores • Panel Administrador',
  description: 'Gestión de roles administrativos, invitaciones con enlace único y pre-registro institucional.',
}

export default async function AdminAdministradoresPage() {
  const { admins, invitations } = await getAdministratorsData()

  return (
    <div className='space-y-6'>
      <AdministratorsManager
        initialAdmins={admins}
        initialInvitations={invitations}
      />
    </div>
  )
}
