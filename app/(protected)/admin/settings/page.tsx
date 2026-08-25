import type { Metadata } from 'next'
import { requireRole } from '@/lib/session'
import { Role } from '@/lib/prisma'
import { getSystemSettingsAction } from '@/lib/actions/admin-settings'
import { SettingsManager } from '@/components/admin/settings-manager'

export const metadata: Metadata = {
  title: 'Políticas y Búsqueda IA • Panel Administrador',
  description: 'Control visual de RAG, búsqueda web en tiempo real, geolocalización y umbrales de precisión en SipánGPT.',
}

export default async function AdminSettingsPage() {
  await requireRole(Role.ADMIN)
  const initialSettings = await getSystemSettingsAction()

  return (
    <div className='p-2 sm:p-4'>
      <SettingsManager initialSettings={initialSettings} />
    </div>
  )
}
