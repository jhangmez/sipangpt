/**
 * Determina si un correo pertenece a un estudiante o miembro de la Universidad Señor de Sipán.
 * Valida si el correo contiene las palabras 'sipan' o 'uss' o dominios institucionales.
 */
export function isUssStudentEmail(email: string): boolean {
  if (!email) return false
  const lower = email.toLowerCase().trim()
  return lower.includes('uss') || lower.includes('sipan')
}

export interface InstitutionalAffiliation {
  isUssStudent: boolean
  badgeLabel: string
  statusTitle: string
  statusDescription: string
}

export function getInstitutionalAffiliation(
  email: string
): InstitutionalAffiliation {
  const isUss = isUssStudentEmail(email)

  if (isUss) {
    return {
      isUssStudent: true,
      badgeLabel: 'Estudiante / Comunidad USS',
      statusTitle: 'Identidad Universitaria Verificada',
      statusDescription:
        'Tu cuenta está asociada a la Universidad Señor de Sipán con acceso preferente a normativas y reglamentos académicos.'
    }
  }

  return {
    isUssStudent: false,
    badgeLabel: 'Usuario Externo / Personal',
    statusTitle: 'Cuenta Personal Externa',
    statusDescription: 'Acceso como usuario externo.'
  }
}
