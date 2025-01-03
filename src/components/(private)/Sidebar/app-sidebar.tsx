'use client'
import * as React from 'react'
import { Asterisk, BotMessageSquare, Settings2, ChartBar } from 'lucide-react'
import { useSidebar } from '@/components/ui/sidebar'
import { NavMain } from '@Components/(private)/Sidebar/nav-main'
import { NavProjects } from '@Components/(private)/Sidebar/nav-projects'
import { NavUser } from '@Components/(private)/Sidebar/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from '@/components/ui/sidebar'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

const data = {
  user: {
    name: 'Administrador',
    email: 'admin@admin.com',
    avatar: '/avatars/user_picture.webp'
  },
  navMain: [
    {
      title: 'Datos',
      url: '#',
      icon: ChartBar,
      isActive: true,
      items: [
        {
          title: 'Resumen',
          url: '/admin/dashboard'
        },
        {
          title: 'Tiempo real',
          url: '/admin/tiemporeal'
        },
        {
          title: 'Feedback',
          url: '/admin/feedback'
        }
      ]
    },
    {
      title: 'Gestión',
      url: '#',
      icon: Asterisk,
      items: [
        {
          title: 'Preguntas',
          url: '/admin/preguntas'
        },
        {
          title: 'Personas',
          url: '/admin/personas'
        }
      ]
    },
    {
      title: 'Configuraciones',
      url: '#',
      icon: Settings2,
      items: [
        {
          title: 'Tema',
          url: '/admin/cuenta'
        }
      ]
    }
  ],
  projects: [
    {
      name: 'Ir al Chat',
      url: '/chat',
      external: true,
      icon: BotMessageSquare
    }
  ]
}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar()
  const { data: session } = useSession()
  const user = {
    ...data.user,
    name: session?.user?.name ?? data.user.name,
    email: session?.user?.email ?? data.user.email,
    avatar: session?.user?.image ?? data.user.avatar
  }

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader className='bg-primary'>
        {state === 'expanded' ? (
          <Link
            href={'/admin/dashboard'}
            className='text-2xl h-12 font-bold font-frances text-gray-sipan  flex items-center gap-1.5 mx-2'
          >
            SipánGPT{' '}
            <span className='font-exo rounded-xl select-none font-xs px-1.5 py-0.5 text-xs uppercase text-yellow-800 font-bold bg-yellow-500'>
              Beta
            </span>
          </Link>
        ) : (
          <Link
            href={'/admin/dashboard'}
            className='text-2xl h-12 font-bold font-frances text-gray-sipan  flex items-center gap-1.5 mx-2'
          >
            S
          </Link>
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
