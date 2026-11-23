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
  RAG_INITIAL_CANDIDATES,
  DEFAULT_RAG_TOP_K,
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

/**
 * Detecta fragmentos sin contenido operativo real (portadas/carátulas, índices ToC
 * o preámbulos introductorios generados por el OCR) para excluirlos del reranking.
 */
function isLowValueBoilerplateChunk(
  content: string,
  metadata?: Record<string, unknown> | null
): boolean {
  const bodyWithoutBreadcrumb = content.replace(/^\s*\[[^\]]+\]\s*/u, '').trim()

  const cleanedLines = bodyWithoutBreadcrumb
    .split('\n')
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length > 0 &&
        !/^[-=*_]{3,}$/.test(l) &&
        !/^---\s*P[áa]gina\s+\d+\s*---$/i.test(l)
    )

  const normalizedBody = cleanedLines.join('\n')

  // Guardas de alto valor: tablas Markdown con datos, montos en soles, URLs o correos USS
  const hasRealMarkdownTable =
    /\|[^|\n]+\|[^|\n]+\|/.test(normalizedBody) &&
    (normalizedBody.match(/\|/g) || []).length >= 6
  const hasHighValueFacts =
    /S\/\s*\d/i.test(normalizedBody) ||
    /https?:\/\//i.test(normalizedBody) ||
    /@uss\.edu\.pe/i.test(normalizedBody)

  if (hasRealMarkdownTable || hasHighValueFacts) {
    return false
  }

  const plainText = normalizedBody
    .replace(/[#>*_`~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (plainText.length < 40) {
    return true
  }

  // Patrón A: Preámbulo introductorio generado por Gemini durante el OCR
  const withoutOcrPreamble = plainText
    .replace(
      /A continuaci[oó]n,?\s+se presenta[^.:\n]*(?:estructura|transcripci[oó]n|contenido|documento)[^.:\n]*[.:]?/gi,
      ''
    )
    .replace(/conforme a la arquitectura solicitada[^.:\n]*[.:]?/gi, '')
    .replace(/Aqu[ií] tienes la transcripci[oó]n[^.:\n]*[.:]?/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (withoutOcrPreamble.length < 45) {
    return true
  }

  // Guarda de artículo normativo sustantivo
  if (
    /\b(?:art[íi]culo|art\.?)\s*[0-9]+[A-Za-z\-º°]*/i.test(withoutOcrPreamble) &&
    withoutOcrPreamble.length >= 100
  ) {
    return false
  }

  // Patrón C: Tabla de contenidos / Índice
  const nonEmptyLines = cleanedLines
    .map((l) => l.replace(/^[#>*\-\s]+/, '').trim())
    .filter(Boolean)
  const hasLongProseParagraph = nonEmptyLines.some((l) => l.length >= 220)
  const dotLeaderLines = nonEmptyLines.filter((l) =>
    /(?:\.{3,}|…)\s*\d{1,3}\s*$/.test(l)
  ).length

  if (dotLeaderLines >= 3 && !hasLongProseParagraph) {
    return true
  }

  const breadcrumbStr =
    typeof metadata?.breadcrumb === 'string'
      ? normalizeSearchText(metadata.breadcrumb)
      : ''
  const capituloStr =
    typeof metadata?.capitulo === 'string'
      ? normalizeSearchText(metadata.capitulo)
      : ''
  const firstThreeLinesNorm = nonEmptyLines
    .slice(0, 3)
    .map((l) => normalizeSearchText(l))
    .join(' ')

  const hasTocHeader =
    /\b(?:indice|indice general|tabla de contenidos?|contenido)\b/.test(
      firstThreeLinesNorm
    ) ||
    /\b(?:indice|indice general|tabla de contenidos?)\b/.test(breadcrumbStr) ||
    /\b(?:indice|indice general|tabla de contenidos?)\b/.test(capituloStr)

  if (hasTocHeader && !hasLongProseParagraph) {
    const pageSuffixLines = nonEmptyLines.filter((l) =>
      /\s+\d{1,3}\s*$/.test(l)
    ).length
    const shortLinesCount = nonEmptyLines.filter((l) => l.length <= 85).length
    const hasProceduralUiVerbs =
      /\b(?:clic|click|seleccionar|ingresar|presionar|pulsar|bot[oó]n|deber[aá]|requisitos?)\b/i.test(
        withoutOcrPreamble
      )

    if (
      pageSuffixLines >= 2 ||
      (nonEmptyLines.length >= 4 &&
        shortLinesCount / nonEmptyLines.length >= 0.8 &&
        !hasProceduralUiVerbs)
    ) {
      return true
    }
  }

  // Patrón B: Portada o carátula institucional vacía
  const nonCoverLines = nonEmptyLines.filter((l) => {
    if (l.length > 95) return true
    const normLine = normalizeSearchText(l)
    const isCoverMetaLine =
      /^(?:universidad\s+senor\s+de\s+sipan|vicerrectorado|direccion\s+de|gerencia|oficina\s+de|manual\s+de\s+usuario|reglamento|directiva|tarifario|resolucion|version|codigo\s*:|fecha\s*:|vigencia\s*:|pimentel|chiclayo|peru|\d{4})\b/i.test(
        normLine
      )
    return !isCoverMetaLine
  })

  const substantiveLength = nonCoverLines.reduce((acc, l) => acc + l.length, 0)
  if (substantiveLength < 55) {
    return true
  }

  return false
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
  topK: number = DEFAULT_RAG_TOP_K,
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

    // FASE 3 (RESPALDO TRANSVERSAL): Evitar que un categoryFilter estrecho excluya documentos clave (ej. Tarifario, Pagos Virtuales)
    if (categoryFilter && keywordConditions.length > 0) {
      const crossCategoryChunks = await prisma.documentChunk.findMany({
        where: {
          document: { status: 'INDEXED' },
          OR: keywordConditions,
        },
        take: 25,
        include: chunkInclude,
      })

      for (const chunk of crossCategoryChunks) {
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

    // Filtrar portadas/carátulas, índices ToC y preámbulos introductorios vacíos antes de vectorizar/rerankear
    const filteredCandidates = candidateChunks.filter(
      (c) =>
        !isLowValueBoilerplateChunk(
          c.content,
          c.metadata as Record<string, unknown> | null
        )
    )
    const filteredBoilerplateCount =
      candidateChunks.length - filteredCandidates.length
    if (filteredCandidates.length > 0) {
      candidateChunks = filteredCandidates
    }

    // 3. ETAPA 2 (STAIR): Recuperación Semántica Fina (Leaf Retrieval con Pool Inicial + Reranker Híbrido)
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
          filteredBoilerplateCount,
          initialCandidatesPool: Math.min(
            candidateChunks.length,
            RAG_INITIAL_CANDIDATES
          ),
          missingEmbeddingsCalculated: missingEmbeddingIndices.length,
          tocBranchesMatched: routeMatches.length,
        },
      }).catch((err) => console.warn('[RAG_EMBEDDING_TOKEN_LOG_WARN]', err))

      // Etapa 2A: Similitud coseno inicial y selección de los mejores candidatos para el reranker
      const vectorScored = candidateChunks.map((chunk, idx) => {
        const chunkVector = resolvedEmbeddings[idx]
        const rawSim = chunkVector
          ? computeCosineSimilarity(queryEmbedding, chunkVector)
          : 0.5
        const vectorScore = Math.max(
          0,
          Math.min(1, isNaN(rawSim) ? 0.0 : rawSim)
        )

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
        const tocBoost = isMatchedBranch ? 0.04 : 0

        const source: RetrievedSource = {
          chunkId: chunk.id,
          documentId: chunk.document.id,
          title: chunk.document.title,
          sourceUrl: chunk.document.publicUrl || chunk.document.fileUrl,
          pageNumber: chunk.pageNumber,
          snippetText: chunk.content.trim(),
          relevance: vectorScore,
          embeddingModel: DEFAULT_EMBEDDING_MODEL,
          categoria,
          anioVigencia,
          breadcrumb,
          capitulo,
          articulo,
        }

        return {
          vectorScore,
          tocBoost,
          source,
        }
      })

      // Quedarse con los 25 mejores candidatos iniciales antes del reranker
      const initialPool = vectorScored
        .sort(
          (a, b) =>
            b.vectorScore + b.tocBoost - (a.vectorScore + a.tocBoost)
        )
        .slice(0, RAG_INITIAL_CANDIDATES)

      // Etapa 2B: Reranker híbrido determinista sobre los 25 candidatos
      const normQuery = normalizeSearchText(cleanQuery)
      const normKeywords = Array.from(
        new Set(
          keywords
            .map((w) => normalizeSearchText(w))
            .filter((w) => w.length >= 3 && !SPANISH_STOP_WORDS.has(w))
        )
      )
      const directArtMatch = cleanQuery.match(
        /\b(?:art[íi]culo|art\.?)\s*([0-9]+[A-Za-z\-º°]*)/i
      )
      const directArtNum = directArtMatch
        ? directArtMatch[1].replace(/[º°]/g, '').trim()
        : null
      const directArtRegex = directArtNum
        ? new RegExp(
            `\\b(?:art[íi]culo|art\\.?)\\s*${directArtNum.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![0-9a-z])`,
            'i'
          )
        : null
      const isCostQuery =
        /(?:costo|precio|tasa|tarifa|tarifario|monto|cuanto|soles|uniforme|pago|pagar|derecho|segunda\s+matricula)/i.test(
          normQuery
        )

      const scoredResults: RetrievedSource[] = initialPool.map((item) => {
        const { source, vectorScore, tocBoost } = item
        const normTitle = normalizeSearchText(source.title)
        const normChunkText = normalizeSearchText(
          `${source.title} ${source.breadcrumb || ''} ${source.snippetText}`
        )

        let matchedChunkWords = 0
        let matchedTitleWords = 0
        for (const word of normKeywords) {
          const stem = word.length >= 5 ? word.slice(0, 5) : null
          if (
            normChunkText.includes(word) ||
            (stem !== null && normChunkText.includes(stem))
          ) {
            matchedChunkWords++
          }
          if (
            normTitle.includes(word) ||
            (stem !== null && normTitle.includes(stem))
          ) {
            matchedTitleWords++
          }
        }

        const lexicalCoverage =
          normKeywords.length > 0 ? matchedChunkWords / normKeywords.length : 0
        const lexicalBoost = lexicalCoverage * 0.10
        const titleBoost = Math.min(0.05, matchedTitleWords * 0.025)

        const directArticleBoost =
          directArtRegex &&
          (directArtRegex.test(source.articulo || '') ||
            directArtRegex.test(source.breadcrumb || '') ||
            directArtRegex.test(source.snippetText))
            ? 0.10
            : 0

        const hasCostSignals =
          /S\/\s*\d/i.test(source.snippetText) ||
          /\|[^|\n]+\|/.test(source.snippetText) ||
          normTitle.includes('tarifario')
        const costTableBoost = isCostQuery && hasCostSignals ? 0.08 : 0

        const finalScore = Math.max(
          0,
          Math.min(
            1,
            vectorScore +
              tocBoost +
              lexicalBoost +
              titleBoost +
              directArticleBoost +
              costTableBoost
          )
        )

        return {
          ...source,
          relevance: Number(finalScore.toFixed(3)),
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

