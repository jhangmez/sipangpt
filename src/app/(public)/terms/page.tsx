'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  InfoCircledIcon,
  LockClosedIcon,
  ChatBubbleIcon,
  ExclamationTriangleIcon,
  LinkedInLogoIcon
} from '@radix-ui/react-icons'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeftIcon } from '@radix-ui/react-icons'

export default function TermsAndPrivacyPage() {
  const router = useRouter()

  return (
    <section className='container mx-auto py-8 px-4 font-exo relative'>
      <div className='fixed bottom-10 right-4 z-50'>
        <Button
          onClick={() => router.push('/login')}
          variant='outline'
          size='icon'
          className='rounded-full bg-primary text-gray-sipan shadow-md'
        >
          <ArrowLeftIcon className='w-4 h-2' />
        </Button>
      </div>
      <h1 className='text-4xl font-bold mb-8 text-center font-frances text-primary'>
        Términos de Uso y Política de Privacidad de SipánGPT
      </h1>
      <Card className='mb-8'>
        <CardHeader>
          <CardTitle className='flex items-center text-2xl font-semibold'>
            <InfoCircledIcon className='mr-2 h-6 w-6' />
            <span id='condiciones'>Términos de Uso</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <h2 className='text-xl font-semibold mb-4'>
            1. Aceptación de los Términos
          </h2>
          <p className='mb-4'>
            Al acceder y utilizar SipánGPT, usted acepta cumplir con estos
            términos y condiciones de uso. Si no está de acuerdo con alguna
            parte de los términos, no podrá acceder al servicio.
          </p>

          <h2 className='text-xl font-semibold mb-4'>
            2. Descripción del Servicio
          </h2>
          <p className='mb-4'>
            SipánGPT es un chatbot experimental que utiliza un modelo Llama.
            Este servicio está diseñado con fines académicos y de investigación.
          </p>

          <h2 className='text-xl font-semibold mb-4'>3. Licencia Llama</h2>
          <p className='mb-4'>
            SipánGPT utiliza el modelo Llama, y por lo tanto, la licencia de
            Llama se extiende a este servicio. Los usuarios deben cumplir con
            los términos de la licencia Llama al utilizar SipánGPT.
          </p>

          <h2 className='text-xl font-semibold mb-4'>
            4. Responsabilidad del Usuario
          </h2>
          <p className='mb-4'>
            Las respuestas generadas por SipánGPT deben ser verificadas por el
            usuario. El creador de SipánGPT no se hace responsable de la
            precisión o las consecuencias del uso de la información
            proporcionada por el chatbot. Se recomienda encarecidamente
            verificar manualmente todas las fuentes y la información obtenida a
            través de SipánGPT.
          </p>

          <h2 className='text-xl font-semibold mb-4'>
            5. Exclusión de Responsabilidad
          </h2>
          <p className='mb-4'>
            La Universidad Señor de Sipán ha otorgado su consentimiento para el
            uso de su nombre en este proyecto, pero no está involucrada en el
            desarrollo, mantenimiento o operación de SipánGPT. La Universidad
            Señor de Sipán queda exenta de cualquier responsabilidad relacionada
            con el uso, funcionamiento o consecuencias derivadas de SipánGPT.
          </p>

          <h2 className='text-xl font-semibold mb-4'>
            6. Cambios en los Términos
          </h2>
          <p className='mb-4'>
            Nos reservamos el derecho de modificar estos términos en cualquier
            momento. Le notificaremos cualquier cambio significativo por correo
            electrónico. El uso continuado de SipánGPT después de dichos cambios
            constituye su aceptación de los nuevos términos.
          </p>
        </CardContent>
      </Card>

      <Separator className='my-8' />

      <Card className='mb-8'>
        <CardHeader>
          <CardTitle className='flex items-center text-2xl font-semibold'>
            <LockClosedIcon className='mr-2 h-6 w-6' />
            <span id='politica'>Política de Privacidad</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <h2 className='text-xl font-semibold mb-4'>
            1. Recopilación de Datos
          </h2>
          <p className='mb-4'>
            SipánGPT recopila información personal que usted proporciona
            directamente, como nombre de usuario y datos de las conversaciones.
            Esta información se utiliza únicamente para fines propios y
            académicos, y no se comparte con terceros.
          </p>

          <h2 className='text-xl font-semibold mb-4'>
            2. Uso de la Información
          </h2>
          <p className='mb-4'>
            La información recopilada se utiliza principalmente para mejorar
            SipánGPT y para fines de investigación académica. No compartimos sus
            datos personales con terceros sin su consentimiento explícito,
            excepto cuando sea requerido por la ley.
          </p>

          <h2 className='text-xl font-semibold mb-4'>3. Protección de Datos</h2>
          <p className='mb-4'>
            Implementamos medidas de seguridad para proteger su información
            personal contra acceso no autorizado, alteración, divulgación o
            destrucción.
          </p>

          <h2 className='text-xl font-semibold mb-4'>
            4. Cambios en la Política de Privacidad
          </h2>
          <p className='mb-4'>
            Nos reservamos el derecho de modificar esta política de privacidad
            en cualquier momento. Cualquier cambio significativo será notificado
            a través de su correo electrónico registrado.
          </p>
        </CardContent>
      </Card>

      <Card className='mb-8'>
        <CardHeader>
          <CardTitle className='flex items-center text-2xl font-semibold'>
            <ChatBubbleIcon className='mr-2 h-6 w-6' />
            <span>Uso de SipánGPT</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <h2 className='text-xl font-semibold mb-4'>
            Naturaleza Experimental
          </h2>
          <p className='mb-4'>
            SipánGPT es un chatbot experimental. Los usuarios deben ser
            conscientes de que las respuestas generadas pueden no ser siempre
            precisas o completas. Se recomienda encarecidamente verificar
            cualquier información importante obtenida a través de SipánGPT con
            fuentes confiables.
          </p>

          <h2 className='text-xl font-semibold mb-4'>
            Verificación de Fuentes
          </h2>
          <p className='mb-4'>
            Es responsabilidad del usuario verificar manualmente las fuentes y
            la información proporcionada por SipánGPT. No se debe confiar
            únicamente en las respuestas del chatbot para tomar decisiones
            importantes o para obtener información crítica.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center text-2xl font-semibold'>
            <ExclamationTriangleIcon className='mr-2 h-6 w-6' />
            <span>Aviso Legal</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='mb-4'>
            SipánGPT es un proyecto experimental desarrollado con fines
            académicos y de investigación. Ni el creador de SipánGPT ni la
            Universidad Señor de Sipán son responsables de cualquier
            consecuencia derivada del uso de este servicio. Los usuarios
            utilizan SipánGPT bajo su propio riesgo y responsabilidad.
          </p>
          <h3 className='text-lg font-medium mb-2'>Contacto</h3>
          <p className='mb-4'>
            Si tiene alguna pregunta sobre estos términos, nuestra política de
            privacidad o el uso de SipánGPT, por favor contacte al
            desarrollador:
          </p>
          <Link
            href='https://www.linkedin.com/in/jhangmez'
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center text-blue-600 hover:underline font-semibold'
          >
            <LinkedInLogoIcon className='mr-2 h-5 w-5' />
            LinkedIn de @jhangmez
          </Link>
        </CardContent>
      </Card>
    </section>
  )
}
