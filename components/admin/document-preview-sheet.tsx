'use client'

import * as React from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import MarkdownRenderer from '@/components/ui/markdown'
import {
  FileText,
  ExternalLink,
  Copy,
  Check,
  Download,
  Search,
  BookOpen,
  Layers,
  FileCode,
  Clock,
  Sparkles,
  RefreshCw,
  X,
  AlertCircle,
  HardDrive,
  Hash,
  ArrowUp,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Zap,
  SlidersHorizontal,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/utils'
import { getDocumentPreviewDataAction } from '@/lib/actions/admin-documents'
import type { DocumentItem } from '@/types'

interface DocumentPreviewSheetProps {
  documentId: string | null
  initialDoc?: DocumentItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigateToChunks?: (doc: DocumentItem) => void
}

type TabType = 'markdown' | 'original' | 'chunks'

interface PreviewData {
  document: {
    id: string
    title: string
    fileName: string
    fileUrl: string | null
    publicUrl: string | null
    mimeType: string
    sizeBytes: number
    status: string
    chunkCount: number
    category?: { id: string; name: string; code: string } | null
    uploadedBy?: { name: string | null; email: string } | null
    createdAt: string
    updatedAt: string
  }
  isPdf: boolean
  markdownContent: string
  sourceOrigin: 'file_download' | 'reconstructed_chunks'
  stats: {
    wordCount: number
    charCount: number
    estimatedReadTimeMinutes: number
  }
  chunks: Array<{
    id: string
    chunkIndex: number
    content: string
    pageNumber: number | null
    hasEmbedding: boolean
  }>
}

// Límite de caracteres por página para optimización de memoria (evita congelar React)
const CHARS_PER_PAGE = 35_000
const CHUNKS_PER_PAGE = 20

/**
 * Divide un documento Markdown extenso en páginas legibles sin romper
 * encabezados, tablas, bloques de código ni párrafos.
 */
function splitMarkdownIntoPages(
  markdown: string,
  maxCharsPerPage: number = CHARS_PER_PAGE
): string[] {
  if (!markdown) return ['']
  if (markdown.length <= maxCharsPerPage) return [markdown]

  const pages: string[] = []
  let startIndex = 0

  while (startIndex < markdown.length) {
    const endIndex = startIndex + maxCharsPerPage

    if (endIndex >= markdown.length) {
      pages.push(markdown.slice(startIndex).trim())
      break
    }

    // Ventana de búsqueda hacia atrás de hasta 3,000 caracteres para corte limpio
    const searchWindow = markdown.slice(
      Math.max(startIndex, endIndex - 3000),
      endIndex
    )

    // 1. Preferir corte antes de un encabezado Markdown (# , ## , ### )
    const headerMatch = searchWindow.search(/\n(?=#{1,4}\s)/)
    if (headerMatch !== -1) {
      const splitPoint =
        Math.max(startIndex, endIndex - 3000) + headerMatch + 1
      pages.push(markdown.slice(startIndex, splitPoint).trim())
      startIndex = splitPoint
      continue
    }

    // 2. Si no hay encabezado, cortar en doble salto de línea (párrafo)
    const paragraphMatch = searchWindow.search(/\n\n/)
    if (paragraphMatch !== -1) {
      const splitPoint =
        Math.max(startIndex, endIndex - 3000) + paragraphMatch + 2
      pages.push(markdown.slice(startIndex, splitPoint).trim())
      startIndex = splitPoint
      continue
    }

    // 3. Si no hay párrafo, cortar en un salto de línea simple
    const lineMatch = searchWindow.search(/\n/)
    if (lineMatch !== -1) {
      const splitPoint = Math.max(startIndex, endIndex - 3000) + lineMatch + 1
      pages.push(markdown.slice(startIndex, splitPoint).trim())
      startIndex = splitPoint
      continue
    }

    // Fallback: corte en endIndex
    pages.push(markdown.slice(startIndex, endIndex).trim())
    startIndex = endIndex
  }

  return pages.filter(Boolean)
}

export function DocumentPreviewSheet({
  documentId,
  initialDoc,
  open,
  onOpenChange,
  onNavigateToChunks,
}: DocumentPreviewSheetProps) {
  const [activeTab, setActiveTab] = React.useState<TabType>('markdown')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [previewData, setPreviewData] = React.useState<PreviewData | null>(null)

  // Estados de paginación del Markdown (Optimización para documentos gigantes > 100k a 4M+ caracteres)
  const [isPagedMode, setIsPagedMode] = React.useState(true)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [jumpPageInput, setJumpPageInput] = React.useState('')

  // Estados de paginación de Chunks (Pestaña 3)
  const [chunksPage, setChunksPage] = React.useState(1)

  // Estados de interacción
  const [searchQuery, setSearchQuery] = React.useState('')
  const [copiedAll, setCopiedAll] = React.useState(false)
  const [copiedChunkId, setCopiedChunkId] = React.useState<string | null>(null)
  const contentContainerRef = React.useRef<HTMLDivElement>(null)
  const [showScrollTop, setShowScrollTop] = React.useState(false)

  // Cargar datos cuando se abre el Sheet
  const fetchPreviewData = React.useCallback(async (docId: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getDocumentPreviewDataAction(docId)
      setPreviewData(data as unknown as PreviewData)
      setCurrentPage(1)
      setChunksPage(1)
      // Si el documento es menor a 50k caracteres, modo continuo por defecto; si es gigante, paginado
      const totalChars = data.stats?.charCount || 0
      setIsPagedMode(totalChars > 50_000)
    } catch (err) {
      console.error('[PREVIEW_SHEET] Error al cargar documento:', err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (open && documentId) {
      setActiveTab('markdown')
      setSearchQuery('')
      fetchPreviewData(documentId)
    } else if (!open) {
      setPreviewData(null)
      setError(null)
    }
  }, [open, documentId, fetchPreviewData])

  // Dividir el markdown en páginas virtuales para rendimiento
  const markdownPages = React.useMemo(() => {
    if (!previewData?.markdownContent) return ['']
    return splitMarkdownIntoPages(previewData.markdownContent, CHARS_PER_PAGE)
  }, [previewData?.markdownContent])

  const totalPages = markdownPages.length
  const isLargeDocument =
    (previewData?.stats.charCount || 0) > 50_000 || totalPages > 1

  // Escuchar scroll del contenedor para botón "Volver arriba"
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop
    setShowScrollTop(top > 400)
  }

  const scrollToTop = () => {
    contentContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Cambio de página con scroll al tope
  const handlePageChange = (newPage: number) => {
    const clamped = Math.max(1, Math.min(totalPages, newPage))
    setCurrentPage(clamped)
    setJumpPageInput('')
    scrollToTop()
  }

  // Búsqueda inteligente: identificar en qué páginas aparece el término buscado
  const searchMatchesByPage = React.useMemo(() => {
    if (!searchQuery.trim() || markdownPages.length <= 1) return []
    const q = searchQuery.toLowerCase()
    const matches: { page: number; count: number }[] = []
    markdownPages.forEach((pageText, idx) => {
      const lower = pageText.toLowerCase()
      let count = 0
      let pos = lower.indexOf(q)
      while (pos !== -1) {
        count++
        pos = lower.indexOf(q, pos + q.length)
      }
      if (count > 0) {
        matches.push({ page: idx + 1, count })
      }
    })
    return matches
  }, [markdownPages, searchQuery])

  // Contenido a renderizar según el modo (paginado o continuo)
  const currentMarkdownToRender = React.useMemo(() => {
    if (!previewData?.markdownContent) return ''
    if (!isPagedMode) return previewData.markdownContent
    const pageIdx = Math.max(0, Math.min(totalPages - 1, currentPage - 1))
    return markdownPages[pageIdx] || ''
  }, [previewData?.markdownContent, isPagedMode, totalPages, currentPage, markdownPages])

  // Copiar todo el Markdown al portapapeles
  const handleCopyMarkdown = async () => {
    if (!previewData?.markdownContent) return
    try {
      await navigator.clipboard.writeText(previewData.markdownContent)
      setCopiedAll(true)
      toast.success(
        `Documento completo copiado (${previewData.stats.charCount.toLocaleString()} caracteres)`
      )
      setTimeout(() => setCopiedAll(false), 2500)
    } catch {
      toast.error('No se pudo copiar el contenido')
    }
  }

  // Copiar un chunk individual
  const handleCopyChunk = async (chunkId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedChunkId(chunkId)
      toast.success('Fragmento copiado al portapapeles')
      setTimeout(() => setCopiedChunkId(null), 2000)
    } catch {
      toast.error('No se pudo copiar el fragmento')
    }
  }

  // Descargar archivo .md localmente
  const handleDownloadMarkdown = () => {
    if (!previewData) return
    const blob = new Blob([previewData.markdownContent], {
      type: 'text/markdown;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const fileName =
      previewData.document.title.toLowerCase().replace(/[^a-z0-9_-]/g, '_') +
      '.md'
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Descargando ${fileName} (${formatSize(previewData.document.sizeBytes || previewData.stats.charCount)})`)
  }

  // Formato de tamaño en KB/MB
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  // Título e información a mostrar
  const docTitle =
    previewData?.document.title ||
    initialDoc?.title ||
    initialDoc?.fileName ||
    'Documento Institucional'

  const directFileUrl =
    previewData?.document.publicUrl ||
    previewData?.document.fileUrl ||
    initialDoc?.publicUrl ||
    initialDoc?.fileUrl

  // Chunks filtrados por búsqueda y paginados
  const allFilteredChunks = React.useMemo(() => {
    if (!previewData?.chunks) return []
    if (!searchQuery.trim()) return previewData.chunks
    const q = searchQuery.toLowerCase()
    return previewData.chunks.filter((c) =>
      c.content.toLowerCase().includes(q)
    )
  }, [previewData?.chunks, searchQuery])

  const totalChunkPages = Math.max(
    1,
    Math.ceil(allFilteredChunks.length / CHUNKS_PER_PAGE)
  )
  const paginatedChunks = React.useMemo(() => {
    const start = (chunksPage - 1) * CHUNKS_PER_PAGE
    return allFilteredChunks.slice(start, start + CHUNKS_PER_PAGE)
  }, [allFilteredChunks, chunksPage])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        showCloseButton={false}
        className='w-full data-[side=right]:sm:max-w-3xl data-[side=right]:lg:max-w-5xl data-[side=right]:xl:max-w-6xl p-0 flex flex-col h-full bg-background border-l border-border/80 shadow-2xl z-50 focus:outline-none'
      >
        {/* ========================================================================= */}
        {/* ENCABEZADO SUPERIOR FIJO */}
        {/* ========================================================================= */}
        <SheetHeader className='shrink-0 border-b border-border/70 bg-card/60 backdrop-blur-md px-6 py-4 space-y-3'>
          <div className='flex items-start justify-between gap-4'>
            <div className='space-y-1.5 flex-1 min-w-0'>
              <div className='flex items-center gap-2 flex-wrap'>
                <Badge
                  variant='outline'
                  className='bg-primary/10 text-primary border-primary/20 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider'
                >
                  {previewData?.isPdf ? 'Documento PDF' : 'Documento Markdown'}
                </Badge>

                {previewData?.document.category && (
                  <Badge
                    variant='outline'
                    className='bg-muted/50 text-foreground text-[10px] font-medium border-border/60'
                  >
                    {previewData.document.category.name}
                  </Badge>
                )}

                {previewData?.document.status === 'INDEXED' && (
                  <Badge
                    variant='outline'
                    className='border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[10px] font-bold py-0.5 gap-1'
                  >
                    <span className='size-1.5 rounded-full bg-emerald-500 animate-pulse' />
                    Indexado RAG
                  </Badge>
                )}

                {previewData?.sourceOrigin === 'reconstructed_chunks' && (
                  <Badge
                    variant='outline'
                    className='text-[10px] text-muted-foreground border-border/40 font-mono'
                    title='Reconstruido fielmente a partir de los fragmentos semánticos indexados en PostgreSQL'
                  >
                    Transcripción IA RAG
                  </Badge>
                )}

                {isLargeDocument && (
                  <Badge
                    variant='outline'
                    className='border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-[10px] font-bold py-0.5 gap-1'
                    title='Documento extenso optimizado en memoria con paginación inteligente'
                  >
                    <Zap className='size-2.5 text-amber-500' />
                    {totalPages} secciones virtuales
                  </Badge>
                )}
              </div>

              <SheetTitle className='font-frances text-xl sm:text-2xl font-bold tracking-tight text-foreground line-clamp-2 leading-tight'>
                {docTitle}
              </SheetTitle>

              <SheetDescription className='text-xs text-muted-foreground flex items-center gap-2 flex-wrap'>
                {previewData?.document.sizeBytes ? (
                  <>
                    <span className='flex items-center gap-1'>
                      <HardDrive className='size-3' />
                      {formatSize(previewData.document.sizeBytes)}
                    </span>
                    <span>•</span>
                  </>
                ) : null}

                {previewData?.chunks ? (
                  <>
                    <span className='flex items-center gap-1 font-mono font-semibold text-foreground'>
                      <Layers className='size-3 text-primary' />
                      {previewData.chunks.length} fragmentos
                    </span>
                    <span>•</span>
                  </>
                ) : null}

                {previewData?.stats && (
                  <>
                    <span className='flex items-center gap-1'>
                      <Clock className='size-3 text-amber-500' />
                      {previewData.stats.estimatedReadTimeMinutes} min de lectura
                    </span>
                    <span>•</span>
                    <span>
                      {previewData.stats.wordCount.toLocaleString()} palabras
                    </span>
                    <span>•</span>
                    <span className='font-mono text-[11px] font-medium text-foreground'>
                      {previewData.stats.charCount.toLocaleString()} caracteres
                    </span>
                  </>
                )}
              </SheetDescription>
            </div>

            {/* Acciones de Cabecera */}
            <div className='flex items-center gap-1.5 shrink-0'>
              {directFileUrl && (
                <a
                  href={directFileUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex items-center justify-center rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer'
                  title='Abrir archivo original en nueva pestaña'
                >
                  <ExternalLink className='size-4' />
                </a>
              )}

              <Button
                variant='ghost'
                size='icon-sm'
                onClick={handleCopyMarkdown}
                disabled={loading || !previewData?.markdownContent}
                className='rounded-xl text-muted-foreground hover:text-foreground cursor-pointer'
                title='Copiar Markdown completo'
              >
                {copiedAll ? (
                  <Check className='size-4 text-emerald-500' />
                ) : (
                  <Copy className='size-4' />
                )}
              </Button>

              <Button
                variant='ghost'
                size='icon-sm'
                onClick={handleDownloadMarkdown}
                disabled={loading || !previewData?.markdownContent}
                className='rounded-xl text-muted-foreground hover:text-foreground cursor-pointer'
                title='Descargar como archivo .md'
              >
                <Download className='size-4' />
              </Button>

              <Button
                variant='ghost'
                size='icon-sm'
                onClick={() => onOpenChange(false)}
                className='rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer ml-1'
                title='Cerrar panel'
              >
                <X className='size-4' />
                <span className='sr-only'>Cerrar</span>
              </Button>
            </div>
          </div>

          {/* Selector de Pestañas y Barra de Búsqueda */}
          <div className='flex items-center justify-between gap-3 pt-1 border-t border-border/50 flex-wrap'>
            <div className='flex items-center gap-1 bg-muted/40 p-1 rounded-2xl border border-border/50'>
              <button
                type='button'
                onClick={() => setActiveTab('markdown')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'markdown'
                    ? 'bg-background text-primary shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BookOpen className='size-3.5' />
                <span>Markdown Renderizado</span>
              </button>

              <button
                type='button'
                onClick={() => setActiveTab('original')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'original'
                    ? 'bg-background text-primary shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {previewData?.isPdf ? (
                  <FileText className='size-3.5' />
                ) : (
                  <FileCode className='size-3.5' />
                )}
                <span>
                  {previewData?.isPdf ? 'Visor PDF Oficial' : 'Código Fuente'}
                </span>
              </button>

              <button
                type='button'
                onClick={() => setActiveTab('chunks')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'chunks'
                    ? 'bg-background text-primary shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Layers className='size-3.5' />
                <span>Fragmentos RAG</span>
                {previewData?.chunks && (
                  <span className='ml-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded-full font-mono'>
                    {previewData.chunks.length}
                  </span>
                )}
              </button>
            </div>

            {/* Buscador interno */}
            <div className='relative flex-1 sm:max-w-xs'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground' />
              <input
                type='text'
                placeholder='Buscar palabras clave...'
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setChunksPage(1)
                }}
                className='w-full rounded-xl border border-border/80 bg-background/80 pl-8.5 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary'
              />
              {searchQuery && (
                <button
                  type='button'
                  onClick={() => setSearchQuery('')}
                  className='absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                >
                  <X className='size-3' />
                </button>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* ========================================================================= */}
        {/* CUERPO DEL CONTENEDOR CON SCROLL */}
        {/* ========================================================================= */}
        <div
          ref={contentContainerRef}
          onScroll={handleScroll}
          className='flex-1 overflow-y-auto px-6 py-6 bg-muted/5 relative font-exo'
        >
          {/* ESTADO: CARGANDO CON LOADER ELEGANTE */}
          {loading && (
            <div className='flex flex-col items-center justify-center min-h-[400px] max-w-lg mx-auto text-center space-y-5 py-12'>
              <div className='relative flex items-center justify-center'>
                <div className='absolute size-16 rounded-full bg-primary/10 animate-ping' />
                <div className='relative size-14 rounded-2xl bg-card border border-primary/30 flex items-center justify-center shadow-md'>
                  <Loader2 className='size-7 animate-spin text-primary' />
                </div>
              </div>

              <div className='space-y-1.5'>
                <h3 className='font-frances font-bold text-lg text-foreground'>
                  Cargando y procesando documento...
                </h3>
                <p className='text-xs text-muted-foreground max-w-sm leading-relaxed'>
                  Descargando contenido institucional, sanitizando codificación
                  UTF-8 y optimizando el renderizado para alta velocidad.
                </p>
              </div>

              <div className='w-full max-w-xs space-y-2 pt-2'>
                <Skeleton className='h-3 w-full rounded-full' />
                <Skeleton className='h-3 w-4/5 mx-auto rounded-full' />
              </div>
            </div>
          )}

          {/* ESTADO: ERROR */}
          {!loading && error && (
            <div className='flex flex-col items-center justify-center h-full min-h-[350px] text-center p-8 space-y-4 max-w-md mx-auto'>
              <div className='p-3 bg-destructive/10 rounded-2xl text-destructive'>
                <AlertCircle className='size-8' />
              </div>
              <div className='space-y-1'>
                <h3 className='font-frances font-bold text-base text-foreground'>
                  Error al cargar la visualización
                </h3>
                <p className='text-xs text-muted-foreground'>{error}</p>
              </div>
              {documentId && (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => fetchPreviewData(documentId)}
                  className='gap-2 rounded-xl text-xs cursor-pointer'
                >
                  <RefreshCw className='size-3.5' /> Reintentar
                </Button>
              )}
            </div>
          )}

          {/* ESTADO: CONTENIDO DISPONIBLE */}
          {!loading && !error && previewData && (
            <div className='max-w-4xl mx-auto space-y-5'>
              {/* ------------------------------------------------------------- */}
              {/* PESTAÑA 1: MARKDOWN RENDERIZADO */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'markdown' && (
                <div className='space-y-5'>
                  {/* Barra de Controles de Rendimiento y Modo Paginado */}
                  <div className='flex items-center justify-between gap-3 bg-card border border-border/80 px-4 py-2.5 rounded-2xl text-xs text-muted-foreground shadow-2xs flex-wrap'>
                    <div className='flex items-center gap-2'>
                      <ShieldCheck className='size-4 text-emerald-500' />
                      <span>
                        UTF-8 verificado sin caracteres rotos. Tablas GFM
                        activas.
                      </span>
                    </div>

                    {/* Toggle de Paginación para Documentos Grandes */}
                    {isLargeDocument && (
                      <div className='flex items-center gap-2'>
                        <span className='text-[11px] font-medium'>
                          Modo de lectura:
                        </span>
                        <div className='flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/50 text-[11px] font-semibold'>
                          <button
                            type='button'
                            onClick={() => {
                              setIsPagedMode(true)
                              scrollToTop()
                            }}
                            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                              isPagedMode
                                ? 'bg-background text-primary shadow-2xs'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                            title='Paginado rápido: Evita sobrecargar la memoria y previene congelamiento de pantalla'
                          >
                            ⚡ Paginado ({totalPages} págs)
                          </button>
                          <button
                            type='button'
                            onClick={() => {
                              if (
                                previewData.stats.charCount > 300_000 &&
                                !confirm(
                                  'Este documento contiene más de 300,000 caracteres. Renderizar todo el contenido continuo en una sola vista puede ralentizar tu navegador por unos segundos. ¿Deseas continuar?'
                                )
                              ) {
                                return
                              }
                              setIsPagedMode(false)
                              scrollToTop()
                            }}
                            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                              !isPagedMode
                                ? 'bg-background text-primary shadow-2xs'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                            title='Modo continuo: Muestra todo el documento de principio a fin'
                          >
                            Continuo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Resultados de búsqueda con saltos entre páginas */}
                  {searchMatchesByPage.length > 0 && isPagedMode && (
                    <div className='bg-primary/5 border border-primary/20 rounded-2xl p-3 text-xs space-y-1.5'>
                      <div className='flex items-center gap-1.5 text-primary font-semibold'>
                        <Search className='size-3.5' />
                        <span>
                          Coincidencias para &quot;{searchQuery}&quot; en el
                          documento:
                        </span>
                      </div>
                      <div className='flex items-center gap-1.5 flex-wrap pt-0.5'>
                        {searchMatchesByPage.map((m) => (
                          <button
                            key={m.page}
                            type='button'
                            onClick={() => handlePageChange(m.page)}
                            className={`px-2 py-0.5 rounded-lg border text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                              currentPage === m.page
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background border-border/70 text-foreground hover:border-primary/50'
                            }`}
                          >
                            Pág. {m.page} ({m.count})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Barra de Paginación Superior (Si está en modo paginado) */}
                  {isPagedMode && totalPages > 1 && (
                    <div className='flex items-center justify-between gap-3 bg-card border border-border/70 p-3 rounded-2xl shadow-2xs flex-wrap'>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs text-muted-foreground'>
                          Sección{' '}
                          <strong className='text-foreground font-semibold'>
                            {currentPage}
                          </strong>{' '}
                          de{' '}
                          <strong className='text-foreground font-semibold'>
                            {totalPages}
                          </strong>
                        </span>
                        <span className='text-[10px] text-muted-foreground/70 hidden sm:inline'>
                          (~{CHARS_PER_PAGE.toLocaleString()} caracteres por
                          sección)
                        </span>
                      </div>

                      <div className='flex items-center gap-1'>
                        <Button
                          size='icon-xs'
                          variant='outline'
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(1)}
                          className='rounded-lg cursor-pointer h-7 w-7'
                          title='Primera sección'
                        >
                          <ChevronsLeft className='size-3.5' />
                        </Button>
                        <Button
                          size='icon-xs'
                          variant='outline'
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                          className='rounded-lg cursor-pointer h-7 w-7'
                          title='Sección anterior'
                        >
                          <ChevronLeft className='size-3.5' />
                        </Button>

                        <div className='flex items-center gap-1 px-1'>
                          <input
                            type='number'
                            min={1}
                            max={totalPages}
                            value={jumpPageInput}
                            placeholder={String(currentPage)}
                            onChange={(e) => setJumpPageInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && jumpPageInput) {
                                handlePageChange(Number(jumpPageInput))
                              }
                            }}
                            className='w-11 text-center rounded-lg border border-border bg-background py-1 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary'
                            title='Ingresa número de página y pulsa Enter'
                          />
                          <span className='text-xs text-muted-foreground font-mono'>
                            / {totalPages}
                          </span>
                        </div>

                        <Button
                          size='icon-xs'
                          variant='outline'
                          disabled={currentPage === totalPages}
                          onClick={() => handlePageChange(currentPage + 1)}
                          className='rounded-lg cursor-pointer h-7 w-7'
                          title='Siguiente sección'
                        >
                          <ChevronRight className='size-3.5' />
                        </Button>
                        <Button
                          size='icon-xs'
                          variant='outline'
                          disabled={currentPage === totalPages}
                          onClick={() => handlePageChange(totalPages)}
                          className='rounded-lg cursor-pointer h-7 w-7'
                          title='Última sección'
                        >
                          <ChevronsRight className='size-3.5' />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Contenedor del Markdown Renderizado */}
                  <div className='bg-card border border-border/80 rounded-3xl p-6 sm:p-10 shadow-xs leading-relaxed'>
                    {currentMarkdownToRender ? (
                      <article className='prose dark:prose-invert max-w-none text-foreground font-exo leading-relaxed [&_h1]:font-frances [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-primary [&_h2]:font-frances [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:font-frances [&_h3]:text-lg [&_h3]:font-semibold [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-border/70 [&_th]:bg-muted/70 [&_th]:border [&_th]:border-border/70 [&_th]:p-2.5 [&_th]:text-xs [&_th]:font-semibold [&_td]:border [&_td]:border-border/50 [&_td]:p-2.5 [&_td]:text-xs [&_tr:nth-child(even)]:bg-muted/20'>
                        <MarkdownRenderer
                          content={currentMarkdownToRender}
                          maxWidth='none'
                          enableMath={true}
                        />
                      </article>
                    ) : (
                      <div className='text-center py-12 text-muted-foreground text-xs'>
                        No hay contenido de texto disponible para renderizar en
                        este documento.
                      </div>
                    )}
                  </div>

                  {/* Barra de Paginación Inferior (Para navegar al terminar de leer la página) */}
                  {isPagedMode && totalPages > 1 && (
                    <div className='flex items-center justify-between gap-3 bg-card border border-border/70 p-3 rounded-2xl shadow-2xs flex-wrap'>
                      <span className='text-xs text-muted-foreground'>
                        Fin de la sección {currentPage} de {totalPages}
                      </span>

                      <div className='flex items-center gap-1.5'>
                        <Button
                          size='xs'
                          variant='outline'
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                          className='gap-1 rounded-xl text-xs cursor-pointer'
                        >
                          <ChevronLeft className='size-3.5' /> Anterior
                        </Button>
                        <Button
                          size='xs'
                          variant='default'
                          disabled={currentPage === totalPages}
                          onClick={() => handlePageChange(currentPage + 1)}
                          className='gap-1 rounded-xl text-xs font-semibold cursor-pointer'
                        >
                          Siguiente <ChevronRight className='size-3.5' />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* PESTAÑA 2: VISOR PDF ORIGINAL O CÓDIGO FUENTE */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'original' && (
                <div className='space-y-4'>
                  {previewData.isPdf &&
                  directFileUrl &&
                  directFileUrl.trim() ? (
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between bg-sky-500/10 border border-sky-500/20 px-4 py-2.5 rounded-2xl text-xs text-sky-700 dark:text-sky-300'>
                        <div className='flex items-center gap-2'>
                          <Sparkles className='size-4 text-sky-600' />
                          <span>
                            Visualizando archivo PDF institucional oficial en
                            alta fidelidad.
                          </span>
                        </div>
                        <a
                          href={directFileUrl}
                          target='_blank'
                          rel='noreferrer'
                          className='inline-flex items-center gap-1 font-semibold hover:underline'
                        >
                          Pantalla completa <ExternalLink className='size-3' />
                        </a>
                      </div>

                      <div className='w-full h-[75vh] rounded-3xl border border-border/80 overflow-hidden bg-muted/20 shadow-xs'>
                        <iframe
                          src={directFileUrl}
                          className='w-full h-full border-0'
                          title={previewData.document.title}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between bg-muted/40 border border-border/70 px-4 py-2.5 rounded-2xl text-xs text-muted-foreground'>
                        <span>
                          Vista cruda del código fuente Markdown con líneas y
                          caracteres normalizados.
                        </span>
                        <Button
                          size='xs'
                          variant='ghost'
                          onClick={handleCopyMarkdown}
                          className='gap-1 text-xs cursor-pointer'
                        >
                          <Copy className='size-3' /> Copiar código
                        </Button>
                      </div>

                      <div className='rounded-3xl border border-border/80 bg-card p-4 overflow-x-auto shadow-xs max-w-full'>
                        <pre className='text-xs font-mono leading-relaxed text-foreground whitespace-pre-wrap select-text max-w-full break-all break-words overflow-x-auto'>
                          {previewData.markdownContent}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* PESTAÑA 3: FRAGMENTOS RAG (CHUNKS) CON PAGINACIÓN */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'chunks' && (
                <div className='space-y-4'>
                  <div className='flex items-center justify-between gap-3 bg-card border border-border/80 px-4 py-2.5 rounded-2xl text-xs text-muted-foreground shadow-2xs flex-wrap'>
                    <span>
                      Mostrando{' '}
                      <strong className='text-foreground'>
                        {allFilteredChunks.length}
                      </strong>{' '}
                      de {previewData.chunks.length} fragmentos semánticos en
                      PostgreSQL.
                    </span>

                    {onNavigateToChunks && initialDoc && (
                      <Button
                        size='xs'
                        variant='outline'
                        onClick={() => {
                          onOpenChange(false)
                          onNavigateToChunks(initialDoc)
                        }}
                        className='gap-1.5 rounded-xl text-xs font-semibold text-primary border-primary/30 cursor-pointer'
                      >
                        <Layers className='size-3.5' /> Gestionar y Editar
                        Chunks
                      </Button>
                    )}
                  </div>

                  {allFilteredChunks.length === 0 ? (
                    <div className='text-center py-12 text-muted-foreground text-xs bg-card rounded-3xl border border-border/60 p-8'>
                      No se encontraron fragmentos que coincidan con &quot;
                      {searchQuery}&quot;.
                    </div>
                  ) : (
                    <div className='space-y-3'>
                      {/* Paginador superior de chunks si hay más de 20 */}
                      {totalChunkPages > 1 && (
                        <div className='flex items-center justify-between gap-2 bg-card/60 border border-border/60 p-2.5 rounded-xl text-xs'>
                          <span className='text-muted-foreground'>
                            Página <strong>{chunksPage}</strong> de{' '}
                            <strong>{totalChunkPages}</strong> (20 por página)
                          </span>
                          <div className='flex items-center gap-1'>
                            <Button
                              size='icon-xs'
                              variant='outline'
                              disabled={chunksPage === 1}
                              onClick={() => setChunksPage((p) => p - 1)}
                              className='rounded-lg h-6 w-6'
                            >
                              <ChevronLeft className='size-3' />
                            </Button>
                            <span className='px-2 font-mono'>
                              {chunksPage} / {totalChunkPages}
                            </span>
                            <Button
                              size='icon-xs'
                              variant='outline'
                              disabled={chunksPage === totalChunkPages}
                              onClick={() => setChunksPage((p) => p + 1)}
                              className='rounded-lg h-6 w-6'
                            >
                              <ChevronRight className='size-3' />
                            </Button>
                          </div>
                        </div>
                      )}

                      {paginatedChunks.map((chunk) => {
                        const isCopied = copiedChunkId === chunk.id
                        return (
                          <div
                            key={chunk.id}
                            className='rounded-2xl border border-border/70 bg-card p-4 space-y-2 shadow-2xs hover:border-primary/40 transition-colors'
                          >
                            <div className='flex items-center justify-between gap-2 flex-wrap text-xs'>
                              <div className='flex items-center gap-2'>
                                <Badge
                                  variant='outline'
                                  className='font-mono font-bold bg-muted/40 text-[11px]'
                                >
                                  <Hash className='size-2.5 mr-0.5' />
                                  Chunk #{chunk.chunkIndex + 1}
                                </Badge>

                                {chunk.pageNumber && (
                                  <Badge
                                    variant='outline'
                                    className='text-[10px] text-muted-foreground'
                                  >
                                    Pág. {chunk.pageNumber}
                                  </Badge>
                                )}

                                {chunk.hasEmbedding ? (
                                  <Badge
                                    variant='outline'
                                    className='border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[9px] font-bold'
                                  >
                                    Vectorizado (1536d)
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant='outline'
                                    className='border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-[9px] font-bold'
                                  >
                                    Sin vector
                                  </Badge>
                                )}
                              </div>

                              <Button
                                size='icon-xs'
                                variant='ghost'
                                onClick={() =>
                                  handleCopyChunk(chunk.id, chunk.content)
                                }
                                className='rounded-lg text-muted-foreground hover:text-foreground cursor-pointer h-7 w-7'
                                title='Copiar este fragmento'
                              >
                                {isCopied ? (
                                  <Check className='size-3 text-emerald-500' />
                                ) : (
                                  <Copy className='size-3' />
                                )}
                              </Button>
                            </div>

                            <div className='rounded-xl bg-muted/20 border border-border/50 p-3 text-xs font-mono leading-relaxed text-foreground whitespace-pre-wrap select-text max-w-full break-all break-words overflow-hidden'>
                              {chunk.content}
                            </div>
                          </div>
                        )
                      })}

                      {/* Paginador inferior de chunks si hay más de 20 */}
                      {totalChunkPages > 1 && (
                        <div className='flex items-center justify-between gap-2 bg-card/60 border border-border/60 p-2.5 rounded-xl text-xs'>
                          <span className='text-muted-foreground'>
                            Mostrando {(chunksPage - 1) * CHUNKS_PER_PAGE + 1} -{' '}
                            {Math.min(
                              chunksPage * CHUNKS_PER_PAGE,
                              allFilteredChunks.length
                            )}{' '}
                            de {allFilteredChunks.length} fragmentos
                          </span>
                          <div className='flex items-center gap-1'>
                            <Button
                              size='icon-xs'
                              variant='outline'
                              disabled={chunksPage === 1}
                              onClick={() => setChunksPage((p) => p - 1)}
                              className='rounded-lg h-6 w-6'
                            >
                              <ChevronLeft className='size-3' />
                            </Button>
                            <span className='px-2 font-mono'>
                              {chunksPage} / {totalChunkPages}
                            </span>
                            <Button
                              size='icon-xs'
                              variant='outline'
                              disabled={chunksPage === totalChunkPages}
                              onClick={() => setChunksPage((p) => p + 1)}
                              className='rounded-lg h-6 w-6'
                            >
                              <ChevronRight className='size-3' />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Botón flotante para volver arriba */}
          {showScrollTop && (
            <button
              type='button'
              onClick={scrollToTop}
              className='fixed bottom-6 right-8 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all cursor-pointer z-50 flex items-center justify-center'
              title='Volver arriba'
            >
              <ArrowUp className='size-4' />
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
