'use client'

import * as React from 'react'
import { Check, ChevronDown, Cpu, Sparkles, AlertCircle, Zap, ShieldCheck } from 'lucide-react'
import { SYSTEM_MODELS, type ModelDefinition } from '@/constants/models'
import type { ModelStatus } from '@/lib/prisma'
import { cn } from '@/lib/utils'

interface ModelSelectorProps {
  selectedModel: ModelDefinition
  onSelectModel: (model: ModelDefinition) => void
  models?: ModelDefinition[]
}

export function ModelSelector({
  selectedModel,
  onSelectModel,
  models = SYSTEM_MODELS,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Cerrar el menú si se hace click afuera
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getStatusBadge = (status: ModelStatus, latencyMs?: number) => {
    switch (status) {
      case 'ONLINE':
        return (
          <span className='inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400'>
            <span className='h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse' />
            Estable {latencyMs ? `(${latencyMs}ms)` : ''}
          </span>
        )
      case 'DEGRADED':
        return (
          <span className='inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400'>
            <span className='h-1.5 w-1.5 rounded-full bg-amber-500' />
            Ping alto {latencyMs ? `(${latencyMs}ms)` : ''}
          </span>
        )
      case 'OFFLINE':
        return (
          <span className='inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400'>
            <span className='h-1.5 w-1.5 rounded-full bg-rose-500' />
            Sin respuesta
          </span>
        )
      case 'DISABLED':
      default:
        return (
          <span className='inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground'>
            <span className='h-1.5 w-1.5 rounded-full bg-muted-foreground' />
            Desactivado
          </span>
        )
    }
  }

  return (
    <div className='relative inline-block text-left' ref={menuRef}>
      {/* Botón Disparador del Selector */}
      <button
        type='button'
        onClick={() => setIsOpen((prev) => !prev)}
        className='inline-flex items-center gap-2 rounded-2xl border border-border/80 bg-background/90 px-3.5 py-1.5 text-xs font-medium text-foreground shadow-sm hover:border-primary/50 hover:bg-accent/40 focus:outline-none transition-all'
      >
        <Sparkles className='h-3.5 w-3.5 text-primary' />
        <span className='font-semibold'>{selectedModel.name}</span>
        {selectedModel.isDefault && (
          <span className='rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary'>
            Default
          </span>
        )}
        {getStatusBadge(selectedModel.status, selectedModel.latencyMs)}
        <ChevronDown
          className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform duration-200', {
            'rotate-180': isOpen,
          })}
        />
      </button>

      {/* Menú Desplegable con Estados de Modelos */}
      {isOpen && (
        <div className='absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150'>
          <div className='px-3 py-2 border-b border-border/40'>
            <p className='text-xs font-semibold text-foreground font-frances'>
              Seleccionar Modelo de Inteligencia Artificial
            </p>
            <p className='text-[11px] text-muted-foreground font-exo'>
              Elige el motor de procesamiento para tus consultas universitarias.
            </p>
          </div>

          <div className='py-1 space-y-1 max-h-72 overflow-y-auto'>
            {models.map((model) => {
              const isSelected = selectedModel.id === model.id
              const isOffline = model.status === 'OFFLINE' || model.status === 'DISABLED'

              return (
                <button
                  key={model.id}
                  type='button'
                  disabled={isOffline}
                  onClick={() => {
                    onSelectModel(model)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'w-full text-left rounded-xl p-2.5 transition-colors flex items-start justify-between gap-3',
                    isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/60',
                    isOffline && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className='space-y-1 flex-1'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <span className='text-xs font-semibold text-foreground'>
                        {model.name}
                      </span>
                      {model.isDefault && (
                        <span className='rounded-md bg-primary/15 px-1.5 py-0.2 text-[9px] font-bold text-primary'>
                          Por Defecto
                        </span>
                      )}
                      {getStatusBadge(model.status, model.latencyMs)}
                    </div>
                    <p className='text-[11px] text-muted-foreground font-exo line-clamp-2'>
                      {model.description}
                    </p>
                  </div>

                  {isSelected && (
                    <Check className='h-4 w-4 text-primary shrink-0 mt-0.5' />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
