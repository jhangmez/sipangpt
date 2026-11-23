import { prisma, ModelProvider, TokenUsageConcept, Prisma } from '@/lib/prisma'
import {
  generateEmbeddingWithUsage,
  generateEmbeddingsWithUsage,
  DEFAULT_EMBEDDING_MODEL,
} from '@/lib/ai/embeddings'
import { recordTokenUsageLog } from '@/lib/ai/token-tracker'
import {
  SPANISH_STOP_WORDS,
  extractCleanKeywords,
  RAG_INITIAL_CANDIDATES,
  DEFAULT_RAG_TOP_K,
  RAG_CACHE_TTL_MS,
  RAG_LEXICAL_CANDIDATES,
  RAG_NEIGHBOR_TOP_WINNERS,
  RAG_MAX_MERGED_CHUNK_CHARS,
} from '@/constants'
import type {
  DocumentTocTree,
  ToCRouteMatch,
  TocChapterItem,
  TocSectionItem,
} from '@/types/stair'

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

interface CachedChunk {
  id: string
  documentId: string
  chunkIndex: number
  title: string
  normTitle: string
  sourceUrl: string | null
  pageNumber: number | null
  content: string
  normContent: string
  categoria: string | null
  anioVigencia: number
  breadcrumb: string
  baseBreadcrumb: string
  capitulo: string | null
  articulo: string | null
  unitVector: Float32Array | null
  tokenFreqs: Map<string, number>
  tokenCount: number
  hasCostSignals: boolean
}

interface RagMemoryCache {
  versionKey: string
  loadedAt: number
  filteredBoilerplateCount: number
  chunks: CachedChunk[]
  byDocChunk: Map<string, CachedChunk>
  idfMap: Map<string, number>
  avgTokenCount: number
}

interface RagCacheStore {
  cache: RagMemoryCache | null
  loadingPromise: Promise<RagMemoryCache> | null
}

const globalForRag = globalThis as unknown as {
  __sipanRagCacheStore?: RagCacheStore
}

const ragStore: RagCacheStore = globalForRag.__sipanRagCacheStore ?? {
  cache: null,
  loadingPromise: null,
}
globalForRag.__sipanRagCacheStore = ragStore

/**
 * Invalida el índice vectorial en memoria para forzar recarga limpia tras
 * cualquier alta, edición, re-procesamiento, desindexación o eliminación.
 */
export function invalidateRagCache(): void {
  ragStore.cache = null
  ragStore.loadingPromise = null
}

function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/** Pre-normaliza un vector embedding a longitud unitaria L2 en Float32Array. */
function toUnitFloat32Array(vec: unknown): Float32Array | null {
  if (!Array.isArray(vec) || vec.length === 0) return null
  const arr = new Float32Array(vec.length)
  let normSq = 0
  for (let i = 0; i < vec.length; i++) {
    const v = Number(vec[i])
    if (!Number.isFinite(v)) return null
    arr[i] = v
    normSq += v * v
  }
  if (normSq <= 0) return null
  const invNorm = 1 / Math.sqrt(normSq)
  for (let i = 0; i < arr.length; i++) {
    arr[i] *= invNorm
  }
  return arr
}

/** Producto punto directo entre vectores L2 pre-normalizados (= similitud coseno). */
function dotUnitVectors(a: Float32Array, b: Float32Array): number {
  const len = Math.min(a.length, b.length)
  let dot = 0
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i]
  }
  return dot
}

/**
 * Tokeniza texto para BM25 preservando identificadores literales con guion o guion bajo
 * (ej. `total_mora`, `e-library`) además de sus sub-términos individuales.
 */
function tokenizeForBm25(text: string): string[] {
  const norm = normalizeSearchText(text)
  if (!norm) return []
  const matches = norm.match(/[a-z0-9]+(?:[_-][a-z0-9]+)*/g)
  if (!matches) return []

  const tokens: string[] = []
  for (const token of matches) {
    if (token.length >= 2 && !SPANISH_STOP_WORDS.has(token)) {
      tokens.push(token)
    }
    if (token.includes('_') || token.includes('-')) {
      const subParts = token.split(/[_-]+/)
      for (const part of subParts) {
        if (part.length >= 2 && !SPANISH_STOP_WORDS.has(part)) {
          tokens.push(part)
        }
      }
    }
  }
  return tokens
}

function stripLeadingBreadcrumb(content: string): string {
  return content.replace(/^\s*\[[^\]]+\]\s*/u, '').trim()
}

function stripPartSuffix(breadcrumb: string): string {
  return breadcrumb.replace(/\s*\(Parte\s+\d+\/\d+\)\s*$/i, '').trim()
}

function isSameSectionOrSeries(a: CachedChunk, b: CachedChunk): boolean {
  if (a.documentId !== b.documentId) return false
  if (a.articulo && b.articulo && a.articulo === b.articulo) return true
  if (a.baseBreadcrumb && b.baseBreadcrumb && a.baseBreadcrumb === b.baseBreadcrumb) {
    return true
  }
  if (a.capitulo && b.capitulo && a.capitulo === b.capitulo) return true
  return false
}

/**
 * Detecta fragmentos sin contenido operativo real (portadas/carátulas, índices ToC
 * o preámbulos introductorios generados por el OCR) para excluirlos del índice.
 */
function isLowValueBoilerplateChunk(
  content: string,
  metadata?: Record<string, unknown> | null
): boolean {
  const bodyWithoutBreadcrumb = stripLeadingBreadcrumb(content)

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

async function getIndexedCorpusVersionKey(): Promise<string> {
  const agg = await prisma.document.aggregate({
    where: { status: 'INDEXED' },
    _max: { updatedAt: true },
    _count: { id: true },
  })
  const maxTs = agg._max.updatedAt ? agg._max.updatedAt.getTime() : 0
  return `${agg._count.id}:${maxTs}`
}

async function loadRagCacheFromDb(versionKey: string): Promise<RagMemoryCache> {
  const rows = await prisma.documentChunk.findMany({
    where: {
      document: { status: 'INDEXED' },
    },
    orderBy: [{ documentId: 'asc' }, { chunkIndex: 'asc' }],
    select: {
      id: true,
      documentId: true,
      chunkIndex: true,
      content: true,
      pageNumber: true,
      metadata: true,
      document: {
        select: {
          id: true,
          title: true,
          publicUrl: true,
          fileUrl: true,
          category: {
            select: {
              code: true,
            },
          },
        },
      },
    },
  })

  if (rows.length === 0) {
    return {
      versionKey,
      loadedAt: Date.now(),
      filteredBoilerplateCount: 0,
      chunks: [],
      byDocChunk: new Map(),
      idfMap: new Map(),
      avgTokenCount: 1,
    }
  }

  // Filtrar portadas, índices ToC y preámbulos OCR una sola vez al poblar el caché
  const filteredRows = rows.filter(
    (r) =>
      !isLowValueBoilerplateChunk(
        r.content,
        r.metadata as Record<string, unknown> | null
      )
  )
  const filteredBoilerplateCount = rows.length - filteredRows.length
  const activeRows = filteredRows.length > 0 ? filteredRows : rows

  // Identificar chunks sin vector persistido para generarlos bajo demanda una única vez
  const missingEmbeddingIndices: number[] = []
  const unitVectors: (Float32Array | null)[] = activeRows.map((row, idx) => {
    const meta = row.metadata as Record<string, unknown> | null
    const unitVec = toUnitFloat32Array(meta?.embedding)
    if (!unitVec) {
      missingEmbeddingIndices.push(idx)
    }
    return unitVec
  })

  if (missingEmbeddingIndices.length > 0) {
    try {
      const missingTexts = missingEmbeddingIndices.map(
        (i) => activeRows[i].content
      )
      const { embeddings: generated } =
        await generateEmbeddingsWithUsage(missingTexts)
      missingEmbeddingIndices.forEach((rowIdx, listIdx) => {
        unitVectors[rowIdx] = toUnitFloat32Array(generated[listIdx])
      })
    } catch (embBatchErr) {
      console.warn(
        '[RAG_CACHE_EMBEDDING_BACKFILL_WARN] No se pudieron generar embeddings faltantes durante la carga:',
        embBatchErr
      )
    }
  }

  const chunks: CachedChunk[] = []
  const byDocChunk = new Map<string, CachedChunk>()
  const dfMap = new Map<string, number>()
  let totalTokenCount = 0

  for (let i = 0; i < activeRows.length; i++) {
    const row = activeRows[i]
    const meta = row.metadata as Record<string, unknown> | null
    const title = row.document.title
    const normTitle = normalizeSearchText(title)
    const content = row.content.trim()
    const breadcrumb =
      (meta?.breadcrumb as string) ||
      `${title}${row.pageNumber ? ` > Pág. ${row.pageNumber}` : ''}`
    const baseBreadcrumb = stripPartSuffix(breadcrumb)
    const normContent = normalizeSearchText(`${title} ${breadcrumb} ${content}`)
    const categoria =
      (meta?.categoria as string) || row.document.category?.code || null
    const anioVigencia =
      typeof meta?.anio_vigencia === 'number' ? meta.anio_vigencia : 2026
    const capitulo = (meta?.capitulo as string) || null
    const articulo = (meta?.articulo as string) || null

    const tokens = tokenizeForBm25(`${title} ${breadcrumb} ${content}`)
    const tokenFreqs = new Map<string, number>()
    for (const t of tokens) {
      tokenFreqs.set(t, (tokenFreqs.get(t) || 0) + 1)
    }
    for (const uniqueTerm of tokenFreqs.keys()) {
      dfMap.set(uniqueTerm, (dfMap.get(uniqueTerm) || 0) + 1)
    }
    totalTokenCount += tokens.length

    const hasCostSignals =
      /S\/\s*\d/i.test(content) ||
      /\|[^|\n]+\|/.test(content) ||
      normTitle.includes('tarifario')

    const cachedChunk: CachedChunk = {
      id: row.id,
      documentId: row.document.id,
      chunkIndex: row.chunkIndex,
      title,
      normTitle,
      sourceUrl: row.document.publicUrl || row.document.fileUrl,
      pageNumber: row.pageNumber,
      content,
      normContent,
      categoria,
      anioVigencia,
      breadcrumb,
      baseBreadcrumb,
      capitulo,
      articulo,
      unitVector: unitVectors[i],
      tokenFreqs,
      tokenCount: tokens.length,
      hasCostSignals,
    }

    chunks.push(cachedChunk)
    byDocChunk.set(`${row.document.id}:${row.chunkIndex}`, cachedChunk)
  }

  const N = chunks.length
  const idfMap = new Map<string, number>()
  if (N > 0) {
    for (const [term, df] of dfMap.entries()) {
      idfMap.set(term, Math.log((N - df + 0.5) / (df + 0.5) + 1))
    }
  }

  const avgTokenCount = N > 0 ? Math.max(1, totalTokenCount / N) : 1

  console.log(
    `[SIPAN_STAIR_CACHE] ⚡ Índice en memoria cargado (${N} chunks activos, ${filteredBoilerplateCount} boilerplate filtrados, versión ${versionKey})`
  )

  return {
    versionKey,
    loadedAt: Date.now(),
    filteredBoilerplateCount,
    chunks,
    byDocChunk,
    idfMap,
    avgTokenCount,
  }
}

/**
 * Obtiene el índice vectorial en memoria validado contra DB (versionKey + TTL)
 * con patrón single-flight (`loadingPromise`) anti-estampida.
 */
async function getOrLoadRagCache(): Promise<RagMemoryCache> {
  const versionKey = await getIndexedCorpusVersionKey()
  const now = Date.now()

  if (
    ragStore.cache &&
    ragStore.cache.versionKey === versionKey &&
    now - ragStore.cache.loadedAt < RAG_CACHE_TTL_MS
  ) {
    return ragStore.cache
  }

  if (ragStore.loadingPromise) {
    return ragStore.loadingPromise
  }

  const loadTask = loadRagCacheFromDb(versionKey)
    .then((loaded) => {
      if (ragStore.loadingPromise === loadTask) {
        ragStore.cache = loaded
      }
      return loaded
    })
    .finally(() => {
      if (ragStore.loadingPromise === loadTask) {
        ragStore.loadingPromise = null
      }
    })

  ragStore.loadingPromise = loadTask
  return loadTask
}

/**
 * ETAPA 1 STAIR: Enrutamiento por Índice (ToC Routing / Poda de Árbol).
 * Evalúa la consulta del estudiante contra los árboles ToC jerárquicos de todos
 * los reglamentos activos (usando categoryFilter solo como boost suave).
 */
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
    const directArtMatch = cleanQuery.match(
      /\b(?:art[íi]culo|art\.?)\s*([0-9]+[A-Za-z\-º°]*)/i
    )
    const directArtNum = directArtMatch
      ? directArtMatch[1].replace(/[º°]/g, '').trim()
      : null

    // Consultar todos los reglamentos indexados con árbol ToC registrado (sin exclusión dura por categoría)
    const docsWithToc = await prisma.document.findMany({
      where: {
        status: 'INDEXED',
        tocTree: { not: Prisma.JsonNull },
      },
      select: {
        id: true,
        title: true,
        tocTree: true,
        category: {
          select: {
            code: true,
          },
        },
      },
      take: 100,
    })

    if (!docsWithToc || docsWithToc.length === 0) {
      return []
    }

    const matches: ToCRouteMatch[] = []

    for (const doc of docsWithToc) {
      const tree = doc.tocTree as unknown as DocumentTocTree
      if (!Array.isArray(tree)) continue

      const normDocTitle = normalizeSearchText(doc.title)
      let docBaseScore =
        categoryFilter && doc.category?.code === categoryFilter ? 0.08 : 0

      for (const word of normKeywords) {
        if (
          normDocTitle.includes(word) ||
          (word.length >= 5 && normDocTitle.includes(word.slice(0, 5)))
        ) {
          docBaseScore += 0.20
        }
      }

      for (const rootNode of tree) {
        const isSection = 'chapters' in rootNode || !('articles' in rootNode)
        const sectionTitle = rootNode.title

        const chapters: TocChapterItem[] = isSection
          ? (rootNode as TocSectionItem).chapters || []
          : [rootNode as TocChapterItem]

        for (const chapter of chapters) {
          const chapTitle = chapter.title
          const normChap = normalizeSearchText(chapTitle)

          let chapScore = docBaseScore
          for (const word of normKeywords) {
            if (
              normChap.includes(word) ||
              (word.length >= 5 && normChap.includes(word.slice(0, 5)))
            ) {
              chapScore += 0.25
            }
          }

          if (Array.isArray(chapter.articles)) {
            for (const article of chapter.articles) {
              const artTitle = article.title
              const normArt = normalizeSearchText(artTitle)
              const artNum = article.articleNumber

              let artScore = chapScore

              if (
                directArtNum &&
                artNum &&
                artNum.toLowerCase() === directArtNum.toLowerCase()
              ) {
                artScore += 0.70
              }

              for (const word of normKeywords) {
                if (
                  normArt.includes(word) ||
                  (word.length >= 5 && normArt.includes(word.slice(0, 5)))
                ) {
                  artScore += 0.35
                }
              }

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

    return matches.sort((a, b) => b.score - a.score).slice(0, 6)
  } catch (err) {
    console.warn('[STAIR_TOC_ROUTING_WARN] Fallo al enrutar ramas ToC:', err)
    return []
  }
}

/**
 * Calcula puntaje BM25 de un fragmento en memoria dada la consulta tokenizada.
 */
function computeChunkBm25Score(
  chunk: CachedChunk,
  uniqueQueryTokens: string[],
  idfMap: Map<string, number>,
  avgTokenCount: number
): number {
  if (uniqueQueryTokens.length === 0 || chunk.tokenCount === 0) return 0
  const k1 = 1.2
  const b = 0.75
  const lenNorm = 1 - b + b * (chunk.tokenCount / (avgTokenCount || 1))
  let score = 0

  for (const qToken of uniqueQueryTokens) {
    let tf = chunk.tokenFreqs.get(qToken) || 0
    let idf = idfMap.get(qToken) ?? 0

    // Fallback por raíz léxica (>= 5 caracteres) si no hubo coincidencia exacta
    if (tf === 0 && qToken.length >= 5) {
      const stem = qToken.slice(0, 5)
      for (const [cToken, cFreq] of chunk.tokenFreqs.entries()) {
        if (cToken.startsWith(stem)) {
          tf += cFreq * 0.7
          const cIdf = idfMap.get(cToken) ?? 0
          if (cIdf > idf) idf = cIdf
        }
      }
    }

    if (tf > 0) {
      if (idf <= 0) idf = 0.2
      score += (idf * (tf * (k1 + 1))) / (tf + k1 * lenNorm)
    }
  }

  return score
}

/**
 * Búsqueda semántica e híbrida sobre el 100% del corpus indexado en RAM (SIPÁN-STAIR):
 * - Etapa 1: ToC Routing sin exclusiones duras por categoría.
 * - Etapa 2A: Escaneo vectorial L2 completo en RAM + BM25 + unión RRF (Top 25 vec ∪ Top 15 léxico ∪ art.).
 * - Etapa 2B: Reranking híbrido y expansión de vecinos contiguos (chunkIndex ± 1) para los 3 mejores ganadores.
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

    const keywords = extractCleanKeywords(cleanQuery)

    // Ejecutar Enrutamiento ToC y carga/validación de caché en paralelo
    const [routeMatches, cache] = await Promise.all([
      routeQueryToToCBranches(cleanQuery, keywords, categoryFilter),
      getOrLoadRagCache(),
    ])

    if (cache.chunks.length === 0) {
      return []
    }

    if (routeMatches.length > 0) {
      console.log(
        `[SIPAN_STAIR] 🌳 ToC Routing identificó ${routeMatches.length} ramas normativas afines:`,
        routeMatches
          .map(
            (r) =>
              `${r.documentTitle} -> ${r.branchTitle} (${Math.round(r.score * 100)}%)`
          )
          .join(' | ')
      )
    }

    // Precomputar señales léxicas, artículo directo e intención de tarifas/costos
    const uniqueQueryTokens = Array.from(new Set(tokenizeForBm25(cleanQuery)))
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

    // Precomputar BM25 y coincidencia directa de artículo en RAM (sirve tanto para RRF como para fallback léxico)
    const bm25Scores = new Float64Array(cache.chunks.length)
    const directArtFlags = new Uint8Array(cache.chunks.length)
    const tocBoosts = new Float64Array(cache.chunks.length)

    for (let i = 0; i < cache.chunks.length; i++) {
      const chunk = cache.chunks[i]
      bm25Scores[i] = computeChunkBm25Score(
        chunk,
        uniqueQueryTokens,
        cache.idfMap,
        cache.avgTokenCount
      )

      if (
        directArtRegex &&
        (directArtRegex.test(chunk.articulo || '') ||
          directArtRegex.test(chunk.breadcrumb) ||
          directArtRegex.test(chunk.content))
      ) {
        directArtFlags[i] = 1
      }

      const isMatchedBranch = routeMatches.some(
        (m) =>
          m.documentId === chunk.documentId &&
          ((chunk.capitulo && m.branchTitle.includes(chunk.capitulo)) ||
            (chunk.articulo &&
              m.articleTitle &&
              m.articleTitle.includes(chunk.articulo)))
      )
      if (isMatchedBranch) {
        tocBoosts[i] = 0.04
      }
    }

    try {
      const embStartTime = Date.now()
      const { embedding: queryEmbedding, tokens: queryTokens } =
        await generateEmbeddingWithUsage(cleanQuery)
      const queryUnitVec = toUnitFloat32Array(queryEmbedding)
      const embDurationMs = Date.now() - embStartTime

      // Registrar consumo de tokens para RAG_EMBEDDING (solo embedding de consulta)
      recordTokenUsageLog({
        userId: context?.userId || null,
        conversationId: context?.conversationId || null,
        modelCode: DEFAULT_EMBEDDING_MODEL,
        provider: ModelProvider.GEMINI,
        concept: TokenUsageConcept.RAG_EMBEDDING,
        promptTokens: queryTokens,
        completionTokens: 0,
        latencyMs: embDurationMs,
        metadata: {
          queryLength: cleanQuery.length,
          candidatesEvaluated: cache.chunks.length,
          filteredBoilerplateCount: cache.filteredBoilerplateCount,
          cacheVersion: cache.versionKey,
          tocBranchesMatched: routeMatches.length,
        },
      }).catch((err) => console.warn('[RAG_EMBEDDING_TOKEN_LOG_WARN]', err))

      // Etapa 2A (Ajuste A): Evaluar similitud vectorial L2 sobre TODOS los chunks en RAM
      const n = cache.chunks.length
      const vectorScores = new Float64Array(n)
      const allIndices = new Array<number>(n)

      for (let i = 0; i < n; i++) {
        allIndices[i] = i
        const unitVec = cache.chunks[i].unitVector
        const rawSim =
          unitVec && queryUnitVec ? dotUnitVectors(queryUnitVec, unitVec) : 0.5
        vectorScores[i] = Math.max(0, Math.min(1, isNaN(rawSim) ? 0.0 : rawSim))
      }

      // Ranking vectorial sobre el 100% del corpus
      const sortedByVector = [...allIndices].sort(
        (a, b) => vectorScores[b] + tocBoosts[b] - (vectorScores[a] + tocBoosts[a])
      )
      const vecRank = new Int32Array(n)
      for (let rankIdx = 0; rankIdx < n; rankIdx++) {
        vecRank[sortedByVector[rankIdx]] = rankIdx + 1
      }

      // Ranking léxico BM25 sobre el 100% del corpus
      const sortedByLexical = [...allIndices].sort(
        (a, b) => bm25Scores[b] - bm25Scores[a]
      )
      const lexRank = new Int32Array(n)
      for (let rankIdx = 0; rankIdx < n; rankIdx++) {
        lexRank[sortedByLexical[rankIdx]] = rankIdx + 1
      }

      // Unión híbrida: Top 25 vectorial ∪ Top 15 léxico BM25 ∪ coincidencias directas de artículo
      const unionIndices = new Set<number>()
      for (const idx of sortedByVector.slice(0, RAG_INITIAL_CANDIDATES)) {
        unionIndices.add(idx)
      }
      let addedLexical = 0
      for (const idx of sortedByLexical) {
        if (bm25Scores[idx] <= 0) break
        unionIndices.add(idx)
        addedLexical++
        if (addedLexical >= RAG_LEXICAL_CANDIDATES) break
      }
      for (let i = 0; i < n; i++) {
        if (directArtFlags[i] === 1) {
          unionIndices.add(i)
        }
      }

      // Calcular peso total de keywords ponderado por IDF una sola vez
      const keywordIdfWeights = normKeywords.map((w) =>
        Math.max(0.2, cache.idfMap.get(w) ?? 1.0)
      )
      const totalKeywordWeight = keywordIdfWeights.reduce((acc, w) => acc + w, 0)

      // Etapa 2B: Reranker híbrido RRF + señales léxicas, de título, categoría (Ajuste D), artículo y tarifas
      interface ScoredCandidate {
        chunk: CachedChunk
        relevance: number
      }

      const scoredCandidates: ScoredCandidate[] = []

      for (const idx of unionIndices) {
        const chunk = cache.chunks[idx]
        const vectorScore = vectorScores[idx]
        const tocBoost = tocBoosts[idx]

        const rrfRaw =
          1 / (60 + vecRank[idx]) +
          (bm25Scores[idx] > 0 ? 1 / (60 + lexRank[idx]) : 0)
        const rrfBonus = Math.min(0.10, (rrfRaw / (2 / 61)) * 0.10)

        let matchedKeywordWeight = 0
        let matchedTitleWords = 0
        for (let kIdx = 0; kIdx < normKeywords.length; kIdx++) {
          const word = normKeywords[kIdx]
          const stem = word.length >= 5 ? word.slice(0, 5) : null
          if (
            chunk.normContent.includes(word) ||
            (stem !== null && chunk.normContent.includes(stem))
          ) {
            matchedKeywordWeight += keywordIdfWeights[kIdx]
          }
          if (
            chunk.normTitle.includes(word) ||
            (stem !== null && chunk.normTitle.includes(stem))
          ) {
            matchedTitleWords++
          }
        }

        const lexicalCoverage =
          totalKeywordWeight > 0 ? matchedKeywordWeight / totalKeywordWeight : 0
        const lexicalBoost = lexicalCoverage * 0.12
        const titleBoost = Math.min(0.05, matchedTitleWords * 0.025)
        const categoryBoost =
          categoryFilter && chunk.categoria === categoryFilter ? 0.025 : 0
        const directArticleBoost = directArtFlags[idx] === 1 ? 0.12 : 0
        const costTableBoost = isCostQuery && chunk.hasCostSignals ? 0.08 : 0

        const finalScore = Math.max(
          0,
          Math.min(
            1,
            vectorScore +
              tocBoost +
              categoryBoost +
              rrfBonus +
              lexicalBoost +
              titleBoost +
              directArticleBoost +
              costTableBoost
          )
        )

        scoredCandidates.push({
          chunk,
          relevance: Number(finalScore.toFixed(3)),
        })
      }

      // Filtrar por umbral configurado con red de seguridad (>= 0.35)
      let validCandidates = scoredCandidates
        .filter((r) => r.relevance >= minScore)
        .sort((a, b) => b.relevance - a.relevance)

      if (validCandidates.length === 0 && scoredCandidates.length > 0) {
        validCandidates = scoredCandidates
          .filter((r) => r.relevance >= 0.35)
          .sort((a, b) => b.relevance - a.relevance)
      }

      // Ajuste B: Expansión de vecinos contiguos (chunkIndex ± 1) en RAM a 0 ms para Top 3 ganadores
      const absorbedIds = new Set<string>()
      const finalResults: RetrievedSource[] = []

      for (const item of validCandidates) {
        if (absorbedIds.has(item.chunk.id)) continue

        const winner = item.chunk

        if (finalResults.length < RAG_NEIGHBOR_TOP_WINNERS) {
          let currentLength = winner.content.length
          const partsToMerge: CachedChunk[] = [winner]

          const nextNeighbor = cache.byDocChunk.get(
            `${winner.documentId}:${winner.chunkIndex + 1}`
          )
          if (
            nextNeighbor &&
            !absorbedIds.has(nextNeighbor.id) &&
            (isSameSectionOrSeries(winner, nextNeighbor) ||
              !winner.capitulo ||
              !nextNeighbor.capitulo)
          ) {
            const nextAddition = stripLeadingBreadcrumb(nextNeighbor.content)
            if (
              currentLength + 2 + nextAddition.length <=
              RAG_MAX_MERGED_CHUNK_CHARS
            ) {
              partsToMerge.push(nextNeighbor)
              currentLength += 2 + nextAddition.length
            }
          }

          const prevNeighbor = cache.byDocChunk.get(
            `${winner.documentId}:${winner.chunkIndex - 1}`
          )
          if (
            prevNeighbor &&
            !absorbedIds.has(prevNeighbor.id) &&
            isSameSectionOrSeries(winner, prevNeighbor)
          ) {
            const prevAddition = stripLeadingBreadcrumb(prevNeighbor.content)
            if (
              currentLength + 2 + prevAddition.length <=
              RAG_MAX_MERGED_CHUNK_CHARS
            ) {
              partsToMerge.unshift(prevNeighbor)
            }
          }

          let mergedSnippet = partsToMerge[0].content
          for (let pIdx = 1; pIdx < partsToMerge.length; pIdx++) {
            const addition = stripLeadingBreadcrumb(partsToMerge[pIdx].content)
            if (addition) {
              mergedSnippet += `\n\n${addition}`
            }
          }

          for (const mergedPart of partsToMerge) {
            absorbedIds.add(mergedPart.id)
          }

          finalResults.push({
            chunkId: winner.id,
            documentId: winner.documentId,
            title: winner.title,
            sourceUrl: winner.sourceUrl,
            pageNumber: winner.pageNumber,
            snippetText: mergedSnippet,
            relevance: item.relevance,
            embeddingModel: DEFAULT_EMBEDDING_MODEL,
            categoria: winner.categoria,
            anioVigencia: winner.anioVigencia,
            breadcrumb: winner.breadcrumb,
            capitulo: winner.capitulo,
            articulo: winner.articulo,
          })
        } else {
          absorbedIds.add(winner.id)
          finalResults.push({
            chunkId: winner.id,
            documentId: winner.documentId,
            title: winner.title,
            sourceUrl: winner.sourceUrl,
            pageNumber: winner.pageNumber,
            snippetText: winner.content,
            relevance: item.relevance,
            embeddingModel: DEFAULT_EMBEDDING_MODEL,
            categoria: winner.categoria,
            anioVigencia: winner.anioVigencia,
            breadcrumb: winner.breadcrumb,
            capitulo: winner.capitulo,
            articulo: winner.articulo,
          })
        }

        if (finalResults.length >= topK) break
      }

      return finalResults
    } catch (embErr) {
      console.warn(
        '[RAG_EMBEDDING_FALLBACK] Error en comparación vectorial, usando ranking BM25 en RAM:',
        embErr
      )

      // Fallback léxico ordenado por BM25 + artículo directo sobre el 100% del corpus en RAM
      const scoredFallback = cache.chunks.map((chunk, i) => ({
        chunk,
        score: bm25Scores[i] + (directArtFlags[i] === 1 ? 5 : 0) + tocBoosts[i],
      }))
      const maxFallback = Math.max(
        1,
        ...scoredFallback.map((x) => x.score)
      )

      return scoredFallback
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .map((x) => ({
          chunkId: x.chunk.id,
          documentId: x.chunk.documentId,
          title: x.chunk.title,
          sourceUrl: x.chunk.sourceUrl,
          pageNumber: x.chunk.pageNumber,
          snippetText: x.chunk.content,
          relevance: Number(
            Math.max(0.4, Math.min(0.95, 0.4 + (x.score / maxFallback) * 0.55)).toFixed(3)
          ),
          embeddingModel: 'lexical-bm25-fallback',
          categoria: x.chunk.categoria,
          anioVigencia: x.chunk.anioVigencia,
          breadcrumb: x.chunk.breadcrumb,
          capitulo: x.chunk.capitulo,
          articulo: x.chunk.articulo,
        }))
    }
  } catch (error) {
    console.error('[RAG_SEARCH_ERROR]', error)
    return []
  }
}
