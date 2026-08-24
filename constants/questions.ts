export interface SuggestedQuestion {
  id: string
  icon: string
  text: string
  category: 'admision' | 'matricula' | 'tramites' | 'carreras'
}

export const INITIAL_QUESTIONS: SuggestedQuestion[] = [
  {
    id: 'q1',
    icon: '📋',
    text: '¿Cuál es el cronograma de matrícula para el presente semestre?',
    category: 'matricula',
  },
  {
    id: 'q2',
    icon: '🎓',
    text: '¿Cuáles son los requisitos para la obtención del grado de bachiller?',
    category: 'tramites',
  },
  {
    id: 'q3',
    icon: '🏛️',
    text: '¿Qué carreras profesionales y modalidades de estudio ofrece la USS?',
    category: 'carreras',
  },
  {
    id: 'q4',
    icon: '📝',
    text: '¿Cómo inicio el trámite de convalidación o traslado externo?',
    category: 'admision',
  },
]
