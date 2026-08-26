import type { Metadata } from 'next'

import { getAdminDocuments } from '@/lib/actions/admin-documents'
import { DocumentsManager } from '@/components/admin/documents-manager'

export const metadata: Metadata = {
  title: 'Ingesta de Documentos RAG • Panel Administrador',
  description:
    'Gestión, subida y clasificación de reglamentos universitarios oficiales con UploadThing y RAG.'
}

// Permite que el Server Action de transcripción/indexación tarde hasta 2 minutos
// (PDFs grandes con Gemini pueden requerir 30–90s de procesamiento)
export const maxDuration = 120

export default async function AdminDocumentsPage() {
  const { documents, topicCategories, stats } = await getAdminDocuments()

  return (
    <div className='space-y-6'>
      <DocumentsManager
        initialDocuments={documents}
        topicCategories={topicCategories}
        stats={stats}
      />
    </div>
  )
}
