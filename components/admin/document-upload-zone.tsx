'use client'

import * as React from 'react'
import { useUploadThing } from '@/lib/uploadthing'
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentActions,
  AttachmentAction,
} from '@/components/ui/attachment'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import {
  UploadCloud,
  FileText,
  FileCode,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Files,
  Plus,
  Info,
  Globe,
  Link2,
  Sparkles,
  Download,
  Tag,
} from 'lucide-react'
import { toast } from 'sonner'
import { ingestDocumentFromUrlAction } from '@/lib/actions/admin-documents'
import type { TopicCategoryItem } from '@/types'

interface DocumentUploadZoneProps {
  onUploadSuccess?: () => void
  topicCategories?: TopicCategoryItem[]
}

type IngestMode = 'files' | 'url'

export function DocumentUploadZone({
  onUploadSuccess,
  topicCategories = [],
}: DocumentUploadZoneProps) {
  const [ingestMode, setIngestMode] = React.useState<IngestMode>('files')

  // Estado para archivos locales (UploadThing)
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([])
  const [isDragOver, setIsDragOver] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Estado para ingesta desde URL
  const [urlInput, setUrlInput] = React.useState('')
  const [titleInput, setTitleInput] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState('none')
  const [isUrlIngesting, setIsUrlIngesting] = React.useState(false)
  const [urlStepMessage, setUrlStepMessage] = React.useState<string | null>(null)

  const { startUpload, isUploading } = useUploadThing('documentUploader', {
    onClientUploadComplete: (res) => {
      toast.success(
        `¡${res?.length || 1} archivo(s) subido(s) e indexados con éxito en Sipán-STAIR!`
      )
      setSelectedFiles([])
      setUploadProgress(0)
      if (onUploadSuccess) {
        onUploadSuccess()
      } else {
        window.location.reload()
      }
    },
    onUploadError: (error: Error) => {
      toast.error(`Error al subir archivo: ${error.message}`)
      setUploadProgress(0)
    },
    onUploadProgress: (progress: number) => {
      setUploadProgress(progress)
    },
  })

  // Validación de tipos y tamaño
  const handleFiles = (incomingFiles: FileList | File[]) => {
    const validFiles: File[] = []
    const maxSizeBytes = 16 * 1024 * 1024 // 16 MB

    Array.from(incomingFiles).forEach((file) => {
      const isPdf =
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      const isTxt =
        file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')
      const isMd =
        file.type === 'text/markdown' ||
        file.name.toLowerCase().endsWith('.md') ||
        file.name.toLowerCase().endsWith('.markdown')

      if (!isPdf && !isTxt && !isMd) {
        toast.error(`"${file.name}" no es un archivo PDF, TXT o Markdown válido.`)
        return
      }

      if (file.size > maxSizeBytes) {
        toast.error(`"${file.name}" excede el límite máximo de 16 MB.`)
        return
      }

      // Evitar duplicados en la lista de seleccionados
      const alreadyExists = selectedFiles.some(
        (f) => f.name === file.name && f.size === file.size
      )
      if (alreadyExists) {
        toast.info(`"${file.name}" ya fue seleccionado.`)
        return
      }

      validFiles.push(file)
    })

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isUploading) setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (isUploading) return

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleRemoveFile = (indexToRemove: number) => {
    if (isUploading) return
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleStartUpload = async () => {
    if (selectedFiles.length === 0 || isUploading) return
    setUploadProgress(0)
    await startUpload(selectedFiles)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  // Manejo de la ingesta directa desde URL institucional
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanUrl = urlInput.trim()
    if (!cleanUrl) {
      toast.error('Por favor, ingresa la URL del documento institucional.')
      return
    }

    try {
      const parsed = new URL(cleanUrl)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        toast.error('El enlace debe iniciar con http:// o https://')
        return
      }
    } catch {
      toast.error('La URL ingresada no tiene un formato web válido.')
      return
    }

    try {
      setIsUrlIngesting(true)
      setUrlStepMessage('Descargando archivo desde la URL oficial...')

      const result = await ingestDocumentFromUrlAction({
        url: cleanUrl,
        title: titleInput.trim() || undefined,
        categoryId: selectedCategory !== 'none' ? selectedCategory : null,
      })

      toast.success(
        `¡Documento "${result.title}" descargado e indexado con éxito! (${result.chunkCount} fragmentos creados con Sipán-STAIR).`
      )

      setUrlInput('')
      setTitleInput('')
      setSelectedCategory('none')

      if (onUploadSuccess) {
        onUploadSuccess()
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Ocurrió un error al procesar la URL.'
      )
    } finally {
      setIsUrlIngesting(false)
      setUrlStepMessage(null)
    }
  }

  return (
    <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-5 font-exo'>
      {/* Encabezado y Selector de Modo de Ingesta */}
      <div className='border-b border-border/40 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3'>
        <div>
          <h2 className='font-frances text-base font-bold text-foreground flex items-center gap-2'>
            <UploadCloud className='w-4 h-4 text-primary' />
            Ingesta de Documentos y Reglamentos USS
          </h2>
          <p className='text-xs text-muted-foreground'>
            Agrega fuentes normativas a la base de conocimiento mediante archivos locales o enlaces web oficiales.
          </p>
        </div>

        {/* Selector de Modo: Archivos Locales vs Importar desde URL */}
        <div className='flex items-center gap-1.5 p-1 bg-muted/40 rounded-2xl border border-border/60 self-start md:self-auto'>
          <button
            type='button'
            onClick={() => {
              if (!isUploading && !isUrlIngesting) setIngestMode('files')
            }}
            disabled={isUploading || isUrlIngesting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              ingestMode === 'files'
                ? 'bg-background text-foreground shadow-2xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            } ${isUploading || isUrlIngesting ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <UploadCloud className='w-3.5 h-3.5 text-primary' />
            <span>Archivos Locales</span>
          </button>

          <button
            type='button'
            onClick={() => {
              if (!isUploading && !isUrlIngesting) setIngestMode('url')
            }}
            disabled={isUploading || isUrlIngesting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              ingestMode === 'url'
                ? 'bg-background text-foreground shadow-2xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            } ${isUploading || isUrlIngesting ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <Globe className='w-3.5 h-3.5 text-sky-500' />
            <span>Importar desde Enlace / URL</span>
            <Badge
              variant='outline'
              className='text-[10px] font-semibold py-0 px-1 border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400'
            >
              Nuevo
            </Badge>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALIDAD 1: ARCHIVOS LOCALES (DRAG & DROP / EXPLORAR) */}
      {/* ========================================================================= */}
      {ingestMode === 'files' && (
        <div className='space-y-4 animate-in fade-in duration-200'>
          {/* Input nativo oculto */}
          <input
            ref={fileInputRef}
            type='file'
            multiple
            accept='.pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown'
            className='hidden'
            disabled={isUploading}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFiles(e.target.files)
                e.target.value = ''
              }
            }}
          />

          {/* Zona Drag & Drop interactiva */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              if (!isUploading) fileInputRef.current?.click()
            }}
            className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-7 text-center transition-all cursor-pointer select-none ${
              isDragOver
                ? 'border-primary bg-primary/10 scale-[0.99]'
                : 'border-border/80 bg-background/50 hover:border-primary/60 hover:bg-muted/30'
            } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
          >
            <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200 shadow-xs mb-3'>
              <UploadCloud className='h-6 w-6' />
            </div>

            <h3 className='font-frances text-sm font-semibold text-foreground mb-1'>
              {isDragOver
                ? 'Suelta los archivos aquí'
                : 'Arrastra y suelta tus archivos aquí'}
            </h3>
            <p className='text-xs text-muted-foreground max-w-sm mb-3'>
              o <span className='font-semibold text-primary underline underline-offset-2'>explora tus archivos</span> en tu computadora
            </p>

            <div className='flex items-center gap-2 text-[11px] text-muted-foreground/80 flex-wrap justify-center'>
              <span className='inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 font-medium'>
                PDF (hasta 16 MB)
              </span>
              <span className='inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 font-medium'>
                TXT (hasta 4 MB)
              </span>
              <span className='inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 font-medium'>
                Markdown / MD (hasta 4 MB)
              </span>
            </div>
          </div>

          {/* Recomendación de optimización para compendios extensos */}
          <div className='flex items-start gap-2.5 rounded-2xl border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground'>
            <Info className='w-4 h-4 text-primary shrink-0 mt-0.5' />
            <div className='space-y-0.5 leading-relaxed'>
              <span className='font-semibold text-foreground'>Recomendación para documentos extensos:</span>{' '}
              Para reglamentos o compendios que superen las 50 páginas (ej. Estatuto Universitario), es recomendable subirlos segmentados por títulos o capítulos (ej. <em>&quot;Reglamento de Matrícula - Cap. I-III&quot;</em>). Esto garantiza una transcripción OCR completa y maximiza la precisión semántica de SipánGPT.
            </div>
          </div>

          {/* Previsualización de archivos seleccionados */}
          {selectedFiles.length > 0 && (
            <div className='space-y-3 pt-2'>
              <div className='flex items-center justify-between text-xs font-semibold text-foreground'>
                <span className='flex items-center gap-1.5'>
                  <Files className='w-4 h-4 text-primary' />
                  Archivos preparados para subir ({selectedFiles.length})
                </span>
                {!isUploading && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='xs'
                    onClick={() => setSelectedFiles([])}
                    className='text-muted-foreground hover:text-destructive text-[11px] cursor-pointer'
                  >
                    Limpiar todo
                  </Button>
                )}
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5'>
                {selectedFiles.map((file, idx) => {
                  const isPdf =
                    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
                  const isMd =
                    file.type === 'text/markdown' ||
                    file.name.toLowerCase().endsWith('.md') ||
                    file.name.toLowerCase().endsWith('.markdown')
                  const typeLabel = isPdf ? 'PDF' : isMd ? 'MD' : 'TXT'
                  return (
                    <Attachment
                      key={`${file.name}-${file.size}-${idx}`}
                      state={isUploading ? 'uploading' : 'idle'}
                      className='w-full border-border/80 bg-background/80 hover:bg-muted/40 transition-all shadow-2xs'
                    >
                      <AttachmentMedia variant='icon' className='bg-primary/10 text-primary'>
                        {isPdf ? <FileText className='w-4 h-4' /> : <FileCode className='w-4 h-4' />}
                      </AttachmentMedia>
                      <AttachmentContent className='min-w-0 pr-1'>
                        <AttachmentTitle
                          className='text-xs font-medium text-foreground'
                          title={file.name}
                        >
                          {file.name}
                        </AttachmentTitle>
                        <AttachmentDescription className='text-[11px] text-muted-foreground flex items-center gap-1'>
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <span className='uppercase font-semibold'>{typeLabel}</span>
                        </AttachmentDescription>
                      </AttachmentContent>
                      <AttachmentActions>
                        {!isUploading && (
                          <AttachmentAction
                            type='button'
                            variant='ghost'
                            size='icon-xs'
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveFile(idx)
                            }}
                            className='text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer rounded-lg'
                            title='Eliminar de la lista'
                          >
                            <X className='w-3.5 h-3.5' />
                          </AttachmentAction>
                        )}
                        {isUploading && (
                          <div className='pr-1'>
                            <Loader2 className='w-3.5 h-3.5 animate-spin text-primary' />
                          </div>
                        )}
                      </AttachmentActions>
                    </Attachment>
                  )
                })}
              </div>

              {/* Barra de Progreso durante la subida */}
              {isUploading && (
                <div className='space-y-1.5 pt-2 animate-in fade-in duration-200'>
                  <div className='flex justify-between items-center text-xs font-medium'>
                    <span className='text-muted-foreground flex items-center gap-1.5'>
                      <Loader2 className='w-3.5 h-3.5 animate-spin text-primary' />
                      Subiendo e indexando en neon/vector...
                    </span>
                    <span className='text-primary font-bold'>{uploadProgress}%</span>
                  </div>
                  <div className='w-full h-2 rounded-full bg-muted overflow-hidden'>
                    <div
                      className='h-full bg-primary transition-all duration-300 rounded-full'
                      style={{ width: `${Math.max(5, uploadProgress)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Acciones principales de subida */}
              <div className='flex items-center justify-end gap-2 pt-2 border-t border-border/40'>
                {!isUploading && (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => fileInputRef.current?.click()}
                    className='text-xs rounded-xl cursor-pointer gap-1.5'
                  >
                    <Plus className='w-3.5 h-3.5' /> Añadir más
                  </Button>
                )}
                <Button
                  type='button'
                  size='sm'
                  disabled={isUploading || selectedFiles.length === 0}
                  onClick={handleStartUpload}
                  className='text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs gap-1.5 px-4'
                >
                  {isUploading ? (
                    <>
                      <Loader2 className='w-3.5 h-3.5 animate-spin' />
                      Subiendo ({uploadProgress}%)...
                    </>
                  ) : (
                    <>
                      <UploadCloud className='w-3.5 h-3.5' />
                      Subir {selectedFiles.length} archivo{selectedFiles.length > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALIDAD 2: IMPORTAR DESDE ENLACE / URL INSTITUCIONAL */}
      {/* ========================================================================= */}
      {ingestMode === 'url' && (
        <form
          onSubmit={handleUrlSubmit}
          className='space-y-4 animate-in fade-in duration-200'
        >
          {/* Banner explicativo del Enlace Institucional Oficial */}
          <div className='flex items-start gap-3 rounded-2xl border border-sky-500/30 bg-sky-500/5 p-3.5 text-xs text-muted-foreground'>
            <Globe className='w-4 h-4 text-sky-500 shrink-0 mt-0.5' />
            <div className='space-y-1 leading-relaxed'>
              <p className='font-semibold text-foreground flex items-center gap-1.5'>
                <span>Enlace Oficial al Documento (publicUrl)</span>
                <Badge
                  variant='outline'
                  className='text-[10px] font-semibold py-0 px-1.5 border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400'
                >
                  Citas en Chat
                </Badge>
              </p>
              <p className='text-[11px] text-muted-foreground'>
                Al ingresar la URL pública de un reglamento (PDF, TXT o Markdown), el servidor descargará el binario, extraerá su estructura formal con <strong>Sipán-STAIR</strong> y <strong>guardará este enlace como la fuente oficial</strong>. Cuando un estudiante consulte este tema, SipánGPT citará el artículo exacto y proporcionará este enlace para abrir directamente el documento original.
              </p>
            </div>
          </div>

          <div className='space-y-3.5 bg-muted/15 border border-border/60 rounded-2xl p-4'>
            {/* Campo 1: URL del documento */}
            <div className='space-y-1.5'>
              <Label
                htmlFor='doc-url-input'
                className='text-xs font-semibold text-foreground flex items-center justify-between'
              >
                <span className='flex items-center gap-1.5'>
                  <Link2 className='w-3.5 h-3.5 text-primary' />
                  Enlace Web / URL Pública del Documento *
                </span>
                <span className='text-[10px] font-normal text-muted-foreground'>
                  Formatos: PDF, TXT, MD (hasta 32 MB)
                </span>
              </Label>
              <Input
                id='doc-url-input'
                type='url'
                required
                disabled={isUrlIngesting}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder='https://transparencia.uss.edu.pe/normativas/reglamento-matricula-2026.pdf'
                className='rounded-xl text-xs bg-background'
              />
              <p className='text-[10px] text-muted-foreground'>
                Ejemplo: Enlaces del portal de transparencia USS, repositorios institucionales o directivas SUNEDU.
              </p>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1'>
              {/* Campo 2: Título personalizado opcional */}
              <div className='space-y-1.5'>
                <Label
                  htmlFor='doc-title-input'
                  className='text-xs font-semibold text-foreground flex items-center gap-1.5'
                >
                  <FileText className='w-3.5 h-3.5 text-muted-foreground' />
                  Título Institucional (Opcional)
                </Label>
                <Input
                  id='doc-title-input'
                  type='text'
                  disabled={isUrlIngesting}
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder='Ej: Reglamento General de Matrícula USS 2026'
                  className='rounded-xl text-xs bg-background'
                />
                <p className='text-[10px] text-muted-foreground'>
                  Si se omite, se deducirá automáticamente del nombre de archivo.
                </p>
              </div>

              {/* Campo 3: Categoría Temática USS */}
              <div className='space-y-1.5'>
                <Label
                  htmlFor='doc-cat-select'
                  className='text-xs font-semibold text-foreground flex items-center gap-1.5'
                >
                  <Tag className='w-3.5 h-3.5 text-muted-foreground' />
                  Categoría Temática USS
                </Label>
                <NativeSelect
                  id='doc-cat-select'
                  disabled={isUrlIngesting}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className='rounded-xl text-xs bg-background h-8'
                >
                  <NativeSelectOption value='none'>
                    Sin categoría temática
                  </NativeSelectOption>
                  {topicCategories.map((c) => (
                    <NativeSelectOption key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <p className='text-[10px] text-muted-foreground'>
                  Ayuda al enrutamiento semántico de consultas especializadas.
                </p>
              </div>
            </div>
          </div>

          {/* Feedback de estado durante la ingesta */}
          {isUrlIngesting && (
            <div className='flex items-center gap-3 p-3.5 rounded-2xl bg-primary/10 border border-primary/20 animate-in fade-in duration-200'>
              <Loader2 className='w-4 h-4 animate-spin text-primary shrink-0' />
              <div className='space-y-0.5 min-w-0'>
                <p className='text-xs font-semibold text-foreground'>
                  {urlStepMessage || 'Procesando documento...'}
                </p>
                <p className='text-[10px] text-muted-foreground'>
                  Descarga del binario, OCR multimodal Gemini, extracción del árbol ToC y almacenamiento vectorial en Neon.
                </p>
              </div>
            </div>
          )}

          {/* Acciones de Ingesta desde URL */}
          <div className='flex items-center justify-end gap-2 pt-2 border-t border-border/40'>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              disabled={isUrlIngesting || (!urlInput && !titleInput)}
              onClick={() => {
                setUrlInput('')
                setTitleInput('')
                setSelectedCategory('none')
              }}
              className='text-xs rounded-xl cursor-pointer text-muted-foreground hover:text-foreground'
            >
              Limpiar
            </Button>

            <Button
              type='submit'
              size='sm'
              disabled={isUrlIngesting || !urlInput.trim()}
              className='text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs gap-1.5 px-4'
            >
              {isUrlIngesting ? (
                <>
                  <Loader2 className='w-3.5 h-3.5 animate-spin' />
                  Descargando e Indexando...
                </>
              ) : (
                <>
                  <Download className='w-3.5 h-3.5' />
                  Descargar e Ingestar Documento
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
