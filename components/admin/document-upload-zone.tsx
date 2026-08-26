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
} from 'lucide-react'
import { toast } from 'sonner'

interface DocumentUploadZoneProps {
  onUploadSuccess?: () => void
}

export function DocumentUploadZone({ onUploadSuccess }: DocumentUploadZoneProps) {
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([])
  const [isDragOver, setIsDragOver] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const { startUpload, isUploading } = useUploadThing('documentUploader', {
    onClientUploadComplete: (res) => {
      toast.success(`¡${res?.length || 1} archivo(s) subido(s) e indexados con éxito!`)
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
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      const isTxt = file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')
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

  return (
    <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4 font-exo'>
      {/* Encabezado */}
      <div className='border-b border-border/40 pb-3 flex flex-wrap items-center justify-between gap-2'>
        <div>
          <h2 className='font-frances text-base font-bold text-foreground flex items-center gap-2'>
            <UploadCloud className='w-4 h-4 text-primary' />
            Subir Archivos PDF / TXT / Markdown
          </h2>
          <p className='text-xs text-muted-foreground'>
            Arrastra o selecciona reglamentos oficiales (PDF, TXT o Markdown hasta 16 MB por archivo).
          </p>
        </div>
        <Badge variant='outline' className='text-[11px] font-medium border-border/60 bg-muted/30 text-muted-foreground'>
          UploadThing v7
        </Badge>
      </div>

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
            e.target.value = '' // Reset para permitir volver a seleccionar el mismo archivo si fue eliminado
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
              const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
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
                    <AttachmentTitle className='text-xs font-medium text-foreground' title={file.name}>
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
  )
}
