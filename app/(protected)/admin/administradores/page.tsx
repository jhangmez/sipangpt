import * as React from 'react'
import { getAdministratorsData } from '@/lib/actions/admin-invitations'
import { AdministratorsManager } from '@/components/admin/administrators-manager'

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
