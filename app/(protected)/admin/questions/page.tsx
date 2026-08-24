import * as React from 'react'
import { getAllQuestionsWithTopics } from '@/lib/actions/admin-questions'
import { getTopicCategoriesData } from '@/lib/actions/admin-topics'
import { QuestionsManager } from '@/components/admin/questions-manager'

export default async function AdminQuestionsPage() {
  const [questions, categories] = await Promise.all([
    getAllQuestionsWithTopics(),
    getTopicCategoriesData(),
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
