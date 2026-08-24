import type { Metadata } from 'next'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/session'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MessageSquare, Sparkles, BookOpen, ShieldCheck, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Inicio • Inteligencia Artificial Universitaria USS',
  description: 'Asistente inteligente con RAG para consultas sobre matrículas, reglamentos, trámites y vida académica en la Universidad Señor de Sipán.',
}

export default async function HomePage() {
  const user = await getCurrentUser()

  return (
    <main className='flex flex-col items-center justify-center px-4 py-16 sm:py-24 max-w-5xl mx-auto text-center'>
      {/* Badge de Versión */}
      <div className='inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-8'>
        <Sparkles className='w-3.5 h-3.5' />
        <span>SipánGPT v2.0 • IA Especializada para la USS</span>
      </div>

      {/* Título Principal con Fraunces */}
      <h1 className='font-frances text-4xl sm:text-6xl font-bold tracking-tight text-foreground max-w-3xl leading-tight sm:leading-tight mb-6'>
        Tu Asistente Inteligente para la <span className='text-primary'>Universidad Señor de Sipán</span>
      </h1>

      {/* Párrafo Descriptivo con Exo 2 */}
      <p className='font-exo text-lg sm:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed'>
        Resuelve dudas sobre carreras, trámites académicos, cronogramas y reglamentos universitarios en segundos mediante inteligencia artificial y RAG con citas oficiales.
      </p>

      {/* Botones de Llamado a la Acción */}
      <div className='flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mb-16'>
        <Link
          href={user ? '/chat' : '/login'}
          className={cn(
            buttonVariants({ variant: 'default', size: 'lg' }),
            'w-full sm:w-auto gap-2 font-semibold text-base h-12 px-8 flex items-center justify-center'
          )}
        >
          <MessageSquare className='w-5 h-5' />
          {user ? 'Ir al Chat' : 'Comenzar Ahora'}
        </Link>
        <a
          href='#caracteristicas'
          className={cn(
            buttonVariants({ variant: 'outline', size: 'lg' }),
            'w-full sm:w-auto text-base h-12 px-8 flex items-center justify-center'
          )}
        >
          Conoce Más
        </a>
      </div>

      {/* Cuadrícula de Características */}
      <div id='caracteristicas' className='grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-left pt-12 border-t border-border/50'>
        <div className='rounded-2xl border border-border/60 bg-card p-6 shadow-sm'>
          <div className='w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4'>
            <BookOpen className='w-5 h-5' />
          </div>
          <h3 className='font-frances font-bold text-lg mb-2 text-foreground'>Base de Conocimiento RAG</h3>
          <p className='text-muted-foreground text-sm leading-relaxed'>
            Respuestas fundamentadas en documentos, reglamentos y guías oficiales de la universidad con enlaces directos a las fuentes.
          </p>
        </div>

        <div className='rounded-2xl border border-border/60 bg-card p-6 shadow-sm'>
          <div className='w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4'>
            <Zap className='w-5 h-5' />
          </div>
          <h3 className='font-frances font-bold text-lg mb-2 text-foreground'>Respuestas Instantáneas</h3>
          <p className='text-muted-foreground text-sm leading-relaxed'>
            Streaming en tiempo real de alta velocidad optimizado tanto con modelos locales de alto rendimiento como APIs cloud.
          </p>
        </div>

        <div className='rounded-2xl border border-border/60 bg-card p-6 shadow-sm'>
          <div className='w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4'>
            <ShieldCheck className='w-5 h-5' />
          </div>
          <h3 className='font-frances font-bold text-lg mb-2 text-foreground'>Acceso Seguro Institucional</h3>
          <p className='text-muted-foreground text-sm leading-relaxed'>
            Autenticación unificada mediante Google OAuth y gestión segura de sesiones por roles para estudiantes y docentes.
          </p>
        </div>
      </div>
    </main>
  )
}
