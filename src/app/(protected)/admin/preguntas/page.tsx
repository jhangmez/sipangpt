'use client'
import { useState, useCallback, useEffect } from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PreguntasForm from '@Components/(private)/preguntas-form'
import TablaPreguntas from '@Components/(private)/TablaPreguntas'
import { toast } from 'sonner'
interface Pregunta {
  id: number
  contenido: string
  creadoPor: {
    name: string | null
  }
}
export default function Page() {
  const [refresh, setRefresh] = useState(false)
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])

  const handlePreguntaCreada = useCallback(() => {
    setRefresh(!refresh)
  }, [refresh])

  const fetchPreguntas = async () => {
    try {
      const response = await fetch('/api/preguntas')
      if (response.ok) {
        const data = await response.json()
        setPreguntas(data)
      } else {
        toast.error('Error al cargar las preguntas.')
      }
    } catch (error) {
      console.error('Error al cargar las preguntas:', error)
      toast.error('Error al cargar las preguntas.')
    }
  }

  useEffect(() => {
    fetchPreguntas()
  }, [refresh])
  return (
    <>
      <header className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
        <div className='flex items-center gap-2 px-4'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='mr-2 h-4' />
          <Breadcrumb>
            <BreadcrumbList className='font-exo'>
              <BreadcrumbItem className='hidden md:block'>
                <BreadcrumbLink href='/admin/preguntas'>Gestión</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className='hidden md:block' />
              <BreadcrumbItem>
                <BreadcrumbPage>Preguntas</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>
        <Card>
          <CardHeader>
            <CardTitle className='font-frances'>Cambiar Preguntas</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-6'>
            <PreguntasForm onPreguntaCreada={handlePreguntaCreada} />
            <TablaPreguntas
              preguntas={preguntas}
              refresh={refresh}
              setPreguntas={setPreguntas}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
