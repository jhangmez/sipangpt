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
  expires: string
  createdAt: string
  updatedAt: string
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
  const [error, setError] = useState<string | null>(null) // Estado para manejar errores
  const [loadingCerrarSesion, setLoadingCerrarSesion] = useState<string | null>(
    null
  )

  const fetchSesiones = async () => {
    setIsLoading(true)
    setError(null) // Reiniciar el error
    try {
      const response = await fetch('/api/sesiones')
      if (response.ok) {
        const data = await response.json()
        const sesionesUsuario = data.filter(
          (sesion: Sesion) => sesion.userId === session.user.id
        )
        setSesiones(sesionesUsuario)
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Error al cargar las sesiones.'
        setError(errorMessage)
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Error al cargar las sesiones:', error)
      setError('Error al cargar las sesiones. Inténtalo de nuevo más tarde.')
      toast.error('Error al cargar las sesiones. Inténtalo de nuevo más tarde.')
    } finally {
      setIsLoading(false)
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
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Error al cerrar la sesión.'
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Error al cerrar la sesión:', error)
      toast.error('Error al cerrar la sesión. Inténtalo de nuevo.')
    } finally {
      setLoadingCerrarSesion(null)
    }
  }

  // Formato de fecha (modificado para aceptar strings)
  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: es })
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
        ) : error ? (
          <TableRow>
            <TableCell colSpan={4} className='text-center text-red-500'>
              {error}
            </TableCell>
          </TableRow>
        ) : sesiones.length > 0 ? (
          sesiones.map((sesion) => (
            <TableRow key={sesion.sessionToken}>
              <TableCell>{sesion.sessionToken}</TableCell>
              <TableCell>{formatDateTime(sesion.expires)}</TableCell>
              <TableCell>{formatDateTime(sesion.createdAt)}</TableCell>
              <TableCell className='text-right'>
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
