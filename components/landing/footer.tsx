import Link from 'next/link'
import { Bot, Shield, FileText, Heart, ExternalLink } from 'lucide-react'

export default function Footer() {
  return (
    <footer className='border-t border-border/40 bg-card/60 backdrop-blur-md text-muted-foreground font-exo'>
      <div className='container mx-auto px-4 sm:px-8 py-10'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8 mb-8'>
          {/* Columna 1: Marca y Propósito */}
          <div className='md:col-span-2 space-y-3'>
            <Link href='/' className='flex items-center gap-2 font-frances font-bold text-xl text-foreground'>
              <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs'>
                <Bot className='h-4 w-4' />
              </div>
              <span>Sipán<span className='text-primary'>GPT</span></span>
            </Link>
            <p className='text-sm leading-relaxed max-w-md'>
              Asistente conversacional universitario experimental desarrollado como proyecto de tesis de investigación académica por{' '}
              <a
                href='https://www.linkedin.com/in/jhangmez'
                target='_blank'
                rel='noopener noreferrer'
                className='font-semibold text-foreground underline underline-offset-2 hover:text-primary transition-colors'
              >
                Jhan Gómez P. (@jhangmez)
              </a>.
            </p>
            <p className='text-xs text-muted-foreground/80'>
              Este proyecto es independiente y <strong>no está afiliado, patrocinado ni administrado oficialmente por la Universidad Señor de Sipán</strong>.
            </p>
          </div>

          {/* Columna 2: Navegación y Chat */}
          <div className='space-y-3'>
            <h4 className='font-frances font-semibold text-sm text-foreground uppercase tracking-wider'>
              Plataforma
            </h4>
            <ul className='space-y-2 text-sm'>
              <li>
                <Link href='/' className='hover:text-foreground transition-colors'>
                  Inicio
                </Link>
              </li>
              <li>
                <Link href='/chat' className='hover:text-foreground transition-colors'>
                  Chatbot Universitario
                </Link>
              </li>
              <li>
                <Link href='/login' className='hover:text-foreground transition-colors'>
                  Acceso Institucional
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Legal y Términos */}
          <div className='space-y-3'>
            <h4 className='font-frances font-semibold text-sm text-foreground uppercase tracking-wider'>
              Legal y Privacidad
            </h4>
            <ul className='space-y-2 text-sm'>
              <li>
                <Link href='/terms#condiciones' className='hover:text-foreground transition-colors flex items-center gap-1.5'>
                  <FileText className='w-3.5 h-3.5 text-primary' />
                  Términos de Uso
                </Link>
              </li>
              <li>
                <Link href='/terms#politica' className='hover:text-foreground transition-colors flex items-center gap-1.5'>
                  <Shield className='w-3.5 h-3.5 text-primary' />
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href='/terms#auditoria' className='hover:text-foreground transition-colors flex items-center gap-1.5'>
                  <ExternalLink className='w-3.5 h-3.5 text-primary' />
                  Auditoría y Contacto
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Barra inferior */}
        <div className='pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs'>
          <p>
            © {new Date().getFullYear()} SipánGPT. Todos los derechos de imágenes y marcas registradas pertenecen a la Universidad Señor de Sipán.
          </p>
          <div className='flex items-center gap-2'>
            <span>Hecho con</span>
            <Heart className='w-3.5 h-3.5 text-red-500 fill-red-500 inline' />
            <span>por Jhan Gómez P.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
export { Footer }
