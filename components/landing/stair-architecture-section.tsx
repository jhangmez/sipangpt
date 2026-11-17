'use client'

import * as React from 'react'
import {
  GitBranch,
  FileCode2,
  CheckCircle2,
  XCircle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Search,
  BookOpen,
  Sparkles,
  Split
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function StairArchitectureSection() {
  const [activeTab, setActiveTab] = React.useState<'traditional' | 'stair'>('stair')

  return (
    <section id='stair' className='w-full py-16 sm:py-24 border-t border-border/50 bg-background'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6'>
        {/* Cabecera de Sección */}
        <div className='text-center max-w-3xl mx-auto space-y-3 mb-12'>
          <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary font-exo'>
            <GitBranch className='w-3.5 h-3.5' />
            <span>Innovación Metodológica • STAIR (IBM Research)</span>
          </div>

          <h2 className='font-frances text-3xl sm:text-4xl font-bold tracking-tight text-foreground'>
            Por qué el RAG tradicional falla en normativas universitarias
          </h2>

          <p className='font-exo text-sm sm:text-base text-muted-foreground leading-relaxed'>
            Los reglamentos no son textos planos. Dividir un documento cada 500 caracteres a mitad
            de una cláusula destruye el contexto. <strong>Sipán-STAIR</strong> indexa preservando la
            jerarquía canónica del documento.
          </p>
        </div>

        {/* Selector de Comparación Interactiva */}
        <div className='flex justify-center mb-8'>
          <div className='inline-flex p-1 rounded-xl bg-muted/60 border border-border/80 font-exo text-xs'>
            <button
              onClick={() => setActiveTab('traditional')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                activeTab === 'traditional'
                  ? 'bg-destructive/15 text-destructive font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <XCircle className='w-4 h-4' />
              <span>RAG Tradicional (Ventanas Ciegas)</span>
            </button>
            <button
              onClick={() => setActiveTab('stair')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                activeTab === 'stair'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Sparkles className='w-4 h-4' />
              <span>Sipán-STAIR (Recuperación Jerárquica)</span>
            </button>
          </div>
        </div>

        {/* Tarjeta Comparativa Dinámica */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch'>
          {/* Lado Izquierdo: Explicación del Proceso (5 columnas) */}
          <div className='lg:col-span-5 rounded-2xl border border-border/80 bg-card p-6 flex flex-col justify-between space-y-6'>
            <div className='space-y-4 font-exo'>
              <div className='flex items-center gap-2'>
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs',
                    activeTab === 'stair'
                      ? 'bg-primary/15 text-primary'
                      : 'bg-destructive/15 text-destructive'
                  )}
                >
                  {activeTab === 'stair' ? '✓' : '✗'}
                </div>
                <h3 className='font-frances font-bold text-lg text-foreground'>
                  {activeTab === 'stair'
                    ? 'Indexación Guiada por Estructura'
                    : 'Segmentación Ciega por Caracteres'}
                </h3>
              </div>

              <p className='text-xs sm:text-sm text-muted-foreground leading-relaxed'>
                {activeTab === 'stair'
                  ? 'STAIR extrae primero el árbol ToC (Títulos > Capítulos > Artículos) en JSONB. La consulta del estudiante realiza una poda en memoria (< 5ms) antes de buscar vectores en hojas.'
                  : 'Los sistemas RAG típicos cortan el PDF arbitrariamente cada 500 a 800 caracteres sin saber si rompieron un artículo a la mitad o perdieron el título del capítulo.'}
              </p>

              <div className='space-y-2.5 pt-2'>
                <div className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                  {activeTab === 'stair' ? 'Ventajas Arquitecturales:' : 'Problemas Frecuentes:'}
                </div>

                {activeTab === 'stair' ? (
                  <ul className='space-y-2 text-xs sm:text-sm text-foreground/90'>
                    <li className='flex items-start gap-2'>
                      <CheckCircle2 className='w-4 h-4 text-primary shrink-0 mt-0.5' />
                      <span>
                        <strong>Cero cortes arbitrarios:</strong> Cada fragmento es un artículo
                        completo o sección lógica.
                      </span>
                    </li>
                    <li className='flex items-start gap-2'>
                      <CheckCircle2 className='w-4 h-4 text-primary shrink-0 mt-0.5' />
                      <span>
                        <strong>Inyección de Breadcrumbs:</strong> Cada chunk viaja con su contexto{' '}
                        <code className='text-[11px] bg-muted px-1.5 py-0.5 rounded'>
                          [Reglamento &gt; Cap. II &gt; Art. 17]
                        </code>
                        .
                      </span>
                    </li>
                    <li className='flex items-start gap-2'>
                      <CheckCircle2 className='w-4 h-4 text-primary shrink-0 mt-0.5' />
                      <span>
                        <strong>Poda de Árbol ToC:</strong> Descarta ramas irrelevantes antes del
                        cálculo de similitud coseno.
                      </span>
                    </li>
                  </ul>
                ) : (
                  <ul className='space-y-2 text-xs sm:text-sm text-foreground/90'>
                    <li className='flex items-start gap-2'>
                      <XCircle className='w-4 h-4 text-destructive shrink-0 mt-0.5' />
                      <span>
                        <strong>Efecto "Lost in the Middle":</strong> El modelo no sabe si el
                        artículo pertenece a Matrícula o a Deberes.
                      </span>
                    </li>
                    <li className='flex items-start gap-2'>
                      <XCircle className='w-4 h-4 text-destructive shrink-0 mt-0.5' />
                      <span>
                        <strong>Cláusulas mutiladas:</strong> Condiciones de excepción quedan en
                        chunks distintos.
                      </span>
                    </li>
                    <li className='flex items-start gap-2'>
                      <XCircle className='w-4 h-4 text-destructive shrink-0 mt-0.5' />
                      <span>
                        <strong>Alucinación inducida:</strong> El LLM asume datos inexistentes por
                        falta de encabezado legal.
                      </span>
                    </li>
                  </ul>
                )}
              </div>
            </div>

            <div className='p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs font-mono text-muted-foreground flex items-center justify-between'>
              <span>Tasa de Alucinaciones Fácticas:</span>
              <span
                className={cn(
                  'font-bold text-sm',
                  activeTab === 'stair' ? 'text-emerald-500 font-bold' : 'text-destructive font-bold'
                )}
              >
                {activeTab === 'stair' ? '0.0% (Cero Alucinaciones)' : '92.0% (Crítico sin RAG)'}
              </span>
            </div>
          </div>

          {/* Lado Derecho: Simulación Visual de la Memoria / Chunking (7 columnas) */}
          <div className='lg:col-span-7 rounded-2xl border border-border/80 bg-muted/20 p-5 sm:p-6 flex flex-col justify-between font-mono text-xs'>
            <div>
              <div className='flex items-center justify-between pb-3 mb-4 border-b border-border/50'>
                <span className='font-semibold text-foreground flex items-center gap-2'>
                  <FileCode2 className='w-4 h-4 text-primary' />
                  {activeTab === 'stair'
                    ? 'Representación Canónica STAIR (JSONB)'
                    : 'Fragmentos Ciegos (Ventanas 650 chars)'}
                </span>
                <span className='text-[11px] text-muted-foreground'>Reglamento de Matrícula USS</span>
              </div>

              {activeTab === 'stair' ? (
                <div className='space-y-3 font-mono text-[11px] sm:text-xs'>
                  <div className='p-3 rounded-lg bg-card border border-primary/30 shadow-2xs space-y-1.5'>
                    <div className='text-primary font-bold flex items-center gap-1.5'>
                      <BookOpen className='w-3.5 h-3.5' />
                      <span>[Breadcrumb Inyectado]</span>
                    </div>
                    <div className='text-foreground/90'>
                      Reglamento General de Matrícula &gt; Capítulo III: Matrícula Extemporánea &gt;
                      Artículo 18°
                    </div>
                  </div>

                  <div className='p-3.5 rounded-lg bg-card border border-border/70 space-y-2'>
                    <div className='flex items-center justify-between text-muted-foreground text-[11px]'>
                      <span className='font-bold text-foreground'>Chunk #42 (Artículo Íntegro)</span>
                      <span className='text-primary'>Tokens: 214 • Límites Preservados</span>
                    </div>
                    <p className='text-foreground/80 font-sans leading-relaxed'>
                      "Artículo 18°. La matrícula extemporánea es un acto administrativo extraordinario
                      que procede cuando el estudiante no realizó su inscripción en las fechas
                      previstas en el cronograma académico regular. Se realiza a través del Campus
                      Virtual abonando la tasa correspondiente..."
                    </p>
                  </div>

                  <div className='p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[11px] flex items-center gap-2 font-exo'>
                    <ShieldCheck className='w-4 h-4 shrink-0' />
                    <span>
                      Enrutamiento ToC identificó el artículo en <strong>3.8 ms</strong> sin escanear
                      los 12 reglamentos restantes.
                    </span>
                  </div>
                </div>
              ) : (
                <div className='space-y-3 font-mono text-[11px] sm:text-xs'>
                  <div className='p-3.5 rounded-lg bg-card border border-destructive/30 space-y-2 opacity-90'>
                    <div className='flex items-center justify-between text-muted-foreground text-[11px]'>
                      <span className='font-bold text-destructive'>Chunk #118 (Corte arbitrario 650 chars)</span>
                      <span className='text-destructive'>Encabezado Perdido</span>
                    </div>
                    <p className='text-foreground/70 font-sans leading-relaxed line-through decoration-destructive/50'>
                      "...ordinario que procede cuando el estudiante no realizó su inscripción. Art. 19°.
                      Los créditos permitidos para este periodo se sujetan a la disponibilidad de vacantes
                      según la directiva aprobada por el Vicerrectorado..."
                    </p>
                  </div>

                  <div className='p-3 rounded-lg bg-card border border-border/50 text-muted-foreground text-[11px] font-sans'>
                    ⚠️ El fragmento no incluye a qué reglamento pertenece, ni el capítulo del cual forma
                    parte. Si el estudiante pregunta por "créditos de matrícula", el sistema confunde
                    esta sección con el reglamento de convalidaciones.
                  </div>
                </div>
              )}
            </div>

            <div className='pt-4 mt-4 border-t border-border/50 text-right text-[11px] text-muted-foreground font-exo'>
              Basado en Kumar et al. (IBM Research, 2026) — arXiv:2609.03874v1
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
