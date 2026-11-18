'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Bot,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  GraduationCap,
  CreditCard,
  BookOpen,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Helper para renderizar negritas (**texto**) y código (`código`) en texto preformateado
 * garantizando que se muestre como HTML real y nunca como asteriscos planos.
 */
function renderMarkdownText(text?: string | null): React.ReactNode {
  if (!text) return null
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className='font-semibold text-foreground'>
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className='rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-primary'>
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

interface DemoScenario {
  id: string
  label: string
  icon: React.ElementType
  userQuery: string
  assistantResponse: {
    lead: string
    points: string[]
    conclusion?: string
  }
  citations: Array<{
    documentTitle: string
    article: string
    url: string
  }>
  metrics: {
    latencyText: string
    similarity: number
    model: string
  }
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'matricula',
    label: 'Matrícula en Línea',
    icon: BookOpen,
    userQuery:
      '¿Hasta cuántos créditos puedo matricularme y cómo solicito la matrícula extemporánea si venció el cronograma?',
    assistantResponse: {
      lead: 'De acuerdo con el **Reglamento General de Matrícula USS** y el **Manual de Matrícula en Línea**:',
      points: [
        '**Límite regular:** Puedes inscribirte en un máximo de **22 créditos** académicos por ciclo regular (ampliable a 26 si registras promedio de excelencia académica).',
        '**Matrícula Extemporánea:** Al vencer el cronograma ordinario, debes ingresar al módulo de Matrícula en Línea en el Campus Virtual y confirmar tus asignaturas abonando el recargo administrativo de matrícula extraordinaria.'
      ],
      conclusion:
        'Recuerda verificar que no tengas cruces de horario antes de cerrar la confirmación final de la ficha.'
    },
    citations: [
      {
        documentTitle: 'Reglamento de Matrícula General USS',
        article: 'Art. 18° y 21°',
        url: 'https://www.uss.edu.pe/uss/TransparenciaDoc/RegEstudiantes/REGLAMENTO%20DE%20MATRICULA%20GENERAL%20USS.pdf'
      },
      {
        documentTitle: 'Manual de Usuario Matrícula en Línea',
        article: 'Págs. 3-5',
        url: 'https://campus.uss.edu.pe/SeussFile/FileInfSeuss/Manualesdeusuario/_10007200552026_5_16_17.pdf'
      }
    ],
    metrics: {
      latencyText: '2.4s (Streaming)',
      similarity: 0.94,
      model: 'Gemini 3.1 Flash-Lite'
    }
  },
  {
    id: 'cobranzas',
    label: 'Pensiones & Pagos',
    icon: CreditCard,
    userQuery:
      '¿Cuáles son las fechas de vencimiento de las cuotas y cómo pago por el campus virtual con Visa sin recargo?',
    assistantResponse: {
      lead: 'De conformidad con el **Reglamento de Cobranzas 2026** y el **Manual de Pagos Virtuales USS**:',
      points: [
        '**Vencimiento de Armadas:** Las pensiones mensuales vencen indefectiblemente el día **15 de cada mes calendario**. Vencido el plazo, se genera el interés legal moratorio estipulado.',
        '**Pasos en Campus Virtual:** Accede a **CampusNet > Gestión Financiera > Pagos en Línea**, selecciona la armada pendiente y elige la pasarela **Visa** para registro automático inmediato sin comisiones adicionales.'
      ],
      conclusion:
        'El sistema emite tu comprobante de pago digital al instante y actualiza tu estado financiero en el registro académico.'
    },
    citations: [
      {
        documentTitle: 'Reglamento de Cobranza USS',
        article: 'Art. 24°',
        url: 'https://www.uss.edu.pe/uss/TransparenciaDoc/RegEstudiantes/cobranzas2026.pdf'
      },
      {
        documentTitle: 'Manual de Usuario de Pagos Virtuales',
        article: 'Sección 2',
        url: 'https://campus.uss.edu.pe/CampusNet6/PagosVisa.pdf'
      }
    ],
    metrics: {
      latencyText: '1.9s (Streaming)',
      similarity: 0.96,
      model: 'Gemini 3.1 Flash-Lite'
    }
  },
  {
    id: 'grados',
    label: 'Grados & Títulos',
    icon: GraduationCap,
    userQuery:
      '¿Cuáles son los requisitos de idioma y créditos para obtener el Grado de Bachiller y sustentar mi tesis?',
    assistantResponse: {
      lead: 'Conforme al **Reglamento de Grados y Títulos de la Universidad Señor de Sipán**:',
      points: [
        '**Créditos Académicos:** Haber completado y aprobado el 100% del plan de estudios de tu carrera profesional (mínimo 200 créditos).',
        '**Acreditación de Idioma:** Certificado oficial de suficiencia de idioma extranjero (nivel intermedio concluido) visado por el Centro de Idiomas USS.',
        '**Trabajo de Investigación:** Aprobación del dictamen de tesis por el jurado calificador, reporte de originalidad Turnitin admisible y depósito en el repositorio.'
      ],
      conclusion:
        'El trámite se inicia 100% digital a través del sistema de registros académicos orientado al egresado.'
    },
    citations: [
      {
        documentTitle: 'Reglamento de Grados y Títulos USS',
        article: 'Art. 12° y 25°',
        url: 'https://www.uss.edu.pe/uss/TransparenciaDoc/RegEstudiantes/REGLAMENTOGRADOSYTITULOS.pdf'
      }
    ],
    metrics: {
      latencyText: '3.1s (Streaming)',
      similarity: 0.92,
      model: 'Gemini 3.1 Flash-Lite'
    }
  },
  {
    id: 'asistencia',
    label: 'Inasistencias & Faltas',
    icon: AlertCircle,
    userQuery:
      '¿Con qué porcentaje de inasistencias soy inhabilitado de un curso y cuál es el plazo para justificar faltas?',
    assistantResponse: {
      lead: 'De acuerdo con el **Reglamento del Estudiante USS** (Art. 42° y 48°):',
      points: [
        '**Límite de Faltas:** El estudiante que acumule el **30% o más de inasistencias** injustificadas respecto al total de horas programadas quedará en condición de **Inhabilitado por Faltas (INF)** en la asignatura.',
        '**Plazo de Justificación:** Dispones de hasta **72 horas hábiles** posteriores a la falta para ingresar tu solicitud por Trámite Documentario en el Campus Virtual con sustento médico o laboral.'
      ],
      conclusion:
        'Una vez calificada la justificación, el docente actualizará el reporte de asistencia en el Campus Virtual.'
    },
    citations: [
      {
        documentTitle: 'Reglamento del Estudiante USS',
        article: 'Art. 42° y 48°',
        url: 'https://www.uss.edu.pe/uss/TransparenciaDoc/RegEstudiantes/REGLAMENTO%20DEL%20ESTUDIANTE.pdf'
      }
    ],
    metrics: {
      latencyText: '2.2s (Streaming)',
      similarity: 0.95,
      model: 'Gemini 3.1 Flash-Lite'
    }
  }
]

export function HeroPreviewChat() {
  const [activeScenarioId, setActiveScenarioId] = React.useState<string>('matricula')
  const [isTyping, setIsTyping] = React.useState<boolean>(false)

  const activeScenario =
    DEMO_SCENARIOS.find((s) => s.id === activeScenarioId) || DEMO_SCENARIOS[0]

  const handleSelectScenario = (id: string) => {
    if (id === activeScenarioId) return
    setIsTyping(true)
    setActiveScenarioId(id)
    setTimeout(() => {
      setIsTyping(false)
    }, 280)
  }

  return (
    <div className='relative w-full max-w-2xl mx-auto lg:max-w-none text-left'>
      {/* Resplandor decorativo de fondo */}
      <div className='absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary/30 via-emerald-500/20 to-primary/10 blur-xl opacity-60 dark:opacity-40 -z-10' />

      {/* Contenedor Principal Estilo Ventana de Software */}
      <div className='rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300'>
        {/* Barra Superior de la Ventana */}
        <div className='flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/40'>
          <div className='flex items-center gap-2'>
            <div className='flex gap-1.5'>
              <div className='w-3 h-3 rounded-full bg-red-500/80' />
              <div className='w-3 h-3 rounded-full bg-amber-500/80' />
              <div className='w-3 h-3 rounded-full bg-emerald-500/80' />
            </div>
            <div className='h-4 w-px bg-border/60 mx-1' />
            <div className='flex items-center gap-1.5 text-xs font-semibold text-foreground/90 font-exo'>
              <Bot className='w-3.5 h-3.5 text-primary' />
              <span>SipánGPT • Demo en Vivo</span>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <div className='hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-medium'>
              <span className='w-1.5 h-1.5 rounded-full bg-primary animate-pulse' />
              <span>STAIR RAG Activo</span>
            </div>
            <span className='text-[11px] text-muted-foreground font-mono'>13 Docs USS</span>
          </div>
        </div>

        {/* Pestañas de Casos de Uso Reales (Scope Oficial) */}
        <div className='flex items-center gap-1 p-2 bg-muted/20 border-b border-border/50 overflow-x-auto no-scrollbar'>
          {DEMO_SCENARIOS.map((scenario) => {
            const Icon = scenario.icon
            const isActive = scenario.id === activeScenario.id

            return (
              <button
                key={scenario.id}
                onClick={() => handleSelectScenario(scenario.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-exo transition-all whitespace-nowrap shrink-0',
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <Icon className='w-3.5 h-3.5' />
                <span>{scenario.label}</span>
              </button>
            )
          })}
        </div>

        {/* Cuerpo Conversacional */}
        <div className='p-4 sm:p-6 space-y-4 min-h-[360px] sm:min-h-[380px] flex flex-col justify-between font-exo'>
          <div className='space-y-4'>
            {/* Mensaje del Estudiante */}
            <div className='flex items-start gap-3 justify-end'>
              <div className='max-w-[85%] rounded-2xl rounded-tr-sm bg-primary/15 border border-primary/25 px-4 py-2.5 text-xs sm:text-sm text-foreground shadow-xs'>
                <p className='leading-relaxed font-medium'>{activeScenario.userQuery}</p>
              </div>
              <div className='w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold'>
                Tú
              </div>
            </div>

            {/* Mensaje del Asistente */}
            <div className='flex items-start gap-3'>
              <div className='w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xs'>
                <Bot className='w-4 h-4' />
              </div>

              <div className='flex-1 max-w-[92%] rounded-2xl rounded-tl-sm bg-muted/50 border border-border/70 p-4 text-xs sm:text-sm text-foreground shadow-xs space-y-3 transition-opacity duration-200'>
                {isTyping ? (
                  <div className='flex items-center gap-2 py-4 text-muted-foreground text-xs'>
                    <span className='w-2 h-2 rounded-full bg-primary animate-bounce' />
                    <span className='w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.15s]' />
                    <span className='w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.3s]' />
                    <span>Consultando índice STAIR y reglamentos...</span>
                  </div>
                ) : (
                  <>
                    <p className='text-muted-foreground text-xs font-medium'>
                      {renderMarkdownText(activeScenario.assistantResponse.lead)}
                    </p>

                    <ul className='space-y-2 text-foreground/90 text-xs sm:text-[13px]'>
                      {activeScenario.assistantResponse.points.map((pt, idx) => (
                        <li key={idx} className='flex items-start gap-2 leading-relaxed'>
                          <CheckCircle2 className='w-3.5 h-3.5 text-primary shrink-0 mt-0.5' />
                          <span>{renderMarkdownText(pt)}</span>
                        </li>
                      ))}
                    </ul>

                    {activeScenario.assistantResponse.conclusion && (
                      <p className='text-xs text-muted-foreground pt-1 border-t border-border/40'>
                        {renderMarkdownText(activeScenario.assistantResponse.conclusion)}
                      </p>
                    )}

                    {/* Citas Oficiales Verificables con Enlace */}
                    <div className='pt-2 space-y-1.5'>
                      <div className='text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1'>
                        <ShieldCheck className='w-3 h-3 text-primary' />
                        <span>Fuentes Universitarias Oficiales Citadas:</span>
                      </div>
                      <div className='flex flex-wrap gap-1.5'>
                        {activeScenario.citations.map((cite, cIdx) => (
                          <a
                            key={cIdx}
                            href={cite.url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-background/80 hover:bg-background text-[11px] font-medium text-foreground border border-border/80 hover:border-primary/50 transition-colors shadow-2xs group'
                          >
                            <span className='text-primary font-semibold'>{cite.article}</span>
                            <span className='text-muted-foreground truncate max-w-[170px] sm:max-w-[210px]'>
                              {cite.documentTitle}
                            </span>
                            <ExternalLink className='w-2.5 h-2.5 text-muted-foreground group-hover:text-primary shrink-0 ml-0.5' />
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Metadatos Técnicos de Inferencia */}
                    <div className='pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground font-mono'>
                      <div className='flex items-center gap-3'>
                        <span className='flex items-center gap-1'>
                          <Clock className='w-3 h-3' />
                          {activeScenario.metrics.latencyText}
                        </span>
                        <span>Similitud: {(activeScenario.metrics.similarity * 100).toFixed(0)}%</span>
                      </div>
                      <span className='hidden sm:inline'>{activeScenario.metrics.model}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Barra Inferior Interactiva de Acción Directa */}
          <div className='pt-3 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3 bg-card/60 rounded-xl p-2.5'>
            <div className='text-xs text-muted-foreground flex items-center gap-1.5'>
              <Sparkles className='w-3.5 h-3.5 text-primary shrink-0' />
              <span>¿Tienes una duda sobre tu matrícula o trámites?</span>
            </div>

            <Link
              href='/chat'
              className='w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-xs group'
            >
              <span>Abrir Chatbot USS</span>
              <ArrowRight className='w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5' />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
