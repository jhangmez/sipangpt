import { prisma, ModelProvider, TokenUsageConcept, Prisma } from '@/lib/prisma'
import {
  generateEmbeddingWithUsage,
  generateEmbeddingsWithUsage,
  computeCosineSimilarity,
  DEFAULT_EMBEDDING_MODEL,
} from '@/lib/ai/embeddings'
import { recordTokenUsageLog } from '@/lib/ai/token-tracker'
import {
  SPANISH_STOP_WORDS,
  extractCleanKeywords,
  UNIVERSAL_CATEGORY_CODES,
} from '@/constants'
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
function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export async function routeQueryToToCBranches(
  query: string,
  keywords: string[],
  categoryFilter?: string | null
): Promise<ToCRouteMatch[]> {
  try {
    const cleanQuery = query.toLowerCase()
    const rawWords = keywords.concat(extractCleanKeywords(cleanQuery))
    const normKeywords = Array.from(
      new Set(
        rawWords
          .map((w) => normalizeSearchText(w))
          .filter((w) => w.length >= 3 && !SPANISH_STOP_WORDS.has(w))
      )
    )

    // Detectar si el usuario menciona un número de artículo directo (ej: "artículo 15", "art 15", "art. 84", "art. 17-A", "art 24°")
    const directArtMatch = cleanQuery.match(/\b(?:art[íi]culo|art\.?)\s*([0-9]+[A-Za-z\-º°]*)/i)
    const directArtNum = directArtMatch
      ? directArtMatch[1].replace(/[º°]/g, '').trim()
      : null

    // Consultar reglamentos indexados con árbol ToC registrado
    const docsWithToc = await prisma.document.findMany({
      where: {
        status: 'INDEXED',
        tocTree: { not: Prisma.JsonNull },
        ...(categoryFilter
          ? {
              OR: [
                { category: { code: categoryFilter } },
                { categoryId: null },
                { category: { code: { in: [...UNIVERSAL_CATEGORY_CODES] } } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        tocTree: true,
      },
      take: 50,
    })

    if (!docsWithToc || docsWithToc.length === 0) {
      return []
    }

    const matches: ToCRouteMatch[] = []

    for (const doc of docsWithToc) {
      const tree = doc.tocTree as unknown as DocumentTocTree
      if (!Array.isArray(tree)) continue

      // Afinidad base del título del documento con la consulta (ej: "cobranza", "matricula", "grados")
      const normDocTitle = normalizeSearchText(doc.title)
      let docBaseScore = 0
      for (const word of normKeywords) {
        if (
          normDocTitle.includes(word) ||
          (word.length >= 5 && normDocTitle.includes(word.slice(0, 5)))
        ) {
          docBaseScore += 0.20
        }
      }

      for (const rootNode of tree) {
        // Puede ser TocSectionItem o TocChapterItem
        const isSection = 'chapters' in rootNode || !('articles' in rootNode)
        const sectionTitle = rootNode.title

        const chapters: TocChapterItem[] = isSection
          ? (rootNode as TocSectionItem).chapters || []
          : [rootNode as TocChapterItem]

        for (const chapter of chapters) {
          const chapTitle = chapter.title
          const normChap = normalizeSearchText(chapTitle)

          // Evaluar afinidad del capítulo con las palabras clave (con soporte de raíces semánticas)
          let chapScore = docBaseScore
          for (const word of normKeywords) {
            if (
              normChap.includes(word) ||
              (word.length >= 5 && normChap.includes(word.slice(0, 5)))
            ) {
              chapScore += 0.25
            }
          }

          // Evaluar artículos contenidos dentro del capítulo
          if (Array.isArray(chapter.articles)) {
            for (const article of chapter.articles) {
              const artTitle = article.title
              const normArt = normalizeSearchText(artTitle)
              const artNum = article.articleNumber

              let artScore = chapScore

              // Coincidencia exacta de número de artículo
              if (
                directArtNum &&
                artNum &&
                artNum.toLowerCase() === directArtNum.toLowerCase()
              ) {
                artScore += 0.70
              }

              // Coincidencias de palabras clave o raíces en el título del artículo
              for (const word of normKeywords) {
                if (
                  normArt.includes(word) ||
                  (word.length >= 5 && normArt.includes(word.slice(0, 5)))
                ) {
                  artScore += 0.35
                }
              }

              // Umbral flexible para no descartar ramas relevantes
              if (artScore >= 0.20) {
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
          if (chapScore >= 0.25) {
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

    // Ordenar ramas por mayor afinidad y retornar las mejores candidatas (ampliado a 6)
    return matches.sort((a, b) => b.score - a.score).slice(0, 6)
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
  topK: number = 4,
  minScore: number = 0.50,
  categoryFilter?: string | null,
  context?: SearchKnowledgeBaseContext
): Promise<RetrievedSource[]> {
  try {
    const cleanQuery = query.trim()
    if (!cleanQuery) return []

    // 1. Extraer términos clave sustantivos (excluyendo stop words de constants/stopwords.ts)
    const keywords = extractCleanKeywords(cleanQuery)

    // 2. ETAPA 1 (STAIR): Enrutamiento por Índice / Poda de Árbol
    const routeMatches = await routeQueryToToCBranches(
      cleanQuery,
      keywords,
      categoryFilter
    )

    const chunkInclude = {
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
    }

    // Mapa de deduplicación para preservar el orden de prioridad
    const candidateMap = new Map<string, any>()

    // FASE 1 (PRIORIDAD ALTA STAIR): Recuperar de forma dedicada los chunks de las ramas ToC afines
    if (routeMatches.length > 0) {
      console.log(
        `[SIPAN_STAIR] 🌳 ToC Routing identificó ${routeMatches.length} ramas normativas afines:`,
        routeMatches.map((r) => `${r.documentTitle} -> ${r.branchTitle} (${Math.round(r.score * 100)}%)`).join(' | ')
      )

      const tocConditions: Array<Record<string, unknown>> = []
      for (const branch of routeMatches) {
        if (branch.articleTitle) {
          tocConditions.push({
            documentId: branch.documentId,
            content: { contains: branch.articleTitle, mode: 'insensitive' as const },
          })
          const artNumMatch = branch.articleTitle.match(/(?:art[íi]culo|art\.?)\s*([0-9]+[A-Za-z\-º°]*)/i)
          if (artNumMatch) {
            tocConditions.push({
              documentId: branch.documentId,
              content: { contains: artNumMatch[0], mode: 'insensitive' as const },
            })
          }
        }
        if (branch.branchTitle) {
          tocConditions.push({
            documentId: branch.documentId,
            content: { contains: branch.branchTitle, mode: 'insensitive' as const },
          })
        }
      }

      if (tocConditions.length > 0) {
        const tocChunks = await prisma.documentChunk.findMany({
          where: {
            document: { status: 'INDEXED' },
            OR: tocConditions,
          },
          take: 40,
          include: chunkInclude,
        })

        for (const chunk of tocChunks) {
          candidateMap.set(chunk.id, chunk)
        }
      }
    }

    // FASE 2 (PRIORIDAD COMPLEMENTARIA): Chunks adicionales por palabras clave sustantivas filtradas por ámbito institucional
    const remainingSlots = Math.max(30, 60 - candidateMap.size)
    const keywordConditions =
      keywords.length > 0
        ? keywords.map((word) => ({
            content: {
              contains: word,
              mode: 'insensitive' as const,
            },
          }))
        : []

    if (keywordConditions.length > 0) {
      const complementaryChunks = await prisma.documentChunk.findMany({
        where: {
          document: {
            status: 'INDEXED',
            ...(categoryFilter
              ? {
                  OR: [
                    { category: { code: categoryFilter } },
                    { categoryId: null },
                    { category: { code: { in: [...UNIVERSAL_CATEGORY_CODES] } } },
                  ],
                }
              : {}),
          },
          OR: keywordConditions,
        },
        take: remainingSlots,
        include: chunkInclude,
      })

      for (const chunk of complementaryChunks) {
        if (!candidateMap.has(chunk.id)) {
          candidateMap.set(chunk.id, chunk)
        }
      }
    }

    let candidateChunks = Array.from(candidateMap.values())

    // Red de Seguridad contra Falsos Negativos (Resiliencia):
    // Si no hubo candidatos, recuperar los chunks indexados más recientes para evaluación vectorial
    if (!candidateChunks || candidateChunks.length === 0) {
      candidateChunks = await prisma.documentChunk.findMany({
        where: {
          document: { status: 'INDEXED' },
        },
        take: 40,
        orderBy: { createdAt: 'desc' },
        include: chunkInclude,
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
        const rawSim = chunkVector
          ? computeCosineSimilarity(queryEmbedding, chunkVector)
          : 0.5
        let similarity = isNaN(rawSim) ? 0.0 : rawSim

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

        const safeRelevance = isNaN(similarity) ? 0.0 : similarity

        return {
          chunkId: chunk.id,
          documentId: chunk.document.id,
          title: chunk.document.title,
          sourceUrl: chunk.document.publicUrl || chunk.document.fileUrl,
          pageNumber: chunk.pageNumber,
          snippetText: chunk.content.trim(),
          relevance: Number(Math.max(0, Math.min(1, safeRelevance)).toFixed(3)),
          embeddingModel: DEFAULT_EMBEDDING_MODEL,
          categoria,
          anioVigencia,
          breadcrumb,
          capitulo,
          articulo,
        }
      })

      // Ordenar por mayor similitud y filtrar por umbral configurado con red de seguridad
      let validResults = scoredResults
        .filter((r) => r.relevance >= minScore)
        .sort((a, b) => b.relevance - a.relevance)

      // Si el umbral estricto no arrojó resultados pero hay candidatos evaluados, recuperar los más afines (>= 0.35)
      if (validResults.length === 0 && scoredResults.length > 0) {
        validResults = scoredResults
          .filter((r) => r.relevance >= 0.35)
          .sort((a, b) => b.relevance - a.relevance)
      }

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

