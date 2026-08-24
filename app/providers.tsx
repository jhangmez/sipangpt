'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SessionProvider } from 'next-auth/react'
import { MultiTabAuthSync } from '@/components/providers/multi-tab-auth-sync'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <SessionProvider refetchOnWindowFocus={true}>
      <MultiTabAuthSync />
      <NextThemesProvider {...props}>
        <TooltipProvider>{children}</TooltipProvider>
      </NextThemesProvider>
    </SessionProvider>
  )
}
