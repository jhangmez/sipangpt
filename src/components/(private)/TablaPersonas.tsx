'use client'

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@Components/ui/table'
import { Button } from '@Components/ui/button'
import { Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { Skeleton } from '@Components/ui/skeleton'

interface Persona {
  id: string
  email: string
  name: string | null
  role: string
}

interface TablaPersonasProps {
  personas: Persona[]
  refresh: boolean
  setPersonas: React.Dispatch<React.SetStateAction<Persona[]>>
}

export default function TablaPersonas({
  personas,
  refresh,
  setPersonas
}: TablaPersonasProps) {
  const [loadingDelete, setLoadingDelete] = useState<string | null>(null)
  const { data: session } = useSession()

  async function handleEliminarPersona(id: string) {
    setLoadingDelete(id)
    try {
      const response = await fetch(`/api/personas/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Rol de administrador revocado correctamente.')
        setPersonas(personas.filter((p) => p.id !== id))
      } else {
        toast.error('Error al revocar el rol de administrador.')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error al revocar el rol de administrador.')
    } finally {
      setLoadingDelete(null)
    }
  }

  return (
    <Table className='font-exo'>
      <TableCaption>Lista de personas con rol de administrador.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Correo Electrónico</TableHead>
          <TableHead className='text-right'>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {personas.length > 0 ? (
          personas
            .filter((persona) => persona.role === 'admin')
            .map((persona) => (
              <TableRow key={persona.id}>
                <TableCell>{persona.name || 'N/A'}</TableCell>
                <TableCell>{persona.email}</TableCell>
                <TableCell className='text-right'>
                  <Button
                    variant='ghost'
                    size='icon'
                    color='danger'
                    onClick={() => handleEliminarPersona(persona.id)}
                    disabled={
                      loadingDelete === persona.id ||
                      persona.id === session?.user.id
                    } // Deshabilita si es el usuario actual
                  >
                    {loadingDelete === persona.id ? (
                      <div className='flex items-center justify-center'>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100'></div>
                      </div>
                    ) : (
                      <Trash2 className='h-4 w-4' />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))
        ) : (
          <TableRow>
            <TableCell colSpan={3} className='text-center'>
              No hay personas con rol de administrador.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
