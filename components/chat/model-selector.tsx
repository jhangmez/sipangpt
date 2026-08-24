'use client'

import * as React from 'react'
import { Sparkles, Check, ChevronDown, Cpu, Activity } from 'lucide-react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
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
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()

  const getStatusBadge = (status: ModelStatus, latencyMs?: number) => {
    switch (status) {
      case 'ONLINE':
        return (
          <Badge variant='outline' className='gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium'>
            <span className='h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse' />
            Estable {latencyMs ? `(${latencyMs}ms)` : ''}
          </Badge>
        )
      case 'DEGRADED':
        return (
          <Badge variant='outline' className='gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-medium'>
            <span className='h-1.5 w-1.5 rounded-full bg-amber-500' />
            Ping alto {latencyMs ? `(${latencyMs}ms)` : ''}
          </Badge>
        )
      case 'OFFLINE':
        return (
          <Badge variant='outline' className='gap-1.5 border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-medium'>
            <span className='h-1.5 w-1.5 rounded-full bg-rose-500' />
            Sin respuesta
          </Badge>
        )
      case 'DISABLED':
      default:
        return (
          <Badge variant='outline' className='gap-1.5 border-border bg-muted text-muted-foreground text-[10px] font-medium'>
            <span className='h-1.5 w-1.5 rounded-full bg-muted-foreground' />
            Desactivado
          </Badge>
        )
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen} showSwipeHandle={isMobile} swipeDirection='down'>
      {/* Botón Disparador del Selector con Drawer de Shadcn */}
      <DrawerTrigger
        render={
          <button
            type='button'
            className='inline-flex items-center gap-2 rounded-2xl border border-border/80 bg-background/90 px-3.5 py-1.5 text-xs font-medium text-foreground shadow-xs hover:border-primary/50 hover:bg-accent/40 focus:outline-none transition-all'
          >
            <Sparkles className='h-3.5 w-3.5 text-primary' />
            <span className='font-semibold'>{selectedModel.name}</span>
            {selectedModel.isDefault && (
              <span className='rounded-md bg-primary/10 px-1.5 py-0.2 text-[10px] font-semibold text-primary'>
                Default
              </span>
            )}
            {getStatusBadge(selectedModel.status, selectedModel.latencyMs)}
            <ChevronDown className='h-3.5 w-3.5 text-muted-foreground transition-transform' />
          </button>
        }
      />

      <DrawerContent className='max-h-[85vh]'>
        <DrawerHeader className='text-left font-exo'>
          <DrawerTitle className='font-frances text-xl'>
            Seleccionar Modelo de Inteligencia Artificial
          </DrawerTitle>
          <DrawerDescription className='text-xs text-muted-foreground'>
            Elige el motor de procesamiento para tus consultas universitarias oficiales en SipánGPT.
          </DrawerDescription>
        </DrawerHeader>

        <div className='flex-1 overflow-y-auto px-4 py-2 font-exo'>
          <RadioGroup
            value={selectedModel.id}
            onValueChange={(val) => {
              const found = models.find((m) => m.id === val)
              if (found && found.status !== 'OFFLINE' && found.status !== 'DISABLED') {
                onSelectModel(found)
                setOpen(false)
              }
            }}
            className='gap-3'
          >
            {models.map((model) => {
              const isSelected = selectedModel.id === model.id
              const isOffline = model.status === 'OFFLINE' || model.status === 'DISABLED'

              return (
                <FieldLabel
                  key={model.id}
                  htmlFor={`model-${model.id}`}
                  className={cn(
                    'block cursor-pointer rounded-2xl border p-4 transition-all',
                    isSelected
                      ? 'border-primary/50 bg-primary/5 shadow-xs ring-1 ring-primary/20'
                      : 'border-border/70 hover:bg-muted/40',
                    isOffline && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  <Field orientation='horizontal' className='flex items-start justify-between gap-3'>
                    <FieldContent className='space-y-1.5 flex-1'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <FieldTitle className='text-sm font-bold text-foreground'>
                          {model.name}
                        </FieldTitle>
                        <Badge variant='secondary' className='text-[10px] font-mono'>
                          {model.provider}
                        </Badge>
                        {model.isDefault && (
                          <Badge className='text-[10px] bg-primary/20 text-primary hover:bg-primary/20'>
                            ★ Por Defecto
                          </Badge>
                        )}
                        {getStatusBadge(model.status, model.latencyMs)}
                      </div>
                      <FieldDescription className='text-xs text-muted-foreground leading-relaxed'>
                        {model.description}
                      </FieldDescription>
                    </FieldContent>

                    <RadioGroupItem
                      value={model.id}
                      id={`model-${model.id}`}
                      disabled={isOffline}
                      className='mt-1'
                    />
                  </Field>
                </FieldLabel>
              )
            })}
          </RadioGroup>
        </div>

        <DrawerFooter className='pt-2'>
          <DrawerClose
            render={
              <button
                type='button'
                className='w-full rounded-xl border border-border bg-background py-2 text-xs font-semibold hover:bg-muted transition font-exo'
              >
                Cerrar
              </button>
            }
          />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
