'use client'

import * as React from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { performSafeLogout } from '@/lib/auth/multi-tab-sync'
import {
  ChevronDown,
  MessageSquare,
  ShieldAlert,
  Sun,
  Moon,
  LogOut,
  LogIn,
  Copy,
  Check
} from 'lucide-react'
import { toast } from 'sonner'

interface UserButtonProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string | null
  } | null
}

export function UserButton({ user }: UserButtonProps) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!user) {
    return (
      <Link
        href='/login'
        className={cn(
          buttonVariants({ variant: 'default', size: 'sm' }),
          'gap-1.5 font-exo font-semibold text-xs px-4 h-9 rounded-xl shadow-xs'
        )}
      >
        <LogIn className='w-3.5 h-3.5' />
        <span>Iniciar Sesión</span>
      </Link>
    )
  }

  const userDisplayName =
    user.name || user.email?.split('@')[0] || 'Estudiante USS'
  const userEmail = user.email || 'Sin correo asociado'
  const isAdmin = user.role === 'ADMIN'
  const currentTheme = mounted ? (resolvedTheme || theme) : 'dark'

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user.email) return
    navigator.clipboard.writeText(user.email)
    setCopied(true)
    toast.success('Correo copiado al portapapeles')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleToggleTheme = () => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark')
  }

  const handleSignOut = () => {
    performSafeLogout('/')
  }

  return (
    <DropdownMenu>
      {/* Botón Trigger: Avatar + Chevron Abajo */}
      <DropdownMenuTrigger
        className={cn(
          'group flex items-center gap-1.5 p-1 pl-1 pr-2 rounded-full border border-border/70',
          'bg-background/80 hover:bg-muted/60 hover:border-border transition-all duration-200',
          'cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
        )}
        aria-label='Menú de perfil de usuario'
      >
        <Avatar className='h-7 w-7 rounded-full border border-border/80 shrink-0'>
          {user.image ? (
            <AvatarImage src={user.image} alt={userDisplayName} />
          ) : null}
          <AvatarFallback className='text-[10px] font-bold bg-primary/10 text-primary font-exo'>
            {userDisplayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <ChevronDown className='w-3.5 h-3.5 text-muted-foreground group-data-popup-open:rotate-180 transition-transform duration-200' />
      </DropdownMenuTrigger>

      {/* Contenido del Dropdown */}
      <DropdownMenuContent
        align='end'
        sideOffset={8}
        className='w-72 p-2 rounded-2xl border border-border/80 shadow-xl font-exo bg-popover/95 backdrop-blur-md'
      >
        {/* Encabezado Superior: Perfil, Nombre, Correo y Rol */}
        <div
          onClick={handleCopyEmail}
          className='flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border/40 transition cursor-pointer select-none text-left group/email'
          title='Haz clic para copiar tu correo institucional'
        >
          <Avatar className='h-9 w-9 rounded-xl border border-border/80 shrink-0'>
            {user.image ? (
              <AvatarImage src={user.image} alt={userDisplayName} />
            ) : null}
            <AvatarFallback className='rounded-xl font-exo text-xs font-semibold bg-primary/10 text-primary'>
              {userDisplayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center justify-between gap-1'>
              <p className='truncate text-xs font-bold text-foreground'>
                {userDisplayName}
              </p>
              {isAdmin && (
                <span className='rounded-md bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary shrink-0'>
                  ADMIN
                </span>
              )}
            </div>
            <p className='truncate text-[11px] text-muted-foreground group-hover/email:text-primary transition'>
              {userEmail}
            </p>
          </div>
          <div className='shrink-0 p-1 text-muted-foreground group-hover/email:text-primary transition'>
            {copied ? (
              <Check className='h-3.5 w-3.5 text-emerald-500' />
            ) : (
              <Copy className='h-3.5 w-3.5 opacity-60' />
            )}
          </div>
        </div>

        <DropdownMenuSeparator className='my-1.5 bg-border/40' />

        {/* Opción: Ir al Chat */}
        <DropdownMenuItem className='p-0 rounded-xl'>
          <Link
            href='/chat'
            className='flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-exo text-foreground hover:bg-muted transition text-left cursor-pointer select-none'
          >
            <div className='flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0'>
              <MessageSquare className='w-4 h-4' />
            </div>
            <div className='flex flex-col'>
              <span className='font-semibold text-foreground'>Ir al Chatbot</span>
              <span className='text-[10px] text-muted-foreground'>
                Interactuar con SipánGPT STAIR
              </span>
            </div>
          </Link>
        </DropdownMenuItem>

        {/* Opción: Panel Administrador (Solo si es ADMIN) */}
        {isAdmin && (
          <DropdownMenuItem className='p-0 rounded-xl'>
            <Link
              href='/admin/dashboard'
              className='flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-exo text-primary font-semibold hover:bg-primary/10 transition text-left cursor-pointer select-none'
            >
              <div className='flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary shrink-0'>
                <ShieldAlert className='w-4 h-4' />
              </div>
              <div className='flex flex-col'>
                <span>Panel de Administrador</span>
                <span className='text-[10px] text-primary/70 font-normal'>
                  Métricas, modelos y RAG
                </span>
              </div>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className='my-1.5 bg-border/40' />

        {/* Opción: Selector Día / Noche */}
        <button
          type='button'
          onClick={handleToggleTheme}
          className='flex items-center justify-between w-full px-2.5 py-2 text-xs font-exo rounded-xl hover:bg-muted/70 transition cursor-pointer select-none text-left'
        >
          <div className='flex items-center gap-2.5 text-foreground'>
            <div className='flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-foreground shrink-0'>
              {currentTheme === 'dark' ? (
                <Sun className='w-4 h-4 text-amber-500' />
              ) : (
                <Moon className='w-4 h-4 text-primary' />
              )}
            </div>
            <div className='flex flex-col'>
              <span className='font-semibold'>
                {currentTheme === 'dark' ? 'Modo Claro' : 'Modo Noche'}
              </span>
              <span className='text-[10px] text-muted-foreground'>
                {currentTheme === 'dark'
                  ? 'Cambiar a interfaz clara'
                  : 'Cambiar a interfaz oscura'}
              </span>
            </div>
          </div>
          <span className='text-[10px] font-semibold text-muted-foreground uppercase font-mono px-1.5 py-0.5 rounded bg-muted'>
            {currentTheme === 'dark' ? 'Oscuro' : 'Claro'}
          </span>
        </button>

        <DropdownMenuSeparator className='my-1.5 bg-border/40' />

        {/* Opción: Cerrar Sesión */}
        <DropdownMenuItem
          onClick={handleSignOut}
          onSelect={handleSignOut}
          className='flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-exo text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition text-left font-semibold cursor-pointer select-none'
        >
          <div className='flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0'>
            <LogOut className='w-4 h-4' />
          </div>
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
