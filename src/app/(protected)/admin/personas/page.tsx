'use client'
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
import PersonasForm from '@Components/(private)/personas-form'
import TablaPersonas from '@Components/(private)/TablaPersonas'
import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

interface Persona {
  id: string
  email: string
  name: string | null
  role: string
}
export default function Page() {
  const [refresh, setRefresh] = useState(false)
  const [personas, setPersonas] = useState<Persona[]>([])

  const handlePersonaCreada = useCallback(() => {
    setRefresh(!refresh)
  }, [refresh])

  const fetchPersonas = async () => {
    try {
      const response = await fetch('/api/personas')
      if (response.ok) {
        const data = await response.json()
        setPersonas(data)
      } else {
        toast.error('Error al cargar las personas.')
      }
    } catch (error) {
      console.error('Error al cargar las personas:', error)
      toast.error('Error al cargar las personas.')
    }
  }

  useEffect(() => {
    fetchPersonas()
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
                <BreadcrumbLink href='/admin/dashboard'>Gestión</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className='hidden md:block' />
              <BreadcrumbItem>
                <BreadcrumbPage>Personas</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>
        <Card>
          <CardHeader>
            <CardTitle className='font-frances'>
              Administrar Personas (Rol Admin)
            </CardTitle>
          </CardHeader>
          <CardContent className='grid gap-6'>
            <PersonasForm
              onPersonaCreada={handlePersonaCreada}
              personas={personas}
            />
            <TablaPersonas
              personas={personas}
              refresh={refresh}
              setPersonas={setPersonas}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
