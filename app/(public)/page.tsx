import type { Metadata } from 'next'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/session'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Scale,
  BookOpen
} from 'lucide-react'
import { HeroPreviewChat } from '@/components/landing/hero-preview-chat'
import { IndexedDocumentsStrip } from '@/components/landing/indexed-documents-strip'
import { StairArchitectureSection } from '@/components/landing/stair-architecture-section'
import { BenchmarkEvidenceSection } from '@/components/landing/benchmark-evidence-section'
import { ArchetypeSelectorSection } from '@/components/landing/archetype-selector-section'
import { FinalCtaSection } from '@/components/landing/final-cta-section'

export const metadata: Metadata = {
  title: 'SipánGPT • Asistente Virtual Universitario USS con IA & RAG',
  description:
    'Asistente oficial con arquitectura Sipán-STAIR RAG fundamentado en los 13 reglamentos y manuales vigentes de la Universidad Señor de Sipán. Respuestas precisas sobre matrícula, pagos, grados y vida académica.',
}

export default async function HomePage() {
  const user = await getCurrentUser()

  return (
    <main className='w-full'>
      {/* ======================================================== */}
      {/* 1. SECCIÓN HERO ASIMÉTRICO (SPLIT HERO PRODUCT PREVIEW) */}
      {/* ======================================================== */}
      <section className='relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 border-b border-border/40'>
        {/* Gradientes ambientales sutiles de fondo */}
        <div className='absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[520px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent pointer-events-none -z-10 blur-3xl opacity-70 dark:opacity-40' />

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center'>
            {/* Columna Izquierda: Narrativa y Copywriting Directo (6 columnas) */}
            <div className='lg:col-span-6 flex flex-col items-start text-left space-y-6'>
              {/* Badge de Rigor Académico y Alcance */}
              <div className='inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary font-exo shadow-2xs'>
                <Sparkles className='w-3.5 h-3.5' />
                <span>Arquitectura RAG Sipán-STAIR • 13 Manuales USS</span>
              </div>

              {/* Titular Principal con Fraunces */}
              <h1 className='font-frances text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.12]'>
                Tus trámites, matrículas y reglamentos USS.{' '}
                <span className='text-primary italic font-serif block sm:inline'>
                  Citados con rigor fáctico.
                </span>
              </h1>

              {/* Párrafo Descriptivo con Exo 2 */}
              <p className='font-exo text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl'>
                La plataforma de IA universitaria desarrollada para responder tus dudas sobre
                fechas de pago, matrícula extemporánea, inasistencias y requisitos de grados y
                títulos con el número de artículo exacto y enlace directo a los 13 reglamentos
                oficiales de la <strong>Universidad Señor de Sipán</strong>.
              </p>

              {/* Botones de Acción (CTAs) */}
              <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto pt-2'>
                <Link
                  href={user ? '/chat' : '/login'}
                  className={cn(
                    buttonVariants({ variant: 'default', size: 'lg' }),
                    'h-12 px-7 font-semibold text-sm sm:text-base gap-2 shadow-md hover:shadow-lg transition-all flex items-center justify-center font-exo'
                  )}
                >
                  <MessageSquare className='w-4 h-4' />
                  <span>{user ? 'Continuar en el Chat' : 'Iniciar Consulta Gratuita'}</span>
                  <ArrowRight className='w-4 h-4 ml-0.5' />
                </Link>

                <a
                  href='#documentos-indexados'
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'lg' }),
                    'h-12 px-6 text-sm sm:text-base border-border/80 hover:bg-muted/60 transition-colors flex items-center justify-center font-exo'
                  )}
                >
                  <BookOpen className='w-4 h-4 mr-2 text-primary' />
                  <span>Ver 13 Reglamentos</span>
                </a>
              </div>

              {/* Indicadores de Confianza y Alcance en Tiempo Real */}
              <div className='pt-6 border-t border-border/60 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full font-exo'>
                <div className='space-y-0.5'>
                  <div className='font-frances text-2xl font-bold text-foreground'>13</div>
                  <div className='text-xs text-muted-foreground leading-snug'>
                    Reglamentos y manuales USS
                  </div>
                </div>
                <div className='space-y-0.5'>
                  <div className='font-frances text-2xl font-bold text-primary'>99.0%</div>
                  <div className='text-xs text-muted-foreground leading-snug'>
                    Exactitud Fáctica (Tesis UNPRG)
                  </div>
                </div>
                <div className='space-y-0.5'>
                  <div className='font-frances text-2xl font-bold text-emerald-500'>0.0%</div>
                  <div className='text-xs text-muted-foreground leading-snug'>
                    Alucinaciones (Cuarta Tanda)
                  </div>
                </div>
                <div className='space-y-0.5'>
                  <div className='font-frances text-2xl font-bold text-foreground'>100%</div>
                  <div className='text-xs text-muted-foreground leading-snug'>
                    Citas con enlace oficial
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Live Product Preview (6 columnas) */}
            <div className='lg:col-span-6 w-full'>
              <HeroPreviewChat />
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. SECCIÓN: POR QUÉ LA ESTRUCTURA IMPORTA (STAIR)        */}
      {/* ======================================================== */}
      <StairArchitectureSection />

      {/* ======================================================== */}
      {/* 3. SECCIÓN: LOS 13 DOCUMENTOS OFICIALES INDEXADOS        */}
      {/* ======================================================== */}
      <IndexedDocumentsStrip />

      {/* ======================================================== */}
      {/* 4. SECCIÓN: ARQUETIPOS DE LA COMUNIDAD USS               */}
      {/* ======================================================== */}
      <ArchetypeSelectorSection />

      {/* ======================================================== */}
      {/* 5. SECCIÓN: EVIDENCIA CIENTÍFICA & BENCHMARK UNPRG       */}
      {/* ======================================================== */}
      <BenchmarkEvidenceSection />

      {/* ======================================================== */}
      {/* 6. SECCIÓN FINAL CTA BANNER                              */}
      {/* ======================================================== */}
      <FinalCtaSection isLoggedIn={Boolean(user)} />

      {/* ======================================================== */}
      {/* 7. AVISO DE TRANSPARENCIA & PROYECTO DE INVESTIGACIÓN    */}
      {/* ======================================================== */}
      <section className='w-full py-12 bg-muted/20 border-t border-border/40 font-exo'>
        <div className='max-w-4xl mx-auto px-4 text-center space-y-2 text-xs text-muted-foreground'>
          <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border/60 text-foreground font-semibold mb-1'>
            <Scale className='w-3.5 h-3.5 text-primary' />
            <span>Transparencia y Naturaleza Académica</span>
          </div>
          <p>
            <strong>SipánGPT</strong> es un proyecto de tesis de ingeniería de sistemas e investigación
            científica de la Universidad Nacional Pedro Ruiz Gallo (UNPRG) aplicado a la Universidad Señor de Sipán (USS).
          </p>
          <p>
            Las marcas y nombres institucionales son propiedad de sus respectivos titulares. Las respuestas se
            fundamentan exclusivamente en los reglamentos de acceso público de la USS.{' '}
            <Link href='/terms' className='text-primary underline font-semibold hover:text-primary/80'>
              Consulta nuestros Términos de Uso, Privacidad y Auditoría
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  )
}
