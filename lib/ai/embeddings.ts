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

/**
 * Genera el embedding vectorial y los tokens consumidos para un texto o consulta individual
 */
export async function generateEmbeddingWithUsage(
  text: string,
  modelCode: string = DEFAULT_EMBEDDING_MODEL
): Promise<EmbeddingResultWithUsage> {
  const model = getEmbeddingModel('GEMINI', modelCode)
  const clean = text.trim()
  const res = await embed({
    model,
    value: clean,
  })
  return {
    embedding: res.embedding,
    tokens: res.usage?.tokens ?? Math.max(1, Math.ceil(clean.length / 4)),
  }
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
 * Genera embeddings vectoriales y tokens por lotes (batch) para múltiples fragmentos de texto
 */
export async function generateEmbeddingsWithUsage(
  texts: string[],
  modelCode: string = DEFAULT_EMBEDDING_MODEL
): Promise<EmbeddingsBatchResultWithUsage> {
  if (texts.length === 0) return { embeddings: [], tokens: 0 }

  const model = getEmbeddingModel('GEMINI', modelCode)
  const cleanedTexts = texts.map((t) => t.trim())
  const res = await embedMany({
    model,
    values: cleanedTexts,
  })
  const totalChars = cleanedTexts.reduce((acc, t) => acc + t.length, 0)
  return {
    embeddings: res.embeddings,
    tokens: res.usage?.tokens ?? Math.max(1, Math.ceil(totalChars / 4)),
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
