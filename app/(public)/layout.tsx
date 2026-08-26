import type * as React from 'react'
import { Navbar } from '@/components/shared/navbar'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='flex min-h-screen flex-col bg-background text-foreground font-exo'>
      <Navbar />
      <div className='flex-1'>{children}</div>
    </div>
  )
}
