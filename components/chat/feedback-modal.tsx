'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export interface FeedbackData {
  model: string
  id_usuario?: string | null
  id_mensaje: string
  mensaje_usuario: string
  respuesta: string
  puntuacion: number
  tipo: 'Adecuada' | 'Inadecuada' | null
  feedback?: string | null
  consentimientoCorreo: boolean
  time: string
}

interface FeedbackModalProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  userQuestion: string
  assistantResponse: string
  messageId: string
  modelName: string
  userId?: string | null
  feedbackType: 'Adecuada' | 'Inadecuada' | null
  setFeedbackType: (type: 'Adecuada' | 'Inadecuada' | null) => void
  initialRating?: number
  onRatingChange?: (rating: number) => void
}

export function FeedbackModal({
  isOpen,
  setIsOpen,
  userQuestion,
  assistantResponse,
  messageId,
  modelName,
  userId,
  feedbackType,
  setFeedbackType,
  initialRating = 0,
  onRatingChange,
}: FeedbackModalProps) {
  const [rating, setRating] = React.useState<number>(initialRating || (feedbackType === 'Adecuada' ? 5 : 1))
  const [feedbackText, setFeedbackText] = React.useState('')
  const [consent, setConsent] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (initialRating > 0) {
      setRating(initialRating)
    } else if (feedbackType === 'Adecuada') {
      setRating(5)
    } else if (feedbackType === 'Inadecuada') {
      setRating(1)
    }
  }, [initialRating, feedbackType, isOpen])

  const handleRatingSelect = (newRating: number) => {
    setRating(newRating)
    if (onRatingChange) {
      onRatingChange(newRating)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    const feedbackData: FeedbackData = {
      model: modelName || 'sipangpt-default',
      id_usuario: userId || null,
      id_mensaje: messageId,
      mensaje_usuario: userQuestion,
      respuesta: assistantResponse,
      puntuacion: rating,
      tipo: feedbackType,
      feedback: feedbackText.trim() || null,
      consentimientoCorreo: consent,
      time: new Date().toISOString(),
    }

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData),
      })

      const result = await response.json()
      if (result.success) {
        toast.success('¡Muchas gracias por tu feedback institucional!')
        setIsOpen(false)
        setFeedbackText('')
        setFeedbackType(null)
      } else {
        toast.error(result.error || 'Hubo un error al enviar el feedback.')
      }
    } catch {
      toast.error('Hubo un error al enviar tu feedback.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const dialogTitle =
    feedbackType === 'Adecuada'
      ? 'Respuesta Adecuada'
      : feedbackType === 'Inadecuada'
      ? 'Respuesta Inadecuada'
      : 'Califica la Respuesta'

  const dialogDescription =
    feedbackType === 'Adecuada'
      ? '¡Excelente! Tu opinión nos ayuda a validar la precisión de las normativas de la USS.'
      : feedbackType === 'Inadecuada'
      ? 'Lamentamos que la respuesta no haya sido óptima. Por favor, indícanos cómo mejorar.'
      : 'Ayúdanos a mejorar continuamente la inteligencia académica de SipánGPT.'

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className='sm:max-w-[460px] max-h-[85vh] overflow-y-auto font-exo rounded-3xl p-6'>
        <DialogHeader className='space-y-1.5 text-left'>
          <DialogTitle className='font-frances text-xl text-foreground'>
            {dialogTitle}
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground leading-relaxed'>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>

        {/* Acordeón con la pregunta del estudiante y la respuesta del modelo */}
        <div className='max-h-[200px] overflow-y-auto rounded-2xl border border-border/70 p-1 bg-card/60'>
          <Accordion defaultValue={['item-1']} className='w-full'>
            <AccordionItem value='item-1' className='border-b-0 px-2'>
              <AccordionTrigger className='font-frances text-xs py-2 hover:no-underline text-foreground'>
                Consulta del Estudiante
              </AccordionTrigger>
              <AccordionContent className='text-xs text-muted-foreground pt-1 pb-2 whitespace-pre-wrap leading-relaxed'>
                {userQuestion || 'Consulta sin texto registrado.'}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value='item-2' className='border-t border-border/40 px-2'>
              <AccordionTrigger className='font-frances text-xs py-2 hover:no-underline text-foreground'>
                Respuesta Generada
              </AccordionTrigger>
              <AccordionContent className='text-xs text-muted-foreground pt-1 pb-2 whitespace-pre-wrap leading-relaxed'>
                {assistantResponse || 'Respuesta sin contenido registrado.'}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Calificación con estrellas */}
        <div className='space-y-1.5 text-center pt-2'>
          <Label className='text-xs font-semibold text-foreground block'>
            Puntuación general:
          </Label>
          <div className='flex items-center justify-center gap-1.5 py-1'>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type='button'
                onClick={() => handleRatingSelect(value)}
                className={cn(
                  'p-1.5 rounded-xl transition-all hover:scale-110',
                  value <= rating ? 'text-amber-500' : 'text-muted-foreground/30 hover:text-amber-400'
                )}
                aria-label={`Calificar con ${value} estrellas`}
              >
                <Star className={cn('h-6 w-6', value <= rating ? 'fill-current' : '')} />
              </button>
            ))}
          </div>
        </div>

        {/* Textarea de Comentarios / Feedback */}
        <div className='grid gap-2 py-1'>
          <Label htmlFor='feedback-text' className='text-xs font-medium text-foreground'>
            Comentarios o sugerencias <span className='text-[10px] text-muted-foreground font-normal'>(opcional)</span>
          </Label>
          <Textarea
            id='feedback-text'
            placeholder='Escribe tus observaciones para mejorar las respuestas de SipánGPT...'
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            className='min-h-[85px] rounded-2xl border-border/80 text-xs font-exo placeholder:text-muted-foreground/60'
          />
        </div>

        {/* Switch de consentimiento para encuestas */}
        <div className='flex items-center justify-between rounded-2xl border border-border/60 p-3 bg-muted/20'>
          <Label htmlFor='consent-switch' className='text-xs text-muted-foreground font-normal pr-3 leading-snug cursor-pointer'>
            Permitir que el equipo de soporte me contacte por correo para encuestas de calidad USS.
          </Label>
          <Switch
            id='consent-switch'
            checked={consent}
            onCheckedChange={setConsent}
          />
        </div>

        {/* Botones del Footer */}
        <DialogFooter className='gap-2 pt-2 sm:justify-end'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setIsOpen(false)}
            className='rounded-xl text-xs'
          >
            Cancelar
          </Button>
          <Button
            type='button'
            size='sm'
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className='rounded-xl text-xs'
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
