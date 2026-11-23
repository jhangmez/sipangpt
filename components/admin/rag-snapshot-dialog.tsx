'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileArchive,
  RefreshCw,
  Loader2,
  Layers,
  FileText,
  Sparkles,
  Trash2
} from 'lucide-react'
import { RAG_SNAPSHOT_IMPORT_BATCH_SIZE } from '@/constants'
import type { DocumentStatus } from '@/lib/prisma'
import {
  validateRagSnapshotPayload,
  type RagSnapshotImportMode,
  type RagSnapshotPayload,
  type RagSnapshotScope
} from '@/lib/ai/rag-snapshot'
import { ConfirmAlertDialog } from '@/components/admin/confirm-alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { getErrorMessage } from '@/lib/utils'

interface RagSnapshotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentStats: {
    total: number
    indexed: number
  }
  onImportComplete: () => Promise<void> | void
}

async function readSnapshotFileText(file: File): Promise<string> {
  const header = new Uint8Array(await file.slice(0, 2).arrayBuffer())
  const isGzip =
    (header.length >= 2 && header[0] === 0x1f && header[1] === 0x8b) ||
    file.name.toLowerCase().endsWith('.gz')

  if (!isGzip) {
    return file.text()
  }

  if (typeof DecompressionStream === 'undefined') {
    throw new Error(
      'Este navegador no soporta descompresión GZIP nativa. Sube el archivo .json sin comprimir.'
    )
  }

  const decompressedStream = file
    .stream()
    .pipeThrough(
      new DecompressionStream('gzip') as unknown as ReadableWritablePair<
        Uint8Array,
        Uint8Array
      >
    )
  return new Response(decompressedStream).text()
}

async function parseErrorResponse(res: Response, fallbackMsg: string): Promise<string> {
  try {
    const json = (await res.json()) as { error?: string }
    if (json?.error) return json.error
  } catch {
    // Si la respuesta no es JSON (ej. error de proxy 413/502), usar fallback legible
  }
  return `${fallbackMsg} (HTTP ${res.status})`
}

function formatMB(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function RagSnapshotDialog({
  open,
  onOpenChange,
  currentStats,
  onImportComplete
}: RagSnapshotDialogProps) {
  // Estado Exportar
  const [exportScope, setExportScope] =
    React.useState<RagSnapshotScope>('indexed')
  const [isExporting, setIsExporting] = React.useState(false)

  // Estado Importar
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [selectedFileName, setSelectedFileName] = React.useState('')
  const [selectedFileSize, setSelectedFileSize] = React.useState(0)
  const [isParsingFile, setIsParsingFile] = React.useState(false)
  const [parseError, setParseError] = React.useState<string | null>(null)
  const [parsedSnapshot, setParsedSnapshot] =
    React.useState<RagSnapshotPayload | null>(null)
  const [importMode, setImportMode] =
    React.useState<RagSnapshotImportMode>('replace')
  const [isDragging, setIsDragging] = React.useState(false)

  // Progreso Importar
  const [confirmReplaceOpen, setConfirmReplaceOpen] = React.useState(false)
  const [isImporting, setIsImporting] = React.useState(false)
  const [importPhaseLabel, setImportPhaseLabel] = React.useState('')
  const [importProgress, setImportProgress] = React.useState({
    current: 0,
    total: 0
  })

  const resetImportState = React.useCallback(() => {
    setSelectedFileName('')
    setSelectedFileSize(0)
    setParseError(null)
    setParsedSnapshot(null)
    setImportPhaseLabel('')
    setImportProgress({ current: 0, total: 0 })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleCloseChange = (nextOpen: boolean) => {
    if (isImporting || isExporting) return
    if (!nextOpen) {
      resetImportState()
    }
    onOpenChange(nextOpen)
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const res = await fetch(
        `/api/admin/documents/export?scope=${exportScope}&format=gzip`,
        {
          method: 'GET',
          cache: 'no-store'
        }
      )

      if (!res.ok) {
        const msg = await parseErrorResponse(
          res,
          'No se pudo exportar el snapshot RAG'
        )
        throw new Error(msg)
      }

      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition') || ''
      const match = disposition.match(/filename="?([^"]+)"?/i)
      const fallbackName = `sipangpt-rag-${exportScope}-${new Date().toISOString().slice(0, 10)}.json.gz`
      const downloadName = match?.[1] || fallbackName

      const docsHeader = res.headers.get('X-Snapshot-Documents')
      const chunksHeader = res.headers.get('X-Snapshot-Chunks')

      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = downloadName
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)

      toast.success(
        `Snapshot descargado (${docsHeader || '?'} docs · ${chunksHeader || '?'} chunks · ${formatMB(blob.size)}).`
      )
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al exportar snapshot RAG.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleFileSelected = async (file: File | null) => {
    if (!file) return
    setIsParsingFile(true)
    setParseError(null)
    setParsedSnapshot(null)
    setSelectedFileName(file.name)
    setSelectedFileSize(file.size)

    try {
      const text = await readSnapshotFileText(file)
      const rawJson: unknown = JSON.parse(text)
      const validated = validateRagSnapshotPayload(rawJson)
      if (!validated.ok) {
        throw new Error(validated.error)
      }
      setParsedSnapshot(validated.data)
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'El archivo seleccionado no es un snapshot RAG válido.'
      setParseError(msg)
      setParsedSnapshot(null)
    } finally {
      setIsParsingFile(false)
    }
  }

  const executeImport = async () => {
    if (!parsedSnapshot) return
    setConfirmReplaceOpen(false)
    setIsImporting(true)

    try {
      const totalChunks = parsedSnapshot.chunks.length
      setImportProgress({ current: 0, total: totalChunks })
      setImportPhaseLabel(
        importMode === 'replace'
          ? 'Limpiando documentos anteriores y preparando catálogo...'
          : 'Sincronizando categorías y documentos...'
      )

      // Fase 1: Preparar categorías y encabezados de documentos
      const prepareRes = await fetch('/api/admin/documents/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'prepare',
          mode: importMode,
          categories: parsedSnapshot.categories,
          documents: parsedSnapshot.documents
        })
      })

      if (!prepareRes.ok) {
        throw new Error(
          await parseErrorResponse(
            prepareRes,
            'Error al preparar los documentos para importación'
          )
        )
      }

      // Fase 2: Subir fragmentos por lotes compactos (evita límites 1 MB / timeouts)
      const totalBatches = Math.ceil(
        totalChunks / RAG_SNAPSHOT_IMPORT_BATCH_SIZE
      )
      for (let i = 0; i < totalChunks; i += RAG_SNAPSHOT_IMPORT_BATCH_SIZE) {
        const batchIndex = Math.floor(i / RAG_SNAPSHOT_IMPORT_BATCH_SIZE) + 1
        const batch = parsedSnapshot.chunks.slice(
          i,
          i + RAG_SNAPSHOT_IMPORT_BATCH_SIZE
        )

        setImportPhaseLabel(
          `Importando fragmentos y embeddings (lote ${batchIndex} de ${totalBatches})...`
        )

        const batchRes = await fetch('/api/admin/documents/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'import-chunks',
            chunks: batch
          })
        })

        if (!batchRes.ok) {
          throw new Error(
            await parseErrorResponse(
              batchRes,
              `Error en el lote ${batchIndex}/${totalBatches}`
            )
          )
        }

        setImportProgress({
          current: Math.min(totalChunks, i + batch.length),
          total: totalChunks
        })
      }

      // Fase 3: Finalizar conteos reales, restaurar estados e invalidar caché RAM
      setImportPhaseLabel(
        'Verificando conteos finales e invalidando índice RAG en memoria...'
      )

      const finalizeRes = await fetch('/api/admin/documents/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'finalize',
          documents: parsedSnapshot.documents.map((d) => ({
            id: d.id,
            status: d.status as DocumentStatus
          }))
        })
      })

      if (!finalizeRes.ok) {
        throw new Error(
          await parseErrorResponse(
            finalizeRes,
            'Error al finalizar la importación RAG'
          )
        )
      }

      const finalJson = (await finalizeRes.json()) as {
        documentsFinalized?: number
        totalChunks?: number
        indexedDocuments?: number
      }

      toast.success(
        `Migración completada: ${finalJson.documentsFinalized ?? parsedSnapshot.documents.length} documentos y ${finalJson.totalChunks ?? totalChunks} fragmentos listos sin re-ejecutar OCR.`
      )

      await onImportComplete()
      resetImportState()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error durante la importación RAG.')
    } finally {
      setIsImporting(false)
      setImportPhaseLabel('')
    }
  }

  const handleStartImportClick = () => {
    if (!parsedSnapshot || isImporting) return
    if (importMode === 'replace') {
      setConfirmReplaceOpen(true)
      return
    }
    void executeImport()
  }

  const progressPercent =
    importProgress.total > 0
      ? Math.round((importProgress.current / importProgress.total) * 100)
      : 0

  return (
    <>
      <Dialog open={open} onOpenChange={handleCloseChange}>
        <DialogContent
          showCloseButton={!isImporting && !isExporting}
          className='sm:max-w-2xl font-exo rounded-3xl p-6 max-h-[90vh] overflow-y-auto'
        >
          <DialogHeader>
            <DialogTitle className='font-frances text-lg font-bold flex items-center gap-2'>
              <Database className='w-5 h-5 text-primary' />
              Exportar e Importar Base de Conocimiento RAG
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground leading-relaxed'>
              Transfiere instantáneamente documentos, árboles ToC (Sipán-STAIR),
              fragmentos curados y embeddings vectoriales entre entornos (ej.
              Local a Producción) sin volver a ejecutar OCR ni recalcular
              vectores.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-5 pt-1'>
            {/* ============================================================= */}
            {/* SECCIÓN 1: EXPORTAR SNAPSHOT */}
            {/* ============================================================= */}
            <div className='rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-3.5'>
              <div className='flex items-center justify-between gap-2 flex-wrap'>
                <div className='flex items-center gap-2'>
                  <div className='h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0'>
                    <Download className='w-4 h-4' />
                  </div>
                  <div>
                    <h3 className='font-frances text-sm font-bold text-foreground'>
                      1. Exportar Snapshot (.json.gz)
                    </h3>
                    <p className='text-[11px] text-muted-foreground'>
                      Actualmente hay {currentStats.indexed} documentos{' '}
                      <strong>INDEXED</strong> de {currentStats.total} totales.
                    </p>
                  </div>
                </div>
                <Badge
                  variant='outline'
                  className='text-[10px] border-primary/30 text-primary bg-primary/5'
                >
                  Float32 Base64 + GZIP
                </Badge>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
                <button
                  type='button'
                  disabled={isExporting || isImporting}
                  onClick={() => setExportScope('indexed')}
                  className={`rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                    exportScope === 'indexed'
                      ? 'border-primary bg-primary/8 shadow-xs'
                      : 'border-border/70 bg-card hover:border-border'
                  }`}
                >
                  <div className='flex items-center justify-between gap-2'>
                    <span className='text-xs font-bold text-foreground'>
                      Solo INDEXED
                    </span>
                    <Badge
                      variant='outline'
                      className='text-[9px] py-0 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                    >
                      Recomendado
                    </Badge>
                  </div>
                  <p className='text-[11px] text-muted-foreground mt-1 leading-snug'>
                    Incluye únicamente los reglamentos activos listos para
                    producción (~9–10 MB).
                  </p>
                </button>

                <button
                  type='button'
                  disabled={isExporting || isImporting}
                  onClick={() => setExportScope('all')}
                  className={`rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                    exportScope === 'all'
                      ? 'border-primary bg-primary/8 shadow-xs'
                      : 'border-border/70 bg-card hover:border-border'
                  }`}
                >
                  <div className='flex items-center justify-between gap-2'>
                    <span className='text-xs font-bold text-foreground'>
                      Catálogo Completo
                    </span>
                    <Badge variant='outline' className='text-[9px] py-0'>
                      Todos
                    </Badge>
                  </div>
                  <p className='text-[11px] text-muted-foreground mt-1 leading-snug'>
                    Exporta activos, desindexados y borradores con todos sus
                    fragmentos.
                  </p>
                </button>
              </div>

              <div className='flex justify-end'>
                <Button
                  type='button'
                  onClick={handleExport}
                  disabled={isExporting || isImporting || currentStats.total === 0}
                  className='rounded-xl text-xs font-semibold gap-1.5 cursor-pointer'
                >
                  {isExporting ? (
                    <Loader2 className='w-3.5 h-3.5 animate-spin' />
                  ) : (
                    <Download className='w-3.5 h-3.5' />
                  )}
                  {isExporting
                    ? 'Generando archivo...'
                    : 'Descargar Snapshot (.json.gz)'}
                </Button>
              </div>
            </div>

            <Separator />

            {/* ============================================================= */}
            {/* SECCIÓN 2: IMPORTAR SNAPSHOT */}
            {/* ============================================================= */}
            <div className='rounded-2xl border border-border/80 bg-card p-4 space-y-3.5'>
              <div className='flex items-center gap-2'>
                <div className='h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0'>
                  <Upload className='w-4 h-4' />
                </div>
                <div>
                  <h3 className='font-frances text-sm font-bold text-foreground'>
                    2. Importar Snapshot RAG
                  </h3>
                  <p className='text-[11px] text-muted-foreground'>
                    Carga en lotes de {RAG_SNAPSHOT_IMPORT_BATCH_SIZE} fragmentos
                    (compatible con proxies y sin costo adicional de IA).
                  </p>
                </div>
              </div>

              {/* Zona Drop / Input de archivo */}
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  if (!isImporting) setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragging(false)
                  if (isImporting) return
                  const dropped = e.dataTransfer.files?.[0] ?? null
                  void handleFileSelected(dropped)
                }}
                onClick={() => {
                  if (!isImporting && !isParsingFile) {
                    fileInputRef.current?.click()
                  }
                }}
                className={`rounded-2xl border-2 border-dashed p-4 text-center transition-all ${
                  isImporting
                    ? 'opacity-60 cursor-not-allowed border-border/50'
                    : isDragging
                      ? 'border-primary bg-primary/5 cursor-pointer'
                      : 'border-border/80 hover:border-primary/60 hover:bg-muted/30 cursor-pointer'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='.gz,.json,application/gzip,application/json'
                  disabled={isImporting || isParsingFile}
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null
                    void handleFileSelected(f)
                  }}
                  className='hidden'
                />
                <div className='flex flex-col items-center gap-1.5'>
                  {isParsingFile ? (
                    <Loader2 className='w-6 h-6 text-primary animate-spin' />
                  ) : (
                    <FileArchive className='w-6 h-6 text-primary' />
                  )}
                  <p className='text-xs font-semibold text-foreground'>
                    {isParsingFile
                      ? 'Descomprimiendo y validando snapshot...'
                      : selectedFileName
                        ? `${selectedFileName} (${formatMB(selectedFileSize)})`
                        : 'Haz clic o arrastra tu archivo .json.gz o .json aquí'}
                  </p>
                  <p className='text-[10px] text-muted-foreground'>
                    Formato oficial <code className='font-mono'>sipangpt-rag-snapshot</code>
                  </p>
                </div>
              </div>

              {parseError && (
                <div className='rounded-xl border border-destructive/40 bg-destructive/10 p-3 flex items-start gap-2 text-xs text-destructive'>
                  <AlertTriangle className='w-4 h-4 shrink-0 mt-0.5' />
                  <span className='leading-relaxed'>{parseError}</span>
                </div>
              )}

              {parsedSnapshot && (
                <div className='space-y-3.5'>
                  {/* Vista Previa del Snapshot Validado */}
                  <div className='rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-2.5'>
                    <div className='flex items-center justify-between gap-2 flex-wrap'>
                      <span className='text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5'>
                        <CheckCircle2 className='w-4 h-4' />
                        Snapshot verificado y listo para importar
                      </span>
                      <span className='text-[10px] text-muted-foreground'>
                        Exportado:{' '}
                        {new Date(parsedSnapshot.exportedAt).toLocaleString('es-PE')}
                      </span>
                    </div>

                    <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 text-center'>
                      <div className='rounded-xl bg-card border border-border/60 p-2'>
                        <p className='text-sm font-bold font-mono text-foreground flex items-center justify-center gap-1'>
                          <FileText className='w-3.5 h-3.5 text-primary' />
                          {parsedSnapshot.stats.documents}
                        </p>
                        <p className='text-[10px] text-muted-foreground'>
                          Documentos
                        </p>
                      </div>
                      <div className='rounded-xl bg-card border border-border/60 p-2'>
                        <p className='text-sm font-bold font-mono text-foreground flex items-center justify-center gap-1'>
                          <Layers className='w-3.5 h-3.5 text-sky-500' />
                          {parsedSnapshot.stats.chunks}
                        </p>
                        <p className='text-[10px] text-muted-foreground'>
                          Fragmentos
                        </p>
                      </div>
                      <div className='rounded-xl bg-card border border-border/60 p-2'>
                        <p className='text-sm font-bold font-mono text-foreground flex items-center justify-center gap-1'>
                          <Sparkles className='w-3.5 h-3.5 text-emerald-500' />
                          {parsedSnapshot.stats.embeddedChunks}
                        </p>
                        <p className='text-[10px] text-muted-foreground'>
                          Con Embeddings
                        </p>
                      </div>
                      <div className='rounded-xl bg-card border border-border/60 p-2'>
                        <p className='text-sm font-bold font-mono text-foreground'>
                          {parsedSnapshot.stats.categories}
                        </p>
                        <p className='text-[10px] text-muted-foreground'>
                          Categorías
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Selector de Modo de Importación */}
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
                    <button
                      type='button'
                      disabled={isImporting}
                      onClick={() => setImportMode('replace')}
                      className={`rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                        importMode === 'replace'
                          ? 'border-rose-500/60 bg-rose-500/8 shadow-xs'
                          : 'border-border/70 bg-muted/20 hover:border-border'
                      }`}
                    >
                      <div className='flex items-center justify-between gap-2'>
                        <span className='text-xs font-bold text-foreground flex items-center gap-1'>
                          <Trash2 className='w-3.5 h-3.5 text-rose-500' />
                          Reemplazar todo
                        </span>
                        <Badge
                          variant='outline'
                          className='text-[9px] py-0 border-rose-500/40 text-rose-600 dark:text-rose-400'
                        >
                          Limpieza total
                        </Badge>
                      </div>
                      <p className='text-[11px] text-muted-foreground mt-1 leading-snug'>
                        Borra todos los documentos/chunks actuales de este entorno
                        y carga únicamente este snapshot.
                      </p>
                    </button>

                    <button
                      type='button'
                      disabled={isImporting}
                      onClick={() => setImportMode('merge')}
                      className={`rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                        importMode === 'merge'
                          ? 'border-primary bg-primary/8 shadow-xs'
                          : 'border-border/70 bg-muted/20 hover:border-border'
                      }`}
                    >
                      <div className='flex items-center justify-between gap-2'>
                        <span className='text-xs font-bold text-foreground flex items-center gap-1'>
                          <RefreshCw className='w-3.5 h-3.5 text-primary' />
                          Combinar / Actualizar
                        </span>
                        <Badge variant='outline' className='text-[9px] py-0'>
                          Sin borrar otros
                        </Badge>
                      </div>
                      <p className='text-[11px] text-muted-foreground mt-1 leading-snug'>
                        Actualiza o inserta los documentos del archivo conservando
                        los demás registros existentes.
                      </p>
                    </button>
                  </div>

                  {/* Barra de Progreso */}
                  {isImporting && (
                    <div className='rounded-2xl border border-primary/30 bg-primary/5 p-3 space-y-2'>
                      <div className='flex items-center justify-between text-[11px] font-semibold text-foreground'>
                        <span className='flex items-center gap-1.5'>
                          <Loader2 className='w-3.5 h-3.5 animate-spin text-primary' />
                          {importPhaseLabel}
                        </span>
                        <span className='font-mono text-primary'>
                          {importProgress.current}/{importProgress.total} ({progressPercent}%)
                        </span>
                      </div>
                      <div className='h-2 w-full rounded-full bg-muted overflow-hidden'>
                        <div
                          className='h-full bg-primary transition-all duration-300'
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className='flex items-center justify-end gap-2 pt-1'>
                    <Button
                      type='button'
                      variant='outline'
                      disabled={isImporting}
                      onClick={resetImportState}
                      className='rounded-xl text-xs font-semibold cursor-pointer'
                    >
                      Limpiar archivo
                    </Button>
                    <Button
                      type='button'
                      disabled={isImporting}
                      onClick={handleStartImportClick}
                      className={`rounded-xl text-xs font-semibold gap-1.5 cursor-pointer ${
                        importMode === 'replace'
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : ''
                      }`}
                    >
                      {isImporting ? (
                        <Loader2 className='w-3.5 h-3.5 animate-spin' />
                      ) : (
                        <Upload className='w-3.5 h-3.5' />
                      )}
                      {isImporting
                        ? 'Importando...'
                        : importMode === 'replace'
                          ? 'Reemplazar Base RAG e Importar'
                          : 'Importar y Combinar Snapshot'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmAlertDialog
        open={confirmReplaceOpen}
        onOpenChange={setConfirmReplaceOpen}
        title='¿Reemplazar toda la base de conocimiento RAG?'
        description={
          parsedSnapshot
            ? `Se eliminarán permanentemente los ${currentStats.total} documentos actuales y sus fragmentos de este entorno antes de importar ${parsedSnapshot.stats.documents} documentos y ${parsedSnapshot.stats.chunks} fragmentos. No afectará usuarios, conversaciones ni citas históricas.`
            : ''
        }
        confirmText='Sí, borrar todo e importar'
        cancelText='Cancelar'
        variant='destructive'
        isLoading={isImporting}
        onConfirm={executeImport}
      />
    </>
  )
}
