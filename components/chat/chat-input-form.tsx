'use client'

import * as React from 'react'
import {
  ArrowUp,
  Paperclip,
  Sparkles,
  MessageSquarePlus
} from 'lucide-react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea
} from '@/components/ui/input-group'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CHAT_LIMIT_MESSAGES,
  MAX_QUESTIONS_PER_CONVERSATION
} from '@/constants'

interface ChatInputFormProps {
  input: string
  setInput: (value: string) => void
  isLoading: boolean
  hasAttachments: boolean
  isLimitReached?: boolean
  questionsCount?: number
  maxQuestions?: number
  onSubmit: (e?: React.FormEvent) => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onNewChat?: () => void
}

export function ChatInputForm({
  input,
  setInput,
  isLoading,
  hasAttachments,
  isLimitReached = false,
  questionsCount = 0,
  maxQuestions = MAX_QUESTIONS_PER_CONVERSATION,
  onSubmit,
  onFileUpload,
  onNewChat
}: ChatInputFormProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isLimitReached) return
    onSubmit(e)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading && !isLimitReached && (input.trim() || hasAttachments)) {
        onSubmit()
      }
    }
  }

  if (isLimitReached) {
    return (
      <div className='p-3 sm:p-4 border-t border-border/40 shrink-0 bg-background/90 backdrop-blur-md font-exo space-y-3'>
        <div className='rounded-3xl border border-primary/30 bg-primary/5 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4'>
          <div className='space-y-1 text-center sm:text-left flex-1 min-w-0'>
            <div className='flex items-center justify-center sm:justify-start gap-2'>
              <Sparkles className='size-4 text-primary shrink-0' />
              <h4 className='font-frances font-bold text-sm text-foreground'>
                {CHAT_LIMIT_MESSAGES.TITLE}
              </h4>
              <Badge variant='outline' className='text-[10px] font-mono py-0'>
                {questionsCount}/{maxQuestions}
              </Badge>
            </div>
            <p className='text-xs text-muted-foreground leading-relaxed'>
              {CHAT_LIMIT_MESSAGES.DESCRIPTION}
            </p>
          </div>

          <Button
            size='sm'
            onClick={onNewChat}
            className='rounded-xl font-semibold gap-1.5 shrink-0 shadow-xs cursor-pointer text-xs w-full sm:w-auto'
          >
            <MessageSquarePlus className='size-4' />
            {CHAT_LIMIT_MESSAGES.BUTTON_TEXT}
          </Button>
        </div>

        <p className='text-[11px] sm:text-[12px] lg:text-xs font-exo text-center select-none text-muted-foreground w-full block'>
          <span className='font-frances text-primary transition-all duration-300 hover:animate-[wave_2s_linear_infinite] hover:text-transparent hover:bg-gradient-to-r hover:from-primary hover:via-primary/40 hover:to-primary hover:bg-[length:200%_100%] hover:bg-clip-text'>
            SipánGPT
          </span>{' '}
          es un chatbot experimental y puede cometer errores. Considera
          verificar la información mostrada.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleFormSubmit}
      className='p-3 sm:p-4 border-t border-border/40 shrink-0 bg-background/80 backdrop-blur-md font-exo w-full'
    >
      <input
        type='file'
        ref={fileInputRef}
        onChange={onFileUpload}
        multiple
        className='hidden'
        accept='.pdf,.doc,.docx,.txt,.md,.png,.jpg'
      />

      <InputGroup className='h-auto min-h-[48px] sm:min-h-[52px] rounded-3xl border border-border/80 bg-card p-1.5 shadow-xs focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all items-end'>
        {/* Botón Adjuntar Archivo */}
        <InputGroupAddon align='inline-start' className='self-end pb-1 pl-1'>
          <InputGroupButton
            size='icon-sm'
            variant='ghost'
            type='button'
            onClick={() => fileInputRef.current?.click()}
            className='h-8 w-8 sm:h-9 sm:w-9 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/70 transition cursor-pointer'
            aria-label='Adjuntar documento o imagen'
            title='Adjuntar archivo'
          >
            <Paperclip className='h-4 w-4' />
          </InputGroupButton>
        </InputGroupAddon>

        {/* Textarea Auto-expandible único con placeholder limpio */}
        <InputGroupTextarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Escribe tu duda o consulta sobre la USS...'
          rows={1}
          className='field-sizing-content min-h-[38px] max-h-40 resize-none overflow-y-auto px-2 py-2 text-xs sm:text-sm font-exo text-foreground placeholder:text-muted-foreground focus:outline-none border-0 shadow-none ring-0 leading-relaxed'
          disabled={isLoading}
        />

        {/* Botón Enviar */}
        <InputGroupAddon align='inline-end' className='self-end pb-1 pr-1'>
          <InputGroupButton
            type='submit'
            size='icon-sm'
            variant='default'
            disabled={isLoading || (!input.trim() && !hasAttachments)}
            className='h-8 w-8 sm:h-9 sm:w-9 rounded-2xl bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer'
            aria-label='Enviar consulta'
            title='Enviar'
          >
            <ArrowUp className='h-4 w-4' />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>

      {/* Footer Institucional Centrado Animado visible en todas las pantallas */}
      <div className='mt-3 mb-1 px-2 w-full text-center relative flex flex-col items-center justify-center z-10'>
        <p className='text-[11px] sm:text-xs font-exo text-center select-none w-full text-muted-foreground block leading-normal max-w-xl mx-auto'>
          <span className='font-frances text-primary transition-all duration-300 hover:animate-[wave_2s_linear_infinite] hover:text-transparent hover:bg-gradient-to-r hover:from-primary hover:via-primary/40 hover:to-primary hover:bg-[length:200%_100%] hover:bg-clip-text font-bold'>
            SipánGPT
          </span>{' '}
          es un chatbot experimental y puede cometer errores. Considera
          verificar la información mostrada.
        </p>

        {questionsCount >= 15 && (
          <div className='mt-2 sm:mt-0 flex justify-center sm:absolute sm:right-2 sm:top-0'>
            <span className='shrink-0 font-mono text-[10px] bg-muted/70 px-2 py-0.5 rounded-full border border-border/50 text-muted-foreground shadow-2xs'>
              {questionsCount}/{maxQuestions} consultas
            </span>
          </div>
        )}
      </div>

    </form>
  )
}


