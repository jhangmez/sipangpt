'use server'

import { prisma, Role } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { revalidatePath } from 'next/cache'

/**
 * Server Action para revocar/cerrar una sesión específica.
 * Un usuario solo puede cerrar sus propias sesiones a menos que sea ADMIN.
 */
export async function closeSessionAction(sessionToken: string) {
  const currentUser = await requireAuth()

  const session = await prisma.session.findUnique({
    where: { sessionToken },
  })

  if (!session) {
    return { success: false, message: 'La sesión ya no existe o ya fue cerrada.' }
  }

  // Verificar pertenencia o rol ADMIN
  if (session.userId !== currentUser.id && currentUser.role !== Role.ADMIN) {
    throw new Error('No tienes permisos para cerrar esta sesión.')
  }

  await prisma.session.delete({
    where: { sessionToken },
  })

  revalidatePath('/admin/dashboard')
  revalidatePath('/configuraciones/sesiones')
  revalidatePath('/chat')

  return { success: true, message: 'Sesión finalizada correctamente.' }
}

/**
 * Server Action para cerrar todas las demás sesiones de un usuario excepto la actual
 */
export async function closeOtherSessionsAction(keepSessionToken?: string) {
  const currentUser = await requireAuth()

  await prisma.session.deleteMany({
    where: {
      userId: currentUser.id,
      sessionToken: keepSessionToken ? { not: keepSessionToken } : undefined,
    },
  })

  revalidatePath('/configuraciones/sesiones')
  revalidatePath('/admin/dashboard')
  revalidatePath('/chat')
  return { success: true, message: 'Se han cerrado todas las demás sesiones.' }
}
