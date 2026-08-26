/**
 * Constantes de configuración y límites del Chatbot SipánGPT
 */

// Límite máximo recomendado de preguntas del usuario por conversación
export const MAX_QUESTIONS_PER_CONVERSATION = 20

// Mensajes informativos y amables para el usuario
export const CHAT_LIMIT_MESSAGES = {
  TITLE: 'Límite de consultas en esta conversación',
  DESCRIPTION:
    'Has alcanzado el límite recomendado de 20 consultas en esta conversación. Para garantizar que SipánGPT mantenga respuestas rápidas, precisas y con el mejor contexto normativo, te invitamos a iniciar un nuevo chat.',
  BUTTON_TEXT: 'Iniciar Nuevo Chat',
  BADGE_LABEL: (current: number, max: number) => `${current}/${max} consultas`,
}
