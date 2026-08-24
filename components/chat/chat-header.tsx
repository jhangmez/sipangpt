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
    <header className='relative flex items-center justify-between border-b border-border/40 pb-3 px-4 shrink-0 font-exo'>
      {/* Lado Izquierdo: Sidebar Trigger y Texto "Chat" */}
      <div className='flex items-center gap-2.5 z-10'>
        <SidebarTrigger className='-ml-1 h-8 w-8 rounded-xl' />
        <div className='h-4 w-px bg-border/60' />
        <span className='font-frances font-bold text-sm text-foreground tracking-tight'>
          Chat
        </span>
      </div>

      {/* Centro: Selector de Modelo */}
      <div className='absolute left-1/2 -translate-x-1/2 flex items-center justify-center z-10'>
        <ModelSelector
          selectedModel={selectedModel}
          onSelectModel={onSelectModel}
          models={models}
        />
      </div>

      {/* Lado Derecho: IA Institucional USS */}
      <div className='text-xs text-muted-foreground font-exo hidden sm:block z-10'>
        IA Institucional USS
      </div>
    </header>
  )
}
