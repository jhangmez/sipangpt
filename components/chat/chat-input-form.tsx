'use client'

import * as React from 'react'
import { ArrowUp, Paperclip } from 'lucide-react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group'

interface ChatInputFormProps {
  input: string
  setInput: (value: string) => void
  isLoading: boolean
  hasAttachments: boolean
  onSubmit: (e?: React.FormEvent) => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function ChatInputForm({
  input,
  setInput,
  isLoading,
  hasAttachments,
  onSubmit,
  onFileUpload,
}: ChatInputFormProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(e)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading && (input.trim() || hasAttachments)) {
        onSubmit()
      }
    }
  }

  return (
    <form
      onSubmit={handleFormSubmit}
      className='p-4 border-t border-border/40 shrink-0 bg-background/80 backdrop-blur-md font-exo'
    >
      <input
        type='file'
        ref={fileInputRef}
        onChange={onFileUpload}
        multiple
        className='hidden'
        accept='.pdf,.doc,.docx,.txt,.png,.jpg'
      />

      <InputGroup className='h-auto min-h-[52px] rounded-3xl border border-border/80 bg-card p-1.5 shadow-xs focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all items-end'>
        {/* Botón Adjuntar Archivo */}
        <InputGroupAddon align='inline-start' className='self-end pb-1 pl-1'>
          <InputGroupButton
            size='icon-sm'
            variant='ghost'
            type='button'
            onClick={() => fileInputRef.current?.click()}
            className='h-9 w-9 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/70 transition cursor-pointer'
            aria-label='Adjuntar documento o imagen'
            title='Adjuntar archivo'
          >
            <Paperclip className='h-4 w-4' />
          </InputGroupButton>
        </InputGroupAddon>

        {/* Textarea Auto-expandible hacia abajo */}
        <InputGroupTextarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Escribe tu consulta sobre trámites, carreras, matrícula o reglamentos... (Shift+Enter para nueva línea)'
          rows={1}
          className='field-sizing-content min-h-[38px] max-h-40 resize-none overflow-y-auto px-2 py-2 text-sm font-exo text-foreground placeholder:text-muted-foreground focus:outline-none border-0 shadow-none ring-0 leading-relaxed'
          disabled={isLoading}
        />

        {/* Botón Enviar */}
        <InputGroupAddon align='inline-end' className='self-end pb-1 pr-1'>
          <InputGroupButton
            type='submit'
            size='icon-sm'
            variant='default'
            disabled={isLoading || (!input.trim() && !hasAttachments)}
            className='h-9 w-9 rounded-2xl bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer'
            aria-label='Enviar consulta'
            title='Enviar'
          >
            <ArrowUp className='h-4 w-4' />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>

      <p className='text-[11px] text-muted-foreground text-center font-exo pt-2'>
        SipánGPT puede cometer errores. Verifica información importante con los reglamentos institucionales oficiales.
      </p>
    </form>
  )
}
