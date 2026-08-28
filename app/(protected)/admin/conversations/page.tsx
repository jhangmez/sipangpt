import { getRecentAdminConversationsAction } from '@/lib/actions/admin-conversations'
import { ConversationsInspector } from '@/components/admin/conversations-inspector'


export const metadata = {
  title: 'Conversaciones RAG - Panel de Administración SipánGPT',
  description: 'Inspección de conversaciones y fuentes RAG para administradores'
}

export default async function AdminConversationsPage() {
  const recentConversations = await getRecentAdminConversationsAction().catch(() => [])

  return (
    <div className='flex flex-col flex-1 h-full w-full font-exo min-h-0 overflow-hidden'>
      <ConversationsInspector initialRecentConversations={recentConversations} />
    </div>
  )
}

