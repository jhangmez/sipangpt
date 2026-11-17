import * as React from 'react'
import {
  FileText,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  GraduationCap,
  BookOpen,
  Laptop,
  Users,
  Video,
  Library
} from 'lucide-react'

interface IndexedDoc {
  title: string
  area: string
  icon: React.ElementType
  summary: string
  url: string
}

const INDEXED_DOCUMENTS: IndexedDoc[] = [
  {
    title: 'Reglamento de Matrícula General USS',
    area: 'Matrícula & Registros',
    icon: BookOpen,
    summary: 'Cronograma, topes de créditos (22 a 26), matrícula extemporánea y reserva de vacante.',
    url: 'https://www.uss.edu.pe/uss/TransparenciaDoc/RegEstudiantes/REGLAMENTO%20DE%20MATRICULA%20GENERAL%20USS.pdf'
  },
  {
    title: 'Reglamento de Cobranza USS (2026)',
    area: 'Pensiones & Cobranzas',
    icon: CreditCard,
    summary: 'Fechas de vencimiento al día 15 de cada mes, cálculo de mora y fraccionamiento.',
    url: 'https://www.uss.edu.pe/uss/TransparenciaDoc/RegEstudiantes/cobranzas2026.pdf'
  },
  {
    title: 'Reglamento de Grados y Títulos USS',
    area: 'Grados & Titulación',
    icon: GraduationCap,
    summary: 'Requisitos de bachiller, idioma intermedio, designación de jurados y dictamen de tesis.',
    url: 'https://www.uss.edu.pe/uss/TransparenciaDoc/RegEstudiantes/REGLAMENTOGRADOSYTITULOS.pdf'
  },
  {
    title: 'Reglamento del Estudiante USS',
    area: 'Normativa Institucional',
    icon: ShieldCheck,
    summary: 'Inhabilitación por 30% de faltas, plazo de 72h para justificaciones y derechos estudiantiles.',
    url: 'https://www.uss.edu.pe/uss/TransparenciaDoc/RegEstudiantes/REGLAMENTO%20DEL%20ESTUDIANTE.pdf'
  },
  {
    title: 'Manual de Usuario Matrícula en Línea',
    area: 'Campus Virtual',
    icon: Laptop,
    summary: 'Proceso guiado de inscripción de asignaturas, selección de turnos y validación web.',
    url: 'https://campus.uss.edu.pe/SeussFile/FileInfSeuss/Manualesdeusuario/_10007200552026_5_16_17.pdf'
  },
  {
    title: 'Manual de Pagos Virtuales (CampusNet)',
    area: 'Tesorería Digital',
    icon: CreditCard,
    summary: 'Cancelación de pensiones vía pasarela Visa sin comisiones y comprobantes digitales.',
    url: 'https://campus.uss.edu.pe/CampusNet6/PagosVisa.pdf'
  },
  {
    title: 'Manual de Registros Académicos Estudiante/Egresado',
    area: 'Trámites Académicos',
    icon: FileText,
    summary: 'Solicitud de récord integral de notas, certificados de estudio y constancia de egreso.',
    url: 'https://campus.uss.edu.pe/SeussFile/FileInfSeuss/Manualesdeusuario/_10000000582024_12_15_13.pdf'
  },
  {
    title: 'Manual de Aprendizaje Virtual Estudiantes',
    area: 'Aula Virtual',
    icon: Laptop,
    summary: 'Envío de evidencias de aprendizaje, foros temáticos, exámenes y calificaciones.',
    url: 'https://campus.uss.edu.pe/SeussFile/FileInfSeuss/Manualesdeusuario/_10000000582024_12_15_34.pdf'
  },
  {
    title: 'Manual de Aula Virtual Docente',
    area: 'Gestión Docente',
    icon: Users,
    summary: 'Administración de cursos, ponderación de rúbricas y seguimiento pedagógico.',
    url: 'https://campus.uss.edu.pe/SeussFile/FileInfSeuss/Manualesdeusuario/_10007200552026_5_16_14.pdf'
  },
  {
    title: 'Manual de Gestión Docente Campus Virtual',
    area: 'Registros Docentes',
    icon: Users,
    summary: 'Ingreso oficial y cierre de actas de notas, registro de asistencias y reportes.',
    url: 'https://campus.uss.edu.pe/SeussFile/FileInfSeuss/Manualesdeusuario/_10000000582024_12_15_12.pdf'
  },
  {
    title: 'Manual Sistema de Biblioteca - Catálogo en Línea',
    area: 'Biblioteca & Repositorio',
    icon: Library,
    summary: 'Búsqueda bibliográfica, acceso al repositorio de tesis y bases de datos Scopus/EBSCO.',
    url: 'https://campus.uss.edu.pe/SeussFile/FileInfSeuss/Manualesdeusuario/_10000000582024_12_15_14.pdf'
  },
  {
    title: 'Manual Videoconferencia Zoom - Estudiantes',
    area: 'Clases Virtuales',
    icon: Video,
    summary: 'Ingreso autenticado a sesiones en tiempo real y asistencia por sala virtual.',
    url: 'https://campus.uss.edu.pe/SeussFile/FileInfSeuss/Manualesdeusuario/_10000000582020_10_17_54.pdf'
  },
  {
    title: 'Manual Videoconferencia Zoom - Docente',
    area: 'Clases Virtuales',
    icon: Video,
    summary: 'Programación de clases síncronas, grabación en la nube y reportes de conexión.',
    url: 'https://campus.uss.edu.pe/SeussFile/FileInfSeuss/Manualesdeusuario/_10000000582020_10_17_53.pdf'
  }
]

export function IndexedDocumentsStrip() {
  return (
    <section id='documentos-indexados' className='w-full py-12 sm:py-16 border-t border-border/50'>
      <div className='max-w-6xl mx-auto px-4'>
        {/* Cabecera de Sección */}
        <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 text-left'>
          <div>
            <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-3'>
              <ShieldCheck className='w-3.5 h-3.5' />
              <span>Corpus Oficial USS • 13 Documentos Indexados</span>
            </div>
            <h2 className='font-frances text-2xl sm:text-3xl font-bold tracking-tight text-foreground'>
              La Base Normativa que Fundamenta cada Respuesta
            </h2>
          </div>
          <p className='font-exo text-sm text-muted-foreground max-w-md'>
            SipánGPT no adivina ni inventa información. Sus respuestas se recuperan directamente
            mediante el índice STAIR sobre los reglamentos institucionales aprobados.
          </p>
        </div>

        {/* Cuadrícula de Reglamentos y Manuales */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {INDEXED_DOCUMENTS.map((doc, idx) => {
            const Icon = doc.icon

            return (
              <div
                key={idx}
                className='group relative rounded-xl border border-border/70 bg-card/60 hover:bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-md flex flex-col justify-between'
              >
                <div>
                  <div className='flex items-center justify-between gap-2 mb-2'>
                    <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium font-exo text-muted-foreground'>
                      <Icon className='w-3 h-3 text-primary' />
                      {doc.area}
                    </span>
                    <a
                      href={doc.url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-muted-foreground hover:text-primary transition-colors p-1'
                      title='Abrir documento oficial original'
                    >
                      <ExternalLink className='w-3.5 h-3.5' />
                    </a>
                  </div>

                  <h3 className='font-frances font-bold text-sm text-foreground group-hover:text-primary transition-colors leading-snug mb-1.5'>
                    {doc.title}
                  </h3>

                  <p className='font-exo text-xs text-muted-foreground leading-relaxed'>
                    {doc.summary}
                  </p>
                </div>

                <div className='pt-3 mt-3 border-t border-border/40 flex items-center justify-between text-[11px] font-mono text-muted-foreground'>
                  <span className='text-emerald-500 font-semibold flex items-center gap-1'>
                    <span className='w-1.5 h-1.5 rounded-full bg-emerald-500' />
                    INDEXADO RAG
                  </span>
                  <a
                    href={doc.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='underline underline-offset-2 hover:text-foreground transition-colors'
                  >
                    Ver PDF oficial
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
