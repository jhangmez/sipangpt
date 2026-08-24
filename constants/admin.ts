/**
 * Lista de correos con permisos de Administrador Inicial / Super-Admin automático.
 * Al iniciar sesión por primera vez con Google OAuth, se les asigna automáticamente el rol ADMIN.
 */
export const INITIAL_ADMIN_EMAILS: string[] = [
  'jhangomez25@gmail.com',
  ...(process.env.INITIAL_ADMIN_EMAILS
    ? process.env.INITIAL_ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase())
    : []),
].map((email) => email.toLowerCase())

/**
 * Helper para verificar si un correo electrónico califica como Administrador Inicial
 */
export function isInitialAdminEmail(email?: string | null): boolean {
  if (!email) return false
  return INITIAL_ADMIN_EMAILS.includes(email.toLowerCase())
}
