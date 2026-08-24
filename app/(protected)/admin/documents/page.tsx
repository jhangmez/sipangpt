import * as React from 'react'
import { getAdminDocuments } from '@/lib/actions/admin-documents'
import { DocumentsManager } from '@/components/admin/documents-manager'

export default async function AdminDocumentsPage() {
  const { documents, stats } = await getAdminDocuments()

  return (
    <div className='space-y-6'>
      <DocumentsManager
        initialDocuments={documents}
        stats={stats}
      />
    </div>
  )
}
