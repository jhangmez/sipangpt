'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  updateModelStatusAction,
  setDefaultModelAction,
  toggleModelActiveAction,
  createAIModelAction,
  updateAIModelPricingAction,
  deleteAIModelAction,
  getTokenUsageStatsAction,
} from '@/lib/actions/admin-models'
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
  Sparkles,
  CheckCircle2,
  Activity,
  Server,
  AlertTriangle,
  XCircle,
  Plus,
  Edit3,
  DollarSign,
  Coins,
  Cpu,
  Trash2,
  Layers,
  History,
  Eye,
  TrendingUp,
  FileCode,
  Sliders,
  Clock,
  User as UserIcon,
  Tag,
} from 'lucide-react'
import type { ModelProvider, ModelStatus, TokenUsageConcept } from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils'

interface AIModelItem {
  id: string
  name: string
  modelCode: string
  provider: ModelProvider
  description: string | null
  endpointUrl: string | null
  status: ModelStatus
  latencyMs: number | null
  isActive: boolean
  isDefault: boolean
  order: number
  maxTokens: number
  temperature: number
  inputPricePerMillion: number
  outputPricePerMillion: number
  totalInferences: number
  totalTokensUsed: number
  estimatedCostUsd: number
  createdAt: Date | string
  updatedAt: Date | string
}

interface ModelsManagerProps {
  initialModels: AIModelItem[]
}

/**
 * Helper para formatear y controlar inputs decimales ergonómicos:
 * - Convierte automáticamente '.' a ','
 * - No permite signos negativos '-' ni letras/símbolos
 * - Permite borrar el '0' completamente (campo vacío)
 * - Evita prefijos redundantes de ceros (ej: '0150' -> '150')
 * - Admite una única coma decimal
 */
function handleDecimalInputChange(rawVal: string, setter: (val: string) => void) {
  let val = rawVal.replace(/\./g, ',')
  val = val.replace(/[^0-9,]/g, '')
  const parts = val.split(',')
  if (parts.length > 2) {
    val = parts[0] + ',' + parts.slice(1).join('')
  }
  if (/^0[0-9]/.test(val)) {
    val = val.replace(/^0+/, '')
  }
  setter(val)
}

function handleIntegerInputChange(rawVal: string, setter: (val: string) => void) {
  let val = rawVal.replace(/[^0-9]/g, '')
  if (/^0[0-9]/.test(val)) {
    val = val.replace(/^0+/, '')
  }
  setter(val)
}

function parseDecimalToFloat(val: string, fallback: number = 0): number {
  if (!val || val.trim() === '') return fallback
  const normalized = val.replace(',', '.').trim()
  const num = parseFloat(normalized)
  return isNaN(num) || num < 0 ? fallback : num
}

export function ModelsManager({ initialModels }: ModelsManagerProps) {
  const [models, setModels] = React.useState<AIModelItem[]>(initialModels)
  const [activeTab, setActiveTab] = React.useState<'models' | 'logs'>('models')

  // Estado para Registrar Nuevo Modelo
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [createForm, setCreateForm] = React.useState<{
    name: string
    modelCode: string
    provider: ModelProvider
    description: string
    endpointUrl: string
    isDefault: boolean
  }>({
    name: '',
    modelCode: '',
    provider: 'GEMINI',
    description: '',
    endpointUrl: '',
    isDefault: false,
  })
  const [createPriceInputStr, setCreatePriceInputStr] = React.useState('0,10')
  const [createPriceOutputStr, setCreatePriceOutputStr] = React.useState('0,40')
  const [createMaxTokensStr, setCreateMaxTokensStr] = React.useState('2048')
  const [createTemperatureStr, setCreateTemperatureStr] = React.useState('0,3')
  const [isCreating, setIsCreating] = React.useState(false)

  // Estado para Editar Precios y Parámetros
  const [editingModel, setEditingModel] = React.useState<AIModelItem | null>(null)
  const [editPriceInputStr, setEditPriceInputStr] = React.useState<string>('0')
  const [editPriceOutputStr, setEditPriceOutputStr] = React.useState<string>('0')
  const [editMaxTokensStr, setEditMaxTokensStr] = React.useState<string>('2048')
  const [editTemperatureStr, setEditTemperatureStr] = React.useState<string>('0,3')
  const [editDescription, setEditDescription] = React.useState<string>('')
  const [isSavingPricing, setIsSavingPricing] = React.useState(false)

  // Estado para AlertDialog de Eliminación
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    isOpen: boolean
    id: string
    name: string
  }>({
    isOpen: false,
    id: '',
    name: '',
  })
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Estado para Analítica de Tokens y Logs
  const [tokenStats, setTokenStats] = React.useState<any>(null)
  const [isLoadingStats, setIsLoadingStats] = React.useState(false)

  // Cargar analíticas cuando se cambia a la pestaña de logs
  React.useEffect(() => {
    if (activeTab === 'logs') {
      loadTokenStats()
    }
  }, [activeTab])

  const loadTokenStats = async () => {
    setIsLoadingStats(true)
    try {
      const data = await getTokenUsageStatsAction()
      setTokenStats(data)
    } catch (err) {
      toast.error('Error al cargar analíticas de consumo de tokens.')
    } finally {
      setIsLoadingStats(false)
    }
  }

  // Manejar creación de modelo
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.name.trim() || !createForm.modelCode.trim()) {
      toast.error('El nombre y el código del modelo son obligatorios.')
      return
    }

    const inputPrice = parseDecimalToFloat(createPriceInputStr, 0)
    const outputPrice = parseDecimalToFloat(createPriceOutputStr, 0)
    const maxTokens = parseInt(createMaxTokensStr, 10) || 2048
    const temperature = parseDecimalToFloat(createTemperatureStr, 0.3)

    setIsCreating(true)
    try {
      const res = await createAIModelAction({
        name: createForm.name.trim(),
        modelCode: createForm.modelCode.trim(),
        provider: createForm.provider,
        description: createForm.description,
        endpointUrl: createForm.endpointUrl,
        inputPricePerMillion: inputPrice,
        outputPricePerMillion: outputPrice,
        maxTokens,
        temperature,
        isDefault: createForm.isDefault,
      })
      setModels((prev) => [...prev, res.model as any])
      setIsCreateOpen(false)
      setCreateForm({
        name: '',
        modelCode: '',
        provider: 'GEMINI',
        description: '',
        endpointUrl: '',
        isDefault: false,
      })
      setCreatePriceInputStr('0,10')
      setCreatePriceOutputStr('0,40')
      setCreateMaxTokensStr('2048')
      setCreateTemperatureStr('0,3')
      toast.success(`¡Modelo "${res.model.name}" registrado con éxito!`)
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al registrar modelo.')
    } finally {
      setIsCreating(false)
    }
  }

  // Abrir modal de edición de precios
  const handleOpenEditPricing = (model: AIModelItem) => {
    setEditingModel(model)
    setEditPriceInputStr(String(model.inputPricePerMillion ?? 0).replace('.', ','))
    setEditPriceOutputStr(String(model.outputPricePerMillion ?? 0).replace('.', ','))
    setEditMaxTokensStr(String(model.maxTokens ?? 2048))
    setEditTemperatureStr(String(model.temperature ?? 0.3).replace('.', ','))
    setEditDescription(model.description || '')
  }

  // Guardar cambios de precios y parámetros
  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingModel) return

    const inputPrice = parseDecimalToFloat(editPriceInputStr, 0)
    const outputPrice = parseDecimalToFloat(editPriceOutputStr, 0)
    const maxTokens = parseInt(editMaxTokensStr, 10) || 2048
    const temperature = parseDecimalToFloat(editTemperatureStr, 0.3)

    setIsSavingPricing(true)
    try {
      const res = await updateAIModelPricingAction(editingModel.id, {
        inputPricePerMillion: inputPrice,
        outputPricePerMillion: outputPrice,
        maxTokens,
        temperature,
        description: editDescription,
      })

      setModels((prev) =>
        prev.map((m) =>
          m.id === editingModel.id
            ? {
                ...m,
                ...(res.model || {}),
                inputPricePerMillion: inputPrice,
                outputPricePerMillion: outputPrice,
                maxTokens,
                temperature,
                description: editDescription,
              }
            : m
        )
      )
      setEditingModel(null)
      toast.success('Precios y parámetros actualizados correctamente.')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al guardar cambios.')
    } finally {
      setIsSavingPricing(false)
    }
  }

  // Marcar como predeterminado
  const handleSetDefault = async (modelId: string) => {
    try {
      await setDefaultModelAction(modelId)
      setModels((prev) =>
        prev.map((m) => ({
          ...m,
          isDefault: m.id === modelId,
          isActive: m.id === modelId ? true : m.isActive,
        }))
      )
      toast.success('Modelo predeterminado actualizado.')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al cambiar default.')
    }
  }

  // Activar / Desactivar modelo
  const handleToggleActive = async (model: AIModelItem) => {
    try {
      const newActive = !model.isActive
      await toggleModelActiveAction(model.id, newActive)
      setModels((prev) =>
        prev.map((m) =>
          m.id === model.id
            ? {
                ...m,
                isActive: newActive,
                status: newActive ? 'ONLINE' : 'DISABLED',
              }
            : m
        )
      )
      toast.success(newActive ? 'Modelo activado.' : 'Modelo desactivado.')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al actualizar estado.')
    }
  }

  // Actualizar estado de salud
  const handleUpdateStatus = async (modelId: string, status: ModelStatus, latencyMs?: number) => {
    try {
      await updateModelStatusAction(modelId, status, latencyMs)
      setModels((prev) =>
        prev.map((m) =>
          m.id === modelId
            ? {
                ...m,
                status,
                latencyMs: latencyMs ?? m.latencyMs,
              }
            : m
        )
      )
      toast.success(`Estado actualizado a ${status}`)
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al actualizar estado.')
    }
  }

  // Eliminar modelo
  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteAIModelAction(deleteConfirm.id)
      setModels((prev) => prev.filter((m) => m.id !== deleteConfirm.id))
      setDeleteConfirm({ isOpen: false, id: '', name: '' })
      toast.success('Modelo eliminado del catálogo.')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al eliminar modelo.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Formatear concepto de consumo
  const renderConceptBadge = (concept: string) => {
    switch (concept) {
      case 'CHAT_COMPLETION':
        return (
          <Badge className='bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]'>
            💬 Chat Asistente
          </Badge>
        )
      case 'DOCUMENT_OCR_TRANSCRIPTION':
        return (
          <Badge className='bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[10px]'>
            📄 OCR / Transcripción
          </Badge>
        )
      case 'RAG_EMBEDDING':
        return (
          <Badge className='bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 text-[10px]'>
            🧠 Embeddings RAG
          </Badge>
        )
      case 'QUERY_ANALYSIS':
        return (
          <Badge className='bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]'>
            🎯 Clasificación
          </Badge>
        )
      default:
        return (
          <Badge variant='outline' className='text-[10px]'>
            ⚙️ {concept}
          </Badge>
        )
    }
  }

  return (
    <div className='space-y-6 font-exo'>
      {/* Cabecera Principal */}
      <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div className='space-y-1'>
          <h1 className='font-frances text-xl font-bold text-foreground flex items-center gap-2'>
            <Cpu className='w-5 h-5 text-primary' />
            Modelos de IA, Precios y Consumo de Tokens
          </h1>
          <p className='text-xs text-muted-foreground max-w-2xl leading-relaxed'>
            Supervisa el catálogo de modelos, define tarifas referenciales por millón de tokens, analiza el costo estimado por concepto y audita el historial de consumo en tiempo real.
          </p>
        </div>

        <div className='flex items-center gap-2 flex-wrap'>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className='gap-2 rounded-2xl cursor-pointer text-xs font-semibold'
          >
            <Plus className='w-4 h-4' /> Registrar Nuevo Modelo
          </Button>
        </div>
      </div>

      {/* Pestañas: Catálogo vs Logs de Tokens */}
      <div className='flex items-center gap-2 border-b border-border/40 pb-2'>
        <button
          type='button'
          onClick={() => setActiveTab('models')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'models'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/70'
          }`}
        >
          <Cpu className='w-4 h-4' />
          <span>Catálogo de Modelos ({models.length})</span>
        </button>

        <button
          type='button'
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/70'
          }`}
        >
          <History className='w-4 h-4' />
          <span>Registro de Tokens y Costos (Logs)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: CATÁLOGO DE MODELOS */}
      {/* ========================================================================= */}
      {activeTab === 'models' && (
        <div className='grid grid-cols-1 gap-4'>
          {models.length === 0 ? (
            <Empty className='rounded-3xl border border-dashed border-border/80 bg-card/40 p-8'>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <Cpu className='size-8 text-muted-foreground' />
                </EmptyMedia>
                <EmptyTitle>Sin modelos registrados</EmptyTitle>
                <EmptyDescription>
                  No hay modelos de IA en el catálogo. Registra uno nuevo para comenzar.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            models.map((model) => (
              <div
                key={model.id}
                className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4 hover:border-primary/40 transition-colors'
              >
                {/* Cabecera de la Tarjeta */}
                <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border/40 pb-4'>
                  <div className='space-y-1.5'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <h3 className='font-frances font-bold text-base text-foreground'>
                        {model.name}
                      </h3>
                      <span className='rounded-lg bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground'>
                        {model.modelCode}
                      </span>
                      <Badge variant='outline' className='text-xs font-semibold'>
                        {model.provider}
                      </Badge>
                      {model.isDefault && (
                        <Badge className='bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-bold'>
                          ★ Predeterminado
                        </Badge>
                      )}
                      {!model.isActive && (
                        <Badge variant='destructive' className='text-xs'>
                          Desactivado
                        </Badge>
                      )}
                    </div>
                    <p className='text-xs text-muted-foreground'>
                      {model.description || 'Modelo de procesamiento de lenguaje natural y razonamiento.'}
                    </p>
                  </div>

                  {/* Acciones Rápidas */}
                  <div className='flex items-center gap-2 shrink-0 flex-wrap'>
                    <Button
                      size='xs'
                      variant='outline'
                      onClick={() => handleOpenEditPricing(model)}
                      className='gap-1 rounded-xl text-xs cursor-pointer text-muted-foreground hover:text-foreground'
                    >
                      <Edit3 className='w-3.5 h-3.5' /> Editar Precios / Parámetros
                    </Button>

                    {!model.isDefault && (
                      <Button
                        size='xs'
                        variant='outline'
                        onClick={() => handleSetDefault(model.id)}
                        className='rounded-xl text-xs cursor-pointer'
                      >
                        Hacer Predeterminado
                      </Button>
                    )}

                    <Button
                      size='xs'
                      variant={model.isActive ? 'outline' : 'default'}
                      onClick={() => handleToggleActive(model)}
                      className={`rounded-xl text-xs cursor-pointer ${
                        model.isActive
                          ? 'border-rose-500/30 text-rose-600 hover:bg-rose-500/10'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {model.isActive ? 'Desactivar' : 'Activar'}
                    </Button>

                    {!model.isDefault && (
                      <Button
                        size='xs'
                        variant='ghost'
                        onClick={() =>
                          setDeleteConfirm({
                            isOpen: true,
                            id: model.id,
                            name: model.name,
                          })
                        }
                        className='text-rose-600 hover:bg-rose-500/10 rounded-xl cursor-pointer p-2'
                        title='Eliminar modelo'
                      >
                        <Trash2 className='w-3.5 h-3.5' />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Métricas de Uso y Precios Referenciales */}
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/20 rounded-2xl p-3 text-xs'>
                  <div className='space-y-0.5'>
                    <span className='text-[10px] text-muted-foreground flex items-center gap-1'>
                      <Eye className='size-3' /> Invocaciones / Vistas
                    </span>
                    <p className='font-bold font-mono text-foreground text-sm'>
                      {(model.totalInferences || 0).toLocaleString()}
                    </p>
                  </div>

                  <div className='space-y-0.5'>
                    <span className='text-[10px] text-muted-foreground flex items-center gap-1'>
                      <Coins className='size-3' /> Tokens Totales
                    </span>
                    <p className='font-bold font-mono text-foreground text-sm'>
                      {(model.totalTokensUsed || 0).toLocaleString()}
                    </p>
                  </div>

                  <div className='space-y-0.5'>
                    <span className='text-[10px] text-muted-foreground flex items-center gap-1'>
                      <DollarSign className='size-3' /> Costo Estimado
                    </span>
                    <p className='font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm'>
                      ${(model.estimatedCostUsd || 0).toFixed(4)} USD
                    </p>
                  </div>

                  <div className='space-y-0.5'>
                    <span className='text-[10px] text-muted-foreground flex items-center gap-1'>
                      <Tag className='size-3' /> Tarifas / 1M Tokens
                    </span>
                    <p className='font-semibold text-foreground text-[11px] font-mono'>
                      In: ${Number(model.inputPricePerMillion ?? 0).toFixed(2)} • Out: ${Number(model.outputPricePerMillion ?? 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Estado de Salud y Latencia */}
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs'>
                  <div className='flex items-center gap-3'>
                    <span className='text-muted-foreground'>Estado de Salud:</span>
                    {model.status === 'ONLINE' && (
                      <span className='inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400'>
                        <span className='size-2 rounded-full bg-emerald-500 animate-pulse' />
                        🟢 Estable ({model.latencyMs || 150}ms)
                      </span>
                    )}
                    {model.status === 'DEGRADED' && (
                      <span className='inline-flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400'>
                        <span className='size-2 rounded-full bg-amber-500' />
                        🟡 Inestable / Ping Alto ({model.latencyMs || 850}ms)
                      </span>
                    )}
                    {model.status === 'OFFLINE' && (
                      <span className='inline-flex items-center gap-1.5 font-semibold text-rose-600 dark:text-rose-400'>
                        <span className='size-2 rounded-full bg-rose-500' />
                        🔴 Offline
                      </span>
                    )}
                    {model.status === 'DISABLED' && (
                      <span className='inline-flex items-center gap-1.5 font-semibold text-muted-foreground'>
                        ⚪ Desactivado
                      </span>
                    )}
                  </div>

                  {/* Forzar Estado */}
                  <div className='flex items-center gap-1.5'>
                    <button
                      type='button'
                      onClick={() => handleUpdateStatus(model.id, 'ONLINE', 120)}
                      className='rounded-lg border border-border/60 px-2 py-1 text-[10px] font-semibold text-emerald-600 hover:bg-emerald-500/10 cursor-pointer'
                      title='Marcar como Estable'
                    >
                      🟢 Online
                    </button>
                    <button
                      type='button'
                      onClick={() => handleUpdateStatus(model.id, 'DEGRADED', 950)}
                      className='rounded-lg border border-border/60 px-2 py-1 text-[10px] font-semibold text-amber-600 hover:bg-amber-500/10 cursor-pointer'
                      title='Marcar como Inestable'
                    >
                      🟡 Degraded
                    </button>
                    <button
                      type='button'
                      onClick={() => handleUpdateStatus(model.id, 'OFFLINE')}
                      className='rounded-lg border border-border/60 px-2 py-1 text-[10px] font-semibold text-rose-600 hover:bg-rose-500/10 cursor-pointer'
                      title='Marcar como Offline'
                    >
                      🔴 Offline
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: REGISTRO DE TOKENS Y COSTOS (LOGS) */}
      {/* ========================================================================= */}
      {activeTab === 'logs' && (
        <div className='space-y-6'>
          {/* Tarjetas KPI de Consumo */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='rounded-3xl border border-border/80 bg-card p-5 shadow-xs space-y-1.5'>
              <div className='flex items-center justify-between text-muted-foreground'>
                <span className='text-xs font-semibold'>Tokens Totales Registrados</span>
                <Coins className='w-4 h-4 text-primary' />
              </div>
              <p className='text-2xl font-bold font-mono text-foreground'>
                {tokenStats ? (tokenStats.totalTokens || 0).toLocaleString() : '...'}
              </p>
              <p className='text-[10px] text-muted-foreground'>
                En {tokenStats?.totalLogsCount || 0} operaciones registradas
              </p>
            </div>

            <div className='rounded-3xl border border-border/80 bg-card p-5 shadow-xs space-y-1.5'>
              <div className='flex items-center justify-between text-muted-foreground'>
                <span className='text-xs font-semibold'>Costo Estimado Global</span>
                <DollarSign className='w-4 h-4 text-emerald-500' />
              </div>
              <p className='text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400'>
                ${tokenStats ? (tokenStats.totalCostUsd || 0).toFixed(4) : '...'} USD
              </p>
              <p className='text-[10px] text-muted-foreground'>
                Cálculo basado en tarifas por 1M de tokens
              </p>
            </div>

            <div className='rounded-3xl border border-border/80 bg-card p-5 shadow-xs space-y-1.5'>
              <div className='flex items-center justify-between text-muted-foreground'>
                <span className='text-xs font-semibold'>Consultas de Chat</span>
                <Sparkles className='w-4 h-4 text-sky-500' />
              </div>
              <p className='text-2xl font-bold font-mono text-foreground'>
                {tokenStats?.byConcept?.CHAT_COMPLETION
                  ? tokenStats.byConcept.CHAT_COMPLETION.count
                  : 0}
              </p>
              <p className='text-[10px] text-muted-foreground'>
                ${tokenStats?.byConcept?.CHAT_COMPLETION?.cost?.toFixed(4) || '0.0000'} USD en respuestas
              </p>
            </div>

            <div className='rounded-3xl border border-border/80 bg-card p-5 shadow-xs space-y-1.5'>
              <div className='flex items-center justify-between text-muted-foreground'>
                <span className='text-xs font-semibold'>OCR & Transcripción</span>
                <FileCode className='w-4 h-4 text-purple-500' />
              </div>
              <p className='text-2xl font-bold font-mono text-foreground'>
                {tokenStats?.byConcept?.DOCUMENT_OCR_TRANSCRIPTION
                  ? tokenStats.byConcept.DOCUMENT_OCR_TRANSCRIPTION.count
                  : 0}
              </p>
              <p className='text-[10px] text-muted-foreground'>
                ${tokenStats?.byConcept?.DOCUMENT_OCR_TRANSCRIPTION?.cost?.toFixed(4) || '0.0000'} USD en PDFs
              </p>
            </div>
          </div>

          {/* Tabla de Logs Recientes */}
          <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4'>
            <div className='flex items-center justify-between border-b border-border/40 pb-3'>
              <div>
                <h2 className='font-frances text-base font-bold text-foreground flex items-center gap-2'>
                  <History className='w-4 h-4 text-primary' /> Historial Reciente de Operaciones y Tokens
                </h2>
                <p className='text-xs text-muted-foreground'>
                  Registro cronológico detallado de tokens de entrada (prompt), salida (completion) y costo.
                </p>
              </div>
              <Button
                size='xs'
                variant='outline'
                onClick={loadTokenStats}
                disabled={isLoadingStats}
                className='rounded-xl text-xs cursor-pointer'
              >
                {isLoadingStats ? 'Cargando...' : 'Actualizar'}
              </Button>
            </div>

            {isLoadingStats ? (
              <div className='p-8 text-center text-xs text-muted-foreground'>
                Cargando registros de auditoría de tokens...
              </div>
            ) : !tokenStats || tokenStats.recentLogs.length === 0 ? (
              <Empty className='p-6'>
                <EmptyHeader>
                  <EmptyMedia variant='icon'>
                    <Coins className='size-8 text-muted-foreground' />
                  </EmptyMedia>
                  <EmptyTitle>Sin registros de consumo aún</EmptyTitle>
                  <EmptyDescription>
                    Los logs se generarán automáticamente a medida que los usuarios interactúen con el chat o se transcriban PDFs.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-left text-xs'>
                  <thead className='bg-muted/30 border-b border-border/50 text-muted-foreground font-semibold'>
                    <tr>
                      <th className='p-3 rounded-l-xl'>Fecha / Hora</th>
                      <th className='p-3'>Concepto</th>
                      <th className='p-3'>Modelo / Proveedor</th>
                      <th className='p-3 text-right'>Prompt</th>
                      <th className='p-3 text-right'>Completion</th>
                      <th className='p-3 text-right'>Total Tokens</th>
                      <th className='p-3 text-right'>Costo (USD)</th>
                      <th className='p-3 text-right rounded-r-xl'>Latencia</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-border/40'>
                    {tokenStats.recentLogs.map((log: any) => {
                      const dateStr = new Date(log.createdAt).toLocaleString('es-PE', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                      return (
                        <tr key={log.id} className='hover:bg-muted/15 transition-colors'>
                          <td className='p-3 font-mono text-muted-foreground whitespace-nowrap'>
                            {dateStr}
                          </td>
                          <td className='p-3 whitespace-nowrap'>{renderConceptBadge(log.concept)}</td>
                          <td className='p-3 font-mono font-medium text-foreground whitespace-nowrap'>
                            {log.modelCode}
                          </td>
                          <td className='p-3 text-right font-mono text-muted-foreground'>
                            {(log.promptTokens || 0).toLocaleString()}
                          </td>
                          <td className='p-3 text-right font-mono text-muted-foreground'>
                            {(log.completionTokens || 0).toLocaleString()}
                          </td>
                          <td className='p-3 text-right font-mono font-bold text-foreground'>
                            {(log.totalTokens || 0).toLocaleString()}
                          </td>
                          <td className='p-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400'>
                            ${(log.estimatedCostUsd || 0).toFixed(5)}
                          </td>
                          <td className='p-3 text-right font-mono text-muted-foreground'>
                            {log.latencyMs ? `${log.latencyMs}ms` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR NUEVO MODELO */}
      {/* ========================================================================= */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className='max-w-xl font-exo rounded-3xl p-6'>
          <DialogHeader>
            <DialogTitle className='font-frances text-lg font-bold flex items-center gap-2'>
              <Cpu className='w-5 h-5 text-primary' /> Registrar Nuevo Modelo de IA
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground'>
              Añade un nuevo modelo a la plataforma con sus credenciales y tarifas de consumo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className='space-y-4 pt-2'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-foreground'>Nombre Visible</label>
                <input
                  type='text'
                  required
                  placeholder='Ej: Gemini 3.1 Flash Lite'
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className='w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs focus:border-primary focus:outline-hidden'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-foreground'>Código del Modelo (ID SDK)</label>
                <input
                  type='text'
                  required
                  placeholder='Ej: gemini-3.1-flash-lite'
                  value={createForm.modelCode}
                  onChange={(e) => setCreateForm({ ...createForm, modelCode: e.target.value })}
                  className='w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-mono focus:border-primary focus:outline-hidden'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-foreground'>Proveedor de IA</label>
                <NativeSelect
                  value={createForm.provider}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, provider: e.target.value as ModelProvider })
                  }
                  className='text-xs'
                >
                  <NativeSelectOption value="GEMINI">Google Gemini</NativeSelectOption>
                  <NativeSelectOption value="OPENAI">OpenAI</NativeSelectOption>
                  <NativeSelectOption value="ANTHROPIC">Anthropic</NativeSelectOption>
                  <NativeSelectOption value="GROQ">Groq Cloud</NativeSelectOption>
                  <NativeSelectOption value="LOCAL_MAC">Local Mac Mini (Ollama)</NativeSelectOption>
                </NativeSelect>
              </div>

              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-foreground'>URL Endpoint (Opcional)</label>
                <input
                  type='text'
                  placeholder='https://tunel.cloudflare.com/v1'
                  value={createForm.endpointUrl}
                  onChange={(e) => setCreateForm({ ...createForm, endpointUrl: e.target.value })}
                  className='w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs focus:border-primary focus:outline-hidden'
                />
              </div>
            </div>

            {/* Tarifas de Precios por Millón */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-3.5 rounded-2xl'>
              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-foreground'>
                  Precio Entrada (USD / 1M Tokens)
                </label>
                <input
                  type='text'
                  inputMode='decimal'
                  placeholder='0,00'
                  value={createPriceInputStr}
                  onChange={(e) => handleDecimalInputChange(e.target.value, setCreatePriceInputStr)}
                  className='w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-mono focus:border-primary focus:outline-hidden'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-foreground'>
                  Precio Salida (USD / 1M Tokens)
                </label>
                <input
                  type='text'
                  inputMode='decimal'
                  placeholder='0,00'
                  value={createPriceOutputStr}
                  onChange={(e) => handleDecimalInputChange(e.target.value, setCreatePriceOutputStr)}
                  className='w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-mono focus:border-primary focus:outline-hidden'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-foreground'>Max Tokens de Salida</label>
                <input
                  type='text'
                  inputMode='numeric'
                  placeholder='2048'
                  value={createMaxTokensStr}
                  onChange={(e) => handleIntegerInputChange(e.target.value, setCreateMaxTokensStr)}
                  className='w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-mono focus:border-primary focus:outline-hidden'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-foreground'>Temperatura (0,0 - 1,0)</label>
                <input
                  type='text'
                  inputMode='decimal'
                  placeholder='0,3'
                  value={createTemperatureStr}
                  onChange={(e) => handleDecimalInputChange(e.target.value, setCreateTemperatureStr)}
                  className='w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-mono focus:border-primary focus:outline-hidden'
                />
              </div>
            </div>

            <div className='space-y-1.5'>
              <label className='text-xs font-semibold text-foreground'>Descripción</label>
              <textarea
                rows={2}
                placeholder='Descripción de las capacidades del modelo...'
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                className='w-full rounded-xl border border-border/80 bg-background p-3 text-xs focus:border-primary focus:outline-hidden resize-none'
              />
            </div>

            <div className='flex items-center justify-end gap-2 pt-2 border-t border-border/40'>
              <Button
                type='button'
                variant='outline'
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
                {isCreating ? 'Guardando...' : 'Registrar Modelo'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: EDITAR PRECIOS Y PARÁMETROS */}
      {/* ========================================================================= */}
      <Dialog open={Boolean(editingModel)} onOpenChange={(open) => !open && setEditingModel(null)}>
        <DialogContent className='max-w-lg font-exo rounded-3xl p-6'>
          <DialogHeader>
            <DialogTitle className='font-frances text-lg font-bold flex items-center gap-2'>
              <DollarSign className='w-5 h-5 text-emerald-500' /> Editar Tarifas y Parámetros: {editingModel?.name}
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground'>
              Ajusta las tarifas por millón de tokens para la estimación de costos en el dashboard.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePricing} className='space-y-4 pt-2'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-3.5 rounded-2xl'>
              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-foreground'>
                  Precio Entrada (USD / 1M Tokens)
                </label>
                <input
                  type='text'
                  inputMode='decimal'
                  placeholder='0,00'
                  value={editPriceInputStr}
                  onChange={(e) => handleDecimalInputChange(e.target.value, setEditPriceInputStr)}
                  className='w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-mono focus:border-primary focus:outline-hidden'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-foreground'>
                  Precio Salida (USD / 1M Tokens)
                </label>
                <input
                  type='text'
                  inputMode='decimal'
                  placeholder='0,00'
                  value={editPriceOutputStr}
                  onChange={(e) => handleDecimalInputChange(e.target.value, setEditPriceOutputStr)}
                  className='w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-mono focus:border-primary focus:outline-hidden'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-foreground'>Max Tokens de Salida</label>
                <input
                  type='text'
                  inputMode='numeric'
                  placeholder='2048'
                  value={editMaxTokensStr}
                  onChange={(e) => handleIntegerInputChange(e.target.value, setEditMaxTokensStr)}
                  className='w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-mono focus:border-primary focus:outline-hidden'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-foreground'>Temperatura (0,0 - 1,0)</label>
                <input
                  type='text'
                  inputMode='decimal'
                  placeholder='0,3'
                  value={editTemperatureStr}
                  onChange={(e) => handleDecimalInputChange(e.target.value, setEditTemperatureStr)}
                  className='w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-mono focus:border-primary focus:outline-hidden'
                />
              </div>
            </div>

            <div className='space-y-1.5'>
              <label className='text-xs font-semibold text-foreground'>Descripción</label>
              <textarea
                rows={2}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className='w-full rounded-xl border border-border/80 bg-background p-3 text-xs focus:border-primary focus:outline-hidden resize-none'
              />
            </div>

            <div className='flex items-center justify-end gap-2 pt-2 border-t border-border/40'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setEditingModel(null)}
                className='rounded-xl text-xs cursor-pointer'
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={isSavingPricing}
                className='rounded-xl text-xs font-semibold cursor-pointer'
              >
                {isSavingPricing ? 'Guardando...' : 'Guardar Tarifas'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* ALERT DIALOG: ELIMINAR MODELO */}
      {/* ========================================================================= */}
      <ConfirmAlertDialog
        open={deleteConfirm.isOpen}
        onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, isOpen: open }))}
        title={`¿Eliminar modelo "${deleteConfirm.name}"?`}
        description='Esta acción eliminará el modelo del catálogo disponible para los estudiantes. Esta acción no se puede deshacer.'
        confirmText='Eliminar Modelo'
        variant='destructive'
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
