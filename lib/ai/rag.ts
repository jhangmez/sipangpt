import { prisma, ModelProvider, TokenUsageConcept, Prisma } from '@/lib/prisma'
import {
  generateEmbeddingWithUsage,
  generateEmbeddingsWithUsage,
  computeCosineSimilarity,
  DEFAULT_EMBEDDING_MODEL,
} from '@/lib/ai/embeddings'
import { recordTokenUsageLog } from '@/lib/ai/token-tracker'
import type { DocumentTocTree, ToCRouteMatch, TocChapterItem, TocSectionItem } from '@/types/stair'

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
  breadcrumb?: string | null
  capitulo?: string | null
  articulo?: string | null
}

export interface SearchKnowledgeBaseContext {
  userId?: string | null
  conversationId?: string | null
}

/**
 * ETAPA 1 STAIR: Enrutamiento por Índice (ToC Routing / Poda de Árbol).
 * Evalúa la consulta del estudiante contra los árboles ToC jerárquicos de los reglamentos
 * activos para identificar las ramas normativas (Capítulos y Artículos) más relevantes,
 * descartando cientos de fragmentos ajenos antes de la búsqueda vectorial.
 */
export async function routeQueryToToCBranches(
  query: string,
  keywords: string[],
  categoryFilter?: string | null
): Promise<ToCRouteMatch[]> {
  try {
    const cleanQuery = query.toLowerCase()
    const queryWords = new Set(
      keywords.concat(
        cleanQuery
          .replace(/[¿?¡!.,;:()]/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length > 2)
      )
    )

    // Detectar si el usuario menciona un número de artículo directo (ej: "artículo 15", "art 84")
    const directArtMatch = cleanQuery.match(/(?:art[íi]culo|art\.)\s*([0-9]+)/i)
    const directArtNum = directArtMatch ? directArtMatch[1] : null

    // Consultar reglamentos indexados con árbol ToC registrado
    const docsWithToc = await prisma.document.findMany({
      where: {
        status: 'INDEXED',
        tocTree: { not: Prisma.JsonNull },
        ...(categoryFilter ? { category: { code: categoryFilter } } : {}),
      },
      select: {
        id: true,
        title: true,
        tocTree: true,
      },
      take: 20,
    })

    if (!docsWithToc || docsWithToc.length === 0) {
      return []
    }

    const matches: ToCRouteMatch[] = []

    for (const doc of docsWithToc) {
      const tree = doc.tocTree as unknown as DocumentTocTree
      if (!Array.isArray(tree)) continue

      for (const rootNode of tree) {
        // Puede ser TocSectionItem o TocChapterItem
        const isSection = 'chapters' in rootNode || !('articles' in rootNode)
        const sectionTitle = rootNode.title

        const chapters: TocChapterItem[] = isSection
          ? (rootNode as TocSectionItem).chapters || []
          : [rootNode as TocChapterItem]

        for (const chapter of chapters) {
          const chapTitle = chapter.title
          const chapLower = chapTitle.toLowerCase()

          // Evaluar afinidad del capítulo con las palabras clave
          let chapScore = 0
          for (const word of queryWords) {
            if (chapLower.includes(word)) chapScore += 0.25
          }

          // Evaluar artículos contenidos dentro del capítulo
          if (Array.isArray(chapter.articles)) {
            for (const article of chapter.articles) {
              const artTitle = article.title
              const artLower = artTitle.toLowerCase()
              const artNum = article.articleNumber

              let artScore = chapScore

              // Coincidencia exacta de número de artículo
              if (directArtNum && artNum === directArtNum) {
                artScore += 0.70
              }

              // Coincidencias de palabras clave en el título del artículo
              for (const word of queryWords) {
                if (artLower.includes(word)) {
                  artScore += 0.35
                }
              }

              if (artScore >= 0.35) {
                const breadcrumb = isSection
                  ? `${doc.title} > ${sectionTitle} > ${chapTitle} > ${artTitle}`
                  : `${doc.title} > ${chapTitle} > ${artTitle}`

                matches.push({
                  documentId: doc.id,
                  documentTitle: doc.title,
                  branchTitle: chapTitle,
                  articleTitle: artTitle,
                  breadcrumb,
                  score: Math.min(1.0, artScore),
                })
              }
            }
          }

          // Si el capítulo completo tiene afinidad pero ningún artículo superó el corte individual
          if (chapScore >= 0.40) {
            const breadcrumb = isSection
              ? `${doc.title} > ${sectionTitle} > ${chapTitle}`
              : `${doc.title} > ${chapTitle}`

            matches.push({
              documentId: doc.id,
              documentTitle: doc.title,
              branchTitle: chapTitle,
              breadcrumb,
              score: Math.min(1.0, chapScore),
            })
          }
        }
      }
    }

    // Ordenar ramas por mayor afinidad y retornar las mejores candidatas
    return matches.sort((a, b) => b.score - a.score).slice(0, 5)
  } catch (err) {
    console.warn('[STAIR_TOC_ROUTING_WARN] Fallo al enrutar ramas ToC:', err)
    return []
  }
}

/**
 * Búsqueda semántica y contextual en la base de conocimiento universitaria (RAG).
 * Implementa la arquitectura SIPÁN-STAIR en 2 Etapas:
 * - Etapa 1: ToC Routing / Poda de Árbol (identifica ramas y artículos normativos afines).
 * - Etapa 2: Recuperación Semántica en Ramas Podadas (Leaf Retrieval) con embeddings
 *   persistidos y breadcrumbs jerárquicos inyectados.
 */
export async function searchKnowledgeBase(
  query: string,
  topK: number = 3,
  minScore: number = 0.50,
  categoryFilter?: string | null,
  context?: SearchKnowledgeBaseContext
): Promise<RetrievedSource[]> {
  try {
    const cleanQuery = query.trim()
    if (!cleanQuery) return []

    // 1. Extraer términos clave para pre-filtrado y ToC routing
    const keywords = cleanQuery
      .toLowerCase()
      .replace(/[¿?¡!.,;:()]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2)

    // 2. ETAPA 1 (STAIR): Enrutamiento por Índice / Poda de Árbol
    const routeMatches = await routeQueryToToCBranches(
      cleanQuery,
      keywords,
      categoryFilter
    )

    const candidateConditions: Array<Record<string, unknown>> = []

    // Si el enrutador ToC identificó ramas normativas candidatas, priorizar sus chunks
    if (routeMatches.length > 0) {
      console.log(
        `[SIPAN_STAIR] 🌳 ToC Routing identificó ${routeMatches.length} ramas normativas afines:`,
        routeMatches.map((r) => `${r.documentTitle} -> ${r.branchTitle} (${Math.round(r.score * 100)}%)`).join(' | ')
      )

      for (const branch of routeMatches) {
        // Filtrar por documento y fragmentos que pertenezcan a esa rama o artículo
        const branchKeywords = [branch.branchTitle, branch.articleTitle]
          .filter(Boolean)
          .join(' ')
          .replace(/[#*]/g, '')
          .trim()

        if (branch.articleTitle) {
          candidateConditions.push({
            documentId: branch.documentId,
            content: { contains: branch.articleTitle, mode: 'insensitive' as const },
          })
        }
        if (branch.branchTitle) {
          candidateConditions.push({
            documentId: branch.documentId,
            content: { contains: branch.branchTitle, mode: 'insensitive' as const },
          })
        }
      }
    }

    // Coincidencias por categoría institucional inferida
    if (categoryFilter) {
      candidateConditions.push({
        document: {
          status: 'INDEXED',
          category: { code: categoryFilter },
        },
      })
    }

    // Coincidencias complementarias por palabras clave normativas
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
      take: Math.max(topK * 12, 60),
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

    // Red de Seguridad contra Falsos Negativos (Resiliencia):
    // Si no hubo candidatos, recuperar los chunks indexados más recientes para evaluación vectorial
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

    // 3. ETAPA 2 (STAIR): Recuperación Semántica Fina (Leaf Retrieval con Similitud Coseno)
    try {
      const embStartTime = Date.now()
      const { embedding: queryEmbedding, tokens: queryTokens } =
        await generateEmbeddingWithUsage(cleanQuery)
      let totalRagTokens = queryTokens

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
        const { embeddings: generated, tokens: batchTokens } =
          await generateEmbeddingsWithUsage(missingTexts)
        totalRagTokens += batchTokens
        missingEmbeddingIndices.forEach((chunkIdx, listIdx) => {
          resolvedEmbeddings[chunkIdx] = generated[listIdx] || null
        })
      }
      const embDurationMs = Date.now() - embStartTime

      // Registrar consumo de tokens para RAG_EMBEDDING
      recordTokenUsageLog({
        userId: context?.userId || null,
        conversationId: context?.conversationId || null,
        modelCode: DEFAULT_EMBEDDING_MODEL,
        provider: ModelProvider.GEMINI,
        concept: TokenUsageConcept.RAG_EMBEDDING,
        promptTokens: totalRagTokens,
        completionTokens: 0,
        latencyMs: embDurationMs,
        metadata: {
          queryLength: cleanQuery.length,
          candidatesEvaluated: candidateChunks.length,
          missingEmbeddingsCalculated: missingEmbeddingIndices.length,
          tocBranchesMatched: routeMatches.length,
        },
      }).catch((err) => console.warn('[RAG_EMBEDDING_TOKEN_LOG_WARN]', err))

      // Calcular similitud coseno sobre cada fragmento e inyectar metadatos STAIR
      const scoredResults: RetrievedSource[] = candidateChunks.map((chunk, idx) => {
        const chunkVector = resolvedEmbeddings[idx]
        let similarity = chunkVector
          ? computeCosineSimilarity(queryEmbedding, chunkVector)
          : 0.5

        const meta = chunk.metadata as Record<string, unknown> | null
        const categoria =
          (meta?.categoria as string) || chunk.document.category?.code || null
        const anioVigencia =
          typeof meta?.anio_vigencia === 'number' ? meta.anio_vigencia : 2026

        // Extraer metadatos jerárquicos STAIR
        const breadcrumb =
          (meta?.breadcrumb as string) ||
          `${chunk.document.title}${chunk.pageNumber ? ` > Pág. ${chunk.pageNumber}` : ''}`
        const capitulo = (meta?.capitulo as string) || null
        const articulo = (meta?.articulo as string) || null

        // Boost sutil si el chunk coincide con una de las ramas identificadas en ToC Routing
        const isMatchedBranch = routeMatches.some(
          (m) =>
            m.documentId === chunk.document.id &&
            ((capitulo && m.branchTitle.includes(capitulo)) ||
              (articulo && m.articleTitle && m.articleTitle.includes(articulo)))
        )
        if (isMatchedBranch) {
          similarity = Math.min(1.0, similarity + 0.05)
        }

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
          breadcrumb,
          capitulo,
          articulo,
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
        const breadcrumb =
          (meta?.breadcrumb as string) ||
          `${chunk.document.title}${chunk.pageNumber ? ` > Pág. ${chunk.pageNumber}` : ''}`
        const capitulo = (meta?.capitulo as string) || null
        const articulo = (meta?.articulo as string) || null

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
          breadcrumb,
          capitulo,
          articulo,
        }
      })
    }
  } catch (error) {
    console.error('[RAG_SEARCH_ERROR]', error)
    return []
  }
}

