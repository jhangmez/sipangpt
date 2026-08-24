'use server'

import { prisma, ModelStatus, Role } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { revalidatePath } from 'next/cache'

/**
 * Server Action para actualizar el estado de salud y latencia de un modelo
 */
export async function updateModelStatusAction(
  modelId: string,
  status: ModelStatus,
  latencyMs?: number
) {
  await requireRole(Role.ADMIN)

  await prisma.aIModelConfig.update({
    where: { id: modelId },
    data: {
      status,
      latencyMs: latencyMs ?? undefined,
    },
  })

  revalidatePath('/admin/models')
  revalidatePath('/chat')
}

/**
 * Server Action para marcar un modelo como predeterminado
 */
export async function setDefaultModelAction(modelId: string) {
  await requireRole(Role.ADMIN)

  // Desmarcar todos los demás
  await prisma.aIModelConfig.updateMany({
    data: { isDefault: false },
  })

  // Establecer el nuevo default
  await prisma.aIModelConfig.update({
    where: { id: modelId },
    data: { isDefault: true, isActive: true },
  })

  revalidatePath('/admin/models')
  revalidatePath('/chat')
}

/**
 * Server Action para activar / desactivar un modelo
 */
export async function toggleModelActiveAction(modelId: string, isActive: boolean) {
  await requireRole(Role.ADMIN)

  await prisma.aIModelConfig.update({
    where: { id: modelId },
    data: {
      isActive,
      status: isActive ? ModelStatus.ONLINE : ModelStatus.DISABLED,
    },
  })

  revalidatePath('/admin/models')
  revalidatePath('/chat')
}
