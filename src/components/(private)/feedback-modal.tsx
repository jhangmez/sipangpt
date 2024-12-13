'use client'

import React, { useState } from 'react'
import { Message } from 'ai'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { StarIcon, StarFilledIcon } from '@radix-ui/react-icons'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'

interface FeedbackModalProps {
  message: Message
  userQuestion: string
  onFeedbackSubmit: (data: FeedbackData) => void
  feedbackType: 'Adecuada' | 'Inadecuada' | null
  setFeedbackType: (type: 'Adecuada' | 'Inadecuada' | null) => void
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export interface FeedbackData {
  model: string
  id_usuario: string | null
  id_mensaje: string
  mensaje_usuario: string
  respuesta: string
  puntuacion: number
  feedback: string | null
  consentimientoCorreo: boolean
  finishReason: string | null
  promptTokens: number | null
  completionTokens: number | null
  time: string | null
}

export function FeedbackModal({
  message,
  userQuestion,
  onFeedbackSubmit,
  feedbackType,
  setFeedbackType,
  isOpen,
  setIsOpen
}: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(0) // Inicializa rating como 0 o undefined
  const [feedbackText, setFeedbackText] = useState('')
  const [consent, setConsent] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const assistantResponse =
    message.role === 'assistant' ? message.content : 'Respuesta del chatbot'

  const handleRatingChange = (newRating: number) => {
    setRating(newRating)
  }

  const handleSubmit = async () => {
    // No es necesario validar aquí, ya que el botón está deshabilitado si rating es 0

    setIsSubmitting(true)

    const feedbackData: FeedbackData = {
      model: 'modelo-placeholder',
      id_usuario: null,
      id_mensaje: message.id,
      mensaje_usuario: userQuestion,
      respuesta: assistantResponse,
      puntuacion: rating,
      feedback: feedbackText,
      consentimientoCorreo: consent,
      finishReason: 'finishReason-placeholder',
      promptTokens: null,
      completionTokens: null,
      time: new Date().toISOString()
    }

    try {
      await onFeedbackSubmit(feedbackData)
      toast.success('¡Gracias por tu feedback!')
      setIsOpen(false)
      setRating(0)
      setFeedbackText('')
      setConsent(false)
      setFeedbackType(null)
    } catch (error) {
      toast.error('Hubo un error al enviar el feedback.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const dialogTitle =
    feedbackType === 'Adecuada'
      ? 'Respuesta Adecuada'
      : feedbackType === 'Inadecuada'
      ? 'Respuesta Inadecuada'
      : 'Califica la respuesta'
  const dialogDescription =
    feedbackType === 'Adecuada'
      ? '¡Gracias! Por favor, considera darnos una calificación.'
      : feedbackType === 'Inadecuada'
      ? 'Lamentamos que la respuesta no haya sido útil. Por favor, ayúdanos a mejorar.'
      : 'Ayúdanos a mejorar la calidad de las respuestas del chatbot.'

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className='sm:max-w-[425px] max-h-[80vh] overflow-y-auto font-exo'>
        <DialogHeader>
          <DialogTitle className='font-frances'>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        {/* Contenedor con scroll para el acordeón */}
        <div className='max-h-[250px] overflow-y-auto'>
          <Accordion
            type='single'
            collapsible
            className='w-full'
            defaultValue='item-1'
          >
            <AccordionItem value='item-1'>
              <AccordionTrigger className='font-frances'>
                Pregunta
              </AccordionTrigger>
              <AccordionContent>{userQuestion}</AccordionContent>
            </AccordionItem>
            <AccordionItem value='item-2'>
              <AccordionTrigger className='font-frances'>
                Respuesta
              </AccordionTrigger>
              <AccordionContent>{assistantResponse}</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Calificación con estrellas (obligatoria) */}
        {feedbackType !== null && (
          <div className='flex items-center justify-center gap-2'>
            {[1, 2, 3, 4, 5].map((value) => (
              <Button
                key={value}
                variant='ghost'
                size='icon'
                onClick={() => handleRatingChange(value)}
                className='hover:bg-accent hover:text-accent-foreground'
              >
                {value <= rating ? (
                  <StarFilledIcon className='h-6 w-6 text-yellow-400' />
                ) : (
                  <StarIcon className='h-6 w-6' />
                )}
              </Button>
            ))}
          </div>
        )}

        {/* Feedback y consentimiento */}
        <div className='grid gap-2 py-4'>
          <Label htmlFor='feedback'>
            Feedback <span className='text-xs'>(opcional)</span>
          </Label>
          <Textarea
            id='feedback'
            placeholder='Escribe tus comentarios...'
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
          />
        </div>

        <div className='flex items-center space-x-2'>
          <Switch id='consent' checked={consent} onCheckedChange={setConsent} />
          <Label htmlFor='consent'>
            Permito usar mi correo para una posterior encuesta{' '}
            <span className='text-xs'>(opcional)</span>.
          </Label>
        </div>

        {/* Botones del footer */}
        <DialogFooter className='gap-2'>
          <Button variant='outline' onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button
            type='submit'
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0} // Deshabilita si está enviando o si no hay rating
          >
            {isSubmitting ? 'Enviando...' : 'Enviar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
