'use client'
import * as React from 'react'
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  BotMessageSquare,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  ChartBar,
  SquareTerminal
} from 'lucide-react'
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
// This is sample data.
const data = {
  user: {
    name: 'Jhan Gómez',
    email: 'jhangmez.pe@gmail.com',
    avatar: '/avatars/jhan.webp'
  },
  teams: [
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise'
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup'
    },
    {
      name: 'Evil Corp.',
      logo: Command,
      plan: 'Free'
    }
  ],
  navMain: [
    {
      title: 'Datos',
      url: '#',
      icon: ChartBar,
      isActive: true,
      items: [
        {
          title: 'Resumen',
          url: '#'
        },
        {
          title: 'Tiempo real',
          url: '#'
        },
        {
          title: 'Feedback',
          url: '#'
        }
      ]
    },
    {
      title: 'Valores predefinidos',
      url: '#',
      icon: BookOpen,
      items: [
        {
          title: 'Preguntas',
          url: '#'
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
          url: '#'
        }
      ]
    }
  ],
  projects: [
    {
      name: 'Ir al Chat',
      url: '/chat',
      icon: BotMessageSquare
    }
  ]
}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader className='bg-primary'>
        <Link
          href={'/admin/dashboard'}
          className='text-2xl h-12 font-bold font-frances text-gray-sipan  flex items-center gap-1.5 mx-2'
        >
          SipánGPT{' '}
          <span className='font-exo rounded-xl select-none font-xs px-1.5 py-0.5 text-xs uppercase text-yellow-800 font-bold bg-yellow-500'>
            Beta
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
