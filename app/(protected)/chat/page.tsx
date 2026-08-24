import { requireAuth } from '@/lib/session'
import { getUserConversations } from '@/lib/db/conversations'
import { getActiveAIModels } from '@/lib/db/system'
import { MessageSquare, Plus, Sparkles, Bot } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default async function ChatPage() {
  const user = await requireAuth()
  const [conversations, aiModels] = await Promise.all([
    getUserConversations(user.id),
    getActiveAIModels(),
  ])

  return (
    <div className='flex-1 container mx-auto px-4 py-8 max-w-6xl grid grid-cols-1 md:grid-cols-4 gap-6'>
      {/* Barra Lateral de Conversaciones (RSC) */}
      <aside className='rounded-2xl border border-border/60 bg-card p-4 flex flex-col h-[75vh]'>
        <div className='flex items-center justify-between pb-4 border-b border-border/40'>
          <h2 className='font-frances font-bold text-base text-foreground'>
            Historial de Consultas
          </h2>
          <Link
            href='/chat'
            className={cn(
              buttonVariants({ size: 'sm' }),
              'gap-1 text-xs flex items-center'
            )}
          >
            <Plus className='w-3.5 h-3.5' />
            Nuevo
          </Link>
        </div>

        <div className='flex-1 overflow-y-auto pt-3 space-y-1.5'>
          {conversations.length === 0 ? (
            <p className='text-xs text-muted-foreground text-center pt-8'>
              No tienes consultas previas. ¡Empieza una nueva!
            </p>
          ) : (
            conversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/chat/${conv.id}`}
                className='flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition truncate'
              >
                <MessageSquare className='w-4 h-4 shrink-0 text-primary' />
                <span className='truncate'>{conv.title}</span>
              </Link>
            ))
          )}
        </div>
      </aside>

      {/* Área Principal de Chat (RSC) */}
      <main className='md:col-span-3 rounded-2xl border border-border/60 bg-card p-6 flex flex-col items-center justify-center text-center'>
        <div className='max-w-md space-y-6'>
          <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-sm'>
            <Bot className='h-8 w-8' />
          </div>

          <div className='space-y-2'>
            <h1 className='font-frances text-2xl sm:text-3xl font-bold text-foreground'>
              ¡Hola, {user.firstName || user.name || 'Estudiante'}!
            </h1>
            <p className='text-sm text-muted-foreground font-exo'>
              ¿En qué puedo ayudarte hoy sobre la Universidad Señor de Sipán?
            </p>
          </div>

          {/* Modelos de IA Disponibles */}
          {aiModels.length > 0 && (
            <div className='flex flex-wrap items-center justify-center gap-2 pt-2'>
              {aiModels.map((model) => (
                <span
                  key={model.id}
                  className='inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-xs text-muted-foreground font-medium'
                >
                  <Sparkles className='w-3 h-3 text-primary' />
                  {model.name}
                </span>
              ))}
            </div>
          )}

          {/* Preguntas Sugeridas Rápidas */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-left'>
            <button className='rounded-xl border border-border/50 bg-background/50 p-3 text-xs text-foreground hover:border-primary/50 transition'>
              📋 ¿Cuál es el cronograma de matrícula del semestre actual?
            </button>
            <button className='rounded-xl border border-border/50 bg-background/50 p-3 text-xs text-foreground hover:border-primary/50 transition'>
              🎓 ¿Cuáles son los requisitos de graduación y titulación?
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
