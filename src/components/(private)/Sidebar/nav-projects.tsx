'use client'
import { ExternalLink, type LucideIcon } from 'lucide-react'

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar'
import Link from 'next/link'

export function NavProjects({
  projects
}: {
  projects: {
    name: string
    url: string
    icon: LucideIcon
    external?: boolean
  }[]
}) {
  const { isMobile } = useSidebar()
  return (
    <SidebarGroup className='group-data-[collapsible=icon]:hidden font-exo'>
      <SidebarGroupLabel className='font-frances'>Chat</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <Link
                href={item.url}
                target={item.external ? '_blank' : undefined}
              >
                <item.icon />
                <span>{item.name}</span>
                <ExternalLink className='ml-auto' />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
