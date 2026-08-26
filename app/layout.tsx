import './globals.css'
import type * as React from 'react'
import { Toaster } from '@/components/ui/sonner'
import { fontExo2, fontFraunces } from './fonts'
import { ThemeProvider } from './providers'
import { TooltipProvider } from '@/components/ui/tooltip'

import type { Metadata } from 'next'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: 'yes'
}

export const metadata: Metadata = {
  metadataBase: new URL('https://sipangpt.xyz'),
  title: {
    default: 'SipánGPT | Inteligencia Artificial Universitaria USS',
    template: '%s | SipánGPT - USS',
  },
  description: 'Asistente de inteligencia artificial y base de conocimiento institucional de la Universidad Señor de Sipán.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'SipánGPT | Inteligencia Artificial Universitaria USS',
    description: 'Asistente institucional de la Universidad Señor de Sipán.',
    url: 'https://sipangpt.xyz',
    siteName: 'SipánGPT',
    images: [
      {
        url: 'https://jhangmez.vercel.app/api/og2?title=SipánGPT',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'es_PE',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang='es'
      suppressHydrationWarning
      className={`${fontExo2.variable} ${fontFraunces.variable}`}
    >
      <head />
      <body
        suppressHydrationWarning
        className='bg-gray-100 dark:bg-background selection:bg-gray-sipan selection:text-primary dark:selection:bg-primary dark:selection:text-background'
      >
        <noscript>Página realizada por Jhan Gómez P. @jhangmez</noscript>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <Toaster />
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
