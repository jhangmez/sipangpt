import { prisma } from '@/lib/prisma'
import {
  generateEmbedding,
  generateEmbeddings,
  computeCosineSimilarity,
  DEFAULT_EMBEDDING_MODEL,
} from '@/lib/ai/embeddings'

export interface RetrievedSource {
  chunkId?: string | null
  documentId: string
  title: string
  sourceUrl?: string | null
  pageNumber?: number | null
  snippetText: string
  relevance: number
  embeddingModel?: string
  categoria?: string | null
  anioVigencia?: number | null
}

/**
 * Búsqueda semántica y contextual en la base de conocimiento universitaria (RAG).
 * Implementa una arquitectura híbrida en 2 capas:
 * - Capa 1: Filtrado determinista por metadatos (estado activo/indexado, categoría institucional)
 *   con fallback resiliente para evitar falsos negativos si la consulta no coincide léxicamente.
 * - Capa 2: Similitud coseno vectorial utilizando embeddings persistidos en metadata (evita re-cálculos).
 */
export async function searchKnowledgeBase(
  query: string,
  topK: number = 3,
  minScore: number = 0.50,
  categoryFilter?: string | null
): Promise<RetrievedSource[]> {
  try {
    const cleanQuery = query.trim()
    if (!cleanQuery) return []

    // 1. Obtener términos clave para pre-filtrado determinista (Capa 1)
    const keywords = cleanQuery
      .toLowerCase()
      .replace(/[¿?¡!.,;:()]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2)

    // 2. Capa 1: Filtro Híbrido Resiliente por Metadatos y Documentos Activos
    const candidateConditions: Array<Record<string, unknown>> = []

    // Si tenemos categoría inferida por NLU, incluirla sin forzar contains de palabra
    if (categoryFilter) {
      candidateConditions.push({
        document: {
          status: 'INDEXED',
          category: { code: categoryFilter },
        },
      })
    }

    // Coincidencias por palabras clave normativas
    if (keywords.length > 0) {
      keywords.forEach((word) => {
        candidateConditions.push({
          content: {
            contains: word,
            mode: 'insensitive' as const,
          },
        })
      })
    }

    let candidateChunks = await prisma.documentChunk.findMany({
      where: {
        document: { status: 'INDEXED' },
        ...(candidateConditions.length > 0 ? { OR: candidateConditions } : {}),
      },
      take: Math.max(topK * 10, 50),
      include: {
        document: {
          select: {
            id: true,
            title: true,
            publicUrl: true,
            fileUrl: true,
            category: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
    })

    // Red de Seguridad contra Falsos Negativos: Si la búsqueda léxica/categoria no devolvió candidatos,
    // recuperar los chunks indexados más recientes para que la similitud coseno vectorial evalúe semánticamente
    if (!candidateChunks || candidateChunks.length === 0) {
      candidateChunks = await prisma.documentChunk.findMany({
        where: {
          document: { status: 'INDEXED' },
        },
        take: 40,
        orderBy: { createdAt: 'desc' },
        include: {
          document: {
            select: {
              id: true,
              title: true,
              publicUrl: true,
              fileUrl: true,
              category: {
                select: {
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      })
    }

    if (!candidateChunks || candidateChunks.length === 0) {
      return []
    }

    // 3. Capa 2: Similitud Coseno de Embeddings Vectoriales (Estrategia 2 y 4)
    try {
      const queryEmbedding = await generateEmbedding(cleanQuery)

      // Separar chunks con embeddings ya persistidos de aquellos históricos que requieran cálculo
      const missingEmbeddingIndices: number[] = []
      const resolvedEmbeddings: (number[] | null)[] = candidateChunks.map((c, idx) => {
        const meta = c.metadata as Record<string, unknown> | null
        if (meta && Array.isArray(meta.embedding) && meta.embedding.length > 0) {
          return meta.embedding as number[]
        }
        missingEmbeddingIndices.push(idx)
        return null
      })

      // Si hay chunks históricos sin vector en metadata, generarlos en lote bajo demanda
      if (missingEmbeddingIndices.length > 0) {
        const missingTexts = missingEmbeddingIndices.map((i) => candidateChunks[i].content)
        const generated = await generateEmbeddings(missingTexts)
        missingEmbeddingIndices.forEach((chunkIdx, listIdx) => {
          resolvedEmbeddings[chunkIdx] = generated[listIdx] || null
        })
      }

      // Calcular similitud coseno sobre cada fragmento e inyectar metadatos de negocio
      const scoredResults: RetrievedSource[] = candidateChunks.map((chunk, idx) => {
        const chunkVector = resolvedEmbeddings[idx]
        const similarity = chunkVector
          ? computeCosineSimilarity(queryEmbedding, chunkVector)
          : 0.5

        const meta = chunk.metadata as Record<string, unknown> | null
        const categoria =
          (meta?.categoria as string) || chunk.document.category?.code || null
        const anioVigencia =
          typeof meta?.anio_vigencia === 'number' ? meta.anio_vigencia : 2026

        return {
          chunkId: chunk.id,
          documentId: chunk.document.id,
          title: chunk.document.title,
          sourceUrl: chunk.document.publicUrl || chunk.document.fileUrl,
          pageNumber: chunk.pageNumber,
          snippetText: chunk.content.trim(),
          relevance: Number(Math.max(0, Math.min(1, similarity)).toFixed(3)),
          embeddingModel: DEFAULT_EMBEDDING_MODEL,
          categoria,
          anioVigencia,
        }
      })

      // Ordenar por mayor similitud y filtrar por umbral configurado
      const validResults = scoredResults
        .filter((r) => r.relevance >= minScore)
        .sort((a, b) => b.relevance - a.relevance)

      return validResults.slice(0, topK)
    } catch (embErr) {
      console.warn(
        '[RAG_EMBEDDING_FALLBACK] Error en comparación vectorial, usando ranking léxico:',
        embErr
      )

      // Fallback a ranking léxico si falla el servicio de embeddings
      return candidateChunks.slice(0, topK).map((chunk, idx) => {
        const meta = chunk.metadata as Record<string, unknown> | null
        return {
          chunkId: chunk.id,
          documentId: chunk.document.id,
          title: chunk.document.title,
          sourceUrl: chunk.document.publicUrl || chunk.document.fileUrl,
          pageNumber: chunk.pageNumber,
          snippetText: chunk.content.trim(),
          relevance: Number((0.95 - idx * 0.05).toFixed(2)),
          embeddingModel: 'lexical-fallback',
          categoria:
            (meta?.categoria as string) || chunk.document.category?.code || null,
          anioVigencia:
            typeof meta?.anio_vigencia === 'number' ? meta.anio_vigencia : 2026,
        }
      })
    }
  } catch (error) {
    console.error('[RAG_SEARCH_ERROR]', error)
    return []
  }
}
