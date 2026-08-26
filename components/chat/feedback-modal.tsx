'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Star, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn, getErrorMessage } from '@/lib/utils'
import type { FeedbackData, FeedbackModalProps } from '@/types'

const NEGATIVE_REASONS = [
  'Información incompleta',
  'Datos desactualizados',
  'No entendió la consulta',
  'Respuesta confusa',
  'Faltaron fuentes oficiales',
  'Respuesta lenta'
]

const POSITIVE_REASONS = [
  'Muy claro',
  'Información precisa',
  'Buenas citas y fuentes',
  'Rápido y conciso',
  'Resolvió mi duda',
  'Excelente tono'
]

const RATING_LABELS: Record<number, string> = {
  1: 'Muy deficiente',
  2: 'Poco claro / Insuficiente',
  3: 'Aceptable',
  4: 'Buena respuesta',
  5: 'Excelente y muy claro'
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
  onRatingChange
}: FeedbackModalProps) {
  const [rating, setRating] = React.useState<number>(
    initialRating ||
      (feedbackType === 'Adecuada' ? 5 : feedbackType === 'Inadecuada' ? 1 : 5)
  )
  const [selectedReasons, setSelectedReasons] = React.useState<string[]>([])
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
    setSelectedReasons([])
    if (onRatingChange) {
      onRatingChange(newRating)
    }
  }

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason]
    )
  }

  const availableReasons = rating >= 4 ? POSITIVE_REASONS : NEGATIVE_REASONS

  const handleSubmit = async () => {
    setIsSubmitting(true)

    const feedbackData: FeedbackData = {
      model: modelName || 'sipangpt-default',
      id_usuario: userId || null,
      id_mensaje: messageId,
      mensaje_usuario: userQuestion,
      respuesta: assistantResponse,
      puntuacion: rating,
      reasons: selectedReasons,
      feedback: feedbackText.trim() || null,
      consentimientoCorreo: consent,
      time: new Date().toISOString()
    }

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData)
      })

      const result = await response.json()
      if (result.success) {
        toast.success('¡Muchas gracias por tu feedback institucional!')
        setIsOpen(false)
        setFeedbackText('')
        setSelectedReasons([])
        if (setFeedbackType) setFeedbackType(null)
      } else {
        toast.error(result.error || 'Hubo un error al enviar el feedback.')
      }
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(err) || 'Hubo un error al enviar tu feedback.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className='sm:max-w-[480px] max-h-[85vh] overflow-y-auto font-exo rounded-3xl p-6'>
        <DialogHeader className='space-y-1.5 text-left'>
          <DialogTitle className='font-frances text-xl text-foreground flex items-center gap-2'>
            <Star className='w-5 h-5 text-amber-500 fill-amber-500' />
            Calificar Respuesta de IA
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground leading-relaxed'>
            Ayúdanos a evaluar la precisión y claridad de las respuestas para
            perfeccionar la base de conocimiento de la USS.
          </DialogDescription>
        </DialogHeader>

        {/* Acordeón con la consulta y la respuesta */}
        <div className='max-h-[160px] overflow-y-auto rounded-2xl border border-border/70 p-1 bg-card/60'>
          <Accordion defaultValue={['item-1']} className='w-full'>
            <AccordionItem value='item-1' className='border-b-0 px-2'>
              <AccordionTrigger className='font-frances text-xs py-2 hover:no-underline text-foreground'>
                Consulta del Estudiante
              </AccordionTrigger>
              <AccordionContent className='text-xs text-muted-foreground pt-1 pb-2 whitespace-pre-wrap leading-relaxed'>
                {userQuestion || 'Consulta sin texto registrado.'}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value='item-2'
              className='border-t border-border/40 px-2'
            >
              <AccordionTrigger className='font-frances text-xs py-2 hover:no-underline text-foreground'>
                Respuesta Generada
              </AccordionTrigger>
              <AccordionContent className='text-xs text-muted-foreground pt-1 pb-2 whitespace-pre-wrap leading-relaxed'>
                {assistantResponse || 'Respuesta sin contenido registrado.'}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Selector de 1 a 5 Estrellas */}
        <div className='space-y-2 text-center pt-2'>
          <div className='flex items-center justify-center gap-2 py-1'>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type='button'
                onClick={() => handleRatingSelect(value)}
                className={cn(
                  'p-1.5 rounded-xl transition-all hover:scale-115 cursor-pointer',
                  value <= rating
                    ? 'text-amber-500'
                    : 'text-muted-foreground/30 hover:text-amber-400'
                )}
                aria-label={`Calificar con ${value} estrellas`}
              >
                <Star
                  className={cn(
                    'h-7 w-7',
                    value <= rating ? 'fill-current' : ''
                  )}
                />
              </button>
            ))}
          </div>
          <p className='text-xs font-semibold text-foreground font-mono'>
            {rating} de 5 estrellas •{' '}
            <span className='text-primary'>{RATING_LABELS[rating] || ''}</span>
          </p>
        </div>

        {/* Etiquetas de Motivo de Calificación (Chips Multi-Select) */}
        <div className='space-y-2 pt-1'>
          <Label className='text-xs font-semibold text-foreground block'>
            ¿Qué motivos describen mejor esta respuesta?
          </Label>
          <div className='flex flex-wrap gap-1.5'>
            {availableReasons.map((reason) => {
              const isSelected = selectedReasons.includes(reason)
              return (
                <button
                  key={reason}
                  type='button'
                  onClick={() => toggleReason(reason)}
                  className={cn(
                    'inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-xl border transition-all cursor-pointer select-none font-exo',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-muted/40 border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  )}
                >
                  {isSelected && <Check className='w-3 h-3' />}
                  {reason}
                </button>
              )
            })}
          </div>
        </div>

        {/* Textarea de Comentarios Adicionales */}
        <div className='grid gap-1.5 py-1'>
          <Label
            htmlFor='feedback-text'
            className='text-xs font-medium text-foreground'
          >
            Comentarios adicionales{' '}
            <span className='text-[10px] text-muted-foreground font-normal'>
              (opcional)
            </span>
          </Label>
          <Textarea
            id='feedback-text'
            placeholder='Detalla observaciones para el equipo académico y de sistemas...'
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            className='min-h-[75px] rounded-2xl border-border/80 text-xs font-exo placeholder:text-muted-foreground/60'
          />
        </div>

        {/* Switch de consentimiento */}
        <div className='flex items-center justify-between rounded-2xl border border-border/60 p-3 bg-muted/20'>
          <Label
            htmlFor='consent-switch'
            className='text-xs text-muted-foreground font-normal pr-3 leading-snug cursor-pointer'
          >
            Permitir contacto por correo para encuestas de satisfacción
            institucional USS.
          </Label>
          <Switch
            id='consent-switch'
            checked={consent}
            onCheckedChange={setConsent}
          />
        </div>

        {/* Footer */}
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
            className='rounded-xl text-xs font-semibold shadow-xs'
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Calificación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
