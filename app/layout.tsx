import './globals.css'
import { Toaster } from '@/components/ui/toast'
import { fontExo2, fontFraunces } from './fonts'
import { ThemeProvider } from './providers'
import { TooltipProvider } from '@/components/ui/tooltip'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: 'yes'
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
      <head>
        <meta charSet='UTF-8' />
        <meta name='description' content='SipánGPT Chatbot' />
        <link rel='icon' type='image/svg+xml' href='/favicon.svg' />
        <meta
          property='og:image'
          content='https://jhangmez.vercel.app/api/og2?title=SipánGPT'
        />
        <meta property='og:url' content='https://sipangpt.xyz/' />
        <meta property='og:title' content='SipánGPT Chatbot' />
        <meta
          property='og:description'
          content='SipánGPT, Chatbot prototipo realizado por @jhangmez y la Universidad Señor de Sipán'
        />
      </head>
      <body className='bg-gray-100 dark:bg-background selection:bg-gray-sipan selection:text-primary dark:selection:bg-primary dark:selection:text-background'>
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
