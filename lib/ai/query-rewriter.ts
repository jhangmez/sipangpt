import { generateText } from 'ai'
import { getLanguageModel } from '@/lib/ai/providers'
import { ModelProvider, TokenUsageConcept } from '@/lib/prisma'
import { DOCUMENT_TRANSCRIPTION_MODEL_CODE } from '@/constants/models'
import { recordTokenUsageLog } from '@/lib/ai/token-tracker'

export interface RewrittenQuery {
  originalQuery: string
  expandedQuery: string
  inferredCategory?: string
  detectedIntent?: string
}

export interface QueryRewriterContext {
  userId?: string | null
  conversationId?: string | null
}

// Diccionario heurístico de expresiones estudiantiles frecuentes (0 latencia / 0 tokens)
const HEURISTIC_PATTERNS: Array<{
  regex: RegExp
  expanded: string
  category: string
  intent: string
}> = [
  {
    regex: /(?:fecha|vence|vencimiento|cu[aá]ndo pago|pagar|mensualidad|pensi[oó]n|sin mora|recargo)/i,
    expanded: 'Cronograma de vencimiento de pensiones, fechas de pago y recargos por mora semestre académico USS',
    category: 'PAGOS',
    intent: 'CONSULTA_PAGOS_PENSIONES',
  },
  {
    regex: /(?:jalarme|cambiar(?:me)? de carrera|traslado interno)/i,
    expanded: 'Requisitos, directivas y plazos para traslado interno o cambio de carrera profesional USS',
    category: 'MATRICULA',
    intent: 'TRAMITE_TRASLADO_INTERNO',
  },
  {
    regex: /(?:convalidar|convalidaci[oó]n|asignaturas previas)/i,
    expanded: 'Reglamento, requisitos, tablas de equivalencias y costos para convalidación de asignaturas USS',
    category: 'CONVALIDACIONES',
    intent: 'TRAMITE_CONVALIDACION',
  },
  {
    regex: /(?:reserva|reservar|suspender|dejar de estudiar|retiro de ciclo|retirar ciclo)/i,
    expanded: 'Requisitos, procedimiento y plazos límite para solicitar reserva de matrícula o retiro de ciclo académico USS',
    category: 'MATRICULA',
    intent: 'TRAMITE_RESERVA_MATRICULA',
  },
  {
    regex: /(?:aplazado|sustitutorio|examen de aplazados|rendir aplazado)/i,
    expanded: 'Reglamento de evaluación del aprendizaje, requisitos y tasas para rendir examen de aplazados USS',
    category: 'EVALUACION',
    intent: 'CONSULTA_EXAMEN_APLAZADOS',
  },
  {
    regex: /(?:bachiller|t[ií]tulo|titulaci[oó]n|sustentar|tesis)/i,
    expanded: 'Reglamento de grados y títulos, requisitos académicos y modalidades de titulación profesional USS',
    category: 'GRADOS_TITULOS',
    intent: 'CONSULTA_GRADOS_TITULOS',
  },
  {
    regex: /(?:carn[eé]|carnet universitario|duplicado de carn[eé])/i,
    expanded: 'Trámite, pago de tasas y solicitud de expedición o duplicado de carné universitario SUNEDU USS',
    category: 'TRAMITES',
    intent: 'TRAMITE_CARNET_UNIVERSITARIO',
  },
  {
    regex: /(?:reingreso|reincorporaci[oó]n|volver a estudiar)/i,
    expanded: 'Reglamento y procedimiento para solicitud de reingreso o reincorporación académica a la USS',
    category: 'MATRICULA',
    intent: 'TRAMITE_REINGRESO',
  },
  {
    regex: /(?:constancia|certificado de estudios|r[eé]cord de notas)/i,
    expanded: 'Procedimiento, requisitos y costo para emisión de constancias de estudio y certificado de notas oficial USS',
    category: 'TRAMITES',
    intent: 'TRAMITE_CONSTANCIAS_NOTAS',
  },
]

/**
 * Normaliza y expande la consulta de un estudiante a terminología institucional formal (NLU Pre-RAG).
 * 1. Primero evalúa reglas heurísticas instantáneas (0ms).
 * 2. Si no coincide y la consulta es compleja, invoca un prompt ultra-rápido con Gemini Flash Lite.
 */
export async function rewriteAndExpandQuery(
  rawQuery: string,
  context?: QueryRewriterContext
): Promise<RewrittenQuery> {
  const clean = rawQuery.trim()
  if (!clean) {
    return { originalQuery: '', expandedQuery: '' }
  }

  // 1. Evaluación rápida heurística (prioritaria para latencia cero)
  for (const item of HEURISTIC_PATTERNS) {
    if (item.regex.test(clean)) {
      return {
        originalQuery: clean,
        expandedQuery: `${clean} - ${item.expanded}`,
        inferredCategory: item.category,
        detectedIntent: item.intent,
      }
    }
  }

  // Si la consulta es muy corta (ej. un saludo o palabra de 1 letra), no expandir
  if (clean.length < 8) {
    return {
      originalQuery: clean,
      expandedQuery: clean,
    }
  }

  // 2. Normalización NLU asistida por IA para consultas ambiguas o coloquiales
  try {
    const model = getLanguageModel(ModelProvider.GEMINI, DOCUMENT_TRANSCRIPTION_MODEL_CODE)
    const rewriteStart = Date.now()

    const { text, usage } = await generateText({
      model,
      system: `Eres un normalizador de consultas institucionales para la Universidad Señor de Sipán (USS).
Tu tarea es convertir la pregunta coloquial o informal de un estudiante en una consulta de búsqueda formal y técnica para un motor de reglamentos universitarios.
Debes responder ÚNICAMENTE un JSON válido con esta estructura:
{
  "expandedQuery": "Texto de búsqueda formal optimizado",
  "inferredCategory": "MATRICULA | PAGOS | CONVALIDACIONES | GRADOS_TITULOS | TRAMITES | BIENESTAR | GENERAL",
  "detectedIntent": "CODIGO_INTENCION_BREVE"
}`,
      prompt: `Consulta del estudiante: "${clean}"`,
      maxOutputTokens: 120,
      abortSignal: AbortSignal.timeout(2500),
    })
    const latencyMs = Date.now() - rewriteStart

    const promptTokens =
      (usage as { promptTokens?: number; inputTokens?: number })?.promptTokens ??
      (usage as { promptTokens?: number; inputTokens?: number })?.inputTokens ??
      Math.max(1, Math.ceil(clean.length / 4))
    const completionTokens =
      (usage as { completionTokens?: number; outputTokens?: number })?.completionTokens ??
      (usage as { completionTokens?: number; outputTokens?: number })?.outputTokens ??
      Math.max(1, Math.ceil(text.length / 4))

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    let parsed: { expandedQuery?: string; inferredCategory?: string; detectedIntent?: string } | null = null
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0])
      } catch {}
    }

    // Registrar consumo de tokens para QUERY_ANALYSIS
    recordTokenUsageLog({
      userId: context?.userId || null,
      conversationId: context?.conversationId || null,
      modelCode: DOCUMENT_TRANSCRIPTION_MODEL_CODE,
      provider: ModelProvider.GEMINI,
      concept: TokenUsageConcept.QUERY_ANALYSIS,
      promptTokens,
      completionTokens,
      latencyMs,
      metadata: {
        rawQuery: clean,
        inferredCategory: parsed?.inferredCategory,
        detectedIntent: parsed?.detectedIntent,
      },
    }).catch((err) => console.warn('[QUERY_ANALYSIS_TOKEN_LOG_WARN]', err))

    if (parsed) {
      return {
        originalQuery: clean,
        expandedQuery: parsed.expandedQuery ? `${clean} ${parsed.expandedQuery}` : clean,
        inferredCategory: parsed.inferredCategory,
        detectedIntent: parsed.detectedIntent,
      }
    }
  } catch {
    // Si falla o excede el timeout (2.5s), continuar con la consulta original sin degradar el chat
  }

  return {
    originalQuery: clean,
    expandedQuery: clean,
  }
}
