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
} from 'lucide-react'
import Link from 'next/link'
import { SYSTEM_MODELS } from '@/constants/models'
import { SessionsManager } from '../sessions-manager'
import type { User } from 'next-auth'

interface UserSettingsProps {
  user?: (User & { role?: string }) | null
}

export function UserSettings({ user }: UserSettingsProps) {
  const isAdmin = user?.role === 'ADMIN'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='flex items-center gap-3 w-full p-2 rounded-2xl hover:bg-muted/70 transition-colors text-left focus:outline-none'>
        <Avatar className='h-9 w-9 rounded-xl border border-border/80'>
          <AvatarImage src={user?.image || undefined} alt={user?.name || 'Usuario'} />
          <AvatarFallback className='rounded-xl font-exo text-xs font-semibold bg-primary/10 text-primary'>
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'USS'}
          </AvatarFallback>
        </Avatar>

        <div className='flex-1 min-w-0 font-exo'>
          <div className='flex items-center gap-1.5'>
            <p className='truncate text-xs font-bold text-foreground'>
              {user?.name || 'Estudiante USS'}
            </p>
            {isAdmin && (
              <span className='rounded-md bg-primary/15 px-1.5 py-0.2 text-[9px] font-bold text-primary'>
                ADMIN
              </span>
            )}
          </div>
          <p className='truncate text-[11px] text-muted-foreground'>
            {user?.email || 'estudiante@uss.edu.pe'}
          </p>
        </div>

        <ChevronUp className='w-4 h-4 text-muted-foreground shrink-0' />
      </DropdownMenuTrigger>

      <DropdownMenuContent className='w-64 p-2 rounded-2xl border border-border/80 shadow-xl' align='start' side='top'>
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
