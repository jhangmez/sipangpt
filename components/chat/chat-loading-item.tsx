'use client'

import * as React from 'react'
import { Bot } from 'lucide-react'
import { MessageScrollerItem } from '@/components/ui/message-scroller'

export function ChatLoadingItem() {
  return (
    <MessageScrollerItem messageId='streaming-indicator' className='py-2 font-exo'>
      <div className='flex items-center gap-2.5 max-w-[90%] sm:max-w-xl'>
        {/* Avatar del Asistente centrado verticalmente a la izquierda */}
        <div className='h-8 w-8 rounded-xl bg-muted border border-border/80 flex items-center justify-center shrink-0 shadow-xs'>
          <Bot className='h-4 w-4 text-primary animate-spin' />
        </div>

        {/* Burbuja de estado de carga */}
        <div className='rounded-2xl px-4 py-2.5 text-xs text-muted-foreground font-exo flex items-center gap-2 bg-assistant-bg border border-assistant-border shadow-xs'>
          <span className='h-2 w-2 rounded-full bg-primary animate-ping shrink-0' />
          <span className='leading-snug'>
            Consultando base de conocimiento USS y generando respuesta...
          </span>
        </div>
      </div>
    </MessageScrollerItem>
  )
}
