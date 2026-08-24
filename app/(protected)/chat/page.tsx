import { requireAuth } from '@/lib/session'
import { getUserConversations } from '@/lib/db/conversations'
import { getActiveAIModels, getActiveSuggestedQuestions } from '@/lib/db/system'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { ChatInterface } from '@/components/chat/chat-interface'
import type { SidebarChat } from '@/types/chat'

export default async function ChatPage() {
  const user = await requireAuth()

  // Consultas paralelas en Server Components (RSC) directas a Neon
  const [conversations, aiModels, suggestedQuestions] = await Promise.all([
    getUserConversations(user.id),
    getActiveAIModels(),
    getActiveSuggestedQuestions(),
  ])

  const sidebarChats: SidebarChat[] = conversations.map((c) => ({
    id: c.id,
    title: c.title,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }))

  return (
    <SidebarProvider>
      <AppSidebar conversations={sidebarChats} user={user} />
      <SidebarInset className='flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background'>
        <header className='flex h-12 shrink-0 items-center gap-2 border-b border-border/40 px-4'>
          <SidebarTrigger className='-ml-1' />
          <div className='h-4 w-px bg-border/60' />
          <span className='font-frances font-bold text-sm text-foreground'>SipánGPT</span>
        </header>

        <div className='flex-1 overflow-hidden p-4'>
          <ChatInterface
            user={user}
            userName={user.firstName || user.name}
            models={aiModels}
            questions={suggestedQuestions}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
