import { cache } from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Role } from '@/lib/prisma'

/**
 * Obtiene el usuario autenticado actual desde la sesión.
 * Utiliza React cache() para evitar consultas duplicadas durante el ciclo de vida del render en RSC.
 */
export const getCurrentUser = cache(async () => {
  const session = await auth()
  return session?.user ?? null
})

export const getAuthenticatedUser = getCurrentUser

/**
 * Guard de autenticación para Server Components y Server Actions.
 * Si el usuario no está autenticado, redirige automáticamente a la página de login.
 */
export async function requireAuth(redirectTo: string = '/login') {
  const user = await getCurrentUser()
  if (!user?.id) {
    redirect(redirectTo)
  }
  return user
}

/**
 * Guard de roles para Server Components y Server Actions.
 * Exige que el usuario esté autenticado y posea uno de los roles permitidos.
 */
export async function requireRole(
  allowedRoles: Role | Role[],
  redirectTo: string = '/unauthorized'
) {
  const user = await requireAuth()
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

  if (!roles.includes(user.role as Role)) {
    redirect(redirectTo)
  }
  return user
}

/**
 * Guard de autenticación y rol ADMIN para Route Handlers (/api/admin/**).
 * Devuelve el estado de autorización sin redirigir, listo para responder 401/403 JSON.
 */
export async function getAdminApiAuth(): Promise<
  | { authorized: true; userId: string }
  | { authorized: false; error: string; status: 401 | 403 }
> {
  const session = await auth()
  if (!session?.user?.id) {
    return { authorized: false, error: 'No autorizado', status: 401 }
  }
  if (session.user.role !== Role.ADMIN) {
    return {
      authorized: false,
      error: 'Se requiere rol de administrador',
      status: 403,
    }
  }
  return { authorized: true, userId: session.user.id }
}
