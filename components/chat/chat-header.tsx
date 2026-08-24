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
    <header className='flex items-center justify-between border-b border-border/40 pb-3 px-4 shrink-0 font-exo'>
      <div className='flex items-center gap-2'>
        <SidebarTrigger className='-ml-1 h-8 w-8 rounded-xl' />
        <div className='h-4 w-px bg-border/60 mx-1' />
        <ModelSelector
          selectedModel={selectedModel}
          onSelectModel={onSelectModel}
          models={models}
        />
      </div>
      <div className='text-xs text-muted-foreground font-exo hidden sm:block'>
        IA Institucional USS
      </div>
    </header>
  )
}
