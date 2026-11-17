import * as React from 'react'
import Link from 'next/link'
import {
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Sparkles,
  Lock,
  Clock,
  FileCheck
} from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FinalCtaSectionProps {
  isLoggedIn?: boolean
}

export function FinalCtaSection({ isLoggedIn }: FinalCtaSectionProps) {
  return (
    <section className='w-full py-16 sm:py-24 border-t border-border/50 relative overflow-hidden bg-gradient-to-b from-background via-muted/20 to-background'>
      {/* Resplandor decorativo de fondo */}
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[320px] bg-primary/10 blur-[100px] rounded-full pointer-events-none -z-10' />

      <div className='max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8 font-exo'>
        {/* Badge */}
        <div className='inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary shadow-2xs'>
          <Sparkles className='w-3.5 h-3.5' />
          <span>Acceso Inmediato para Estudiantes, Egresados y Docentes USS</span>
        </div>

        {/* Título de Cierre en Fraunces */}
        <div className='space-y-4 max-w-3xl mx-auto'>
          <h2 className='font-frances text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight'>
            ¿Listo para resolver tus consultas universitarias sin rodeos ni alucinaciones?
          </h2>
          <p className='text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl mx-auto'>
            Olvídate de buscar en PDFs de cientos de páginas o esperar en ventanillas académicas.
            Pregúntale a SipánGPT y obtén el artículo exacto en segundos.
          </p>
        </div>

        {/* Acciones Principales */}
        <div className='flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2'>
          <Link
            href={isLoggedIn ? '/chat' : '/login'}
            className={cn(
              buttonVariants({ size: 'lg' }),
              'h-12 px-8 font-semibold text-sm sm:text-base gap-2 shadow-md hover:shadow-lg transition-all w-full sm:w-auto font-exo'
            )}
          >
            <MessageSquare className='w-4 h-4' />
            <span>{isLoggedIn ? 'Abrir Asistente Conversacional' : 'Comenzar a Consultar Gratis'}</span>
            <ArrowRight className='w-4 h-4' />
          </Link>

          <Link
            href='/terms'
            className={cn(
              buttonVariants({ variant: 'outline', size: 'lg' }),
              'h-12 px-7 text-sm sm:text-base border-border/80 hover:bg-muted/60 transition-colors w-full sm:w-auto font-exo'
            )}
          >
            <ShieldCheck className='w-4 h-4 mr-2 text-primary' />
            <span>Términos y Privacidad</span>
          </Link>
        </div>

        {/* 3 Garantías en Tarjetas Compactas */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-border/50 text-left'>
          <div className='p-4 rounded-xl border border-border/70 bg-card/70 space-y-2 shadow-2xs'>
            <div className='flex items-center gap-2 text-primary font-semibold text-xs'>
              <BookOpen className='w-4 h-4' />
              <span>13 Reglamentos Indexados</span>
            </div>
            <p className='text-xs text-muted-foreground leading-relaxed'>
              Matrícula, cobranzas, grados y títulos, inasistencias y manuales de campus virtual activos.
            </p>
          </div>

          <div className='p-4 rounded-xl border border-border/70 bg-card/70 space-y-2 shadow-2xs'>
            <div className='flex items-center gap-2 text-primary font-semibold text-xs'>
              <FileCheck className='w-4 h-4' />
              <span>100% Citas Fácticas</span>
            </div>
            <p className='text-xs text-muted-foreground leading-relaxed'>
              Cada respuesta incluye el número de artículo legal y enlace directo para abrir el PDF oficial.
            </p>
          </div>

          <div className='p-4 rounded-xl border border-border/70 bg-card/70 space-y-2 shadow-2xs'>
            <div className='flex items-center gap-2 text-primary font-semibold text-xs'>
              <Lock className='w-4 h-4' />
              <span>Privacidad Garantizada</span>
            </div>
            <p className='text-xs text-muted-foreground leading-relaxed'>
              No solicitamos contraseñas del campus. Autenticación unificada y segura con Google OAuth.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
