'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { HomeIcon, ArrowLeftIcon } from '@radix-ui/react-icons'

const shortTitle = 'Página no encontrada 🤔'
const description = 'No se ha encontrado esta página, intenta con otra.'
const jhangmez = ' | SipánGPT'
const title = `${shortTitle}${jhangmez}`
const imageUrl = `https://jhangmez.vercel.app/api/og2?title=${shortTitle}&description=${description}`

export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'article',
    url: 'https://sipangpt.xyz/',
    images: [{ url: imageUrl }]
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [imageUrl]
  }
}

export default function NotFound() {
  const router = useRouter()
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
          <Button
            onClick={() => router.push('/')}
            className='flex items-center justify-center gap-2 w-full font-semibold'
          >
            <HomeIcon className='w-4 h-4' />
            Ir a Inicio
          </Button>
          <Button
            onClick={() => router.back()}
            variant='outline'
            className='flex items-center justify-center gap-2 w-full font-semibold'
          >
            <ArrowLeftIcon className='w-4 h-4' />
            Regresar
          </Button>
        </div>
      </div>
    </main>
  )
}
