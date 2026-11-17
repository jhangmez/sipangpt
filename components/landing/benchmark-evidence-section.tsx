'use client'

import * as React from 'react'
import {
  Award,
  BarChart3,
  CheckCircle,
  ExternalLink,
  Flame,
  Scale,
  Sparkles,
  TrendingUp,
  FileCheck2,
  ShieldAlert
} from 'lucide-react'

export function BenchmarkEvidenceSection() {
  return (
    <section id='benchmark' className='w-full py-16 sm:py-24 border-t border-border/50 bg-muted/15'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6'>
        {/* Cabecera de la Sección */}
        <div className='flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 text-left'>
          <div className='max-w-2xl space-y-3'>
            <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary font-exo'>
              <Award className='w-3.5 h-3.5' />
              <span>Evaluación de Tesis UNPRG • Estándar NeurIPS 2023</span>
            </div>

            <h2 className='font-frances text-3xl sm:text-4xl font-bold tracking-tight text-foreground'>
              Evidencia Científica y Rigor de Evaluación
            </h2>

            <p className='font-exo text-sm sm:text-base text-muted-foreground leading-relaxed'>
              No nos basamos en impresiones subjetivas. El rendimiento de SipánGPT fue medido
              cuantitativamente frente a modelos con ajuste fino (LoRA) mediante la metodología{' '}
              <strong>LLM-as-a-Judge</strong> sobre el banco oficial de 50 casos de la USS.
            </p>
          </div>

          <div className='flex flex-wrap items-center gap-2 font-exo text-xs'>
            <a
              href='https://huggingface.co/datasets/ussipan/sipangpt-V2'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border/70 hover:border-primary/50 text-foreground transition-colors'
            >
              <span>Dataset ussipan/sipangpt-V2</span>
              <ExternalLink className='w-3 h-3 text-muted-foreground' />
            </a>
            <a
              href='https://github.com/jhangmez/codigo_para_evaluar_sipangpt_benchmark'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border/70 hover:border-primary/50 text-foreground transition-colors'
            >
              <span>Suite de Benchmark</span>
              <ExternalLink className='w-3 h-3 text-muted-foreground' />
            </a>
          </div>
        </div>

        {/* Tarjetas de Métricas Científicas */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 font-exo'>
          <div className='rounded-2xl border border-border/70 bg-card p-5 space-y-2 shadow-xs'>
            <div className='flex items-center justify-between text-muted-foreground text-xs'>
              <span>Ventaja de Exactitud</span>
              <TrendingUp className='w-4 h-4 text-primary' />
            </div>
            <div className='font-frances text-3xl font-bold text-primary'>+41.00%</div>
            <p className='text-xs text-muted-foreground leading-relaxed'>
              Superioridad de Sipán-STAIR frente a modelos Fine-Tuned puros sin recuperación.
            </p>
          </div>

          <div className='rounded-2xl border border-border/70 bg-card p-5 space-y-2 shadow-xs'>
            <div className='flex items-center justify-between text-muted-foreground text-xs'>
              <span>Control de Alucinación</span>
              <CheckCircle className='w-4 h-4 text-emerald-500' />
            </div>
            <div className='font-frances text-3xl font-bold text-foreground'>34.0%</div>
            <p className='text-xs text-muted-foreground leading-relaxed'>
              Reducción dramática del riesgo de inventar artículos o requisitos inexistentes.
            </p>
          </div>

          <div className='rounded-2xl border border-border/70 bg-card p-5 space-y-2 shadow-xs'>
            <div className='flex items-center justify-between text-muted-foreground text-xs'>
              <span>Banco de Pruebas</span>
              <FileCheck2 className='w-4 h-4 text-primary' />
            </div>
            <div className='font-frances text-3xl font-bold text-foreground'>50 Casos</div>
            <p className='text-xs text-muted-foreground leading-relaxed'>
              70% monoturno y 30% multiturno abarcando los 5 módulos temáticos de la USS.
            </p>
          </div>

          <div className='rounded-2xl border border-border/70 bg-card p-5 space-y-2 shadow-xs'>
            <div className='flex items-center justify-between text-muted-foreground text-xs'>
              <span>Juez de Evaluación</span>
              <Scale className='w-4 h-4 text-primary' />
            </div>
            <div className='font-frances text-3xl font-bold text-foreground'>T = 0.0</div>
            <p className='text-xs text-muted-foreground leading-relaxed'>
              Gemini Flash a temperatura cero con esquemas estrictos Pydantic v2 (NeurIPS).
            </p>
          </div>
        </div>

        {/* Comparador Visual de Barras */}
        <div className='rounded-2xl border border-border/80 bg-card p-6 sm:p-8 space-y-6 font-exo shadow-sm'>
          <h3 className='font-frances font-bold text-lg sm:text-xl text-foreground text-left'>
            Exactitud Global por Enfoque Tecnológico (LLM-as-a-Judge)
          </h3>

          <div className='space-y-6'>
            {/* Barra 1: Sipán-STAIR (RAG) */}
            <div className='space-y-2 text-left'>
              <div className='flex justify-between items-center text-sm font-medium'>
                <span className='flex items-center gap-2 text-foreground font-semibold'>
                  <span className='w-2.5 h-2.5 rounded-full bg-primary' />
                  Sipán-STAIR (Arquitectura RAG Jerárquica + Next.js + Neon)
                </span>
                <span className='font-frances font-bold text-primary text-base'>55.00% Exactitud</span>
              </div>
              <div className='h-4 w-full bg-muted rounded-full overflow-hidden p-0.5 border border-border/60'>
                <div
                  className='h-full bg-primary rounded-full transition-all duration-1000'
                  style={{ width: '55%' }}
                />
              </div>
              <div className='text-[11px] text-muted-foreground flex items-center justify-between'>
                <span>Respuestas fundamentadas con citas verificables directas al PDF</span>
                <span className='text-emerald-500 font-semibold'>Calificación Más Alta</span>
              </div>
            </div>

            {/* Barra 2: Gemma-4 Fine-Tuned LoRA */}
            <div className='space-y-2 text-left opacity-80'>
              <div className='flex justify-between items-center text-sm font-medium'>
                <span className='flex items-center gap-2 text-muted-foreground'>
                  <span className='w-2.5 h-2.5 rounded-full bg-muted-foreground/60' />
                  Gemma-4 Fine-Tuned (Ajuste Fino LoRA GGUF Q4_K_M)
                </span>
                <span className='font-frances font-bold text-muted-foreground text-base'>14.00% Exactitud</span>
              </div>
              <div className='h-4 w-full bg-muted rounded-full overflow-hidden p-0.5 border border-border/60'>
                <div
                  className='h-full bg-muted-foreground/50 rounded-full transition-all duration-1000'
                  style={{ width: '14%' }}
                />
              </div>
              <div className='text-[11px] text-muted-foreground flex items-center justify-between'>
                <span>Presenta 78% de alucinaciones en artículos específicos sin anclaje RAG</span>
                <span className='text-destructive font-medium'>Alucinación Frecuente</span>
              </div>
            </div>
          </div>

          <div className='pt-4 border-t border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground'>
            <p>
              Basado en el protocolo de evaluación de Zheng et al. (UC Berkeley / LMSYS, NeurIPS 2023)
              publicado en arXiv:2306.05685.
            </p>
            <span className='font-mono text-[11px] text-primary shrink-0'>50 / 50 Evaluaciones Completadas</span>
          </div>
        </div>
      </div>
    </section>
  )
}
