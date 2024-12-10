'use client'

import { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Skeleton } from '@Components/ui/skeleton'
import Cookies from 'js-cookie'

interface Sesion {
  sessionToken: string
  userId: string
  expires: Date
  createdAt: Date
  updatedAt: Date
  user: {
    email: string
  }
}

interface TablaSesionesProps {
  session: Session
}

export default function TablaSesiones({ session }: TablaSesionesProps) {
  const [sesiones, setSesiones] = useState<Sesion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingCerrarSesion, setLoadingCerrarSesion] = useState<string | null>(
    null
  )

  const fetchSesiones = async () => {
    setIsLoading(true) // Activa el indicador de carga
    try {
      const response = await fetch('/api/sesiones')
      if (response.ok) {
        const data = await response.json()
        const sesionesUsuario = data.filter(
          (sesion: Sesion) => sesion.userId === session.user.id
        )
        setSesiones(sesionesUsuario)
      } else {
        toast.error('Error al cargar las sesiones.')
      }
    } catch (error) {
      console.error('Error al cargar las sesiones:', error)
      toast.error('Error al cargar las sesiones.')
    } finally {
      setIsLoading(false) // Desactiva el indicador de carga
    }
  }

  useEffect(() => {
    fetchSesiones()
  }, [])

  const handleCerrarSesion = async (sessionToken: string) => {
    setLoadingCerrarSesion(sessionToken)
    try {
      const response = await fetch(`/api/sesiones/cerrar/${sessionToken}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        toast.success('Sesión cerrada correctamente.')
        setSesiones(
          sesiones.filter((sesion) => sesion.sessionToken !== sessionToken)
        )
      } else {
        toast.error('Error al cerrar la sesión.')
      }
    } catch (error) {
      console.error('Error al cerrar la sesión:', error)
      toast.error('Error al cerrar la sesión.')
    } finally {
      setLoadingCerrarSesion(null)
    }
  }

  const formatDateTime = (date: Date) => {
    return format(date, 'dd MMM yyyy, HH:mm', { locale: es })
  }

  const currentSessionToken =
    typeof window !== 'undefined'
      ? Cookies.get('authjs.session-token') ||
        Cookies.get('__Secure-authjs.session-token')
      : null

  return (
    <Table className='font-exo'>
      <TableHeader>
        <TableRow>
          <TableHead>Sesión</TableHead>
          <TableHead>Expira</TableHead>
          <TableHead>Creada</TableHead>
          <TableHead className='text-right'>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          // Indicador de carga
          <TableRow>
            <TableCell colSpan={4}>
              <div className='flex items-center space-x-2'>
                <Skeleton className='h-6 w-24' />
                <Skeleton className='h-6 w-24' />
                <Skeleton className='h-6 w-24' />
                <Skeleton className='h-6 w-24' />
              </div>
            </TableCell>
          </TableRow>
        ) : sesiones.length > 0 ? (
          sesiones.map((sesion) => (
            <TableRow key={sesion.sessionToken}>
              <TableCell>{sesion.sessionToken}</TableCell>
              <TableCell>{formatDateTime(sesion.expires)}</TableCell>
              <TableCell>{formatDateTime(sesion.createdAt)}</TableCell>
              <TableCell className='text-right'>
                {/* Condición para deshabilitar el botón */}
                {sesion.sessionToken !== currentSessionToken && (
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => handleCerrarSesion(sesion.sessionToken)}
                    disabled={loadingCerrarSesion === sesion.sessionToken}
                  >
                    {loadingCerrarSesion === sesion.sessionToken ? (
                      <div className='flex items-center justify-center'>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100'></div>
                      </div>
                    ) : (
                      <LogOut className='h-4 w-4' />
                    )}
                  </Button>
                )}
              </TableCell>
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
  )
}
