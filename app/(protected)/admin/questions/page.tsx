import * as React from 'react'
import { getAllSuggestedQuestions } from '@/lib/db/system'
import { requireRole } from '@/lib/session'
import { Role } from '@/lib/prisma'
import { QuestionsManager } from '@/components/admin/questions-manager'

export default async function AdminQuestionsPage() {
  await requireRole(Role.ADMIN)
  const questions = await getAllSuggestedQuestions()

  return (
    <div className='space-y-6'>
      <QuestionsManager initialQuestions={questions} />
    </div>
  )
}
