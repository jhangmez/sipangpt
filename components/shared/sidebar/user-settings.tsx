'use client'

import * as React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
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
  Moon,
  Sun
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { SYSTEM_MODELS } from '@/constants/models'
import { SessionsManager } from '../sessions-manager'
import { useSidebar } from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import type { User as AuthUser } from 'next-auth'
import { performSafeLogout } from '@/lib/auth/multi-tab-sync'

interface UserSettingsProps {
  user?: (AuthUser & { role?: string }) | null
}

export function UserSettings({ user }: UserSettingsProps) {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const [copied, setCopied] = React.useState(false)
  const { theme, setTheme } = useTheme()

  const userDisplayName = user?.name || user?.email?.split('@')[0] || 'Estudiante USS'
  const userEmail = user?.email || 'estudiante@uss.edu.pe'
  const userImage = user?.image || undefined
  const isAdmin = user?.role === 'ADMIN'
  const userRoleLabel = isAdmin ? 'Administrador' : 'Estudiante USS'

  const handleCopyEmail = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(userEmail)
      setCopied(true)
      toast.success('Correo copiado al portapapeles')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('No se pudo copiar el correo')
    }
  }

  const handleSignOut = () => {
    performSafeLogout('/login')
  }

  const triggerContent = (
    <DropdownMenuTrigger
      className={cn(
        'flex items-center gap-3 w-full p-2 rounded-2xl hover:bg-muted/70 transition-colors text-left focus:outline-none cursor-pointer select-none',
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
        <div
          onClick={handleCopyEmail}
          className='flex items-center gap-3 p-2.5 w-full rounded-2xl bg-muted/40 hover:bg-muted/70 transition cursor-pointer text-left group/email mb-1.5 select-none'
          title='Haz clic para copiar el correo'
        >
          <Avatar className='h-9 w-9 rounded-xl border border-border/80 shrink-0'>
            <AvatarImage src={user?.image || undefined} alt={userDisplayName} />
            <AvatarFallback className='rounded-xl font-exo text-xs font-semibold bg-primary/10 text-primary'>
              {userDisplayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className='flex-1 min-w-0 font-exo'>
            <p className='truncate text-xs font-bold text-foreground'>
              {userDisplayName}
            </p>
            <p className='truncate text-[11px] text-muted-foreground group-hover/email:text-primary transition'>
              {userEmail}
            </p>
          </div>
          <div className='ml-auto shrink-0 p-1 text-muted-foreground group-hover/email:text-primary transition'>
            {copied ? (
              <Check className='h-4 w-4 text-emerald-500' />
            ) : (
              <Copy className='h-4 w-4' />
            )}
          </div>
        </div>

        <Separator className='my-1 bg-border/40' />

        {/* Enlace a Configuraciones */}
        <DropdownMenuItem className='p-0'>
          <Link
            href='/configuraciones/usuario'
            className='flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-exo text-foreground hover:bg-muted transition text-left cursor-pointer select-none'
          >
            <Settings className='w-4 h-4 text-primary' />
            Configuraciones
          </Link>
        </DropdownMenuItem>

        {/* Diálogo de Modelos de IA Disponibles */}
        <Dialog>
          <DialogTrigger className='flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-exo text-foreground hover:bg-muted transition text-left cursor-pointer select-none'>
            <Cpu className='w-4 h-4 text-primary' />
            Modelos de Inteligencia Artificial
          </DialogTrigger>
          <DialogContent className='max-w-lg rounded-3xl p-6'>
            <DialogHeader className='space-y-1 font-exo'>
              <DialogTitle className='font-frances text-xl'>
                Modelos Disponibles
              </DialogTitle>
            </DialogHeader>
            <div className='space-y-3 pt-2 font-exo'>
              {SYSTEM_MODELS.map((m) => (
                <div
                  key={m.id}
                  className='rounded-2xl border border-border/70 p-3.5 space-y-1 bg-card/60'
                >
                  <div className='flex items-center justify-between gap-2'>
                    <span className='font-semibold text-xs text-foreground'>
                      {m.name}
                    </span>
                    <span className='rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary'>
                      {m.provider}
                    </span>
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    {m.description}
                  </p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Diálogo Sobre SipánGPT */}
        <Dialog>
          <DialogTrigger className='flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-exo text-foreground hover:bg-muted transition text-left cursor-pointer select-none'>
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
                  Asistente inteligente oficial de la Universidad Señor de Sipán
                  entrenado con base de conocimiento y normativas
                  institucionales.
                </p>
                <p>
                  Desarrollado con arquitectura moderna RAG (Retrieval-Augmented
                  Generation) para responder dudas sobre matrícula, planes de
                  estudio y trámites universitarios.
                </p>
              </div>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        {/* Selector de Modo Noche / Modo Claro Totalmente Clickeable */}
        <button
          type='button'
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className='flex items-center justify-between w-full px-2.5 py-2 text-xs font-exo rounded-xl hover:bg-muted/70 transition cursor-pointer select-none text-left'
        >
          <div className='flex items-center gap-2.5 text-foreground'>
            {theme === 'dark' ? (
              <Moon className='w-4 h-4 text-primary' />
            ) : (
              <Sun className='w-4 h-4 text-amber-500' />
            )}
            <span>Modo Noche</span>
          </div>
          <span className='text-[10px] font-semibold text-muted-foreground uppercase font-mono'>
            {theme === 'dark' ? 'Activado' : 'Desactivado'}
          </span>
        </button>

        {/* Enlace para Administradores (Exclusivo para usuarios con rol ADMIN) */}
        {isAdmin && (
          <>
            <Separator className='my-1 bg-border/40' />
            <DropdownMenuItem className='p-0'>
              <Link
                href='/admin/dashboard'
                className='flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-exo text-primary font-semibold hover:bg-primary/10 transition text-left cursor-pointer select-none'
              >
                <ShieldAlert className='w-4 h-4' />
                Panel de Administrador
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <Separator className='my-1 bg-border/40' />

        {/* Cerrar Sesión */}
        <DropdownMenuItem
          onClick={handleSignOut}
          onSelect={handleSignOut}
          className='flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-exo text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition text-left font-semibold cursor-pointer select-none'
        >
          <LogOut className='w-4 h-4' />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
