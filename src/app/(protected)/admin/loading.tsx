import { Loader2 } from 'lucide-react'
export default function Loading() {
  return (
    <section className='flex flex-col items-center justify-center min-w-full min-h-screen bg-background'>
      <h1 className='mb-4 text-3xl font-bold text-primary font-frances'>
        SipánGPT
      </h1>
      <Loader2 className='h-8 w-8 animate-spin text-primary' />
      <p className='mt-4 text-muted-foreground font-semibold font-exo'>
        Cargando sección...
      </p>
    </section>
  )
}
