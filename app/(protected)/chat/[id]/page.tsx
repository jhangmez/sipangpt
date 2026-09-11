import type { Metadata } from 'next'
import { requireAuth, getCurrentUser } from '@/lib/session'
import { getConversationById, getUserConversations } from '@/lib/db/conversations'
import { getActiveAIModels, getActiveSuggestedQuestions } from '@/lib/db/system'
import { getPublishedPosts } from '@/lib/actions/posts'
import { notFound } from 'next/navigation'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { ChatInterface } from '@/components/chat/chat-interface'
import type { SidebarChat, ChatMessage } from '@/types/chat'

interface ChatIdPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ChatIdPageProps): Promise<Metadata> {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return { title: 'Conversación • SipánGPT' }

  const conversation = await getConversationById(id, user.id)
  return {
    title: conversation ? `${conversation.title} • SipánGPT` : 'Conversación • SipánGPT',
    description: 'Consulta reglamentos y trámites académicos con citas oficiales de la USS.',
  }
}

export default async function ChatIdPage({ params }: ChatIdPageProps) {
  const user = await requireAuth()
  const { id } = await params

  // Consultas paralelas en Server Components (RSC) directas a Neon
  const [conversation, conversations, aiModels, suggestedQuestions, publishedPosts] = await Promise.all([
    getConversationById(id, user.id),
    getUserConversations(user.id),
    getActiveAIModels(),
    getActiveSuggestedQuestions(),
    getPublishedPosts(),
  ])

  if (!conversation) {
    notFound()
  }

  const sidebarChats: SidebarChat[] = conversations.map((c) => ({
    id: c.id,
    title: c.title,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }))

  const initialChatMessages: ChatMessage[] = conversation.messages.map((m) => ({
    id: m.id,
    role: m.role === 'USER' ? 'user' : 'assistant',
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    modelName: m.modelUsed || undefined,
    latencyMs: m.latencyMs || undefined,
    retrievalLatencyMs: m.retrievalLatencyMs || undefined,
    generationLatencyMs: m.generationLatencyMs || undefined,
    parentId: m.parentId || null,
    isRegeneration: m.isRegeneration,
    regeneratedFromId: m.regeneratedFromId || null,
    sources: m.citations.map((c) => {
      const hasBreadcrumb = c.title.includes(' > ')
      return {
        chunkId: c.chunkId,
        documentId: c.documentId,
        title: hasBreadcrumb ? c.title.split(' > ')[0] : c.title,
        url: c.sourceUrl || undefined,
        snippet: c.snippetText,
        relevance: c.relevance || undefined,
        breadcrumb: hasBreadcrumb ? c.title : undefined,
      }
    }),
  }))

  const latestPost = publishedPosts.length > 0 ? publishedPosts[0] : null

  return (
    <SidebarProvider>
      <AppSidebar
        conversations={sidebarChats}
        currentChatId={id}
        user={user}
        latestPost={latestPost}
      />
      <SidebarInset className='flex flex-col h-full overflow-hidden bg-background'>
        <div className='flex-1 overflow-hidden p-4'>
          <ChatInterface
            conversationId={id}
            initialMessages={initialChatMessages}
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
