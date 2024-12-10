'use client'

import { useState, useEffect } from 'react'
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

interface Session {
  sessionToken: string
  userId: string
  expires: Date
  createdAt: Date
  updatedAt: Date
  user: {
    email: string
  }
}

export default function SesionesActivas() {
  const [sesiones, setSesiones] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchSesiones = async () => {
    try {
      const response = await fetch('/api/sesiones')
      if (response.ok) {
        const data = await response.json()
        setSesiones(data)
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

  const formatDateTime = (date: Date) => {
    return format(date, 'dd MMM yyyy, HH:mm', { locale: es })
  }

  return (
    <Card className='col-span-full md:col-span-6'>
      <CardHeader>
        <CardTitle className='font-frances text-2xl'>
          Sesiones activas ahora
        </CardTitle>
        <CardDescription className='font-exo'>
          Usuarios activos: {sesiones.length}
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className='text-center'>
                  Cargando...
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
