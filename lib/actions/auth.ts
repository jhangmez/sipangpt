'use server'

import { signOut } from '@/auth'

/**
 * Server action para cerrar sesión de manera definitiva y redirigir al login.
 */
export async function logoutAction() {
  await signOut({ redirectTo: '/login' })
}
