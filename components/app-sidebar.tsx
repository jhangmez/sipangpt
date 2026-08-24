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
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, MessageSquare, Trash2, MoreHorizontal, Clock, Bot, Sparkles } from 'lucide-react'
import { UserSettings } from '@/components/shared/sidebar/user-settings'
import type { SidebarChat } from '@/types/chat'
import type { User } from 'next-auth'

interface AppSidebarProps {
  conversations?: SidebarChat[]
  currentChatId?: string
  user?: (User & { role?: string }) | null
  isLoading?: boolean
  onDeleteChat?: (chatId: string) => Promise<void>
}

export function AppSidebar({
  conversations = [],
  currentChatId,
  user,
  isLoading = false,
  onDeleteChat,
}: AppSidebarProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const handleDelete = async (chatId: string) => {
    setDeletingId(chatId)
    try {
      if (onDeleteChat) {
        await onDeleteChat(chatId)
      } else {
        await fetch(`/api/chat?id=${chatId}`, { method: 'DELETE' })
      }
      router.push('/chat')
      router.refresh()
    } catch (err) {
      console.error('Error al borrar chat:', err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Sidebar collapsible='icon' className='border-r border-border/60 bg-card font-exo'>
      {/* Header Oficial: Logo USS + Botón Nuevo Chat */}
      <SidebarHeader className='p-3 border-b border-border/40'>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href='/chat' />}
              className='flex items-center gap-2.5 font-frances font-bold text-base text-primary'
            >
              <div className='flex h-7 w-7 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs shrink-0'>
                <Bot className='h-4 w-4' />
              </div>
              <span className='group-data-[collapsible=icon]:hidden'>SipánGPT</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem className='group-data-[collapsible=icon]:hidden pt-1'>
            <SidebarMenuButton
              render={<Link href='/chat' />}
              className='flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-background/80 py-2 text-xs font-semibold text-foreground hover:bg-muted transition shadow-xs'
            >
              <Plus className='w-3.5 h-3.5' />
              <span>Nueva Consulta</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content: Historial de Consultas */}
      <SidebarContent className='px-2 py-2'>
        <SidebarGroup>
          <SidebarGroupLabel className='px-2 text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5'>
            <Clock className='w-3.5 h-3.5' />
            <span>Historial</span>
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {conversations.length === 0 ? (
                <div className='px-3 py-6 text-center text-xs text-muted-foreground group-data-[collapsible=icon]:hidden'>
                  Sin consultas previas
                </div>
              ) : (
                conversations.map((chat) => {
                  const isActive = chat.id === currentChatId

                  return (
                    <SidebarMenuItem key={chat.id}>
                      <SidebarMenuButton
                        render={<Link href={`/chat/${chat.id}`} />}
                        isActive={isActive}
                        className='text-xs'
                      >
                        <MessageSquare className='w-3.5 h-3.5 shrink-0 text-primary' />
                        <span className='truncate'>{chat.title}</span>
                      </SidebarMenuButton>

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
                          <DropdownMenuContent align='end' className='w-36 p-1 rounded-xl shadow-lg'>
                            <DialogTrigger className='flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition text-left font-medium'>
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
                              Esta acción no se puede deshacer. Se eliminarán los mensajes y citas de esta consulta.
                            </DialogDescription>
                            <div className='flex justify-end gap-2 pt-3'>
                              <button
                                type='button'
                                onClick={() => handleDelete(chat.id)}
                                disabled={deletingId === chat.id}
                                className='rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition'
                              >
                                {deletingId === chat.id ? 'Eliminando...' : 'Eliminar'}
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
      </SidebarContent>

      {/* Footer: UserSettings Reutilizable */}
      <SidebarFooter className='p-2 border-t border-border/40'>
        <UserSettings user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
