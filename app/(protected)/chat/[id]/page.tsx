import type { Metadata } from 'next'
import { requireAuth, getCurrentUser } from '@/lib/session'
import { getConversationById, getUserConversations } from '@/lib/db/conversations'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, Plus, Bot, User as UserIcon } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ChatIdPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ChatIdPageProps): Promise<Metadata> {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return { title: 'Conversación • SipánGPT' }

  const conversation = await getConversationById(id, user.id)
  return {
    title: conversation ? `${conversation.title} • Chat` : 'Conversación • Chat',
    description: 'Consulta y seguimiento conversacional en SipánGPT.',
  }
}

export default async function ChatIdPage({ params }: ChatIdPageProps) {
  const user = await requireAuth()
  const { id } = await params

  const [conversation, conversations] = await Promise.all([
    getConversationById(id, user.id),
    getUserConversations(user.id),
  ])

  if (!conversation) {
    notFound()
  }

  return (
    <div className='flex-1 container mx-auto px-4 py-8 max-w-6xl grid grid-cols-1 md:grid-cols-4 gap-6'>
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
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/chat/${conv.id}`}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition truncate ${
                conv.id === id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <MessageSquare className='w-4 h-4 shrink-0 text-primary' />
              <span className='truncate'>{conv.title}</span>
            </Link>
          ))}
        </div>
      </aside>

      <main className='md:col-span-3 rounded-2xl border border-border/60 bg-card p-6 flex flex-col h-[75vh]'>
        <div className='pb-4 border-b border-border/40'>
          <h1 className='font-frances font-bold text-lg text-foreground truncate'>
            {conversation.title}
          </h1>
        </div>

        <div className='flex-1 overflow-y-auto py-4 space-y-4'>
          {conversation.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-2xl ${
                msg.role === 'USER' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'USER'
                    ? 'bg-primary text-primary-foreground font-bold text-xs'
                    : 'bg-muted text-foreground'
                }`}
              >
                {msg.role === 'USER' ? <UserIcon className='w-4 h-4' /> : <Bot className='w-4 h-4 text-primary' />}
              </div>

              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'USER'
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'bg-muted/60 text-foreground border border-border/40'
                }`}
              >
                <p className='whitespace-pre-wrap'>{msg.content}</p>

                {msg.citations && msg.citations.length > 0 && (
                  <div className='mt-3 pt-2 border-t border-border/50 space-y-1.5'>
                    <span className='text-xs font-semibold text-muted-foreground block'>
                      Fuentes oficiales citadas:
                    </span>
                    {msg.citations.map((citation) => (
                      <a
                        key={citation.id}
                        href={citation.sourceUrl || '#'}
                        target='_blank'
                        rel='noreferrer'
                        className='text-xs text-primary hover:underline block truncate'
                      >
                        📄 {citation.title} {citation.pageNumber ? `(Pág. ${citation.pageNumber})` : ''}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
