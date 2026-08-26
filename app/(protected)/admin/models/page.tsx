import type { Metadata } from 'next'
import { getAllAIModels } from '@/lib/db/system'
import { requireRole } from '@/lib/session'
import { Role, type AIModelConfig } from '@/lib/prisma'
import { ModelsManager } from '@/components/admin/models-manager'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Modelos de IA & Consumo de Tokens • Panel Administrador',
  description:
    'Supervisión de salud, precios por millón de tokens, registro de consumo por concepto y configuración de modelos de IA en SipánGPT.',
}

export default async function AdminModelsPage() {
  await requireRole(Role.ADMIN)
  const models: AIModelConfig[] = await getAllAIModels()

  return <ModelsManager initialModels={models} />
}
