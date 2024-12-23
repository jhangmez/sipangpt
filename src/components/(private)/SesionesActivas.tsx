'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

interface Session {
  sessionToken: string
  userId: string
  expires: string // Cambia a string para evitar la conversión a Date en el componente
  createdAt: string // Cambia a string para evitar la conversión a Date en el componente
  updatedAt: string // Cambia a string para evitar la conversión a Date en el componente
  user: {
    email: string
  }
}

export default function SesionesActivas() {
  const [sesiones, setSesiones] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const latestSessionUpdate = useRef<number | null>(null)

  const fetchSesiones = async () => {
    // No mostrar el skeleton si ya hay datos
    if (sesiones.length === 0) {
      setIsLoading(true)
    }
    try {
      const response = await fetch('/api/sesiones')
      if (response.ok) {
        const data = await response.json()

        // Convertir las fechas a timestamps numéricos para la comparación
        const dataWithTimestamps = data.map((session: Session) => ({
          ...session,
          updatedAtTimestamp: new Date(session.updatedAt).getTime()
        }))

        // Si es la primera carga, o si hay nuevas sesiones, actualiza el estado
        if (
          sesiones.length === 0 ||
          dataWithTimestamps[0]?.updatedAtTimestamp !==
            latestSessionUpdate.current
        ) {
          setSesiones(data)
          latestSessionUpdate.current =
            dataWithTimestamps[0]?.updatedAtTimestamp
        }
      } else {
        toast.error('Error al cargar las sesiones.')
      }
    } catch (error) {
      console.error('Error al cargar las sesiones:', error)
      toast.error('Error al cargar las sesiones.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSesiones()

    const intervalId = setInterval(() => {
      fetchSesiones()
    }, 10000) // Actualiza cada 10 segundos

    return () => clearInterval(intervalId)
  }, [])

  // Función para formatear la fecha solo para la visualización
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, 'dd MMM yyyy, HH:mm', { locale: es })
  }

  return (
    <Card className='col-span-full md:col-span-6'>
      <CardHeader>
        <CardTitle className='font-frances text-2xl'>
          Sesiones activas ahora
        </CardTitle>
        <CardDescription className='font-exo'>
          Usuarios activos:{' '}
          {isLoading && sesiones.length === 0
            ? 'Cargando...'
            : !isLoading && sesiones.length === 0
            ? 'No hay usuarios activos'
            : sesiones.length}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table className='font-exo'>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Expira</TableHead>
              <TableHead>Iniciado</TableHead>
              <TableHead>Actualizado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && sesiones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <div className='flex items-center gap-2'>
                    <Skeleton className='h-4 w-full' />
                  </div>
                </TableCell>
              </TableRow>
            ) : sesiones.length > 0 ? (
              sesiones.map((sesion) => (
                <TableRow key={sesion.sessionToken}>
                  <TableCell>{sesion.user.email}</TableCell>
                  <TableCell>{formatDateTime(sesion.expires)}</TableCell>
                  <TableCell>{formatDateTime(sesion.createdAt)}</TableCell>
                  <TableCell>{formatDateTime(sesion.updatedAt)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className='text-center'>
                  No hay sesiones activas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
