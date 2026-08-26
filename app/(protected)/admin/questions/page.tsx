import type { Metadata } from 'next'

import { getAllQuestionsWithTopics } from '@/lib/actions/admin-questions'
import { getTopicCategoriesData } from '@/lib/actions/admin-topics'
import { QuestionsManager } from '@/components/admin/questions-manager'

export const metadata: Metadata = {
  title: 'Preguntas Frecuentes • Panel Administrador',
  description:
    'Configuración de preguntas sugeridas para estudiantes, ordenamiento e iconos en SipánGPT.'
}

export default async function AdminQuestionsPage() {
  const [questions, categories] = await Promise.all([
    getAllQuestionsWithTopics(),
    getTopicCategoriesData()
  ])

  return (
    <div className='space-y-6'>
      <QuestionsManager
        initialQuestions={questions}
        topicCategories={categories}
      />
    </div>
  )
}
