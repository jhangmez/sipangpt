import { requireAuth } from '@/lib/session'
import { getUserConversations } from '@/lib/db/conversations'
import { getActiveAIModels, getActiveSuggestedQuestions } from '@/lib/db/system'
import { MessageSquare, Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { ChatInterface } from '@/components/chat/chat-interface'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default async function ChatPage() {
  const user = await requireAuth()

  // Consultas paralelas en Server Components (RSC) directas a Neon
  const [conversations, aiModels, suggestedQuestions] = await Promise.all([
    getUserConversations(user.id),
    getActiveAIModels(),
    getActiveSuggestedQuestions(),
  ])

  return (
    <div className='flex-1 container mx-auto px-4 py-4 max-w-6xl grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-5rem)]'>
      {/* Barra Lateral de Conversaciones (RSC) */}
      <aside className='hidden md:flex rounded-2xl border border-border/60 bg-card p-4 flex-col h-full shadow-xs'>
        <div className='flex items-center justify-between pb-3 border-b border-border/40'>
          <h2 className='font-frances font-bold text-sm text-foreground'>
            Historial de Consultas
          </h2>
          <Link
            href='/chat'
            className={cn(
              buttonVariants({ size: 'sm' }),
              'gap-1 text-xs flex items-center rounded-xl'
            )}
          >
            <Plus className='w-3.5 h-3.5' />
            Nuevo
          </Link>
        </div>

        <div className='flex-1 overflow-y-auto pt-3 space-y-1'>
          {conversations.length === 0 ? (
            <p className='text-xs text-muted-foreground text-center pt-8 font-exo'>
              No tienes consultas previas. ¡Empieza una nueva!
            </p>
          ) : (
            conversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/chat/${conv.id}`}
                className='flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-exo text-muted-foreground hover:text-foreground hover:bg-muted/60 transition truncate'
              >
                <MessageSquare className='w-3.5 h-3.5 shrink-0 text-primary' />
                <span className='truncate'>{conv.title}</span>
              </Link>
            ))
          )}
        </div>
      </aside>

      {/* Interfaz de Chat con Modelos y Preguntas Dinámicas */}
      <main className='md:col-span-3 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xs flex flex-col h-full overflow-hidden shadow-xs'>
        <ChatInterface
          userName={user.firstName || user.name}
          models={aiModels}
          questions={suggestedQuestions}
        />
      </main>
    </div>
  )
}
