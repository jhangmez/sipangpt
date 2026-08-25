'use client'

import * as React from 'react'
import { Bot, Sparkles, ArrowRight } from 'lucide-react'
import type { SuggestedQuestionDefinition } from '@/constants/questions'

interface ChatEmptyStateProps {
  userDisplayName: string
  questions?: SuggestedQuestionDefinition[]
  onSelectQuestion: (questionText: string) => void
}

export function ChatEmptyState({
  userDisplayName,
  questions = [],
  onSelectQuestion,
}: ChatEmptyStateProps) {
  return (
    <div className='flex flex-col items-center justify-center min-h-[420px] text-center space-y-6 max-w-xl mx-auto my-auto py-8'>
      {/* Bot Icon Hero */}
      <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20 animate-in zoom-in-90 duration-300'>
        <Bot className='h-8 w-8' />
      </div>

      {/* Greeting and subtitle */}
      <div className='space-y-1.5 font-exo'>
        <h1 className='font-frances text-2xl sm:text-3xl font-bold text-foreground tracking-tight'>
          ¡Hola, {userDisplayName}!
        </h1>
        <p className='text-sm text-muted-foreground max-w-md mx-auto'>
          ¿En qué puedo orientarte hoy sobre la Universidad Señor de Sipán?
        </p>
      </div>

      {/* Consultas Rápidas Sugeridas */}
      {questions.length > 0 && (
        <div className='w-full text-left pt-2 space-y-3 font-exo'>
          <div className='px-1'>
            <h2 className='font-frances text-sm font-semibold text-foreground/80 flex items-center gap-1.5'>
              <Sparkles className='w-4 h-4 text-primary shrink-0' />
              Consultas Rápidas Sugeridas
            </h2>
            <p className='text-xs text-muted-foreground mt-0.5'>
              Selecciona un tema frecuente para consultar reglamentos y trámites oficiales:
            </p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
            {questions.map((q) => (
              <button
                key={q.id}
                type='button'
                onClick={() => onSelectQuestion(q.text)}
                className='group flex items-start gap-3 rounded-2xl border border-border/80 bg-card/60 p-3.5 text-xs text-left shadow-xs hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
              >
                <span className='text-lg shrink-0 mt-0.5 group-hover:scale-110 transition-transform'>
                  {q.icon}
                </span>
                <div className='space-y-1 min-w-0 flex-1'>
                  <span className='font-medium text-foreground block line-clamp-2 leading-snug group-hover:text-primary transition-colors'>
                    {q.text}
                  </span>
                  <span className='text-[10px] text-primary uppercase font-bold tracking-wider block'>
                    {q.category}
                  </span>
                </div>
                <ArrowRight className='w-3.5 h-3.5 text-muted-foreground/50 shrink-0 self-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all' />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
