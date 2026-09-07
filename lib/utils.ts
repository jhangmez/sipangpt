import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return 'Ocurrió un error inesperado'
}

/**
 * Normaliza y repara texto con Mojibake (secuencias UTF-8 erróneamente interpretadas
 * como Windows-1252 o Latin-1 por CDNs, navegadores o archivos con codificación defectuosa).
 * Convierte secuencias como "SEÃ‘OR" -> "SEÑOR", "INGENIERÃA" -> "INGENIERÍA", "CÃ“DIGO" -> "CÓDIGO".
 */
export function sanitizeMojibake(text: string): string {
  if (!text) return ''

  const replacements: [RegExp, string][] = [
    // Mayúsculas con tilde y eñe
    [/Ã[\u2018\u0091‘']|Ã‘/g, 'Ñ'],
    [/Ã[\u201C\u0093“]|Ã“/g, 'Ó'],
    [/Ã[\u0161\u009Aš]|Ãš/g, 'Ú'],
    [/Ã[\u2030\u0089‰]|Ã‰/g, 'É'],
    [/Ã[\u008D\u00AD­]|Ãa/g, 'Í'],
    [/Ã[\u0081\u00CA\u00C1Ê]|Ã(?=[BCDFGHJKLMNPQRSTVWXYZ\s])/g, 'Á'],

    // Minúsculas con tilde y eñe
    [/Ã±/g, 'ñ'],
    [/Ã³/g, 'ó'],
    [/Ãº/g, 'ú'],
    [/Ã©/g, 'é'],
    [/Ã­/g, 'í'],
    [/Ã¡/g, 'á'],
    [/Ã¼/g, 'ü'],
    [/Ãœ/g, 'Ü'],

    // Signos y símbolos habituales en español
    [/Â¿/g, '¿'],
    [/Â¡/g, '¡'],
    [/Â°/g, '°'],
    [/Â·/g, '·'],
    [/â€“/g, '–'],
    [/â€”/g, '—'],
    [/â€œ/g, '“'],
    [/â€/g, '”'],
    [/â€˜/g, '‘'],
    [/â€™/g, '’'],
    [/â€¢/g, '•'],
    [/â€¦/g, '…'],
  ]

  let cleaned = text
  for (const [regex, rep] of replacements) {
    cleaned = cleaned.replace(regex, rep)
  }

  // Limpieza de caracteres de control nulos o inválidos (conservando saltos de línea y tabuladores)
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  return cleaned
}

/**
 * Elimina imágenes en base64 embebidas (data:image/...) en documentos Markdown o texto.
 * Previene que cadenas gigantes de caracteres base64 (de cientos de miles o millones de caracteres)
 * contaminen los fragmentos RAG con ruido, consuman cuota de tokens o desborden la memoria/UI.
 */
export function stripBase64Images(content: string): string {
  if (!content) return ''

  // 1. Sintaxis Markdown: ![alt](data:image/...)
  let cleaned = content.replace(
    /!\[(.*?)\]\(data:image\/[a-zA-Z0-9.+_-]+;base64,[A-Za-z0-9+/=\s]+\)/gi,
    (_match, alt) => {
      const cleanAlt = alt?.trim()
      return cleanAlt ? `[Imagen: ${cleanAlt}]` : '[Imagen]'
    }
  )

  // 2. Sintaxis HTML: <img ... src="data:image/..." ... />
  cleaned = cleaned.replace(
    /<img\b[^>]*\bsrc=["']data:image\/[a-zA-Z0-9.+_-]+;base64,[A-Za-z0-9+/=\s]+["'][^>]*>/gi,
    (_match) => '[Imagen]'
  )

  // 3. URLs data:image sueltas de más de 60 caracteres de base64
  cleaned = cleaned.replace(
    /data:image\/[a-zA-Z0-9.+_-]+;base64,[A-Za-z0-9+/=\s]{60,}/gi,
    '[Imagen data-URI omitida]'
  )

  return cleaned
}

