'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  toggleDocumentStatus,
  deleteDocumentAction,
  updateDocumentCategory,
  updateDocumentDetailsAction,
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
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select'
import { ConfirmAlertDialog } from '@/components/admin/confirm-alert-dialog'
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
  Search,
  PowerOff,
  Power,
  Link as LinkIcon,
  FileCode,
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
  const [activeTab, setActiveTab] = React.useState<'documents' | 'chunks'>('documents')

  // Estado para Modal de Crear Documento Directo
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [newTitle, setNewTitle] = React.useState('')
  const [newPublicUrl, setNewPublicUrl] = React.useState('')
  const [newCategoryId, setNewCategoryId] = React.useState('none')
  const [newContent, setNewContent] = React.useState('')
  const [isCreating, setIsCreating] = React.useState(false)

  // Estado para Modal de Editar Enlace / Metadatos del Documento
  const [editingDoc, setEditingDoc] = React.useState<DocumentItem | null>(null)
  const [editDocTitle, setEditDocTitle] = React.useState('')
  const [editDocPublicUrl, setEditDocPublicUrl] = React.useState('')
  const [editDocCategoryId, setEditDocCategoryId] = React.useState('none')
  const [isSavingDocDetails, setIsSavingDocDetails] = React.useState(false)

  // Estado para Gestión de Fragmentos (Chunks)
  const [selectedDocForChunks, setSelectedDocForChunks] = React.useState<DocumentItem | null>(
    documents.length > 0 ? documents[0] : null
  )
  const [chunks, setChunks] = React.useState<ChunkItem[]>([])
  const [isLoadingChunks, setIsLoadingChunks] = React.useState(false)
  const [chunkSearchQuery, setChunkSearchQuery] = React.useState('')
  const [editingChunkId, setEditingChunkId] = React.useState<string | null>(null)
  const [editChunkContent, setEditChunkContent] = React.useState('')
  const [editChunkPage, setEditChunkPage] = React.useState<number | ''>('')
  const [isSavingChunk, setIsSavingChunk] = React.useState(false)

  // Estado para Agregar Nuevo Fragmento
  const [isAddingChunk, setIsAddingChunk] = React.useState(false)
  const [newChunkContent, setNewChunkContent] = React.useState('')
  const [newChunkPage, setNewChunkPage] = React.useState<number | ''>('')

  // Estado para Alertas de Confirmación (AlertDialog)
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    isOpen: boolean
    type: 'document' | 'chunk' | 'deindex'
    id: string
    title: string
    chunkCount?: number
  }>({
    isOpen: false,
    type: 'document',
    id: '',
    title: '',
  })
  const [isAlertLoading, setIsAlertLoading] = React.useState(false)

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  // Cargar chunks cuando cambia el documento seleccionado
  React.useEffect(() => {
    if (selectedDocForChunks?.id) {
      loadChunks(selectedDocForChunks.id)
    }
  }, [selectedDocForChunks?.id])

  const loadChunks = async (docId: string) => {
    setIsLoadingChunks(true)
    setEditingChunkId(null)
    setIsAddingChunk(false)
    try {
      const res = await getDocumentChunksAction(docId)
      setChunks(res.chunks as any)
    } catch (err) {
      toast.error('Error al cargar los fragmentos del documento.')
    } finally {
      setIsLoadingChunks(false)
    }
  }

  // Cambiar a la pestaña de Chunks para un documento específico
  const handleNavigateToChunks = (doc: DocumentItem) => {
    setSelectedDocForChunks(doc)
    setActiveTab('chunks')
  }

  // Abrir Modal para Editar Enlace y Metadatos
  const handleOpenEditDoc = (doc: DocumentItem) => {
    setEditingDoc(doc)
    setEditDocTitle(doc.title || doc.fileName)
    setEditDocPublicUrl(doc.publicUrl || doc.fileUrl || '')
    setEditDocCategoryId(doc.categoryId || 'none')
  }

  // Guardar Cambios de Enlace / Metadatos
  const handleSaveDocDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDoc) return
    if (!editDocTitle.trim()) {
      toast.error('El título no puede estar vacío.')
      return
    }

    setIsSavingDocDetails(true)
    try {
      const res = await updateDocumentDetailsAction(editingDoc.id, {
        title: editDocTitle.trim(),
        publicUrl: editDocPublicUrl.trim() || null,
        categoryId: editDocCategoryId === 'none' ? null : editDocCategoryId,
      })

      setDocuments((prev) =>
        prev.map((d) => (d.id === editingDoc.id ? { ...d, ...res.document } : d))
      )
      if (selectedDocForChunks?.id === editingDoc.id) {
        setSelectedDocForChunks((prev) => (prev ? { ...prev, ...res.document } : null))
      }

      toast.success('Documento y enlace público actualizados.')
      setEditingDoc(null)
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al guardar los detalles.')
    } finally {
      setIsSavingDocDetails(false)
    }
  }

  // Ejecutar Acción Confirmada en AlertDialog
  const handleConfirmAlert = async () => {
    setIsAlertLoading(true)
    try {
      if (deleteConfirm.type === 'document') {
        await deleteDocumentAction(deleteConfirm.id)
        const removedDoc = documents.find((d) => d.id === deleteConfirm.id)
        setDocuments((prev) => prev.filter((d) => d.id !== deleteConfirm.id))
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
        if (selectedDocForChunks?.id === deleteConfirm.id) {
          const remaining = documents.filter((d) => d.id !== deleteConfirm.id)
          setSelectedDocForChunks(remaining.length > 0 ? remaining[0] : null)
        }
        toast.success('Documento eliminado correctamente.')
      } else if (deleteConfirm.type === 'chunk') {
        await deleteDocumentChunkAction(deleteConfirm.id)
        setChunks((prev) => prev.filter((c) => c.id !== deleteConfirm.id))
        if (selectedDocForChunks) {
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === selectedDocForChunks.id
                ? { ...d, chunkCount: Math.max(0, (d.chunkCount || 1) - 1) }
                : d
            )
          )
        }
        toast.success('Fragmento RAG eliminado.')
      } else if (deleteConfirm.type === 'deindex') {
        await toggleDocumentStatus(deleteConfirm.id, 'DEINDEXED')
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === deleteConfirm.id ? { ...doc, status: 'DEINDEXED' as DocumentStatus } : doc
          )
        )
        if (selectedDocForChunks?.id === deleteConfirm.id) {
          setSelectedDocForChunks((prev) =>
            prev ? { ...prev, status: 'DEINDEXED' as DocumentStatus } : null
          )
        }
        setStats((prev) => ({ ...prev, indexed: Math.max(0, prev.indexed - 1) }))
        toast.success('Documento desindexado. No será consultado por SipánGPT.')
      }
      setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al procesar la acción.')
    } finally {
      setIsAlertLoading(false)
    }
  }

  // Indexar o Desindexar
  const handleToggleIndex = (doc: DocumentItem) => {
    if (doc.status === 'INDEXED') {
      setDeleteConfirm({
        isOpen: true,
        type: 'deindex',
        id: doc.id,
        title: doc.title || doc.fileName,
      })
    } else {
      // Re-indexar directamente
      toggleDocumentStatus(doc.id, 'INDEXED')
        .then(() => {
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === doc.id ? { ...d, status: 'INDEXED' as DocumentStatus } : d
            )
          )
          if (selectedDocForChunks?.id === doc.id) {
            setSelectedDocForChunks((prev) =>
              prev ? { ...prev, status: 'INDEXED' as DocumentStatus } : null
            )
          }
          setStats((prev) => ({ ...prev, indexed: prev.indexed + 1 }))
          toast.success('Documento indexado para respuestas RAG.')
        })
        .catch((err) => toast.error(getErrorMessage(err) || 'Error al indexar.'))
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

  // Agregar un Nuevo Chunk
  const handleAddChunk = async () => {
    if (!selectedDocForChunks || !newChunkContent.trim()) {
      toast.error('Ingresa el contenido del fragmento.')
      return
    }

    setIsSavingChunk(true)
    try {
      const res = await addDocumentChunkAction(
        selectedDocForChunks.id,
        newChunkContent.trim(),
        newChunkPage === '' ? null : Number(newChunkPage)
      )
      setChunks((prev) => [...prev, res.chunk as any])
      setIsAddingChunk(false)
      setNewChunkContent('')
      setNewChunkPage('')
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === selectedDocForChunks.id
            ? { ...d, chunkCount: (d.chunkCount || 0) + 1, status: 'INDEXED' as DocumentStatus }
            : d
        )
      )
      toast.success('Nuevo fragmento RAG añadido e indexado.')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al agregar fragmento')
    } finally {
      setIsSavingChunk(false)
    }
  }

  const filteredChunks = chunks.filter((c) =>
    chunkSearchQuery
      ? c.content.toLowerCase().includes(chunkSearchQuery.toLowerCase()) ||
        String(c.pageNumber || '').includes(chunkSearchQuery)
      : true
  )

  return (
    <div className='space-y-6 font-exo'>
      {/* Cabecera Principal */}
      <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div className='space-y-1'>
          <h1 className='font-frances text-xl font-bold text-foreground flex items-center gap-2'>
            <Database className='w-5 h-5 text-primary' />
            Base de Conocimiento y Fragmentos RAG
          </h1>
          <p className='text-xs text-muted-foreground max-w-xl leading-relaxed'>
            Sube reglamentos de matrícula, normativas de grados, cronogramas y directivas de la USS. Administra y edita los fragmentos semánticos (chunks) indexados para búsquedas vectoriales con Gemini.
          </p>
        </div>

        <div className='flex items-center gap-2 flex-wrap'>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className='gap-2 rounded-2xl cursor-pointer text-xs font-semibold'
          >
            <Plus className='w-4 h-4' /> Registrar Nuevo Documento
          </Button>
        </div>
      </div>

      {/* Selector de Pestañas Principales */}
      <div className='flex items-center gap-2 border-b border-border/40 pb-2'>
        <button
          type='button'
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'documents'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/70'
          }`}
        >
          <FileText className='w-4 h-4' />
          <span>Documentos y Reglamentos ({documents.length})</span>
        </button>

        <button
          type='button'
          onClick={() => setActiveTab('chunks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'chunks'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/70'
          }`}
        >
          <Layers className='w-4 h-4' />
          <span>Gestión de Fragmentos RAG (Chunks)</span>
          {selectedDocForChunks && (
            <Badge variant='outline' className={`text-[10px] ml-1 py-0 ${activeTab === 'chunks' ? 'bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30' : ''}`}>
              {selectedDocForChunks.title?.substring(0, 18) || 'Doc'}...
            </Badge>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: CATÁLOGO DE DOCUMENTOS Y REGLAMENTOS */}
      {/* ========================================================================= */}
      {activeTab === 'documents' && (
        <div className='space-y-6'>
          {/* Grid de Métricas */}
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            <div className='rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-1.5'>
              <div className='flex items-center justify-between text-muted-foreground'>
                <span className='text-xs font-semibold'>Total Documentos</span>
                <FileText className='w-4 h-4 text-primary' />
              </div>
              <p className='text-2xl font-bold font-mono text-foreground'>{stats.total}</p>
              <p className='text-[10px] text-muted-foreground'>Archivos institucionales registrados</p>
            </div>

            <div className='rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-1.5'>
              <div className='flex items-center justify-between text-muted-foreground'>
                <span className='text-xs font-semibold'>Indexados en RAG</span>
                <CheckCircle2 className='w-4 h-4 text-emerald-500' />
              </div>
              <p className='text-2xl font-bold font-mono text-foreground'>{stats.indexed}</p>
              <p className='text-[10px] text-muted-foreground'>Activos para respuestas inteligentes</p>
            </div>

            <div className='rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-1.5'>
              <div className='flex items-center justify-between text-muted-foreground'>
                <span className='text-xs font-semibold'>Almacenamiento Total</span>
                <HardDrive className='w-4 h-4 text-sky-500' />
              </div>
              <p className='text-2xl font-bold font-mono text-foreground'>
                {formatFileSize(stats.totalBytes)}
              </p>
              <p className='text-[10px] text-muted-foreground'>Espacio en servidor UploadThing</p>
            </div>
          </div>

          {/* Zona de Carga Rápida con UploadThing */}
          <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4'>
            <div className='border-b border-border/40 pb-3 flex items-center justify-between'>
              <div>
                <h2 className='font-frances text-base font-bold text-foreground flex items-center gap-2'>
                  <UploadCloud className='w-4 h-4 text-primary' />
                  Subir Archivos PDF / TXT
                </h2>
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

          {/* Listado de Documentos */}
          <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4'>
            <div className='border-b border-border/40 pb-3 flex items-center justify-between'>
              <h2 className='font-frances text-base font-bold text-foreground flex items-center gap-2'>
                <Layers className='w-4 h-4 text-primary' />
                Documentos en la Base de Conocimiento ({documents.length})
              </h2>
            </div>

            {documents.length === 0 ? (
              <Empty className='py-12 border border-dashed border-border/80 rounded-3xl'>
                <EmptyHeader>
                  <EmptyMedia variant='icon'>
                    <FileText className='w-5 h-5 text-primary' />
                  </EmptyMedia>
                  <EmptyTitle className='font-frances'>No hay documentos registrados</EmptyTitle>
                  <EmptyDescription>
                    Sube tu primer reglamento institucional o regístralo manualmente para indexarlo en RAG.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    onClick={() => setIsCreateOpen(true)}
                    className='rounded-xl text-xs font-semibold cursor-pointer gap-1.5'
                  >
                    <Plus className='w-3.5 h-3.5' /> Registrar Nuevo Documento
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <div className='space-y-3'>
                {documents.map((doc) => {
                  const isIndexed = doc.status === 'INDEXED'
                  const isProcessing = doc.status === 'PROCESSING'
                  const isDeindexed = doc.status === 'DEINDEXED'
                  const dateStr = new Date(doc.createdAt).toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })

                  return (
                    <div
                      key={doc.id}
                      className='rounded-2xl border border-border/70 p-4 bg-card/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-border transition-all'
                    >
                      <div className='flex items-start gap-3.5 min-w-0 flex-1'>
                        <div className='h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5'>
                          <FileText className='w-5 h-5' />
                        </div>
                        <div className='min-w-0 flex-1 space-y-1.5'>
                          <div className='flex items-center gap-2 flex-wrap'>
                            <p className='font-bold text-xs text-foreground'>
                              {doc.title || doc.fileName}
                            </p>

                            {/* Badge de Estado */}
                            {isIndexed && (
                              <Badge variant='outline' className='border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[9px] font-bold py-0 gap-1'>
                                <span className='size-1.5 rounded-full bg-emerald-500 animate-pulse' />
                                Indexado RAG ({doc.chunkCount || 0} chunks)
                              </Badge>
                            )}
                            {isDeindexed && (
                              <Badge variant='outline' className='border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-[9px] font-bold py-0 gap-1'>
                                <PowerOff className='size-2.5' />
                                Desindexado (Pausado)
                              </Badge>
                            )}
                            {isProcessing && (
                              <Badge variant='outline' className='border-sky-500/40 text-sky-600 dark:text-sky-400 bg-sky-500/10 text-[9px] py-0'>
                                En Proceso
                              </Badge>
                            )}
                          </div>

                          <div className='flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap'>
                            <span>{formatFileSize(doc.sizeBytes)}</span>
                            <span>•</span>
                            <span suppressHydrationWarning>Subido el {dateStr}</span>
                            {doc.category && (
                              <>
                                <span>•</span>
                                <span className='text-primary font-medium'>{doc.category.name}</span>
                              </>
                            )}
                            {doc.publicUrl && (
                              <>
                                <span>•</span>
                                <a
                                  href={doc.publicUrl}
                                  target='_blank'
                                  rel='noreferrer'
                                  className='text-sky-600 hover:underline flex items-center gap-0.5 truncate max-w-xs'
                                >
                                  <LinkIcon className='size-2.5 shrink-0' />
                                  <span className='truncate'>{doc.publicUrl}</span>
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botones de Acción */}
                      <div className='flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/40 flex-wrap'>
                        {/* 1. Botón Gestionar Fragmentos RAG */}
                        <Button
                          size='xs'
                          variant='outline'
                          onClick={() => handleNavigateToChunks(doc)}
                          className='gap-1 text-[11px] rounded-xl font-semibold border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 cursor-pointer'
                          title='Explorar y editar fragmentos semánticos'
                        >
                          <BookOpen className='w-3.5 h-3.5' /> Fragmentos RAG
                        </Button>

                        {/* 2. Botón Editar Enlace y Metadatos */}
                        <Button
                          size='xs'
                          variant='outline'
                          onClick={() => handleOpenEditDoc(doc)}
                          className='gap-1 text-[11px] rounded-xl text-muted-foreground hover:text-foreground cursor-pointer'
                          title='Editar enlace público, título y categoría'
                        >
                          <LinkIcon className='w-3.5 h-3.5' /> Editar Enlace
                        </Button>

                        {/* 3. Botón Ver PDF en nueva ventana */}
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
                            className='gap-1 text-[11px] rounded-xl text-muted-foreground hover:text-foreground cursor-pointer'
                            title='Abrir documento oficial en otra ventana'
                          >
                            <ExternalLink className='w-3.5 h-3.5' /> Ver PDF
                          </Button>
                        )}

                        {/* 4. Botón Indexar / Desindexar con estado visual claro */}
                        <Button
                          size='xs'
                          variant={isIndexed ? 'outline' : 'default'}
                          onClick={() => handleToggleIndex(doc)}
                          className={`gap-1 text-[11px] rounded-xl cursor-pointer ${
                            isIndexed
                              ? 'border-amber-500/30 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                          title={isIndexed ? 'Pausar/Desindexar de búsquedas RAG' : 'Activar indexación para RAG'}
                        >
                          {isIndexed ? (
                            <>
                              <PowerOff className='w-3.5 h-3.5' /> Desindexar
                            </>
                          ) : (
                            <>
                              <Power className='w-3.5 h-3.5' /> Indexar RAG
                            </>
                          )}
                        </Button>

                        {/* 5. Botón Eliminar con AlertDialog */}
                        <Button
                          size='xs'
                          variant='ghost'
                          onClick={() =>
                            setDeleteConfirm({
                              isOpen: true,
                              type: 'document',
                              id: doc.id,
                              title: doc.title || doc.fileName,
                              chunkCount: doc.chunkCount || 0,
                            })
                          }
                          className='text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 text-[11px] rounded-xl cursor-pointer'
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: GESTIÓN Y EDICIÓN COMPLETA DE FRAGMENTOS (CHUNKS) */}
      {/* ========================================================================= */}
      {activeTab === 'chunks' && (
        <div className='space-y-6'>
          {/* Header y Selector de Documento Activo */}
          <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4'>
              <div>
                <h2 className='font-frances text-lg font-bold text-foreground flex items-center gap-2'>
                  <Layers className='w-5 h-5 text-primary' />
                  Editor de Fragmentos Semánticos (Chunks)
                </h2>
                <p className='text-xs text-muted-foreground mt-0.5'>
                  Modifica los textos normativos, números de página y directivas exactas recuperadas por SipánGPT.
                </p>
              </div>

              {/* Botón Añadir Fragmento Manual */}
              <Button
                size='xs'
                onClick={() => setIsAddingChunk(!isAddingChunk)}
                className='gap-1.5 text-xs rounded-xl font-semibold cursor-pointer'
              >
                <Plus className='w-3.5 h-3.5' /> {isAddingChunk ? 'Cancelar' : 'Añadir Fragmento'}
              </Button>
            </div>

            {/* Selector de Documento Activo con NativeSelect de Shadcn */}
            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/20 p-3.5 rounded-2xl border border-border/60'>
              <div className='flex items-center gap-3 min-w-0 flex-1 flex-wrap'>
                <span className='text-xs font-semibold text-foreground shrink-0'>
                  Documento Seleccionado:
                </span>
                <NativeSelect
                  value={selectedDocForChunks?.id || ''}
                  onChange={(e) => {
                    const found = documents.find((d) => d.id === e.target.value)
                    if (found) setSelectedDocForChunks(found)
                  }}
                  className='max-w-md w-full'
                >
                  {documents.map((d) => (
                    <NativeSelectOption key={d.id} value={d.id}>
                      {d.title || d.fileName} ({d.status === 'INDEXED' ? 'Indexado' : 'Desindexado'})
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>

              <div className='flex items-center gap-2'>
                <Badge variant='outline' className='font-mono text-xs'>
                  {chunks.length} fragmento(s)
                </Badge>
                {selectedDocForChunks?.publicUrl && (
                  <a
                    href={selectedDocForChunks.publicUrl}
                    target='_blank'
                    rel='noreferrer'
                    className='text-xs text-primary hover:underline flex items-center gap-1 font-medium'
                  >
                    <ExternalLink className='size-3' /> Ver PDF
                  </a>
                )}
              </div>
            </div>

            {/* Buscador de Chunks */}
            <div className='relative'>
              <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground' />
              <input
                type='text'
                placeholder='Buscar palabras clave dentro de los fragmentos de este documento...'
                value={chunkSearchQuery}
                onChange={(e) => setChunkSearchQuery(e.target.value)}
                className='w-full rounded-xl border border-border/80 bg-background pl-9 pr-4 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary'
              />
            </div>
          </div>

          {/* Formulario para Añadir Nuevo Fragmento */}
          {isAddingChunk && (
            <div className='rounded-3xl border border-primary/30 bg-primary/5 p-5 space-y-3 shadow-xs'>
              <div className='flex items-center justify-between border-b border-primary/20 pb-2'>
                <h3 className='font-frances font-bold text-sm text-primary flex items-center gap-1.5'>
                  <Plus className='size-4' /> Nuevo Fragmento para &quot;{selectedDocForChunks?.title}&quot;
                </h3>
                <div className='flex items-center gap-2'>
                  <span className='text-xs text-muted-foreground'>Página del documento:</span>
                  <input
                    type='number'
                    placeholder='Ej: 14'
                    value={newChunkPage}
                    onChange={(e) =>
                      setNewChunkPage(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className='w-20 rounded-lg border border-border bg-background px-2 py-1 text-xs'
                  />
                </div>
              </div>

              <textarea
                rows={4}
                value={newChunkContent}
                onChange={(e) => setNewChunkContent(e.target.value)}
                placeholder='Escribe o pega el texto oficial del artículo o acápite que deseas incorporar a la base RAG...'
                className='w-full rounded-2xl border border-border bg-background p-3 text-xs font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary'
              />

              <div className='flex justify-end gap-2'>
                <Button
                  size='xs'
                  variant='ghost'
                  onClick={() => setIsAddingChunk(false)}
                  className='rounded-xl text-xs cursor-pointer'
                >
                  Cancelar
                </Button>
                <Button
                  size='xs'
                  disabled={isSavingChunk}
                  onClick={handleAddChunk}
                  className='gap-1.5 rounded-xl text-xs font-semibold cursor-pointer'
                >
                  <Save className='w-3.5 h-3.5' /> Guardar Fragmento
                </Button>
              </div>
            </div>
          )}

          {/* Listado de Chunks */}
          <div className='space-y-4'>
            {isLoadingChunks ? (
              <div className='py-16 text-center text-xs text-muted-foreground space-y-2 rounded-3xl border border-border/80 bg-card p-6'>
                <Layers className='w-6 h-6 mx-auto animate-bounce text-primary/60' />
                <p>Cargando fragmentos del documento seleccionado...</p>
              </div>
            ) : filteredChunks.length === 0 ? (
              <Empty className='py-16 border border-dashed border-border/80 rounded-3xl bg-card'>
                <EmptyHeader>
                  <EmptyMedia variant='icon'>
                    <FileCode className='w-5 h-5 text-primary' />
                  </EmptyMedia>
                  <EmptyTitle className='font-frances'>No se encontraron fragmentos</EmptyTitle>
                  <EmptyDescription>
                    {chunkSearchQuery
                      ? 'No hay fragmentos que coincidan con la búsqueda de texto.'
                      : 'Este documento aún no tiene fragmentos semánticos indexados.'}
                  </EmptyDescription>
                </EmptyHeader>
                {!chunkSearchQuery && (
                  <EmptyContent>
                    <Button
                      size='xs'
                      onClick={() => setIsAddingChunk(true)}
                      className='rounded-xl text-xs font-semibold cursor-pointer gap-1.5'
                    >
                      <Plus className='w-3.5 h-3.5' /> Añadir Primer Fragmento
                    </Button>
                  </EmptyContent>
                )}
              </Empty>
            ) : (
              filteredChunks.map((chunk) => {
                const isEditing = editingChunkId === chunk.id

                return (
                  <div
                    key={chunk.id}
                    className='rounded-3xl border border-border/70 bg-card p-4 sm:p-5 space-y-3 shadow-xs hover:border-border transition-colors'
                  >
                    <div className='flex items-center justify-between border-b border-border/40 pb-2.5'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <Badge variant='secondary' className='text-[10px] font-mono py-0.5 font-bold'>
                          Fragmento #{chunk.chunkIndex + 1}
                        </Badge>
                        {chunk.pageNumber && (
                          <Badge variant='outline' className='text-[10px] text-muted-foreground py-0.5'>
                            Pág. {chunk.pageNumber}
                          </Badge>
                        )}
                        {chunk._count?.citations ? (
                          <Badge variant='outline' className='text-[9px] text-emerald-600 bg-emerald-500/10 border-emerald-500/30 py-0.5'>
                            {chunk._count.citations} citas realizadas
                          </Badge>
                        ) : null}
                        <span className='text-[10px] text-muted-foreground font-mono'>
                          ({chunk.content.length} caracteres)
                        </span>
                      </div>

                      <div className='flex items-center gap-1.5'>
                        {!isEditing ? (
                          <>
                            <Button
                              size='xs'
                              variant='outline'
                              onClick={() => {
                                setEditingChunkId(chunk.id)
                                setEditChunkContent(chunk.content)
                                setEditChunkPage(chunk.pageNumber ?? '')
                              }}
                              className='gap-1 text-[11px] rounded-xl cursor-pointer'
                              title='Editar texto del fragmento'
                            >
                              <Edit3 className='w-3 h-3' /> Editar
                            </Button>
                            <Button
                              size='xs'
                              variant='ghost'
                              onClick={() =>
                                setDeleteConfirm({
                                  isOpen: true,
                                  type: 'chunk',
                                  id: chunk.id,
                                  title: `Fragmento #${chunk.chunkIndex + 1}`,
                                })
                              }
                              className='text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 text-[11px] rounded-xl cursor-pointer'
                              title='Eliminar fragmento'
                            >
                              <Trash2 className='w-3.5 h-3.5' />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size='xs'
                            variant='ghost'
                            onClick={() => setEditingChunkId(null)}
                            className='gap-1 text-[11px] rounded-xl text-muted-foreground hover:text-foreground cursor-pointer'
                            title='Cancelar edición'
                          >
                            <X className='w-3.5 h-3.5' /> Cancelar
                          </Button>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className='space-y-3 pt-1'>
                        <div className='flex items-center gap-2'>
                          <label className='text-xs font-semibold text-foreground'>
                            Número de Página:
                          </label>
                          <input
                            type='number'
                            value={editChunkPage}
                            onChange={(e) =>
                              setEditChunkPage(e.target.value === '' ? '' : Number(e.target.value))
                            }
                            className='w-20 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-mono'
                          />
                        </div>

                        <textarea
                          rows={6}
                          value={editChunkContent}
                          onChange={(e) => setEditChunkContent(e.target.value)}
                          className='w-full rounded-2xl border border-border bg-background p-3 text-xs font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary'
                        />

                        <div className='flex justify-end gap-2'>
                          <Button
                            size='xs'
                            variant='ghost'
                            onClick={() => setEditingChunkId(null)}
                            className='rounded-xl text-xs cursor-pointer'
                          >
                            Cancelar
                          </Button>
                          <Button
                            size='xs'
                            disabled={isSavingChunk}
                            onClick={() => handleSaveChunk(chunk.id)}
                            className='gap-1.5 rounded-xl text-xs font-semibold cursor-pointer'
                          >
                            <Save className='w-3.5 h-3.5' /> Guardar Cambios
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className='rounded-2xl bg-muted/20 border border-border/50 p-3.5 text-xs font-mono leading-relaxed text-foreground whitespace-pre-wrap select-text'>
                        {chunk.content}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDITAR ENLACE Y METADATOS DEL DOCUMENTO */}
      {/* ========================================================================= */}
      <Dialog open={Boolean(editingDoc)} onOpenChange={(open) => !open && setEditingDoc(null)}>
        <DialogContent className='max-w-xl font-exo rounded-3xl p-6'>
          <DialogHeader>
            <DialogTitle className='font-frances text-lg font-bold flex items-center gap-2'>
              <LinkIcon className='w-5 h-5 text-primary' /> Editar Enlace y Datos del Documento
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground'>
              Actualiza la URL pública del PDF institucional, título y categoría para que los estudiantes puedan consultar la fuente oficial.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveDocDetails} className='space-y-4 pt-2'>
            <div className='space-y-1.5'>
              <label className='text-xs font-semibold text-foreground'>
                Título del Documento *
              </label>
              <input
                type='text'
                required
                value={editDocTitle}
                onChange={(e) => setEditDocTitle(e.target.value)}
                placeholder='Ej: Reglamento de Grados y Títulos USS 2026'
                className='w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary'
              />
            </div>

            <div className='space-y-1.5'>
              <label className='text-xs font-semibold text-foreground flex items-center justify-between'>
                <span>Enlace Público al Documento Oficial (PDF / Portal)</span>
                {editDocPublicUrl && (
                  <a
                    href={editDocPublicUrl}
                    target='_blank'
                    rel='noreferrer'
                    className='text-[11px] text-primary hover:underline flex items-center gap-1 font-normal'
                  >
                    <ExternalLink className='size-2.5' /> Probar Enlace
                  </a>
                )}
              </label>
              <input
                type='url'
                value={editDocPublicUrl}
                onChange={(e) => setEditDocPublicUrl(e.target.value)}
                placeholder='https://www.uss.edu.pe/transparencia/reglamento-grados-2026.pdf'
                className='w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary'
              />
              <p className='text-[10px] text-muted-foreground'>
                Este es el enlace que se abrirá cuando los estudiantes hagan clic en el botón de citas o fuente oficial.
              </p>
            </div>

            <div className='space-y-1.5'>
              <label className='text-xs font-semibold text-foreground'>
                Categoría Temática
              </label>
              <NativeSelect
                value={editDocCategoryId}
                onChange={(e) => setEditDocCategoryId(e.target.value)}
                className='w-full'
              >
                <NativeSelectOption value='none'>Sin categoría temática</NativeSelectOption>
                {topicCategories.map((c) => (
                  <NativeSelectOption key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            <div className='flex justify-end gap-2 pt-3 border-t border-border/40'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setEditingDoc(null)}
                className='rounded-xl text-xs cursor-pointer'
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={isSavingDocDetails}
                className='gap-1.5 rounded-xl text-xs font-semibold cursor-pointer'
              >
                <Save className='w-3.5 h-3.5' />
                {isSavingDocDetails ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR DOCUMENTO DIRECTO */}
      {/* ========================================================================= */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className='max-w-2xl font-exo rounded-3xl p-6'>
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
                <NativeSelect
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  className='w-full'
                >
                  <NativeSelectOption value='none'>Sin categoría temática</NativeSelectOption>
                  {topicCategories.map((c) => (
                    <NativeSelectOption key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
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
                className='w-full rounded-2xl border border-border bg-background p-3 text-xs text-foreground font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary'
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
                className='rounded-xl text-xs cursor-pointer'
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={isCreating}
                className='gap-2 rounded-xl text-xs font-semibold cursor-pointer'
              >
                <Sparkles className='w-4 h-4' />
                {isCreating ? 'Indexando en RAG...' : 'Guardar e Indexar Documento'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* ALERT DIALOG REUTILIZABLE: CONFIRMACIONES DESTRUCCIONES Y DESINDEXACIÓN */}
      {/* ========================================================================= */}
      <ConfirmAlertDialog
        open={deleteConfirm.isOpen}
        onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, isOpen: open }))}
        title={
          deleteConfirm.type === 'document'
            ? `¿Eliminar "${deleteConfirm.title}"?`
            : deleteConfirm.type === 'chunk'
            ? `¿Eliminar ${deleteConfirm.title}?`
            : `¿Desindexar "${deleteConfirm.title}"?`
        }
        description={
          deleteConfirm.type === 'document'
            ? `Esta acción no se puede deshacer. Se eliminarán permanentemente el documento y todos sus ${
                deleteConfirm.chunkCount ?? 0
              } fragmentos semánticos indexados de la base de conocimiento.`
            : deleteConfirm.type === 'chunk'
            ? 'Esta acción eliminará permanentemente este fragmento normativo. SipánGPT ya no podrá utilizar este texto en sus respuestas.'
            : 'El documento permanecerá en el sistema, pero sus fragmentos se pausarán temporalmente y SipánGPT no los utilizará para responder a las preguntas de los estudiantes.'
        }
        confirmText={
          deleteConfirm.type === 'document'
            ? 'Eliminar Documento'
            : deleteConfirm.type === 'chunk'
            ? 'Eliminar Fragmento'
            : 'Desindexar Documento'
        }
        variant={deleteConfirm.type === 'deindex' ? 'default' : 'destructive'}
        isLoading={isAlertLoading}
        onConfirm={handleConfirmAlert}
      />
    </div>
  )
}
