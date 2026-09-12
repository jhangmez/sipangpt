import { embed, embedMany, cosineSimilarity, type EmbeddingModel } from 'ai'
import { google, openai } from '@/lib/ai/providers'
import type { ModelProvider } from '@/lib/prisma'
import { DEFAULT_EMBEDDING_MODEL } from '@/constants'

export { DEFAULT_EMBEDDING_MODEL }

/**
 * Obtiene la instancia del modelo de embeddings según el proveedor
 */
export function getEmbeddingModel(
  provider: ModelProvider | string = 'GEMINI',
  modelCode: string = DEFAULT_EMBEDDING_MODEL
): EmbeddingModel {
  if (provider === 'OPENAI') {
    return openai.textEmbeddingModel(modelCode || 'text-embedding-3-small')
  }

  // Por defecto usar Google Gemini Embeddings (gemini-embedding-2)
  return google.textEmbeddingModel(modelCode || DEFAULT_EMBEDDING_MODEL)
}

export interface EmbeddingResultWithUsage {
  embedding: number[]
  tokens: number
}

export interface EmbeddingsBatchResultWithUsage {
  embeddings: number[][]
  tokens: number
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRateLimitError(error: unknown): boolean {
  if (!error) return false
  const err = error as { statusCode?: number; status?: string; message?: string }
  const msg =
    err.message || (typeof error === 'string' ? error : JSON.stringify(error))
  return (
    err.statusCode === 429 ||
    err.status === 'RESOURCE_EXHAUSTED' ||
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('Quota exceeded') ||
    msg.includes('quotaValue') ||
    msg.includes('rate-limits') ||
    msg.includes('retry in')
  )
}

function extractRetryDelayMs(error: unknown, fallbackMs = 12000): number {
  if (!error) return fallbackMs
  const str =
    typeof error === 'string'
      ? error
      : (error as Error).message || JSON.stringify(error)
  const matchSec =
    str.match(/retry\s+in\s+([0-9.]+)\s*s/i) ||
    str.match(/retryDelay["':\s]+([0-9.]+)\s*s?/i)
  if (matchSec && matchSec[1]) {
    const sec = parseFloat(matchSec[1])
    if (!isNaN(sec) && sec > 0) {
      return Math.ceil(sec * 1000) + 1500 // 1.5s de margen de seguridad
    }
  }
  return fallbackMs
}

/**
 * Tamaño máximo de textos por sublote para respetar los límites de la API (Free Tier: máx 100 por minuto)
 */
const EMBEDDING_BATCH_SIZE = 25
const MAX_RETRIES_PER_BATCH = 5

/**
 * Genera el embedding vectorial y los tokens consumidos para un texto o consulta individual
 */
export async function generateEmbeddingWithUsage(
  text: string,
  modelCode: string = DEFAULT_EMBEDDING_MODEL
): Promise<EmbeddingResultWithUsage> {
  const model = getEmbeddingModel('GEMINI', modelCode)
  const clean = text.trim()
  const MAX_RETRIES = 3

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await embed({
        model,
        value: clean,
      })
      return {
        embedding: res.embedding,
        tokens: res.usage?.tokens ?? Math.max(1, Math.ceil(clean.length / 4)),
      }
    } catch (err) {
      if (attempt === MAX_RETRIES || !isRateLimitError(err)) {
        throw err
      }
      const waitMs = extractRetryDelayMs(err, 8000 * attempt)
      console.warn(
        `[EMBEDDING] ⏳ Rate limit (429) en embedding individual. Esperando ${Math.round(waitMs / 1000)}s antes de reintentar (intento ${attempt}/${MAX_RETRIES})...`
      )
      await sleep(waitMs)
    }
  }
  throw new Error('No fue posible generar el embedding tras agotar los reintentos.')
}

/**
 * Genera el embedding vectorial para un texto o consulta individual
 */
export async function generateEmbedding(
  text: string,
  modelCode: string = DEFAULT_EMBEDDING_MODEL
): Promise<number[]> {
  const res = await generateEmbeddingWithUsage(text, modelCode)
  return res.embedding
}

/**
 * Genera embeddings vectoriales y tokens por lotes (batch) para múltiples fragmentos de texto.
 * Divide los textos en sublotes seguros (25 items) y aplica pausas adaptativas si se alcanza
 * el límite de cuota por minuto de Google Gemini (Error 429).
 */
export async function generateEmbeddingsWithUsage(
  texts: string[],
  modelCode: string = DEFAULT_EMBEDDING_MODEL
): Promise<EmbeddingsBatchResultWithUsage> {
  if (texts.length === 0) return { embeddings: [], tokens: 0 }

  const model = getEmbeddingModel('GEMINI', modelCode)
  const cleanedTexts = texts.map((t) => t.trim())

  // Dividir los textos en sublotes seguros para no saturar los límites de Free Tier
  const batches: string[][] = []
  for (let i = 0; i < cleanedTexts.length; i += EMBEDDING_BATCH_SIZE) {
    batches.push(cleanedTexts.slice(i, i + EMBEDDING_BATCH_SIZE))
  }

  const allEmbeddings: number[][] = []
  let totalUsageTokens = 0

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batchTexts = batches[batchIdx]
    let batchSucceeded = false

    for (let attempt = 1; attempt <= MAX_RETRIES_PER_BATCH; attempt++) {
      try {
        const res = await embedMany({
          model,
          values: batchTexts,
        })

        allEmbeddings.push(...res.embeddings)

        const batchChars = batchTexts.reduce((acc, t) => acc + t.length, 0)
        const usageTokens = res.usage?.tokens
        const safeTokens =
          typeof usageTokens === 'number' && !isNaN(usageTokens) && usageTokens > 0
            ? usageTokens
            : Math.max(1, Math.ceil(batchChars / 4))

        totalUsageTokens += safeTokens
        batchSucceeded = true
        break
      } catch (err) {
        const isRateLimit = isRateLimitError(err)
        if (attempt === MAX_RETRIES_PER_BATCH || !isRateLimit) {
          console.error(
            `[EMBEDDINGS] ❌ Error en sublote ${batchIdx + 1}/${batches.length} (intento ${attempt}):`,
            err
          )
          throw err
        }

        const waitMs = extractRetryDelayMs(err, 12000 * attempt)
        console.warn(
          `[EMBEDDINGS] ⏳ Límite de cuota Free Tier (429) en sublote ${batchIdx + 1}/${batches.length}. Esperando ${Math.round(waitMs / 1000)}s antes de reintentar (intento ${attempt}/${MAX_RETRIES_PER_BATCH})...`
        )
        await sleep(waitMs)
      }
    }

    if (!batchSucceeded) {
      throw new Error(
        `No fue posible generar embeddings para el sublote ${batchIdx + 1}/${batches.length} tras ${MAX_RETRIES_PER_BATCH} intentos.`
      )
    }

    // Pausa preventiva de 600ms entre sublotes consecutivos para no saturar en ráfaga
    if (batchIdx < batches.length - 1) {
      await sleep(600)
    }
  }

  return {
    embeddings: allEmbeddings,
    tokens: totalUsageTokens,
  }
}

/**
 * Genera embeddings vectoriales por lotes (batch) para múltiples fragmentos de texto
 */
export async function generateEmbeddings(
  texts: string[],
  modelCode: string = DEFAULT_EMBEDDING_MODEL
): Promise<number[][]> {
  const res = await generateEmbeddingsWithUsage(texts, modelCode)
  return res.embeddings
}

/**
 * Calcula la similitud de coseno entre dos vectores numéricos
 */
export function computeCosineSimilarity(
  vectorA: number[],
  vectorB: number[]
): number {
  return cosineSimilarity(vectorA, vectorB)
}
