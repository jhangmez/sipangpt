'use client'

import * as React from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ModelSelector } from './model-selector'
import type { ModelDefinition } from '@/constants/models'

interface ChatHeaderProps {
  selectedModel: ModelDefinition
  onSelectModel: (model: ModelDefinition) => void
  models?: ModelDefinition[]
}

export function ChatHeader({
  selectedModel,
  onSelectModel,
  models,
}: ChatHeaderProps) {
  return (
    <header className='flex items-center justify-between border-b border-border/40 pb-3 px-2 sm:px-4 shrink-0 font-exo gap-2 min-w-0'>
      {/* Lado Izquierdo: Sidebar Trigger y Título "Chat" */}
      <div className='flex items-center gap-1.5 sm:gap-2.5 shrink-0'>
        <SidebarTrigger className='-ml-1 h-8 w-8 rounded-xl shrink-0' />
        <div className='h-4 w-px bg-border/60 hidden sm:block' />
        <span className='font-frances font-bold text-sm text-foreground tracking-tight hidden sm:inline-block'>
          Chat
        </span>
      </div>

      {/* Centro: Selector de Modelo adaptativo y fluido para xs, sm, md, lg */}
      <div className='flex-1 flex items-center justify-center min-w-0 px-1'>
        <ModelSelector
          selectedModel={selectedModel}
          onSelectModel={onSelectModel}
          models={models}
        />
      </div>

      {/* Lado Derecho: Título institucional o balance visual */}
      <div className='shrink-0 text-xs text-muted-foreground font-exo hidden md:block'>
        Tesis de grado
      </div>
    </header>
  )
}
