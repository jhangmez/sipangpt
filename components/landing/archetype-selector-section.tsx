'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Users2,
  GraduationCap,
  Briefcase,
  BookOpen,
  ArrowRight,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Archetype {
  id: string
  label: string
  roleTitle: string
  badgeText: string
  icon: React.ElementType
  description: string
  sampleQuestions: Array<{
    query: string
    resolutionContext: string
    documentCited: string
  }>
}

const ARCHETYPES: Archetype[] = [
  {
    id: 'estudiantes',
    label: 'Estudiantes de Pregrado',
    roleTitle: 'Resolución Ágil de Trámites y Pagos',
    badgeText: 'Arquetipo Cotidiano / Informal',
    icon: Users2,
    description:
      'Orientado a resolver las emergencias y consultas más frecuentes del ciclo académico: cronogramas de matrícula, vencimiento de cuotas, retiros y límites de inasistencia.',
    sampleQuestions: [
      {
        query: '¿Hasta cuándo puedo pagar mi pensión sin que me cobren mora?',
        resolutionContext: 'Identifica el vencimiento al día 15 y los canales de pago por CampusNet sin recargos.',
        documentCited: 'Reglamento de Cobranzas USS • Art. 24°'
      },
      {
        query: '¿Cómo hago para retirar un curso si ya pasaron las primeras semanas?',
        resolutionContext: 'Explica el plazo administrativo y requisitos en el campus virtual antes de evaluaciones parciales.',
        documentCited: 'Reglamento de Matrícula General • Art. 34°'
      },
      {
        query: '¿Cuántas faltas puedo tener antes de salir inhabilitado en una asignatura?',
        resolutionContext: 'Alerta sobre el tope del 30% de inasistencias y el plazo de 72 horas para presentar certificado.',
        documentCited: 'Reglamento del Estudiante • Art. 42°'
      }
    ]
  },
  {
    id: 'tesistas',
    label: 'Tesistas & Egresados',
    roleTitle: 'Rigor Normativo en Grados y Títulos',
    badgeText: 'Arquetipo Formal / Protocolar',
    icon: GraduationCap,
    description:
      'Diseñado para quienes buscan obtener el Grado de Bachiller o Título Profesional, con información exacta sobre jurados, sustentación y repositorio.',
    sampleQuestions: [
      {
        query: '¿Cuál es el porcentaje máximo de similitud Turnitin admitido para la tesis?',
        resolutionContext: 'Detalla el umbral admisible (< 25%), exclusiones de bibliografía y filtros metodológicos.',
        documentCited: 'Reglamento de Grados y Títulos • Art. 28°'
      },
      {
        query: '¿Qué nivel de idioma extranjero debo acreditar para solicitar mi Bachiller?',
        resolutionContext: 'Precisa el nivel intermedio concluido y la validación ante el Centro de Idiomas USS.',
        documentCited: 'Reglamento de Grados y Títulos • Art. 12°'
      },
      {
        query: '¿Cuánto tiempo tiene el jurado evaluador para emitir el dictamen de mi informe?',
        resolutionContext: 'Informa sobre los plazos hábiles fijados para la revisión y levantamiento de observaciones.',
        documentCited: 'Reglamento de Grados y Títulos • Art. 22°'
      }
    ]
  },
  {
    id: 'docentes',
    label: 'Docentes Universitarios',
    roleTitle: 'Gestión Académica y Campus Virtual',
    badgeText: 'Arquetipo Docente / Especializado',
    icon: Briefcase,
    description:
      'Asistencia técnica para profesores de la USS en el uso del aula virtual, ponderación de evaluaciones y registro de actas de notas.',
    sampleQuestions: [
      {
        query: '¿Cómo realizo el registro y cierre de actas de notas en el campus virtual?',
        resolutionContext: 'Explica la ruta en el sistema de gestión docente, bloqueo de actas y plazos institucionales.',
        documentCited: 'Manual de Gestión Docente Campus Virtual • Pág. 8'
      },
      {
        query: '¿Cómo configuro los enlaces síncronos de Zoom en el aula virtual?',
        resolutionContext: 'Detalla la integración de sesiones síncronas y programación recurrente con cuenta institucional.',
        documentCited: 'Manual Zoom Docente USS • Sección 3'
      },
      {
        query: '¿Cuál es el procedimiento para registrar la asistencia diaria de los alumnos?',
        resolutionContext: 'Indica la carga de reportes de asistencia y la tolerancia máxima de ingreso al aula.',
        documentCited: 'Manual del Aula Virtual – Docente • Pág. 12'
      }
    ]
  }
]

export function ArchetypeSelectorSection() {
  const [activeTab, setActiveTab] = React.useState<string>('estudiantes')

  const activeArchetype =
    ARCHETYPES.find((a) => a.id === activeTab) || ARCHETYPES[0]

  return (
    <section id='arquetipos' className='w-full py-16 sm:py-24 border-t border-border/50 bg-background'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6'>
        {/* Cabecera */}
        <div className='text-center max-w-3xl mx-auto space-y-3 mb-12'>
          <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary font-exo'>
            <Users2 className='w-3.5 h-3.5' />
            <span>Adaptación por Perfil • Dataset ShareGPT USS</span>
          </div>

          <h2 className='font-frances text-3xl sm:text-4xl font-bold tracking-tight text-foreground'>
            Diseñado para cada Integrante de la Comunidad USS
          </h2>

          <p className='font-exo text-sm sm:text-base text-muted-foreground leading-relaxed'>
            SipánGPT no asume que todos preguntan igual. El sistema está calibrado para entender
            desde el estudiante con prisas hasta la formalidad académica del tesista o docente.
          </p>
        </div>

        {/* Pestañas de Roles */}
        <div className='flex justify-center mb-8'>
          <div className='inline-flex p-1.5 rounded-2xl bg-muted/50 border border-border/70 font-exo text-xs sm:text-sm overflow-x-auto max-w-full'>
            {ARCHETYPES.map((arch) => {
              const Icon = arch.icon
              const isActive = arch.id === activeTab

              return (
                <button
                  key={arch.id}
                  onClick={() => setActiveTab(arch.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap',
                    isActive
                      ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className={cn('w-4 h-4', isActive ? 'text-primary' : '')} />
                  <span>{arch.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Contenido del Arquetipo Seleccionado */}
        <div className='rounded-2xl border border-border/80 bg-card/60 p-6 sm:p-8 space-y-6 font-exo shadow-sm text-left'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-border/50'>
            <div>
              <div className='inline-block px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold mb-2'>
                {activeArchetype.badgeText}
              </div>
              <h3 className='font-frances font-bold text-xl sm:text-2xl text-foreground'>
                {activeArchetype.roleTitle}
              </h3>
            </div>
            <p className='text-xs sm:text-sm text-muted-foreground max-w-md'>
              {activeArchetype.description}
            </p>
          </div>

          {/* Preguntas de Muestra Interactivas */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {activeArchetype.sampleQuestions.map((q, idx) => (
              <div
                key={idx}
                className='group rounded-xl border border-border/70 bg-card p-4 hover:border-primary/50 transition-all duration-200 flex flex-col justify-between space-y-3'
              >
                <div className='space-y-2'>
                  <div className='text-xs font-semibold text-foreground group-hover:text-primary transition-colors flex items-start gap-2'>
                    <HelpCircle className='w-4 h-4 text-primary shrink-0 mt-0.5' />
                    <span>"{q.query}"</span>
                  </div>
                  <p className='text-[12px] text-muted-foreground leading-relaxed'>
                    {q.resolutionContext}
                  </p>
                </div>

                <div className='pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground'>
                  <span className='truncate font-mono text-primary font-medium text-[10px]'>
                    {q.documentCited}
                  </span>
                  <Link
                    href='/chat'
                    className='shrink-0 text-foreground group-hover:text-primary transition-colors flex items-center gap-1 font-semibold'
                  >
                    <span>Preguntar</span>
                    <ArrowRight className='w-3 h-3' />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
