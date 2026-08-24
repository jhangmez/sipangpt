'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  User,
  Smartphone,
  Cpu,
  Brain,
  ArrowLeft,
  Bot,
  Sliders,
} from 'lucide-react'
import { UserSettings } from '@/components/shared/sidebar/user-settings'
import type { User as AuthUser } from 'next-auth'

interface SettingsSidebarProps {
  user?: (AuthUser & { role?: string }) | null
}

const SETTINGS_NAV_ITEMS = [
  {
    title: 'Perfil de Usuario',
    href: '/configuraciones/usuario',
    icon: User,
    description: 'Datos personales y cuenta',
  },
  {
    title: 'Dispositivos y Sesiones',
    href: '/configuraciones/sesiones',
    icon: Smartphone,
    description: 'Gestión de sesiones activas',
  },
  {
    title: 'Consumo y Tokens',
    href: '/configuraciones/consumo',
    icon: Cpu,
    description: 'Métricas de uso de IA',
  },
  {
    title: 'Recuerdos de IA',
    href: '/configuraciones/memorias',
    icon: Brain,
    description: 'Preferencias y memoria persistente',
  },
]

export function SettingsSidebar({ user }: SettingsSidebarProps) {
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

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
                <TooltipContent side='right' align='center' className='font-exo'>
                  <p className='font-semibold'>SipánGPT</p>
                  <p className='text-[10px] text-muted-foreground'>Configuraciones</p>
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

      {/* Content: Menú de Configuraciones */}
      <SidebarContent className='px-2 py-2 flex flex-col justify-between group-data-[collapsible=icon]:px-1'>
        <SidebarGroup className='flex-1 min-h-0 overflow-y-auto'>
          {/* Label de Sección */}
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <div className='flex items-center justify-center p-2 text-muted-foreground hover:text-foreground transition cursor-default rounded-xl hover:bg-muted/60'>
                    <Sliders className='w-4 h-4 text-primary' />
                  </div>
                }
              />
              <TooltipContent side='right' align='center' className='font-exo'>
                <p className='font-semibold'>Ajustes del Sistema</p>
                <p className='text-[10px] text-muted-foreground'>Opciones y Preferencias</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <SidebarGroupLabel className='px-2 text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5'>
              <Sliders className='w-3.5 h-3.5' />
              <span>Ajustes</span>
            </SidebarGroupLabel>
          )}

          <SidebarGroupContent className='pt-1'>
            <SidebarMenu>
              {SETTINGS_NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                const menuButton = (
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={isActive}
                    className='text-xs group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0'
                  >
                    <Icon className='w-4 h-4 shrink-0 text-primary' />
                    <span className='truncate group-data-[collapsible=icon]:hidden font-medium'>
                      {item.title}
                    </span>
                  </SidebarMenuButton>
                )

                return (
                  <SidebarMenuItem key={item.href}>
                    {isCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger render={menuButton} />
                        <TooltipContent side='right' align='center' className='font-exo'>
                          <p className='font-semibold'>{item.title}</p>
                          <p className='text-[10px] text-muted-foreground'>{item.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      menuButton
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sección Inferior: Botón Volver al Chat */}
        <div className='pt-2 border-t border-border/40'>
          <SidebarMenu>
            <SidebarMenuItem>
              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <SidebarMenuButton
                        render={<Link href='/chat' />}
                        className='flex items-center justify-center rounded-xl bg-muted text-foreground hover:bg-muted/80 hover:text-primary transition shadow-xs group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0 mx-auto'
                      >
                        <ArrowLeft className='w-4 h-4 shrink-0' />
                      </SidebarMenuButton>
                    }
                  />
                  <TooltipContent side='right' align='center' className='font-exo'>
                    <p className='font-semibold'>Volver al Chat</p>
                    <p className='text-[10px] text-muted-foreground'>Regresar a tus conversaciones</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <SidebarMenuButton
                  render={<Link href='/chat' />}
                  className='flex items-center justify-center gap-2 rounded-xl border border-border/70 bg-muted/60 text-foreground py-2.5 text-xs font-semibold hover:bg-muted hover:text-primary transition shadow-xs w-full'
                >
                  <ArrowLeft className='w-4 h-4' />
                  <span>Volver al Chat</span>
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
