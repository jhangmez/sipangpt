'use server'

import { signOut, auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * Server action para cerrar sesión de manera definitiva y redirigir al login.
 */
export async function logoutAction() {
  try {
    const session = await auth()
    if (session?.user?.id) {
      // Limpiar registros de sesión del usuario en la base de datos
      await prisma.session.deleteMany({
        where: { userId: session.user.id },
      }).catch(() => {})
    }
  } catch (err) {
    console.error('[LOGOUT_ACTION_ERROR]', err)
  }

  await signOut({ redirectTo: '/login' })
}
