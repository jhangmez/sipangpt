import Link from 'next/link'
import { House, ArrowLeft } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

const shortTitle = 'Página no encontrada 🤔'
const description = 'No se ha encontrado esta página, intenta con otra.'
const title = `${shortTitle} | SipánGPT`
const imageUrl = `https://jhangmez.vercel.app/api/og2?title=${encodeURIComponent(shortTitle)}&description=${encodeURIComponent(description)}`

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'article',
    url: 'https://sipangpt.xyz/',
    images: [{ url: imageUrl }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [imageUrl],
  },
}

export default function NotFound() {
  return (
    <main className='flex flex-col items-center justify-center min-h-screen px-4 bg-background'>
      <div className='text-center space-y-5 w-full max-w-md font-exo'>
        <h1 className='text-4xl font-bold text-primary'>404</h1>
        <h2 className='text-2xl font-semibold font-frances'>
          Página no encontrada
        </h2>
        <p className='text-muted-foreground font-semibold'>
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>
        <div className='flex flex-col gap-4 mt-8 w-full'>
          <Link
            href='/'
            className={cn(
              buttonVariants({ variant: 'default' }),
              'flex items-center justify-center gap-2 w-full font-semibold h-10'
            )}
          >
            <House className='w-4 h-4' />
            Ir a Inicio
          </Link>
          <Link
            href='/'
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'flex items-center justify-center gap-2 w-full font-semibold h-10'
            )}
          >
            <ArrowLeft className='w-4 h-4' />
            Regresar
          </Link>
        </div>
      </div>
    </main>
  )
}
