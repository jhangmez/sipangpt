'use client'

import * as React from 'react'
import { Bot } from 'lucide-react'
import { Message, MessageAvatar, MessageContent } from '@/components/ui/message'
import { MessageScrollerItem } from '@/components/ui/message-scroller'
import { Bubble } from '@/components/ui/bubble'
import { Avatar } from '@/components/ui/avatar'

export function ChatLoadingItem() {
  return (
    <MessageScrollerItem messageId='streaming-indicator' className='py-2 font-exo'>
      <Message align='start'>
        <MessageAvatar>
          <Avatar className='h-8 w-8 rounded-xl bg-muted border border-border flex items-center justify-center'>
            <Bot className='h-4 w-4 text-primary animate-spin' />
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <Bubble
            variant='muted'
            className='rounded-2xl p-3 text-xs text-muted-foreground font-exo flex items-center gap-2 bg-assistant-bg border border-assistant-border'
          >
            <span className='h-2 w-2 rounded-full bg-primary animate-ping' />
            Consultando base de conocimiento USS y generando respuesta...
          </Bubble>
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  )
}
