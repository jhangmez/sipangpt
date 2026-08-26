'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'

interface SettingsHeaderProps {
  title?: string
  subtitle?: string
}

export function SettingsHeader({
  title = 'Configuraciones',
  subtitle = 'Cuenta y Preferencias USS'
}: SettingsHeaderProps) {
  return (
    <header className='relative flex items-center justify-between border-b border-border/40 pb-3 px-4 shrink-0 font-exo'>
      {/* Lado Izquierdo: Sidebar Trigger y Texto "Configuraciones" */}
      <div className='flex items-center gap-2.5 z-10'>
        <SidebarTrigger className='-ml-1 h-8 w-8 rounded-xl' />
        <div className='h-4 w-px bg-border/60' />
        <span className='font-frances font-bold text-sm text-foreground tracking-tight'>
          {title}
        </span>
      </div>

      {/* Lado Derecho: Cuenta y Preferencias USS */}
      <div className='text-xs text-muted-foreground font-exo hidden sm:block z-10'>
        {subtitle}
      </div>
    </header>
  )
}
