'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  toggleDocumentStatus,
  deleteDocumentAction,
  updateDocumentCategory,
} from '@/lib/actions/admin-documents'
import { UploadDropzone } from '@/lib/uploadthing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
} from 'lucide-react'
import type { DocumentStatus } from '@/lib/prisma'

interface TopicCategoryItem {
  id: string
  name: string
  code: string
  description: string | null
  order: number
}

interface DocumentItem {
  id: string
  title: string
  fileName: string
  fileUrl: string | null
  publicUrl: string | null
  mimeType: string
  sizeBytes: number
  status: DocumentStatus
  chunkCount: number
  categoryId: string | null
  category?: {
    id: string
    name: string
    code: string
  } | null
  createdAt: Date
  uploadedBy?: {
    name: string | null
    email: string
  } | null
}

interface DocumentsManagerProps {
  initialDocuments: DocumentItem[]
  topicCategories: TopicCategoryItem[]
  stats: {
    total: number
    indexed: number
    totalBytes: number
  }
}

export function DocumentsManager({
  initialDocuments,
  topicCategories,
  stats: initialStats,
}: DocumentsManagerProps) {
  const [documents, setDocuments] = React.useState<DocumentItem[]>(initialDocuments)
  const [stats, setStats] = React.useState(initialStats)
  const [isUpdating, setIsUpdating] = React.useState(false)

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
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar estado')
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
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar categoría')
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
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar el documento')
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
            Sube reglamentos de matrícula, cronogramas, normativas de grados y mallas de la USS. Asigna categorías temáticas para analítica institucional y búsquedas semánticas precisas.
          </p>
        </div>
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

      {/* Zona de Carga con UploadThing */}
      <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4'>
        <div className='border-b border-border/40 pb-3 flex items-center justify-between'>
          <div>
            <h3 className='font-frances text-base font-bold text-foreground flex items-center gap-2'>
              <UploadCloud className='w-4 h-4 text-primary' />
              Subir Nuevos Documentos (PDF, TXT)
            </h3>
            <p className='text-xs text-muted-foreground'>
              Arrastra o selecciona reglamentos y documentos oficiales universitarios (hasta 16 MB).
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

      {/* Listado de Documentos con Categorización Temática */}
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
            <p className='text-[11px]'>Sube tu primer reglamento oficial en la zona de carga superior.</p>
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
                            Indexado RAG
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
                        <span>Subido el {dateStr}</span>
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

                  <div className='flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40'>
                    {/* Botón Ver Documento */}
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
                        title='Ver archivo original'
                      >
                        <ExternalLink className='w-3.5 h-3.5' /> Ver
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
    </div>
  )
}
