'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Info,
  Lock,
  MessageSquare,
  AlertTriangle,
  ArrowUp,
  ShieldAlert,
  FileText,
  Mail,
  Eye,
  Check,
  Copy,
  ExternalLink,
  Sparkles,
  BookOpen,
  Image as ImageIcon,
} from 'lucide-react'

// Obfuscación del correo para prevenir indexación por scrapers y bots
const ENCODED_CONTACT = 'amhhbmdvbWV6MjVAZ21haWwuY29t' // jhangomez25@gmail.com en base64

export default function TermsAndPrivacyPage() {
  const [showScrollTop, setShowScrollTop] = React.useState(false)
  const [isEmailRevealed, setIsEmailRevealed] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  // Desofuscar correo en tiempo de ejecución en el cliente
  const contactEmail = React.useMemo(() => {
    if (typeof window === 'undefined') return ''
    try {
      return window.atob(ENCODED_CONTACT)
    } catch {
      return 'jhangomez25' + '@' + 'gmail.com'
    }
  }, [])

  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleCopyEmail = () => {
    if (!contactEmail) return
    navigator.clipboard.writeText(contactEmail)
    setCopied(true)
    toast.success('Correo de contacto copiado al portapapeles.')
    setTimeout(() => setCopied(false), 2500)
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className='container mx-auto py-10 px-4 sm:px-8 max-w-4xl font-exo relative'>
      {/* Botón Flotante para Subir */}
      {showScrollTop && (
        <div className='fixed bottom-6 right-6 z-50 animate-in fade-in zoom-in duration-200'>
          <Button
            onClick={scrollToTop}
            variant='default'
            size='icon'
            aria-label='Subir al inicio'
            className='rounded-full shadow-lg h-12 w-12 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90'
          >
            <ArrowUp className='w-5 h-5' />
          </Button>
        </div>
      )}

      {/* Encabezado Principal */}
      <div className='text-center space-y-4 mb-10'>
        <div className='inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-2'>
          <Sparkles className='w-3.5 h-3.5' />
          <span>Marco Legal y Transparencia Académica</span>
        </div>
        <h1 className='text-3xl sm:text-5xl font-bold font-frances text-foreground tracking-tight'>
          Términos de Uso y Política de Privacidad de <span className='text-primary'>SipánGPT</span>
        </h1>
        <p className='text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed'>
          Directrices éticas, limitaciones de responsabilidad, tratamiento de datos públicos y canales oficiales de auditoría e investigación.
        </p>
        <p className='text-xs text-muted-foreground/80'>
          Última actualización: Septiembre de 2026 • Versión 2.0
        </p>

        {/* Acceso Rápido por Secciones */}
        <div className='flex flex-wrap justify-center gap-2 pt-2'>
          <a href='#condiciones'>
            <Badge variant='outline' className='cursor-pointer hover:bg-muted/60 transition-colors py-1 px-3 gap-1.5'>
              <FileText className='w-3 h-3 text-primary' />
              Términos de Uso
            </Badge>
          </a>
          <a href='#politica'>
            <Badge variant='outline' className='cursor-pointer hover:bg-muted/60 transition-colors py-1 px-3 gap-1.5'>
              <Lock className='w-3 h-3 text-primary' />
              Política de Privacidad
            </Badge>
          </a>
          <a href='#modelo-generativo'>
            <Badge variant='outline' className='cursor-pointer hover:bg-muted/60 transition-colors py-1 px-3 gap-1.5'>
              <AlertTriangle className='w-3 h-3 text-amber-500' />
              Modelo Generativo
            </Badge>
          </a>
          <a href='#propiedad-intelectual'>
            <Badge variant='outline' className='cursor-pointer hover:bg-muted/60 transition-colors py-1 px-3 gap-1.5'>
              <ImageIcon className='w-3 h-3 text-primary' />
              Propiedad Intelectual
            </Badge>
          </a>
          <a href='#auditoria'>
            <Badge variant='outline' className='cursor-pointer hover:bg-muted/60 transition-colors py-1 px-3 gap-1.5'>
              <ShieldAlert className='w-3 h-3 text-primary' />
              Auditoría y Contacto
            </Badge>
          </a>
        </div>
      </div>

      {/* Banner de Declaración de Independencia y Proyecto de Tesis */}
      <div className='mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 sm:p-6 text-amber-950 dark:text-amber-200'>
        <div className='flex items-start gap-3.5'>
          <ShieldAlert className='w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5' />
          <div className='space-y-2 text-sm leading-relaxed'>
            <h2 className='font-frances font-bold text-base text-amber-900 dark:text-amber-300'>
              Aviso Importante: Proyecto de Tesis de Investigación Independiente
            </h2>
            <p>
              <strong>SipánGPT es un proyecto académico de tesis</strong> desarrollado de forma independiente por el investigador{' '}
              <a
                href='https://www.linkedin.com/in/jhangmez'
                target='_blank'
                rel='noopener noreferrer'
                className='font-bold underline hover:text-amber-700 dark:hover:text-amber-100'
              >
                Jhan Gómez P. (@jhangmez)
              </a>.
            </p>
            <p>
              <strong>Este proyecto NO está afiliado, respaldado, patrocinado ni administrado oficialmente por la Universidad Señor de Sipán (USS).</strong> La denominación y el estudio se enmarcan en una investigación científica orientada a evaluar la efectividad de arquitecturas RAG en el ámbito universitario.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Términos de Uso */}
      <Card id='condiciones' className='mb-8 border-border/80 shadow-xs scroll-mt-24'>
        <CardHeader>
          <CardTitle className='flex items-center text-xl sm:text-2xl font-semibold font-frances'>
            <Info className='mr-2.5 h-6 w-6 text-primary' />
            <span>1. Términos de Uso</span>
          </CardTitle>
          <CardDescription>
            Condiciones bajo las cuales se concede el acceso al servicio experimental de SipánGPT.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6 text-sm leading-relaxed text-foreground/90'>
          <div>
            <h3 className='font-bold text-base font-frances text-foreground mb-2'>
              1.1. Aceptación de los Términos
            </h3>
            <p>
              Al acceder, navegar o utilizar SipánGPT mediante la web, interfaz de chat o cualquier punto de enlace relacionado, usted manifiesta su conformidad con los presentes Términos de Uso y Política de Privacidad. Si no está de acuerdo con alguno de los puntos expuestos, debe abstenerse de utilizar el servicio.
            </p>
          </div>

          <div>
            <h3 className='font-bold text-base font-frances text-foreground mb-2'>
              1.2. Descripción y Naturaleza Académica del Servicio
            </h3>
            <p>
              SipánGPT es una herramienta conversacional experimental con Generación Aumentada por Recuperación (RAG). Está concebida con propósitos estrictamente académicos, de investigación en inteligencia artificial y de asistencia orientativa para consultas estudiantiles comunes sobre reglamentos y trámites universitarios.
            </p>
          </div>

          <div>
            <h3 className='font-bold text-base font-frances text-foreground mb-2'>
              1.3. Licenciamiento y Modelos de Inteligencia Artificial
            </h3>
            <p>
              SipánGPT integra y orquesta diversos modelos fundacionales de lenguaje (tales como la familia Llama de Meta, modelos Gemini de Google, entre otros). El uso de la plataforma se encuentra sujeto a las licencias, políticas de uso aceptable y términos comunitarios de cada proveedor respectivo.
            </p>
          </div>

          <div>
            <h3 className='font-bold text-base font-frances text-foreground mb-2'>
              1.4. Exclusión de Responsabilidad de la Universidad Señor de Sipán
            </h3>
            <p>
              La Universidad Señor de Sipán queda íntegramente exenta de cualquier responsabilidad civil, académica, legal o técnica derivada del funcionamiento, disponibilidad, exactitud o consecuencias del uso de SipánGPT. La universidad no participa en la gestión de servidores, almacenamiento de credenciales ni curación algorítmica del sistema.
            </p>
          </div>

          <div>
            <h3 className='font-bold text-base font-frances text-foreground mb-2'>
              1.5. Modificaciones de los Términos
            </h3>
            <p>
              El autor se reserva el derecho de actualizar o adecuar estos términos en cualquier momento según las necesidades metodológicas de la investigación o requerimientos normativos. El uso continuado de la plataforma implica la aceptación plena de cualquier actualización publicada.
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator className='my-8 border-border/40' />

      {/* 2. Política de Privacidad */}
      <Card id='politica' className='mb-8 border-border/80 shadow-xs scroll-mt-24'>
        <CardHeader>
          <CardTitle className='flex items-center text-xl sm:text-2xl font-semibold font-frances'>
            <Lock className='mr-2.5 h-6 w-6 text-primary' />
            <span>2. Política de Privacidad y Tratamiento de Datos</span>
          </CardTitle>
          <CardDescription>
            Tratamiento responsable y protección de la información del usuario en el entorno académico.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6 text-sm leading-relaxed text-foreground/90'>
          <div>
            <h3 className='font-bold text-base font-frances text-foreground mb-2'>
              2.1. Recopilación Mínima de Datos
            </h3>
            <p>
              SipánGPT recopila únicamente la información imprescindible para autenticar al usuario y proveer la sesión de chat: nombre de perfil, correo electrónico institucional provisto voluntariamente vía Google OAuth y el historial de consultas formuladas al asistente para dar continuidad conversacional.
            </p>
          </div>

          <div>
            <h3 className='font-bold text-base font-frances text-foreground mb-2'>
              2.2. Uso Exclusivo para Investigación y No Comercialización
            </h3>
            <p>
              <strong>Bajo ninguna circunstancia se venden, alquilan o comercializan datos de los usuarios a terceros ni a empresas de publicidad.</strong> La información recopilada se utiliza exclusivamente para fines analíticos de la tesis (ej. medición de latencia, precisión de fragmentos RAG, evaluación de calidad de respuestas y costos de inferencia).
            </p>
          </div>

          <div>
            <h3 className='font-bold text-base font-frances text-foreground mb-2'>
              2.3. Seguridad y Protección de Credenciales
            </h3>
            <p>
              Se emplean protocolos seguros HTTPS con cifrado en tránsito (TLS), almacenamiento en base de datos PostgreSQL con acceso restringido mediante roles, tokens de sesión seguros y sanitización estricta de entradas para prevenir vulnerabilidades.
            </p>
          </div>

          <div>
            <h3 className='font-bold text-base font-frances text-foreground mb-2'>
              2.4. Control del Usuario sobre sus Conversaciones
            </h3>
            <p>
              El usuario tiene el derecho de eliminar sus sesiones de chat, limpiar su historial y solicitar la baja o revocación de su acceso en cualquier momento a través de los paneles de configuración de la plataforma o escribiendo al canal de contacto.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Naturaleza Experimental del Modelo Generativo y Verificación Manual */}
      <Card id='modelo-generativo' className='mb-8 border-border/80 shadow-xs scroll-mt-24'>
        <CardHeader>
          <CardTitle className='flex items-center text-xl sm:text-2xl font-semibold font-frances'>
            <AlertTriangle className='mr-2.5 h-6 w-6 text-amber-500' />
            <span>3. Naturaleza del Modelo Generativo y Verificación Manual</span>
          </CardTitle>
          <CardDescription>
            Advertencias esenciales sobre el alcance y limitaciones de la inteligencia artificial probabilística.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6 text-sm leading-relaxed text-foreground/90'>
          <div className='p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2'>
            <h4 className='font-frances font-bold text-foreground flex items-center gap-2'>
              <BookOpen className='w-4 h-4 text-primary' />
              Obligación de Verificación Manual por el Usuario
            </h4>
            <p>
              <strong>SipánGPT es un modelo de inteligencia artificial generativa y probabilística que puede cometer errores, desactualizarse o producir alucinaciones.</strong> Ninguna respuesta proporcionada por el asistente sustituye resoluciones decanales, reglamentos universitarios vigentes ni indicaciones de las dependencias oficiales de la Universidad Señor de Sipán.
            </p>
            <p className='font-semibold text-primary'>
              Es responsabilidad ineludible del usuario cotejar y verificar manualmente toda información crítica en las fuentes normativas y canales oficiales institucionales antes de tomar decisiones académicas, económicas o administrativas.
            </p>
          </div>

          <div>
            <h3 className='font-bold text-base font-frances text-foreground mb-2'>
              3.1. Citas y Enlaces de Respaldo RAG
            </h3>
            <p>
              Siempre que es posible, el sistema indexa y provee citas con el número de página y enlace a los reglamentos y guías de donde extrajo la información. El usuario debe consultar el fragmento original para validar la vigencia de cualquier cronograma o requisito.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Propiedad Intelectual, Imágenes y Datos Públicos */}
      <Card id='propiedad-intelectual' className='mb-8 border-border/80 shadow-xs scroll-mt-24'>
        <CardHeader>
          <CardTitle className='flex items-center text-xl sm:text-2xl font-semibold font-frances'>
            <ImageIcon className='mr-2.5 h-6 w-6 text-primary' />
            <span>4. Propiedad Intelectual, Imágenes Institucionales y Datos Públicos</span>
          </CardTitle>
          <CardDescription>
            Reconocimiento explícito de titularidad de activos gráficos y fuentes de información.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6 text-sm leading-relaxed text-foreground/90'>
          <div>
            <h3 className='font-bold text-base font-frances text-foreground mb-2'>
              4.1. Titularidad de Imágenes, Logotipos y Marcas Institucionales
            </h3>
            <p>
              <strong>Todas las imágenes, logotipos, emblemas institucionales y fotografías de la Universidad Señor de Sipán son propiedad exclusiva de sus respectivos titulares y de la Universidad Señor de Sipán.</strong>
            </p>
            <p className='mt-2'>
              Este proyecto de tesis <strong>en ningún caso se apropia, reclama derechos de autor, titularidad comercial ni exclusividad</strong> sobre el material gráfico de la institución. Su utilización en la plataforma responde únicamente a criterios de ambientación didáctica, referencia contextual y rigor académico dentro del marco de la tesis universitaria.
            </p>
          </div>

          <div>
            <h3 className='font-bold text-base font-frances text-foreground mb-2'>
              4.2. Recopilación Exclusiva de Fuentes Públicas
            </h3>
            <p>
              Toda la base documental utilizada para alimentar el motor RAG de SipánGPT ha sido recopilada de <strong>fuentes públicas de libre acceso</strong> disponibles en internet y portales web institucionales (tales como el Reglamento General de Grados y Títulos, Reglamento del Estudiante, Estatuto Universitario, Guías de Matrícula y manuales publicados abiertamente por la USS).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 5. Auditoría Institucional y Contacto Seguro */}
      <Card id='auditoria' className='border-border/80 shadow-xs scroll-mt-24'>
        <CardHeader>
          <CardTitle className='flex items-center text-xl sm:text-2xl font-semibold font-frances'>
            <ShieldAlert className='mr-2.5 h-6 w-6 text-primary' />
            <span>5. Auditoría Técnica, Requerimientos Institucionales y Contacto</span>
          </CardTitle>
          <CardDescription>
            Canal directo para autoridades universitarias, solicitudes de auditoría o cesión del proyecto.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6 text-sm leading-relaxed text-foreground/90'>
          <div className='p-4 rounded-xl border border-border/80 bg-card space-y-3'>
            <h4 className='font-frances font-bold text-foreground'>
              Solicitudes de las Autoridades de la Universidad Señor de Sipán
            </h4>
            <p>
              Si las autoridades, decanatos, oficina de asesoría jurídica o dependencias de la Universidad Señor de Sipán requieren:
            </p>
            <ul className='list-disc list-inside space-y-1 pl-2 text-muted-foreground'>
              <li>Una <strong>auditoría técnica integral</strong> del código fuente, modelos o base de datos.</li>
              <li>Revisión o retiro de algún documento específico indexado en la base RAG.</li>
              <li>Coordinaciones sobre la <strong>propiedad, adopción o cesión institucional del proyecto</strong> para beneficio de la comunidad estudiantil.</li>
            </ul>
            <p className='pt-1'>
              Pueden comunicarse de forma directa con el investigador principal para atender cualquier requerimiento formal con la máxima prioridad.
            </p>
          </div>

          {/* Mecanismo de contacto seguro protegido anti-scraping */}
          <div className='rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:p-6 space-y-4'>
            <div className='flex items-center justify-between flex-wrap gap-2'>
              <div className='flex items-center gap-2 font-frances font-semibold text-foreground'>
                <Mail className='w-4 h-4 text-primary' />
                <span>Correo Electrónico de Contacto Oficial y Auditoría</span>
              </div>
              <span className='text-[11px] px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50'>
                Protegido contra robots de spam
              </span>
            </div>

            <p className='text-xs text-muted-foreground leading-relaxed'>
              Para evitar que recopiladores automatizados y spiders de búsqueda indexen indiscriminadamente la dirección de contacto, el correo se encuentra ofuscado en el código fuente.
            </p>

            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2' data-nosnippet>
              {!isEmailRevealed ? (
                <Button
                  onClick={() => setIsEmailRevealed(true)}
                  variant='outline'
                  className='gap-2 font-medium cursor-pointer border-primary/40 hover:bg-primary/10'
                >
                  <Eye className='w-4 h-4 text-primary' />
                  Haz clic aquí para mostrar el correo de contacto
                </Button>
              ) : (
                <div className='flex flex-wrap items-center gap-2 w-full'>
                  <div className='px-3.5 py-2 rounded-xl bg-background border border-border font-mono text-sm font-semibold select-all text-primary'>
                    {contactEmail}
                  </div>
                  <Button
                    onClick={handleCopyEmail}
                    variant='outline'
                    size='sm'
                    className='gap-1.5 cursor-pointer'
                    title='Copiar correo'
                  >
                    {copied ? <Check className='w-4 h-4 text-green-500' /> : <Copy className='w-4 h-4' />}
                    <span>{copied ? 'Copiado' : 'Copiar'}</span>
                  </Button>
                  <a
                    href={`mailto:${contactEmail}?subject=Consulta%20sobre%20Sip%C3%A1nGPT%20-%20Auditor%C3%ADa`}
                    rel='nofollow noindex'
                    className='inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs'
                  >
                    <Mail className='w-3.5 h-3.5' />
                    Enviar Mensaje Directo
                  </a>
                </div>
              )}
            </div>

            <div className='pt-2 border-t border-border/40 flex items-center gap-2 text-xs text-muted-foreground'>
              <span>Perfil profesional del autor:</span>
              <a
                href='https://www.linkedin.com/in/jhangmez'
                target='_blank'
                rel='noopener noreferrer'
                className='font-semibold text-primary underline hover:text-primary/80 inline-flex items-center gap-1'
              >
                LinkedIn @jhangmez
                <ExternalLink className='w-3 h-3' />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
