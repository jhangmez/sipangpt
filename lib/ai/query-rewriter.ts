import { generateText } from 'ai'
import type { GoogleLanguageModelOptions } from '@ai-sdk/google'
import { getLanguageModel } from '@/lib/ai/providers'
import { ModelProvider, TokenUsageConcept } from '@/lib/prisma'
import {
  DEFAULT_THINKING_LEVEL,
  QUERY_REWRITER_MODEL_CODE,
} from '@/constants/models'
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

export interface ConversationTurnHint {
  role: 'user' | 'assistant'
  text: string
}

// Diccionario heurístico de expresiones estudiantiles frecuentes (0 latencia / 0 tokens)
const HEURISTIC_PATTERNS: Array<{
  regex: RegExp
  expanded: string
  category: string
  intent: string
}> = [
  {
    regex: /(?:fecha(?:s)?\s+(?:de\s+)?(?:pago|vencimiento)\s+(?:de\s+)?(?:pensi[oó]n|pensiones|cuota|cuotas|mensualidad)|vencimiento\s+(?:de\s+)?(?:pensi[oó]n|pensiones|cuota|cuotas|mensualidad)|cronograma\s+(?:de\s+)?(?:pagos|pensiones|vencimientos?)|cu[aá]ndo\s+vence\s+(?:la\s+)?(?:pensi[oó]n|cuota|mensualidad)|mensualidad(?:es)?|pensi[oó]n|pensiones|\bsin\s+mora\b|recargo(?:s)?\s+(?:por\s+)?mora|gasto(?:s)?\s+administrativo(?:s)?\s+(?:por\s+)?mora)/i,
    expanded: 'Cronograma de vencimiento de pensiones, fechas de pago y recargos por mora semestre académico USS',
    category: 'PAGOS_PENSIONES',
    intent: 'CONSULTA_PAGOS_PENSIONES',
  },
  {
    regex: /(?:admisi[oó]n|postular|postulante|examen de admisi[oó]n|centro pre)/i,
    expanded: 'Modalidades de ingreso, examen de admisión ordinario y requisitos de postulación USS',
    category: 'ADMISION',
    intent: 'CONSULTA_ADMISION',
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
    category: 'MATRICULA',
    intent: 'CONSULTA_EXAMEN_APLAZADOS',
  },
  {
    regex: /(?:bachiller|t[ií]tulo|titulaci[oó]n|sustentar|tesis)/i,
    expanded: 'Reglamento de grados y títulos, requisitos académicos y modalidades de titulación profesional USS',
    category: 'GRADOS_TITULOS',
    intent: 'CONSULTA_GRADOS_TITULOS',
  },
  {
    regex: /(?:beca|descuento|bienestar|apoyo econ[oó]mico|rendimiento acad[eé]mico)/i,
    expanded: 'Reglamento de becas, categorización socioeconómica y beneficios de bienestar universitario USS',
    category: 'BECAS',
    intent: 'CONSULTA_BECAS',
  },
  {
    regex: /(?:carn[eé]|carnet universitario|duplicado de carn[eé])/i,
    expanded: 'Trámite, pago de tasas y solicitud de expedición o duplicado de carné universitario SUNEDU USS',
    category: 'OTROS',
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
    category: 'OTROS',
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
  context?: QueryRewriterContext,
  recentHistory?: ConversationTurnHint[]
): Promise<RewrittenQuery> {
  const clean = rawQuery.trim()
  if (!clean) {
    return { originalQuery: '', expandedQuery: '' }
  }

  const normalizedHistory = (recentHistory ?? [])
    .map((turn) => ({
      role: turn.role,
      text: turn.text.trim(),
    }))
    .filter((turn) => turn.text.length > 0)
    .slice(-4)
  const hasHistory = normalizedHistory.length > 0

  // 1. Evaluación rápida heurística solo en consultas monoturno (sin historial previo que condensar)
  if (!hasHistory) {
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
  }

  // 2. Normalización NLU / condensación multiturno asistida por IA (modelo rápido Flash Lite)
  try {
    const model = getLanguageModel(ModelProvider.GEMINI, QUERY_REWRITER_MODEL_CODE)
    const rewriteStart = Date.now()
    const historyBlock = hasHistory
      ? `Historial reciente de la conversación:\n${normalizedHistory
          .map((turn) => {
            const label = turn.role === 'user' ? 'Estudiante' : 'SipánGPT'
            const excerpt =
              turn.text.length > 450
                ? `${turn.text.slice(0, 450)}...`
                : turn.text
            return `${label}: "${excerpt}"`
          })
          .join('\n')}\n\n`
      : ''

    const { text, usage } = await generateText({
      model,
      system: `Eres un normalizador de consultas institucionales para la Universidad Señor de Sipán (USS).
Tu tarea es convertir la pregunta coloquial, elíptica o informal de un estudiante en una consulta de búsqueda formal, técnica y autónoma para un motor de reglamentos y manuales universitarios.
${hasHistory ? 'Si la consulta actual depende de turnos anteriores (referencias implícitas o continuación de un tema previo), DEBES incorporar explícitamente la carrera, escuela profesional, asignatura, nivel, reglamento o trámite del historial dentro de "expandedQuery" para que la consulta se entienda por sí sola.' : ''}
Debes responder ÚNICAMENTE un JSON válido con esta estructura:
{
  "expandedQuery": "Texto de búsqueda formal autónomo optimizado",
  "inferredCategory": "ADMISION | MATRICULA | PAGOS_PENSIONES | CONVALIDACIONES | GRADOS_TITULOS | BECAS | OTROS | GENERAL",
  "detectedIntent": "CODIGO_INTENCION_BREVE"
}`,
      prompt: `${historyBlock}Consulta actual del estudiante: "${clean}"`,
      maxOutputTokens: hasHistory ? 512 : 384,
      reasoning: DEFAULT_THINKING_LEVEL,
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingLevel: DEFAULT_THINKING_LEVEL,
          },
        } satisfies GoogleLanguageModelOptions,
      },
      abortSignal: AbortSignal.timeout(hasHistory ? 4500 : 3500),
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

    // Normalizar categoría inferida para que coincida 100% con los códigos canónicos de la base de datos
    let normalizedCategory: string | undefined = undefined
    if (parsed?.inferredCategory) {
      let cat = parsed.inferredCategory.trim().toUpperCase()
      if (cat === 'PAGOS' || cat === 'PAGOS_Y_PENSIONES') cat = 'PAGOS_PENSIONES'
      if (cat === 'TRAMITES' || cat === 'SERVICIOS') cat = 'OTROS'
      if (cat === 'BIENESTAR' || cat === 'BIENESTAR_UNIVERSITARIO') cat = 'BECAS'
      if (cat === 'EVALUACION' || cat === 'ACADEMICO') cat = 'MATRICULA'
      normalizedCategory = cat
    }

    // Registrar consumo de tokens para QUERY_ANALYSIS
    recordTokenUsageLog({
      userId: context?.userId || null,
      conversationId: context?.conversationId || null,
      modelCode: QUERY_REWRITER_MODEL_CODE,
      provider: ModelProvider.GEMINI,
      concept: TokenUsageConcept.QUERY_ANALYSIS,
      promptTokens,
      completionTokens,
      latencyMs,
      metadata: {
        rawQuery: clean,
        hasHistory,
        inferredCategory: normalizedCategory || parsed?.inferredCategory,
        detectedIntent: parsed?.detectedIntent,
      },
    }).catch((err) => console.warn('[QUERY_ANALYSIS_TOKEN_LOG_WARN]', err))

    if (parsed) {
      const condensed = parsed.expandedQuery?.trim()
      return {
        originalQuery: clean,
        expandedQuery: condensed
          ? hasHistory
            ? condensed.toLowerCase().includes(clean.toLowerCase())
              ? condensed
              : `${condensed} (${clean})`
            : `${clean} ${condensed}`
          : clean,
        inferredCategory: normalizedCategory || parsed.inferredCategory,
        detectedIntent: parsed.detectedIntent,
      }
    }
  } catch {
    // Si falla o excede el timeout, aplicar respaldo contextual sin degradar el chat
  }

  if (hasHistory) {
    const lastPrevUserTurn =
      [...normalizedHistory].reverse().find((t) => t.role === 'user') ??
      normalizedHistory[normalizedHistory.length - 1]
    return {
      originalQuery: clean,
      expandedQuery: `${lastPrevUserTurn.text.slice(0, 200)} ${clean}`,
    }
  }

  return {
    originalQuery: clean,
    expandedQuery: clean,
  }
}
