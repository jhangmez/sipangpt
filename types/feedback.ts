export interface FeedbackData {
  model: string
  id_usuario?: string | null
  id_mensaje?: string | null
  mensaje_usuario?: string
  respuesta?: string
  puntuacion: number
  reasons: string[]
  feedback?: string | null
  consentimientoCorreo: boolean
  time: string
}

export interface FeedbackModalProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  userQuestion: string
  assistantResponse: string
  messageId: string
  modelName: string
  userId?: string | null
  feedbackType?: 'Adecuada' | 'Inadecuada' | null
  setFeedbackType?: (type: 'Adecuada' | 'Inadecuada' | null) => void
  initialRating?: number
  onRatingChange?: (rating: number) => void
}
