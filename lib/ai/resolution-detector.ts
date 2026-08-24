import { ResolutionStatus } from '@/lib/prisma'

export interface ResolutionDetectorParams {
  citationsCount: number
  maxRelevance?: number
  responseText: string
}

const FALLBACK_PHRASES = [
  'no dispongo de información oficial sobre este trámite en mis reglamentos',
  'no cuento con información oficial en mis reglamentos',
  'no dispongo de información oficial en los reglamentos',
  'no he encontrado información oficial en la base de datos',
]

/**
 * Detecta el estado de resolución analítica de una respuesta generada por el bot.
 */
export function detectResolutionStatus({
  citationsCount,
  maxRelevance = 0,
  responseText,
}: ResolutionDetectorParams): ResolutionStatus {
  const lowerText = responseText.toLowerCase()

  // 1. Detección de fallback por frase de control institucional
  for (const phrase of FALLBACK_PHRASES) {
    if (lowerText.includes(phrase)) {
      return ResolutionStatus.UNRESOLVED_BY_FALLBACK
    }
  }

  // 2. Éxito: RAG encontró fragmentos con similitud alta (> 0.75) y generó citas
  if (citationsCount > 0 && maxRelevance >= 0.75) {
    return ResolutionStatus.RESOLVED_WITH_SOURCES
  }

  // 3. Gap de Conocimiento: El buscador no encontró documentos que superen el umbral
  if (citationsCount === 0) {
    // Si es un saludo breve o pregunta general
    if (lowerText.length < 120 && (lowerText.includes('hola') || lowerText.includes('buenas') || lowerText.includes('asistente'))) {
      return ResolutionStatus.RESOLVED_GENERAL
    }
    return ResolutionStatus.NO_CONTEXT_FOUND
  }

  return ResolutionStatus.RESOLVED_WITH_SOURCES
}
