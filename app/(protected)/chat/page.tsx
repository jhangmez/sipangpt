import type { Metadata } from 'next'
import { requireAuth } from '@/lib/session'
import { getUserConversations } from '@/lib/db/conversations'
import { getActiveAIModels, getActiveSuggestedQuestions } from '@/lib/db/system'
import { getPublishedPosts } from '@/lib/actions/posts'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { ChatInterface } from '@/components/chat/chat-interface'
import type { SidebarChat } from '@/types/chat'

export const metadata: Metadata = {
  title: 'Chat • Asistente Inteligente USS',
  description: 'Consulta reglamentos, cronogramas, mallas curriculares y trámites académicos con citas oficiales de la USS.',
}

export default async function ChatPage() {
  const user = await requireAuth()

  // Consultas paralelas en Server Components (RSC) directas a Neon
  const [conversations, aiModels, suggestedQuestions, publishedPosts] = await Promise.all([
    getUserConversations(user.id),
    getActiveAIModels(),
    getActiveSuggestedQuestions(),
    getPublishedPosts(),
  ])

  const sidebarChats: SidebarChat[] = conversations.map((c) => ({
    id: c.id,
    title: c.title,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }))

  const latestPost = publishedPosts.length > 0 ? publishedPosts[0] : null

  return (
    <SidebarProvider>
      <AppSidebar
        conversations={sidebarChats}
        user={user}
        latestPost={latestPost}
      />
      <SidebarInset className='flex flex-col h-full overflow-hidden bg-background'>
        <div className='flex-1 overflow-hidden p-4'>
          <ChatInterface
            user={user}
            userName={user.firstName || user.name}
            models={aiModels}
            questions={suggestedQuestions}
            posts={publishedPosts}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
