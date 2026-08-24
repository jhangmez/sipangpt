'use client'

import * as React from 'react'
import { Bot } from 'lucide-react'
import {
  Questionnaire,
  QuestionnaireItem,
  QuestionnaireTitle,
  QuestionnaireDescription,
  QuestionnaireChoices,
  QuestionnaireChoice,
} from '@/components/ui/questionnaire'
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
    <div className='flex flex-col items-center justify-center min-h-[420px] text-center space-y-6 max-w-xl mx-auto my-auto'>
      <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20'>
        <Bot className='h-8 w-8' />
      </div>

      <div className='space-y-1.5 font-exo'>
        <h1 className='font-frances text-2xl sm:text-3xl font-bold text-foreground'>
          ¡Hola, {userDisplayName}!
        </h1>
        <p className='text-sm text-muted-foreground'>
          ¿En qué puedo orientarte hoy sobre la Universidad Señor de Sipán?
        </p>
      </div>

      {/* Cuestionario de Preguntas Sugeridas usando Questionnaire de Shadcn */}
      {questions.length > 0 && (
        <div className='w-full text-left pt-2'>
          <Questionnaire>
            <QuestionnaireItem name='initial-questions'>
              <QuestionnaireTitle className='font-frances text-sm text-muted-foreground px-1 pb-1'>
                Consultas Rápidas Sugeridas
              </QuestionnaireTitle>
              <QuestionnaireDescription className='text-xs text-muted-foreground px-1 pb-2 font-exo'>
                Selecciona un tema frecuente para consultar reglamentos y trámites oficiales:
              </QuestionnaireDescription>

              <QuestionnaireChoices className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
                {questions.map((q) => (
                  <QuestionnaireChoice
                    key={q.id}
                    value={q.id}
                    onClick={() => onSelectQuestion(q.text)}
                    className='flex items-start gap-2.5 rounded-2xl border border-border/70 p-3.5 text-xs font-exo hover:border-primary/50 hover:bg-primary/5 transition-all text-left shadow-xs'
                  >
                    <span className='text-base shrink-0'>{q.icon}</span>
                    <div className='space-y-0.5 min-w-0'>
                      <span className='font-medium text-foreground block line-clamp-2 leading-relaxed'>
                        {q.text}
                      </span>
                      <span className='text-[10px] text-primary uppercase font-bold tracking-wider block'>
                        {q.category}
                      </span>
                    </div>
                  </QuestionnaireChoice>
                ))}
              </QuestionnaireChoices>
            </QuestionnaireItem>
          </Questionnaire>
        </div>
      )}
    </div>
  )
}
