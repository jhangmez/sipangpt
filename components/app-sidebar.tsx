'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarRail,
  useSidebar
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  Plus,
  MessageSquare,
  Trash2,
  MoreHorizontal,
  Clock,
  Bot,
  Sparkles
} from 'lucide-react'
import { UserSettings } from '@/components/shared/sidebar/user-settings'
import { toast } from 'sonner'
import type { SidebarChat } from '@/types/chat'
import type { PostItem } from '@/types'
import type { User } from 'next-auth'

interface AppSidebarProps {
  conversations?: SidebarChat[]
  currentChatId?: string
  user?: (User & { role?: string }) | null
  latestPost?: PostItem | null
  isLoading?: boolean
  onDeleteChat?: (chatId: string) => Promise<void>
}

export function AppSidebar({
  conversations = [],
  currentChatId,
  user,
  latestPost,
  isLoading = false,
  onDeleteChat
}: AppSidebarProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const handleDelete = async (chatId: string) => {
    setDeletingId(chatId)
    try {
      if (onDeleteChat) {
        await onDeleteChat(chatId)
      } else {
        const res = await fetch(`/api/chat?id=${chatId}`, { method: 'DELETE' })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData?.error || 'Error al ocultar la conversación')
        }
      }
      toast.success('Conversación ocultada correctamente.')
      if (currentChatId === chatId) {
        router.push('/chat')
      }
      router.refresh()
    } catch (err: unknown) {
      console.error('Error al ocultar chat:', err)
      const msg = err instanceof Error ? err.message : 'Error al ocultar conversación.'
      toast.error(msg)
    } finally {
      setDeletingId(null)
    }
  }


  return (
    <Sidebar
      collapsible='icon'
      className='border-r border-border/60 bg-card font-exo'
    >
      {/* Header Oficial: Logo USS */}
      <SidebarHeader className='p-3 border-b border-border/40 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center'>
        <SidebarMenu>
          <SidebarMenuItem>
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <SidebarMenuButton
                      render={<Link href='/chat' />}
                      className='flex items-center gap-2.5 font-frances font-bold text-base text-primary group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0'
                    >
                      <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs shrink-0'>
                        <Bot className='h-4 w-4' />
                      </div>
                    </SidebarMenuButton>
                  }
                />
                <TooltipContent
                  side='right'
                  align='center'
                  className='font-exo'
                >
                  <p className='font-semibold'>SipánGPT</p>
                  <p className='text-[10px] text-muted-foreground'>
                    Asistente Oficial USS
                  </p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <SidebarMenuButton
                render={<Link href='/chat' />}
                className='flex items-center gap-2.5 font-frances font-bold text-base text-primary'
              >
                <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs shrink-0'>
                  <Bot className='h-4 w-4' />
                </div>
                <span className='group-data-[collapsible=icon]:hidden'>
                  SipánGPT
                </span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content: Historial de Consultas + Botón Nueva Consulta abajo */}
      <SidebarContent className='px-2 py-2 flex flex-col justify-between group-data-[collapsible=icon]:px-1'>
        {/* Sección Superior: Historial */}
        <SidebarGroup className='flex-1 min-h-0 overflow-y-auto'>
          {/* Label de Historial con Tooltip en modo colapsado */}
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <div className='flex items-center justify-center p-2 text-muted-foreground hover:text-foreground transition cursor-default rounded-xl hover:bg-muted/60'>
                    <Clock className='w-4 h-4 text-primary' />
                  </div>
                }
              />
              <TooltipContent side='right' align='center' className='font-exo'>
                <p className='font-semibold'>Historial de Consultas</p>
                <p className='text-[10px] text-muted-foreground'>
                  {conversations.length} consulta(s) previa(s)
                </p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <SidebarGroupLabel className='px-2 text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5'>
              <Clock className='w-3.5 h-3.5' />
              <span>Historial</span>
            </SidebarGroupLabel>
          )}

          <SidebarGroupContent className='pt-1'>
            <SidebarMenu>
              {conversations.length === 0 ? (
                <div className='px-3 py-6 text-center text-xs text-muted-foreground group-data-[collapsible=icon]:hidden'>
                  Sin consultas previas
                </div>
              ) : (
                conversations.map((chat) => {
                  const isActive = chat.id === currentChatId

                  const menuButton = (
                    <SidebarMenuButton
                      render={<Link href={`/chat/${chat.id}`} />}
                      isActive={isActive}
                      className='text-xs group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0'
                    >
                      <MessageSquare className='w-3.5 h-3.5 shrink-0 text-primary' />
                      <span className='truncate group-data-[collapsible=icon]:hidden'>
                        {chat.title}
                      </span>
                    </SidebarMenuButton>
                  )

                  return (
                    <SidebarMenuItem key={chat.id}>
                      {isCollapsed ? (
                        <Tooltip>
                          <TooltipTrigger render={menuButton} />
                          <TooltipContent
                            side='right'
                            align='center'
                            className='max-w-xs font-exo'
                          >
                            <p className='font-semibold line-clamp-2'>
                              {chat.title}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        menuButton
                      )}

                      {/* Acción contextual de eliminar conversación */}
                      <Dialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <SidebarMenuAction showOnHover>
                                <MoreHorizontal className='w-3.5 h-3.5' />
                              </SidebarMenuAction>
                            }
                          />
                          <DropdownMenuContent
                            align='end'
                            className='w-36 p-1 rounded-xl shadow-lg font-exo'
                          >
                            <DialogTrigger className='flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition text-left font-medium cursor-pointer'>
                              <Trash2 className='w-3.5 h-3.5' />
                              Eliminar chat
                            </DialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <DialogContent className='rounded-3xl p-6'>
                          <DialogHeader className='space-y-3 font-exo'>
                            <DialogTitle className='font-frances text-xl'>
                              ¿Eliminar esta conversación?
                            </DialogTitle>
                            <DialogDescription className='text-xs text-muted-foreground'>
                              Esta acción no se puede deshacer. Se eliminarán
                              los mensajes y citas de esta consulta.
                            </DialogDescription>
                            <div className='flex justify-end gap-2 pt-3'>
                              <button
                                type='button'
                                onClick={() => handleDelete(chat.id)}
                                disabled={deletingId === chat.id}
                                className='rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition cursor-pointer'
                              >
                                {deletingId === chat.id
                                  ? 'Eliminando...'
                                  : 'Eliminar'}
                              </button>
                            </div>
                          </DialogHeader>
                        </DialogContent>
                      </Dialog>
                    </SidebarMenuItem>
                  )
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sección Inferior: Card de Novedades USS + Botón Nueva Consulta */}
        <div className='pt-2 border-t border-border/40 space-y-2'>
          {/* Card Pequeño de Novedad / Nuevo Post con enlace directo */}
          {latestPost &&
            (() => {
              const targetHref =
                latestPost.externalUrl || `/posts/${latestPost.slug}`

              return isCollapsed ? (
                <div className='flex justify-center'>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <a
                          href={targetHref}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition cursor-pointer'
                        >
                          <Sparkles className='w-4 h-4' />
                        </a>
                      }
                    />
                    <TooltipContent
                      side='right'
                      align='center'
                      className='font-exo max-w-xs p-3 space-y-1'
                    >
                      <div className='flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase'>
                        <Sparkles className='w-3 h-3' />
                        <span>Nuevo Post</span>
                      </div>
                      <p className='font-semibold text-xs text-foreground'>
                        {latestPost.title}
                      </p>
                      <p className='text-[11px] text-muted-foreground line-clamp-2 leading-tight'>
                        {latestPost.excerpt || latestPost.content}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              ) : (
                <a
                  href={targetHref}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='block rounded-2xl border border-primary/20 bg-primary/5 p-2.5 transition hover:bg-primary/10 select-none group cursor-pointer'
                >
                  <div className='flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wide'>
                    <Sparkles className='w-3 h-3' />
                    <span>Nuevo Post</span>
                  </div>
                  <p className='font-semibold text-xs text-foreground line-clamp-1 mt-1 leading-snug group-hover:text-primary transition-colors'>
                    {latestPost.title}
                  </p>
                  <p className='text-[11px] text-muted-foreground line-clamp-1 mt-0.5 leading-tight'>
                    {latestPost.excerpt || latestPost.content}
                  </p>
                </a>
              )
            })()}

          <SidebarMenu>
            <SidebarMenuItem>
              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <SidebarMenuButton
                        render={<Link href='/chat' />}
                        className='flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-xs group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0 mx-auto'
                      >
                        <Plus className='w-4 h-4 shrink-0' />
                      </SidebarMenuButton>
                    }
                  />
                  <TooltipContent
                    side='right'
                    align='center'
                    className='font-exo'
                  >
                    <p className='font-semibold'>Nueva Consulta</p>
                    <p className='text-[10px] text-muted-foreground'>
                      Iniciar una nueva conversación
                    </p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <SidebarMenuButton
                  render={<Link href='/chat' />}
                  className='flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-2.5 text-xs font-semibold hover:bg-primary/90 transition shadow-xs w-full'
                >
                  <Plus className='w-4 h-4' />
                  <span>Nueva Consulta</span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>

      {/* Footer: UserSettings Reutilizable */}
      <SidebarFooter className='p-2 border-t border-border/40 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center'>
        <UserSettings user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
