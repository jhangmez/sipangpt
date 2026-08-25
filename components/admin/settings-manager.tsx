'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  BookOpen,
  Globe,
  MapPin,
  Image,
  Sliders,
  ShieldAlert,
  Sparkles,
  Save,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  updateSystemSettingsAction,
  type SystemSettingsData,
} from '@/lib/actions/admin-settings'

interface SettingsManagerProps {
  initialSettings: SystemSettingsData
}

export function SettingsManager({ initialSettings }: SettingsManagerProps) {
  const [settings, setSettings] = React.useState<SystemSettingsData>(initialSettings)
  const [isSaving, setIsSaving] = React.useState(false)
  const [hasChanges, setHasChanges] = React.useState(false)

  const handleChange = <K extends keyof SystemSettingsData>(
    key: K,
    value: SystemSettingsData[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const res = await updateSystemSettingsAction({
        enableRAG: settings.enableRAG,
        enableWebSearch: settings.enableWebSearch,
        enableMapsSearch: settings.enableMapsSearch,
        enableImageAnalysis: settings.enableImageAnalysis,
        minSimilarityScore: Number(settings.minSimilarityScore),
        maxDailyTokensPerUser: Number(settings.maxDailyTokensPerUser),
        maxPromptChars: Number(settings.maxPromptChars),
        enableVoiceInput: settings.enableVoiceInput,
        maintenanceMode: settings.maintenanceMode,
      })

      if (res.success) {
        toast.success(res.message)
        setHasChanges(false)
      } else {
        toast.error(res.message)
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar la configuración')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className='space-y-6 font-exo max-w-4xl'>
      {/* Header con botón de guardado */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4'>
        <div>
          <h1 className='font-frances text-2xl font-bold text-foreground flex items-center gap-2'>
            <Sliders className='w-6 h-6 text-primary' />
            Políticas de Búsqueda y Capacidades de IA
          </h1>
          <p className='text-xs text-muted-foreground mt-1'>
            Controla qué herramientas de recuperación y grounding tienen permitidas los modelos de IA al responder.
          </p>
        </div>

        <Button
          type='submit'
          disabled={!hasChanges || isSaving}
          className='gap-1.5 rounded-xl text-xs font-semibold shadow-xs shrink-0 cursor-pointer'
        >
          {isSaving ? (
            <RefreshCw className='w-3.5 h-3.5 animate-spin' />
          ) : (
            <Save className='w-3.5 h-3.5' />
          )}
          <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
        </Button>
      </div>

      {/* 1. Capacidades de Recuperación e Información Externa */}
      <div className='rounded-3xl border border-border/70 bg-card p-5 sm:p-6 space-y-5 shadow-xs'>
        <div className='border-b border-border/40 pb-3'>
          <h2 className='font-frances font-bold text-base text-foreground flex items-center gap-2'>
            <Sparkles className='w-4 h-4 text-primary' />
            Fuentes de Recuperación e Información Externa
          </h2>
          <p className='text-xs text-muted-foreground'>
            Habilita o restringe las fuentes de información autorizadas para los modelos de SipánGPT.
          </p>
        </div>

        <div className='grid grid-cols-1 gap-4'>
          {/* Opción 1: RAG en Documentos USS */}
          <div className='flex items-start justify-between gap-4 rounded-2xl border border-border/60 bg-muted/20 p-4 transition hover:border-primary/40'>
            <div className='flex items-start gap-3.5'>
              <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5'>
                <BookOpen className='h-4.5 w-4.5' />
              </div>
              <div className='space-y-1'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <span className='font-bold text-sm text-foreground'>
                    Búsqueda Vectorial RAG (Documentos USS)
                  </span>
                  <Badge variant='outline' className='text-[10px] text-emerald-600 bg-emerald-500/10 border-emerald-500/30'>
                    Recomendado por Defecto
                  </Badge>
                </div>
                <p className='text-xs text-muted-foreground leading-relaxed'>
                  Permite al asistente buscar semánticamente dentro de los reglamentos, mallas curriculares y resoluciones oficiales indexadas en la base de datos Neon.
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enableRAG}
              onCheckedChange={(val) => handleChange('enableRAG', val)}
              className='shrink-0'
            />
          </div>

          {/* Opción 2: Google Search Grounding */}
          <div className='flex items-start justify-between gap-4 rounded-2xl border border-border/60 bg-muted/20 p-4 transition hover:border-primary/40'>
            <div className='flex items-start gap-3.5'>
              <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5'>
                <Globe className='h-4.5 w-4.5' />
              </div>
              <div className='space-y-1'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <span className='font-bold text-sm text-foreground'>
                    Búsqueda en Internet en Tiempo Real (Web Search Grounding)
                  </span>
                  <Badge variant='secondary' className='text-[10px]'>
                    Opcional
                  </Badge>
                </div>
                <p className='text-xs text-muted-foreground leading-relaxed'>
                  Si se habilita, los modelos de Gemini podrán consultar noticias externas e internet público. Si está deshabilitado, el modelo solo responde basándose en el conocimiento institucional.
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enableWebSearch}
              onCheckedChange={(val) => handleChange('enableWebSearch', val)}
              className='shrink-0'
            />
          </div>

          {/* Opción 3: Google Maps Grounding */}
          <div className='flex items-start justify-between gap-4 rounded-2xl border border-border/60 bg-muted/20 p-4 transition hover:border-primary/40'>
            <div className='flex items-start gap-3.5'>
              <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5'>
                <MapPin className='h-4.5 w-4.5' />
              </div>
              <div className='space-y-1'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <span className='font-bold text-sm text-foreground'>
                    Ubicación y Mapas (Google Maps Grounding)
                  </span>
                  <Badge variant='secondary' className='text-[10px]'>
                    Opcional
                  </Badge>
                </div>
                <p className='text-xs text-muted-foreground leading-relaxed'>
                  Permite resolver consultas de geolocalización, rutas, sedes físicas y campus de la USS a través de la API de Maps.
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enableMapsSearch}
              onCheckedChange={(val) => handleChange('enableMapsSearch', val)}
              className='shrink-0'
            />
          </div>

          {/* Opción 4: Análisis Multimodal */}
          <div className='flex items-start justify-between gap-4 rounded-2xl border border-border/60 bg-muted/20 p-4 transition hover:border-primary/40'>
            <div className='flex items-start gap-3.5'>
              <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5'>
                <Image className='h-4.5 w-4.5' />
              </div>
              <div className='space-y-1'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <span className='font-bold text-sm text-foreground'>
                    Análisis Multimodal de Archivos e Imágenes
                  </span>
                  <Badge variant='outline' className='text-[10px] text-purple-600 bg-purple-500/10 border-purple-500/30'>
                    Activo
                  </Badge>
                </div>
                <p className='text-xs text-muted-foreground leading-relaxed'>
                  Permite a los usuarios adjuntar capturas, fotografías de formularios y documentos PDF para que la IA los analice visualmente.
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enableImageAnalysis}
              onCheckedChange={(val) => handleChange('enableImageAnalysis', val)}
              className='shrink-0'
            />
          </div>
        </div>
      </div>

      {/* 2. Umbral de Precisión y Similitud Coseno RAG */}
      <div className='rounded-3xl border border-border/70 bg-card p-5 sm:p-6 space-y-4 shadow-xs'>
        <div className='border-b border-border/40 pb-3'>
          <div className='flex items-center justify-between'>
            <h2 className='font-frances font-bold text-base text-foreground'>
              Umbral Mínimo de Similitud Coseno (Score RAG)
            </h2>
            <Badge className='font-mono font-bold text-xs bg-primary text-primary-foreground'>
              {Math.round(settings.minSimilarityScore * 100)}% Similitud Mínima
            </Badge>
          </div>
          <p className='text-xs text-muted-foreground mt-1'>
            Controla qué tan estricta debe ser la coincidencia entre la pregunta del usuario y los fragmentos de reglamentos para ser citados.
          </p>
        </div>

        <div className='space-y-4 pt-2'>
          <div className='flex items-center justify-between text-xs text-muted-foreground font-mono'>
            <span>20% (Permisivo)</span>
            <span>50% (Recomendado)</span>
            <span>85% (Muy Estricto)</span>
          </div>
          <div className='px-1'>
            <Slider
              value={[Math.round(settings.minSimilarityScore * 100)]}
              onValueChange={(vals) => {
                const val = Array.isArray(vals) ? vals[0] : vals
                handleChange('minSimilarityScore', (val || 50) / 100)
              }}
              min={20}
              max={85}
              step={5}
              className='py-2 cursor-pointer'
            />
          </div>
          <p className='text-[11px] text-muted-foreground'>
            Fragmentos con score inferior a <strong>{Math.round(settings.minSimilarityScore * 100)}%</strong> no serán inyectados en el contexto para prevenir alucinaciones.
          </p>
        </div>
      </div>

      {/* 3. Cuotas de Consumo y Seguridad */}
      <div className='rounded-3xl border border-border/70 bg-card p-5 sm:p-6 space-y-4 shadow-xs'>
        <div className='border-b border-border/40 pb-3'>
          <h2 className='font-frances font-bold text-base text-foreground flex items-center gap-2'>
            <ShieldAlert className='w-4 h-4 text-primary' />
            Límites de Uso y Cuotas de Tokens
          </h2>
          <p className='text-xs text-muted-foreground'>
            Previene abusos y sobrecostos en las APIs de Gemini fijando límites diarios por usuario.
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1'>
          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-foreground'>
              Límite Diario de Tokens por Usuario
            </label>
            <Input
              type='number'
              value={settings.maxDailyTokensPerUser}
              onChange={(e) => handleChange('maxDailyTokensPerUser', parseInt(e.target.value) || 0)}
              className='rounded-xl text-xs font-mono'
            />
            <span className='text-[10px] text-muted-foreground'>
              Reinicio automático diario a las 00:00 UTC.
            </span>
          </div>

          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-foreground'>
              Longitud Máxima de Consulta (Caracteres)
            </label>
            <Input
              type='number'
              value={settings.maxPromptChars}
              onChange={(e) => handleChange('maxPromptChars', parseInt(e.target.value) || 0)}
              className='rounded-xl text-xs font-mono'
            />
            <span className='text-[10px] text-muted-foreground'>
              Evita envíos excesivamente largos en el prompt inicial.
            </span>
          </div>
        </div>
      </div>
    </form>
  )
}
