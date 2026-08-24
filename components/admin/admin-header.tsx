'use client'

import * as React from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'

interface AdminHeaderProps {
  title?: string
  subtitle?: string
}

export function AdminHeader({
  title = 'Panel de Administración',
  subtitle = 'Gestión Institucional USS',
}: AdminHeaderProps) {
  return (
    <header className='relative flex items-center justify-between border-b border-border/40 pb-3 px-4 shrink-0 font-exo'>
      {/* Lado Izquierdo: Sidebar Trigger y Título */}
      <div className='flex items-center gap-2.5 z-10'>
        <SidebarTrigger className='-ml-1 h-8 w-8 rounded-xl' />
        <div className='h-4 w-px bg-border/60' />
        <span className='font-frances font-bold text-sm text-foreground tracking-tight'>
          {title}
        </span>
      </div>

      {/* Lado Derecho: Subtítulo Institucional */}
      <div className='text-xs text-muted-foreground font-exo hidden sm:block z-10'>
        {subtitle}
      </div>
    </header>
  )
}
