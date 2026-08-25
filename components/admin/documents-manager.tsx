'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  toggleDocumentStatus,
  deleteDocumentAction,
  updateDocumentCategory,
  createDocumentDirectAction,
  getDocumentChunksAction,
  updateDocumentChunkAction,
  deleteDocumentChunkAction,
  addDocumentChunkAction,
} from '@/lib/actions/admin-documents'
import { UploadDropzone } from '@/lib/uploadthing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Trash2,
  ExternalLink,
  HardDrive,
  Database,
  Layers,
  Sparkles,
  Tag,
  Plus,
  Edit3,
  Save,
  X,
  BookOpen,
} from 'lucide-react'
import { getErrorMessage } from '@/lib/utils'
import type { DocumentStatus } from '@/lib/prisma'
import type { DocumentItem, TopicCategoryItem } from '@/types'

interface DocumentsManagerProps {
  initialDocuments: DocumentItem[]
  topicCategories: TopicCategoryItem[]
  stats: {
    total: number
    indexed: number
    totalBytes: number
  }
}

interface ChunkItem {
  id: string
  chunkIndex: number
  content: string
  pageNumber: number | null
  _count?: { citations: number }
}

export function DocumentsManager({
  initialDocuments,
  topicCategories,
  stats: initialStats,
}: DocumentsManagerProps) {
  const [documents, setDocuments] = React.useState<DocumentItem[]>(initialDocuments)
  const [stats, setStats] = React.useState(initialStats)
  const [isUpdating, setIsUpdating] = React.useState(false)

  // Estado para Modal de Crear Documento Directo
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [newTitle, setNewTitle] = React.useState('')
  const [newPublicUrl, setNewPublicUrl] = React.useState('')
  const [newCategoryId, setNewCategoryId] = React.useState('none')
  const [newContent, setNewContent] = React.useState('')
  const [isCreating, setIsCreating] = React.useState(false)

  // Estado para Modal de Gestión de Fragmentos (Chunks)
  const [activeDocForChunks, setActiveDocForChunks] = React.useState<{
    id: string
    title: string
  } | null>(null)
  const [chunks, setChunks] = React.useState<ChunkItem[]>([])
  const [isLoadingChunks, setIsLoadingChunks] = React.useState(false)
  const [editingChunkId, setEditingChunkId] = React.useState<string | null>(null)
  const [editChunkContent, setEditChunkContent] = React.useState('')
  const [editChunkPage, setEditChunkPage] = React.useState<number | ''>('')
  const [isSavingChunk, setIsSavingChunk] = React.useState(false)

  // Estado para Agregar Nuevo Fragmento
  const [isAddingChunk, setIsAddingChunk] = React.useState(false)
  const [newChunkContent, setNewChunkContent] = React.useState('')
  const [newChunkPage, setNewChunkPage] = React.useState<number | ''>('')

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const handleToggleStatus = async (id: string, currentStatus: DocumentStatus) => {
    const nextStatus: DocumentStatus =
      currentStatus === 'INDEXED' ? 'DEINDEXED' : 'INDEXED'

    setIsUpdating(true)
    try {
      await toggleDocumentStatus(id, nextStatus)
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === id ? { ...doc, status: nextStatus } : doc))
      )
      setStats((prev) => ({
        ...prev,
        indexed:
          nextStatus === 'INDEXED' ? prev.indexed + 1 : Math.max(0, prev.indexed - 1),
      }))
      toast.success(
        nextStatus === 'INDEXED'
          ? 'Documento indexado para consultas RAG'
          : 'Documento desindexado/pausado temporalmente'
      )
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al cambiar estado')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCategoryChange = async (docId: string, categoryId: string) => {
    const val = categoryId === 'none' ? null : categoryId
    try {
      await updateDocumentCategory(docId, val)
      const catObj = topicCategories.find((c) => c.id === val)
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === docId
            ? {
                ...doc,
                categoryId: val,
                category: catObj ? { id: catObj.id, name: catObj.name, code: catObj.code } : null,
              }
            : doc
        )
      )
      toast.success('Categoría temática actualizada')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al cambiar categoría')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar "${name}" del sistema de conocimiento?`)) {
      return
    }

    try {
      await deleteDocumentAction(id)
      const removedDoc = documents.find((d) => d.id === id)
      setDocuments((prev) => prev.filter((d) => d.id !== id))
      if (removedDoc) {
        setStats((prev) => ({
          total: prev.total - 1,
          indexed:
            removedDoc.status === 'INDEXED'
              ? Math.max(0, prev.indexed - 1)
              : prev.indexed,
          totalBytes: Math.max(0, prev.totalBytes - removedDoc.sizeBytes),
        }))
      }
      toast.success('Documento eliminado correctamente')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al eliminar el documento')
    }
  }

  // Crear Documento Directo e Indexar
  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Por favor completa el título y el contenido del documento.')
      return
    }

    setIsCreating(true)
    try {
      const res = await createDocumentDirectAction({
        title: newTitle.trim(),
        publicUrl: newPublicUrl.trim() || undefined,
        categoryId: newCategoryId === 'none' ? null : newCategoryId,
        content: newContent.trim(),
      })

      toast.success(`¡Documento creado e indexado con ${res.chunkCount} fragmentos RAG!`)
      setIsCreateOpen(false)
      setNewTitle('')
      setNewPublicUrl('')
      setNewContent('')
      setNewCategoryId('none')
      window.location.reload()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al crear documento')
    } finally {
      setIsCreating(false)
    }
  }

  // Abrir Modal de Gestión de Chunks
  const handleOpenChunksModal = async (doc: DocumentItem) => {
    setActiveDocForChunks({ id: doc.id, title: doc.title || doc.fileName })
    setIsLoadingChunks(true)
    setEditingChunkId(null)
    setIsAddingChunk(false)
    try {
      const res = await getDocumentChunksAction(doc.id)
      setChunks(res.chunks as any)
    } catch (err) {
      toast.error('Error al cargar fragmentos del documento.')
    } finally {
      setIsLoadingChunks(false)
    }
  }

  // Guardar Edición de un Chunk
  const handleSaveChunk = async (chunkId: string) => {
    if (!editChunkContent.trim()) {
      toast.error('El contenido del fragmento no puede estar vacío.')
      return
    }

    setIsSavingChunk(true)
    try {
      await updateDocumentChunkAction(
        chunkId,
        editChunkContent.trim(),
        editChunkPage === '' ? null : Number(editChunkPage)
      )
      setChunks((prev) =>
        prev.map((c) =>
          c.id === chunkId
            ? {
                ...c,
                content: editChunkContent.trim(),
                pageNumber: editChunkPage === '' ? null : Number(editChunkPage),
              }
            : c
        )
      )
      setEditingChunkId(null)
      toast.success('Fragmento RAG actualizado correctamente.')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al guardar fragmento')
    } finally {
      setIsSavingChunk(false)
    }
  }

  // Eliminar un Chunk
  const handleDeleteChunk = async (chunkId: string) => {
    if (!confirm('¿Eliminar este fragmento RAG?')) return

    try {
      await deleteDocumentChunkAction(chunkId)
      setChunks((prev) => prev.filter((c) => c.id !== chunkId))
      toast.success('Fragmento eliminado.')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al eliminar fragmento')
    }
  }

  // Agregar un Nuevo Chunk
  const handleAddChunk = async () => {
    if (!activeDocForChunks || !newChunkContent.trim()) {
      toast.error('Ingresa el contenido del fragmento.')
      return
    }

    setIsSavingChunk(true)
    try {
      const res = await addDocumentChunkAction(
        activeDocForChunks.id,
        newChunkContent.trim(),
        newChunkPage === '' ? null : Number(newChunkPage)
      )
      setChunks((prev) => [...prev, res.chunk as any])
      setIsAddingChunk(false)
      setNewChunkContent('')
      setNewChunkPage('')
      toast.success('Nuevo fragmento RAG añadido e indexado.')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al agregar fragmento')
    } finally {
      setIsSavingChunk(false)
    }
  }

  return (
    <div className='space-y-6 font-exo'>
      {/* Cabecera y Descripción */}
      <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div className='space-y-1'>
          <h2 className='font-frances text-xl font-bold text-foreground flex items-center gap-2'>
            <Database className='w-5 h-5 text-primary' />
            Ingesta de Documentos y Base de Conocimiento RAG
          </h2>
          <p className='text-xs text-muted-foreground max-w-xl leading-relaxed'>
            Sube reglamentos de matrícula, normativas de grados, cronogramas y directivas de la USS. Administra los fragmentos semánticos (chunks) indexados para búsquedas vectoriales con Gemini.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className='gap-2 rounded-2xl cursor-pointer text-xs font-semibold'
        >
          <Plus className='w-4 h-4' /> Registrar Nuevo Documento
        </Button>
      </div>

      {/* Grid de Estadísticas */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div className='rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-1.5'>
          <div className='flex items-center justify-between text-muted-foreground'>
            <span className='text-xs font-semibold'>Total Documentos</span>
            <FileText className='w-4 h-4 text-primary' />
          </div>
          <p className='text-2xl font-bold font-mono text-foreground'>
            {stats.total}
          </p>
          <p className='text-[10px] text-muted-foreground'>
            Archivos institucionales registrados
          </p>
        </div>

        <div className='rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-1.5'>
          <div className='flex items-center justify-between text-muted-foreground'>
            <span className='text-xs font-semibold'>Indexados en RAG</span>
            <CheckCircle2 className='w-4 h-4 text-emerald-500' />
          </div>
          <p className='text-2xl font-bold font-mono text-foreground'>
            {stats.indexed}
          </p>
          <p className='text-[10px] text-muted-foreground'>
            Activos para respuestas inteligentes
          </p>
        </div>

        <div className='rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-1.5'>
          <div className='flex items-center justify-between text-muted-foreground'>
            <span className='text-xs font-semibold'>Almacenamiento Total</span>
            <HardDrive className='w-4 h-4 text-sky-500' />
          </div>
          <p className='text-2xl font-bold font-mono text-foreground'>
            {formatFileSize(stats.totalBytes)}
          </p>
          <p className='text-[10px] text-muted-foreground'>
            Espacio en servidor UploadThing
          </p>
        </div>
      </div>

      {/* Zona de Carga Rápida con UploadThing */}
      <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4'>
        <div className='border-b border-border/40 pb-3 flex items-center justify-between'>
          <div>
            <h3 className='font-frances text-base font-bold text-foreground flex items-center gap-2'>
              <UploadCloud className='w-4 h-4 text-primary' />
              Subir Archivos PDF / TXT
            </h3>
            <p className='text-xs text-muted-foreground'>
              Arrastra o selecciona reglamentos oficiales universitarios (hasta 16 MB).
            </p>
          </div>
        </div>

        <div className='pt-2'>
          <UploadDropzone
            endpoint='documentUploader'
            onClientUploadComplete={(res) => {
              toast.success(`¡${res?.length || 1} archivo(s) subido(s) con éxito!`)
              window.location.reload()
            }}
            onUploadError={(error: Error) => {
              toast.error(`Error al subir archivo: ${error.message}`)
            }}
            className='border-2 border-dashed border-border/80 rounded-3xl p-6 hover:border-primary/50 transition-colors bg-background/50 ut-button:bg-primary ut-button:rounded-xl ut-button:text-xs ut-button:font-semibold ut-label:text-primary ut-label:text-sm'
          />
        </div>
      </div>

      {/* Listado de Documentos con Gestión de Chunks */}
      <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4'>
        <div className='border-b border-border/40 pb-3 flex items-center justify-between'>
          <h3 className='font-frances text-base font-bold text-foreground flex items-center gap-2'>
            <Layers className='w-4 h-4 text-primary' />
            Documentos en la Base de Conocimiento ({documents.length})
          </h3>
        </div>

        {documents.length === 0 ? (
          <div className='py-8 text-center text-xs text-muted-foreground space-y-1'>
            <FileText className='w-6 h-6 mx-auto text-muted-foreground/60 mb-2' />
            <p className='font-semibold text-foreground'>No hay documentos registrados</p>
            <p className='text-[11px]'>Sube tu primer reglamento oficial o regístralo manualmente.</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {documents.map((doc) => {
              const isIndexed = doc.status === 'INDEXED'
              const isProcessing = doc.status === 'PROCESSING'
              const dateStr = new Date(doc.createdAt).toLocaleDateString('es-PE', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })

              return (
                <div
                  key={doc.id}
                  className='rounded-2xl border border-border/70 p-4 bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-border transition-all'
                >
                  <div className='flex items-start gap-3 min-w-0 flex-1'>
                    <div className='h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0'>
                      <FileText className='w-5 h-5' />
                    </div>
                    <div className='min-w-0 flex-1 space-y-1.5'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <p className='font-bold text-xs text-foreground truncate'>
                          {doc.title || doc.fileName}
                        </p>
                        {isIndexed && (
                          <Badge variant='outline' className='border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[9px] py-0'>
                            Indexado RAG ({doc.chunkCount || 0} chunks)
                          </Badge>
                        )}
                        {isProcessing && (
                          <Badge variant='outline' className='border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-[9px] py-0'>
                            En Proceso
                          </Badge>
                        )}
                        {doc.status === 'DEINDEXED' && (
                          <Badge variant='outline' className='border-muted-foreground/40 text-muted-foreground text-[9px] py-0'>
                            Desindexado
                          </Badge>
                        )}
                      </div>

                      <div className='flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap'>
                        <span>{formatFileSize(doc.sizeBytes)}</span>
                        <span>•</span>
                        <span suppressHydrationWarning>Subido el {dateStr}</span>
                        {doc.uploadedBy?.email && (
                          <>
                            <span>•</span>
                            <span>por {doc.uploadedBy.email}</span>
                          </>
                        )}
                      </div>

                      {/* Selector de Categoría Temática */}
                      {topicCategories.length > 0 && (
                        <div className='flex items-center gap-2 pt-1'>
                          <Tag className='w-3 h-3 text-muted-foreground' />
                          <select
                            value={doc.categoryId || 'none'}
                            onChange={(e) => handleCategoryChange(doc.id, e.target.value)}
                            className='rounded-lg border border-border/80 bg-background px-2 py-0.5 text-[10px] font-exo text-foreground focus:outline-none focus:ring-1 focus:ring-primary'
                          >
                            <option value='none'>Sin categoría temática</option>
                            {topicCategories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name} ({cat.code})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className='flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40 flex-wrap'>
                    {/* Botón Ver / Editar Chunks RAG */}
                    <Button
                      size='xs'
                      variant='outline'
                      onClick={() => handleOpenChunksModal(doc)}
                      className='gap-1 text-[11px] rounded-xl font-semibold border-primary/30 text-primary bg-primary/5 hover:bg-primary/10'
                      title='Ver y editar fragmentos semánticos indexados'
                    >
                      <BookOpen className='w-3.5 h-3.5' /> Fragmentos RAG
                    </Button>

                    {/* Botón Ver Documento Oficial en otra ventana */}
                    {(doc.fileUrl || doc.publicUrl) && (
                      <Button
                        size='xs'
                        variant='ghost'
                        render={
                          <a
                            href={doc.publicUrl || doc.fileUrl || '#'}
                            target='_blank'
                            rel='noreferrer'
                          />
                        }
                        className='gap-1 text-[11px] rounded-xl text-muted-foreground hover:text-foreground'
                        title='Abrir documento oficial en otra ventana'
                      >
                        <ExternalLink className='w-3.5 h-3.5' /> Ver PDF
                      </Button>
                    )}

                    {/* Botón Alternar Estado RAG */}
                    <Button
                      size='xs'
                      variant={isIndexed ? 'outline' : 'default'}
                      onClick={() => handleToggleStatus(doc.id, doc.status)}
                      disabled={isUpdating}
                      className='gap-1 text-[11px] rounded-xl'
                    >
                      <Sparkles className='w-3.5 h-3.5' />
                      {isIndexed ? 'Desindexar' : 'Indexar RAG'}
                    </Button>

                    {/* Botón Eliminar */}
                    <Button
                      size='xs'
                      variant='ghost'
                      onClick={() => handleDelete(doc.id, doc.title || doc.fileName)}
                      className='text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 text-[11px] rounded-xl'
                      title='Eliminar documento'
                    >
                      <Trash2 className='w-3.5 h-3.5' />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL: Registrar Documento Directo */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className='max-w-2xl font-exo rounded-3xl'>
          <DialogHeader>
            <DialogTitle className='font-frances text-lg font-bold flex items-center gap-2'>
              <BookOpen className='w-5 h-5 text-primary' /> Registrar Documento o Reglamento RAG
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground'>
              Ingresa el contenido oficial del reglamento para que SipánGPT lo divida en fragmentos semánticos y lo indexe automáticamente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateDocument} className='space-y-4 pt-2'>
            <div className='space-y-1.5'>
              <label className='text-xs font-semibold text-foreground'>
                Título del Documento *
              </label>
              <input
                type='text'
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder='Ej: Reglamento General de Matrícula y Admisión USS 2026'
                className='w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary'
              />
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-foreground'>
                  Enlace Oficial (PDF / Portal)
                </label>
                <input
                  type='url'
                  value={newPublicUrl}
                  onChange={(e) => setNewPublicUrl(e.target.value)}
                  placeholder='https://www.uss.edu.pe/transparencia/reglamento.pdf'
                  className='w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-foreground'>
                  Categoría Temática
                </label>
                <select
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  className='w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary'
                >
                  <option value='none'>Sin categoría temática</option>
                  {topicCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className='space-y-1.5'>
              <label className='text-xs font-semibold text-foreground'>
                Contenido Textual del Documento / Artículos *
              </label>
              <textarea
                required
                rows={9}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder='Pega aquí el texto completo del reglamento, artículos, directivas o cronogramas académicos...'
                className='w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary'
              />
              <p className='text-[10px] text-muted-foreground'>
                El sistema fragmentará automáticamente el texto en bloques semánticos y los preparará para búsquedas vectoriales.
              </p>
            </div>

            <div className='flex justify-end gap-2 pt-2 border-t border-border/40'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setIsCreateOpen(false)}
                className='rounded-xl text-xs'
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={isCreating}
                className='gap-2 rounded-xl text-xs font-semibold'
              >
                <Sparkles className='w-4 h-4' />
                {isCreating ? 'Indexando en RAG...' : 'Guardar e Indexar Documento'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: Gestionar y Editar Fragmentos (Chunks) */}
      <Dialog
        open={Boolean(activeDocForChunks)}
        onOpenChange={(open) => !open && setActiveDocForChunks(null)}
      >
        <DialogContent className='max-w-3xl max-h-[85vh] flex flex-col font-exo rounded-3xl p-6'>
          <DialogHeader className='shrink-0'>
            <DialogTitle className='font-frances text-lg font-bold flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Layers className='w-5 h-5 text-primary' />
                <span>Fragmentos RAG: {activeDocForChunks?.title}</span>
              </div>
              <Badge variant='outline' className='text-[10px] font-mono'>
                {chunks.length} fragmentos indexados
              </Badge>
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground'>
              Visualiza y edita el contenido exacto de cada fragmento utilizado por Gemini para responder a los estudiantes.
            </DialogDescription>
          </DialogHeader>

          {/* Botón para agregar fragmento manual */}
          <div className='flex justify-between items-center pt-2 shrink-0 border-b border-border/40 pb-2'>
            <span className='text-xs font-semibold text-foreground'>
              Lista de Fragmentos Semánticos
            </span>
            <Button
              size='xs'
              variant='outline'
              onClick={() => setIsAddingChunk(!isAddingChunk)}
              className='gap-1 text-[11px] rounded-xl'
            >
              <Plus className='w-3.5 h-3.5' /> {isAddingChunk ? 'Cancelar' : 'Añadir Fragmento'}
            </Button>
          </div>

          {/* Formulario Añadir Fragmento */}
          {isAddingChunk && (
            <div className='rounded-2xl border border-primary/30 bg-primary/5 p-3.5 space-y-2.5 shrink-0'>
              <div className='flex items-center justify-between'>
                <span className='text-xs font-bold text-primary'>Nuevo Fragmento Semántico</span>
                <input
                  type='number'
                  placeholder='Página'
                  value={newChunkPage}
                  onChange={(e) =>
                    setNewChunkPage(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className='w-24 rounded-lg border border-border bg-background px-2 py-0.5 text-[11px]'
                />
              </div>
              <textarea
                rows={3}
                value={newChunkContent}
                onChange={(e) => setNewChunkContent(e.target.value)}
                placeholder='Escribe el texto normativo del fragmento...'
                className='w-full rounded-xl border border-border bg-background p-2.5 text-xs font-mono leading-relaxed'
              />
              <div className='flex justify-end gap-2'>
                <Button
                  size='xs'
                  disabled={isSavingChunk}
                  onClick={handleAddChunk}
                  className='gap-1 rounded-xl text-xs'
                >
                  <Save className='w-3.5 h-3.5' /> Guardar Fragmento
                </Button>
              </div>
            </div>
          )}

          {/* Lista desplazable de Chunks */}
          <div className='flex-1 overflow-y-auto space-y-3 pr-1 pt-2'>
            {isLoadingChunks ? (
              <div className='py-12 text-center text-xs text-muted-foreground'>
                Cargando fragmentos del documento...
              </div>
            ) : chunks.length === 0 ? (
              <div className='py-12 text-center text-xs text-muted-foreground'>
                No hay fragmentos indexados para este documento.
              </div>
            ) : (
              chunks.map((chunk, idx) => {
                const isEditing = editingChunkId === chunk.id

                return (
                  <div
                    key={chunk.id}
                    className='rounded-2xl border border-border/80 bg-card p-3.5 space-y-2 text-xs shadow-xs hover:border-border transition-colors'
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <Badge variant='secondary' className='text-[10px] font-mono py-0'>
                          Chunk #{idx + 1}
                        </Badge>
                        {chunk.pageNumber && (
                          <span className='text-[11px] text-muted-foreground'>
                            Pág. {chunk.pageNumber}
                          </span>
                        )}
                        {chunk._count?.citations ? (
                          <Badge variant='outline' className='text-[9px] text-primary py-0'>
                            {chunk._count.citations} cita(s) realizadas
                          </Badge>
                        ) : null}
                      </div>

                      <div className='flex items-center gap-1'>
                        {!isEditing ? (
                          <>
                            <Button
                              size='icon-xs'
                              variant='ghost'
                              onClick={() => {
                                setEditingChunkId(chunk.id)
                                setEditChunkContent(chunk.content)
                                setEditChunkPage(chunk.pageNumber ?? '')
                              }}
                              className='rounded-lg text-muted-foreground hover:text-foreground'
                              title='Editar texto del fragmento'
                            >
                              <Edit3 className='w-3.5 h-3.5' />
                            </Button>
                            <Button
                              size='icon-xs'
                              variant='ghost'
                              onClick={() => handleDeleteChunk(chunk.id)}
                              className='rounded-lg text-rose-600 hover:text-rose-700'
                              title='Eliminar fragmento'
                            >
                              <Trash2 className='w-3.5 h-3.5' />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size='icon-xs'
                            variant='ghost'
                            onClick={() => setEditingChunkId(null)}
                            className='rounded-lg text-muted-foreground hover:text-foreground'
                            title='Cancelar edición'
                          >
                            <X className='w-3.5 h-3.5' />
                          </Button>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className='space-y-2 pt-1'>
                        <div className='flex items-center gap-2'>
                          <span className='text-[11px] text-muted-foreground'>Número de Página:</span>
                          <input
                            type='number'
                            value={editChunkPage}
                            onChange={(e) =>
                              setEditChunkPage(e.target.value === '' ? '' : Number(e.target.value))
                            }
                            className='w-20 rounded-lg border border-border bg-background px-2 py-0.5 text-xs'
                          />
                        </div>
                        <textarea
                          rows={4}
                          value={editChunkContent}
                          onChange={(e) => setEditChunkContent(e.target.value)}
                          className='w-full rounded-xl border border-primary/40 bg-background p-2.5 text-xs font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary'
                        />
                        <div className='flex justify-end gap-2'>
                          <Button
                            size='xs'
                            variant='ghost'
                            onClick={() => setEditingChunkId(null)}
                            className='rounded-xl text-xs'
                          >
                            Cancelar
                          </Button>
                          <Button
                            size='xs'
                            disabled={isSavingChunk}
                            onClick={() => handleSaveChunk(chunk.id)}
                            className='gap-1 rounded-xl text-xs font-semibold'
                          >
                            <Save className='w-3.5 h-3.5' /> Guardar Cambios
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className='text-[11px] text-muted-foreground font-mono bg-muted/40 p-2.5 rounded-xl leading-relaxed border border-border/40 whitespace-pre-wrap'>
                        {chunk.content}
                      </p>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
