/**
 * Tipos e interfaces de datos para la arquitectura "Sipán-STAIR"
 * (Structure-Aware Indexing and Retrieval) adaptada para SipánGPT.
 */

export interface TocArticleItem {
  id?: string
  title: string // Ej: "Art. 17: Matrícula Extemporánea"
  articleNumber?: string // Ej: "17"
  pageNumber?: number | null
  summary?: string
}

export interface TocChapterItem {
  id?: string
  title: string // Ej: "Capítulo II: De la Matrícula Regular y Extemporánea"
  chapterNumber?: string // Ej: "II"
  articles: TocArticleItem[]
  pageNumber?: number | null
}

export interface TocSectionItem {
  id?: string
  title: string // Ej: "Título I: Disposiciones Generales"
  sectionNumber?: string // Ej: "I"
  chapters?: TocChapterItem[]
  articles?: TocArticleItem[]
  pageNumber?: number | null
}

/**
 * Árbol jerárquico canónico del Índice (ToC) de un documento o reglamento institucional.
 * Puede estructurarse en Títulos o directamente en Capítulos/Artículos.
 */
export type DocumentTocTree = Array<TocSectionItem | TocChapterItem>

/**
 * Rama identificada durante la Etapa 1 de Enrutamiento (ToC Routing / Poda de Árbol)
 */
export interface ToCRouteMatch {
  documentId: string
  documentTitle: string
  branchTitle: string // Ej: "Capítulo II: De la Matrícula Regular y Extemporánea"
  articleTitle?: string // Ej: "Art. 17: Matrícula Extemporánea"
  breadcrumb: string // Ej: "Reglamento General de Matrícula > Capítulo II > Art. 17"
  score: number // Puntuación de relevancia heurística / léxica (0.0 a 1.0)
}

/**
 * Metadatos estructurados persistidos en cada fragmento (DocumentChunk.metadata)
 */
export interface StructuralChunkMetadata {
  documentTitle: string
  categoria?: string
  titulo?: string | null
  capitulo?: string | null
  articulo?: string | null
  breadcrumb: string
  nodeType: 'ARTICLE' | 'SECTION' | 'GENERAL'
  isLeaf: boolean
  partIndex?: number
  totalParts?: number
  anio_vigencia?: number
  estado?: string
  pageNumber?: number | null
  embedding?: number[] | null
  [key: string]: unknown
}
