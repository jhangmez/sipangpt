import type {
  DocumentTocTree,
  TocSectionItem,
  TocChapterItem,
  TocArticleItem,
  StructuralChunkMetadata,
} from '@/types/stair'

export interface ParsedStructuralChunk {
  content: string
  pageNumber?: number | null
  chunkIndex: number
  metadata: StructuralChunkMetadata
}

/**
 * Normaliza y limpia títulos de encabezados
 */
function cleanTitle(title: string): string {
  return title
    .replace(/^#+\s*/, '')
    .replace(/^\*\*|\*\*$/g, '')
    .trim()
}

/**
 * Extrae el número de artículo de un texto o título (ej. "Artículo 17: Matrícula" -> "17")
 */
export function extractArticleNumber(text: string): string | undefined {
  const match = text.match(/(?:art[íi]culo|art\.?)\s*([0-9]+[A-Za-z\-º°]*)/i)
  return match ? match[1].replace(/[º°]/g, '').trim() : undefined
}

/**
 * Extrae el número o identificador de capítulo (ej. "Capítulo II: Matrícula" -> "II")
 */
export function extractChapterNumber(text: string): string | undefined {
  const match = text.match(/(?:cap[íi]tulo|cap\.)\s*([IVXLCDM\d]+)/i)
  return match ? match[1].trim() : undefined
}

/**
 * Extrae el número o identificador de título (ej. "Título III: De los Grados" -> "III")
 */
export function extractSectionNumber(text: string): string | undefined {
  const match = text.match(/(?:t[íi]tulo)\s*([IVXLCDM\d]+|preliminar)/i)
  return match ? match[1].trim() : undefined
}

/**
 * Determina si una línea representa el inicio de un artículo
 */
export function isArticleHeader(line: string): boolean {
  const clean = cleanTitle(line)
  return /^(?:art[íi]culo|art\.?)\s*\d+/i.test(clean)
}

/**
 * Determina si una línea representa el inicio de un capítulo
 */
export function isChapterHeader(line: string): boolean {
  const clean = cleanTitle(line)
  return /^(?:cap[íi]tulo|cap\.)\s*[IVXLCDM\d]+/i.test(clean)
}

/**
 * Determina si una línea representa el inicio de un título general
 */
export function isSectionHeader(line: string): boolean {
  const clean = cleanTitle(line)
  return /^(?:t[íi]tulo)\s*(?:[IVXLCDM\d]+|preliminar)/i.test(clean)
}

/**
 * Extrae y construye el árbol jerárquico canónico ToC (Table of Contents)
 * a partir del texto Markdown de un reglamento universitario de la USS.
 */
export function extractTocTreeFromMarkdown(
  markdown: string,
  documentTitle: string = 'Reglamento Institucional USS'
): DocumentTocTree {
  const lines = markdown.split('\n')
  const tree: DocumentTocTree = []

  let currentSection: TocSectionItem | null = null
  let currentChapter: TocChapterItem | null = null
  let currentPage: number | null = 1

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim()
    if (!rawLine) continue

    // Rastrear número de página si hay separadores ("--- Página 4 ---" o similares)
    const pageMatch = rawLine.match(/(?:---\s*página|página|pag\.|pág\.)\s*(\d+)/i)
    if (pageMatch) {
      currentPage = parseInt(pageMatch[1], 10)
    }

    // 1. Detectar Título General (ej. "Título I: Disposiciones Generales")
    if (isSectionHeader(rawLine) || /^#\s+(?!art|cap)/i.test(rawLine)) {
      const title = cleanTitle(rawLine)
      const secNum = extractSectionNumber(title)

      currentSection = {
        title,
        sectionNumber: secNum,
        chapters: [],
        articles: [],
        pageNumber: currentPage,
      }
      tree.push(currentSection)
      currentChapter = null
      continue
    }

    // 2. Detectar Capítulo (ej. "Capítulo II: De la Matrícula")
    if (isChapterHeader(rawLine) || /^##\s+(?:cap[íi]tulo|cap\.)/i.test(rawLine)) {
      const title = cleanTitle(rawLine)
      const chapNum = extractChapterNumber(title)

      currentChapter = {
        title,
        chapterNumber: chapNum,
        articles: [],
        pageNumber: currentPage,
      }

      if (currentSection) {
        if (!currentSection.chapters) currentSection.chapters = []
        currentSection.chapters.push(currentChapter)
      } else {
        tree.push(currentChapter)
      }
      continue
    }

    // 3. Detectar Artículo (ej. "Artículo 17: Matrícula Extemporánea" o "### Art 18" o "### Art. 18.-")
    if (isArticleHeader(rawLine) || /^#{2,4}\s*(?:art[íi]culo|art\.?)/i.test(rawLine)) {
      const title = cleanTitle(rawLine)
      const artNum = extractArticleNumber(title)

      const articleItem: TocArticleItem = {
        title,
        articleNumber: artNum,
        pageNumber: currentPage,
      }

      if (currentChapter) {
        currentChapter.articles.push(articleItem)
      } else if (currentSection) {
        if (!currentSection.articles) currentSection.articles = []
        currentSection.articles.push(articleItem)
      } else {
        // Artículo suelto sin capítulo previo: crear capítulo implícito
        currentChapter = {
          title: 'Disposiciones y Articulado',
          articles: [articleItem],
          pageNumber: currentPage,
        }
        tree.push(currentChapter)
      }
      continue
    }
  }

  // Si no se detectó ningún artículo formal pero sí encabezados Markdown (# / ##)
  if (tree.length === 0) {
    let currentH1: TocSectionItem | null = null
    let currentH2: TocChapterItem | null = null

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('# ')) {
        const title = cleanTitle(trimmed)
        currentH1 = {
          title,
          chapters: [],
          articles: [],
          pageNumber: 1,
        }
        tree.push(currentH1)
        currentH2 = null
      } else if (trimmed.startsWith('## ')) {
        const title = cleanTitle(trimmed)
        currentH2 = {
          title,
          articles: [],
          pageNumber: 1,
        }
        if (currentH1) {
          currentH1.chapters?.push(currentH2)
        } else {
          tree.push(currentH2)
        }
      } else if (trimmed.startsWith('### ')) {
        const title = cleanTitle(trimmed)
        const artItem: TocArticleItem = { title, pageNumber: 1 }
        if (currentH2) {
          currentH2.articles.push(artItem)
        } else if (currentH1) {
          currentH1.articles?.push(artItem)
        } else {
          currentH2 = {
            title: documentTitle,
            articles: [artItem],
            pageNumber: 1,
          }
          tree.push(currentH2)
        }
      }
    }
  }

  return tree
}

/**
 * Segmenta el texto en chunks semánticos basados en los artículos y secciones
 * naturales del reglamento (Arquitectura Sipán-STAIR), inyectando el Breadcrumb jerárquico.
 *
 * Cada artículo se convierte en una unidad semántica indivisible. Solo si un artículo
 * excede maxArticleChars (~3,000 caracteres) se subdivide internamente conservando
 * el breadcrumb padre con sufijo de subsección.
 */
export function splitTextIntoStructuralChunks(
  text: string,
  documentTitle: string = 'Reglamento Institucional USS',
  categoryCode: string = 'GENERAL',
  maxArticleChars: number = 3000
): ParsedStructuralChunk[] {
  const clean = text.trim()
  if (!clean) return []

  const lines = clean.split('\n')
  const chunks: ParsedStructuralChunk[] = []

  let currentTitulo: string | null = null
  let currentCapitulo: string | null = null
  let currentArticulo: string | null = null
  let currentPage: number | null = 1

  let accumulatedContent: string[] = []
  let chunkIndex = 0

  // Detectar año de vigencia (ej: 2026, 2025)
  const yearMatch = clean.match(/\b(202[4-9]|203[0-5])\b/)
  const anioVigencia = yearMatch ? parseInt(yearMatch[1], 10) : 2026

  /**
   * Construye el Breadcrumb jerárquico canónico
   */
  const buildBreadcrumb = (articleName?: string | null): string => {
    const parts: string[] = [documentTitle]
    if (currentTitulo) parts.push(currentTitulo)
    if (currentCapitulo) parts.push(currentCapitulo)
    if (articleName) parts.push(articleName)
    return parts.join(' > ')
  }

  /**
   * Empaqueta el contenido acumulado en uno o más chunks con metadatos y breadcrumb
   */
  const flushCurrentUnit = (
    articleTitle: string | null,
    nodeType: 'ARTICLE' | 'SECTION' | 'GENERAL'
  ) => {
    const rawUnitText = accumulatedContent.join('\n').trim()
    accumulatedContent = []

    if (!rawUnitText || rawUnitText.length < 15) return

    const breadcrumb = buildBreadcrumb(articleTitle)

    // Si el artículo o sección cabe en el límite recomendado, guardar como un solo chunk íntegro
    if (rawUnitText.length <= maxArticleChars) {
      const headerPrefix = `[${breadcrumb}]\n\n`
      const finalContent = rawUnitText.startsWith('[')
        ? rawUnitText
        : `${headerPrefix}${rawUnitText}`

      chunks.push({
        content: finalContent,
        pageNumber: currentPage,
        chunkIndex,
        metadata: {
          documentTitle,
          categoria: categoryCode,
          titulo: currentTitulo,
          capitulo: currentCapitulo,
          articulo: articleTitle,
          breadcrumb,
          nodeType,
          isLeaf: true,
          anio_vigencia: anioVigencia,
          estado: 'ACTIVO',
          pageNumber: currentPage,
        },
      })
      chunkIndex++
      return
    }

    // Si el artículo es muy extenso (> maxArticleChars, ej. 50 incisos o tabla extensa),
    // dividir internamente por párrafos conservando el breadcrumb padre
    const paragraphs = rawUnitText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)

    let subChunkText = ''
    let partIndex = 1
    const subChunksBuffer: string[] = []

    for (const para of paragraphs) {
      if ((subChunkText + '\n\n' + para).length <= maxArticleChars) {
        subChunkText = subChunkText ? `${subChunkText}\n\n${para}` : para
      } else {
        if (subChunkText) {
          subChunksBuffer.push(subChunkText)
        }
        subChunkText = para
      }
    }
    if (subChunkText.trim()) {
      subChunksBuffer.push(subChunkText.trim())
    }

    const totalParts = subChunksBuffer.length
    for (let pIdx = 0; pIdx < subChunksBuffer.length; pIdx++) {
      const partText = subChunksBuffer[pIdx]
      const partBreadcrumb =
        totalParts > 1
          ? `${breadcrumb} (Parte ${pIdx + 1}/${totalParts})`
          : breadcrumb

      const headerPrefix = `[${partBreadcrumb}]\n\n`
      const finalContent = partText.startsWith('[')
        ? partText
        : `${headerPrefix}${partText}`

      chunks.push({
        content: finalContent,
        pageNumber: currentPage,
        chunkIndex,
        metadata: {
          documentTitle,
          categoria: categoryCode,
          titulo: currentTitulo,
          capitulo: currentCapitulo,
          articulo: articleTitle,
          breadcrumb: partBreadcrumb,
          nodeType,
          isLeaf: true,
          partIndex: pIdx + 1,
          totalParts,
          anio_vigencia: anioVigencia,
          estado: 'ACTIVO',
          pageNumber: currentPage,
        },
      })
      chunkIndex++
    }
  }

  // Iterar línea a línea reconociendo fronteras estructurales
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Rastrear página
    const pageMatch = trimmed.match(/(?:---\s*página|página|pag\.|pág\.)\s*(\d+)/i)
    if (pageMatch) {
      currentPage = parseInt(pageMatch[1], 10)
    }

    // 1. Detectar frontera de TÍTULO
    if (isSectionHeader(trimmed) || /^#\s+(?!art|cap)/i.test(trimmed)) {
      if (accumulatedContent.length > 0) {
        flushCurrentUnit(
          currentArticulo,
          currentArticulo ? 'ARTICLE' : 'SECTION'
        )
      }
      currentTitulo = cleanTitle(trimmed)
      currentCapitulo = null
      currentArticulo = null
      accumulatedContent.push(line)
      continue
    }

    // 2. Detectar frontera de CAPÍTULO
    if (isChapterHeader(trimmed) || /^##\s+(?:cap[íi]tulo|cap\.)/i.test(trimmed)) {
      if (accumulatedContent.length > 0) {
        flushCurrentUnit(
          currentArticulo,
          currentArticulo ? 'ARTICLE' : 'SECTION'
        )
      }
      currentCapitulo = cleanTitle(trimmed)
      currentArticulo = null
      accumulatedContent.push(line)
      continue
    }

    // 3. Detectar frontera de ARTÍCULO
    if (isArticleHeader(trimmed) || /^#{2,4}\s*(?:art[íi]culo|art\.?)/i.test(trimmed)) {
      if (accumulatedContent.length > 0) {
        flushCurrentUnit(
          currentArticulo,
          currentArticulo ? 'ARTICLE' : 'SECTION'
        )
      }
      currentArticulo = cleanTitle(trimmed)
      accumulatedContent.push(line)
      continue
    }

    accumulatedContent.push(line)
  }

  // Vaciar último fragmento remanente
  if (accumulatedContent.length > 0) {
    flushCurrentUnit(
      currentArticulo,
      currentArticulo ? 'ARTICLE' : 'SECTION'
    )
  }

  // Si no se detectó ningún artículo formal (ej. texto plano o comunicado),
  // hacer fallback limpio por párrafos respetando el límite maxArticleChars
  if (chunks.length === 0 && clean.length > 0) {
    const paragraphs = clean
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)

    let currentBuffer = ''
    for (const para of paragraphs) {
      if ((currentBuffer + '\n\n' + para).length <= maxArticleChars) {
        currentBuffer = currentBuffer ? `${currentBuffer}\n\n${para}` : para
      } else {
        if (currentBuffer) {
          const breadcrumb = `${documentTitle} > Fragmento ${chunkIndex + 1}`
          chunks.push({
            content: `[${breadcrumb}]\n\n${currentBuffer}`,
            pageNumber: 1,
            chunkIndex,
            metadata: {
              documentTitle,
              categoria: categoryCode,
              breadcrumb,
              nodeType: 'GENERAL',
              isLeaf: true,
              anio_vigencia: anioVigencia,
              estado: 'ACTIVO',
              pageNumber: 1,
            },
          })
          chunkIndex++
        }
        currentBuffer = para
      }
    }

    if (currentBuffer.trim()) {
      const breadcrumb = `${documentTitle} > Fragmento ${chunkIndex + 1}`
      chunks.push({
        content: `[${breadcrumb}]\n\n${currentBuffer}`,
        pageNumber: 1,
        chunkIndex,
        metadata: {
          documentTitle,
          categoria: categoryCode,
          breadcrumb,
          nodeType: 'GENERAL',
          isLeaf: true,
          anio_vigencia: anioVigencia,
          estado: 'ACTIVO',
          pageNumber: 1,
        },
      })
    }
  }

  return chunks
}
