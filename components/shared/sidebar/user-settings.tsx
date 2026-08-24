'use client'

import * as React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { signOut } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Settings,
  Sparkles,
  Info,
  ChevronUp,
  Cpu,
  LogOut,
  ShieldAlert,
  Smartphone,
  Copy,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { SYSTEM_MODELS } from '@/constants/models'
import { SessionsManager } from '../sessions-manager'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { useSidebar } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { User } from 'next-auth'

interface UserSettingsProps {
  user?: (User & { role?: string }) | null
}

export function UserSettings({ user }: UserSettingsProps) {
  const isAdmin = user?.role === 'ADMIN'
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const [copied, setCopied] = React.useState(false)

  const userDisplayName = user?.name || 'Estudiante USS'
  const userEmail = user?.email || 'estudiante@uss.edu.pe'
  const userRoleLabel = isAdmin ? 'Administrador' : 'Estudiante USS'

  const handleCopyEmail = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(userEmail)
    setCopied(true)
    toast.success('Correo copiado al portapapeles')
    setTimeout(() => setCopied(false), 2000)
  }

  const triggerContent = (
    <DropdownMenuTrigger
      className={cn(
        'flex items-center gap-3 w-full p-2 rounded-2xl hover:bg-muted/70 transition-colors text-left focus:outline-none cursor-pointer',
        'group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full'
      )}
      aria-label='Configuración de usuario'
    >
      <Avatar className='h-8 w-8 rounded-xl border border-border/80 shrink-0'>
        <AvatarImage src={user?.image || undefined} alt={userDisplayName} />
        <AvatarFallback className='rounded-xl font-exo text-xs font-semibold bg-primary/10 text-primary'>
          {userDisplayName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className='flex-1 min-w-0 font-exo group-data-[collapsible=icon]:hidden'>
        <p className='truncate text-xs font-bold text-foreground'>
          {userDisplayName}
        </p>
        <div className='flex items-center gap-1.5 pt-0.5'>
          {isAdmin ? (
            <span className='rounded-md bg-primary/15 px-1.5 py-0.2 text-[9px] font-bold text-primary shrink-0'>
              ADMIN
            </span>
          ) : (
            <span className='text-[10px] text-muted-foreground truncate'>
              {userRoleLabel}
            </span>
          )}
        </div>
      </div>

      <ChevronUp className='w-4 h-4 text-muted-foreground shrink-0 group-data-[collapsible=icon]:hidden' />
    </DropdownMenuTrigger>
  )

  return (
    <DropdownMenu>
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger render={triggerContent} />
          <TooltipContent side='right' align='center' className='font-exo'>
            <p className='font-semibold'>{userDisplayName}</p>
            <p className='text-[10px] text-muted-foreground'>{userRoleLabel}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        triggerContent
      )}

      <DropdownMenuContent
        className='w-64 p-2 rounded-2xl border border-border/80 shadow-xl font-exo'
        align={isCollapsed ? 'center' : 'start'}
        side={isCollapsed ? 'right' : 'top'}
        sideOffset={12}
      >
        {/* Cabecera con Avatar, Nombre y Correo clickeable para copiar */}
        <button
          type='button'
          onClick={handleCopyEmail}
          className='flex items-center gap-3 p-2 w-full rounded-xl bg-muted/40 hover:bg-muted/70 transition cursor-pointer text-left group/email mb-1.5'
          title='Haz clic para copiar el correo'
        >
          <Avatar className='h-9 w-9 rounded-xl border border-border/80 shrink-0'>
            <AvatarImage src={user?.image || undefined} alt={userDisplayName} />
            <AvatarFallback className='rounded-xl font-exo text-xs font-semibold bg-primary/10 text-primary'>
              {userDisplayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className='flex-1 min-w-0 font-exo'>
            <div className='flex items-center gap-1.5'>
              <p className='truncate text-xs font-bold text-foreground'>
                {userDisplayName}
              </p>
              {isAdmin && (
                <span className='rounded-md bg-primary/15 px-1.5 py-0.2 text-[9px] font-bold text-primary shrink-0'>
                  ADMIN
                </span>
              )}
            </div>
            <p className='truncate text-[11px] text-muted-foreground group-hover/email:text-primary transition flex items-center gap-1'>
              <span className='truncate'>{userEmail}</span>
              {copied ? (
                <Check className='h-3 w-3 text-emerald-500 shrink-0' />
              ) : (
                <Copy className='h-3 w-3 opacity-60 group-hover/email:opacity-100 transition shrink-0' />
              )}
            </p>
          </div>
        </button>

        <div className='my-1 border-t border-border/40' />
        {/* Diálogo de Dispositivos y Sesiones Activas */}
        <Dialog>
          <DialogTrigger className='flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-exo text-foreground hover:bg-muted transition text-left'>
            <Smartphone className='w-4 h-4 text-primary' />
            Dispositivos y Sesiones
          </DialogTrigger>
          <DialogContent className='max-w-xl rounded-3xl p-6'>
            <DialogHeader className='space-y-1'>
              <DialogTitle className='font-frances text-xl'>Sesiones y Dispositivos</DialogTitle>
            </DialogHeader>
            <SessionsManager />
          </DialogContent>
        </Dialog>

        {/* Diálogo de Modelos de IA Disponibles */}
        <Dialog>
          <DialogTrigger className='flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-exo text-foreground hover:bg-muted transition text-left'>
            <Cpu className='w-4 h-4 text-primary' />
            Modelos de Inteligencia Artificial
          </DialogTrigger>
          <DialogContent className='max-w-lg rounded-3xl p-6'>
            <DialogHeader className='space-y-1 font-exo'>
              <DialogTitle className='font-frances text-xl'>Modelos Disponibles</DialogTitle>
            </DialogHeader>
            <div className='space-y-3 pt-2 font-exo'>
              {SYSTEM_MODELS.map((m) => (
                <div key={m.id} className='rounded-2xl border border-border/70 p-3.5 space-y-1 bg-card/60'>
                  <div className='flex items-center justify-between gap-2'>
                    <span className='font-semibold text-xs text-foreground'>{m.name}</span>
                    <span className='rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary'>
                      {m.provider}
                    </span>
                  </div>
                  <p className='text-xs text-muted-foreground'>{m.description}</p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Diálogo Sobre SipánGPT */}
        <Dialog>
          <DialogTrigger className='flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-exo text-foreground hover:bg-muted transition text-left'>
            <Info className='w-4 h-4 text-primary' />
            Sobre SipánGPT
          </DialogTrigger>
          <DialogContent className='max-w-md rounded-3xl p-6'>
            <DialogHeader className='space-y-2 font-exo'>
              <DialogTitle className='font-frances text-xl'>
                Sobre <span className='text-primary'>SipánGPT</span>
              </DialogTitle>
              <div className='text-xs space-y-3 text-muted-foreground pt-2'>
                <p>
                  Asistente inteligente oficial de la Universidad Señor de Sipán entrenado con base de conocimiento y normativas institucionales.
                </p>
                <p>
                  Desarrollado con arquitectura moderna RAG (Retrieval-Augmented Generation) para responder dudas sobre matrícula, planes de estudio y trámites universitarios.
                </p>
              </div>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        {/* Selector de Modo Noche / Modo Claro */}
        <div className='flex items-center justify-between px-2.5 py-2 text-xs font-exo rounded-xl hover:bg-muted/60 transition'>
          <span className='text-foreground'>Modo Noche</span>
          <ThemeToggle />
        </div>

        {/* Enlace para Administradores */}
        {isAdmin && (
          <DropdownMenuItem className='p-0'>
            <Link
              href='/admin/dashboard'
              className='flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-exo text-primary font-semibold hover:bg-primary/10 transition text-left'
            >
              <ShieldAlert className='w-4 h-4' />
              Panel de Administrador
            </Link>
          </DropdownMenuItem>
        )}

        <div className='my-1 border-t border-border/40' />

        {/* Cerrar Sesión */}
        <DropdownMenuItem
          onSelect={() => signOut({ redirectTo: '/login' })}
          className='flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-exo text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition text-left font-semibold'
        >
          <LogOut className='w-4 h-4' />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
