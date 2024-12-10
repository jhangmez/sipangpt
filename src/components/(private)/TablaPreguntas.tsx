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

interface Pregunta {
  id: number
  contenido: string
  creadoPor: {
    name: string | null
  }
}

export default function TablaPreguntas() {
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [loadingDelete, setLoadingDelete] = useState<number | null>(null)

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
  }, [])

  async function handleEliminarPregunta(id: number) {
    setLoadingDelete(id)
    try {
      const response = await fetch(`/api/preguntas/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Pregunta eliminada correctamente.')
        // Actualizar la lista de preguntas después de eliminar
        setPreguntas(preguntas.filter((p) => p.id !== id))
      } else {
        toast.error('Error al eliminar la pregunta.')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error al eliminar la pregunta.')
    } finally {
      setLoadingDelete(null)
    }
  }

  return (
    <Table className='font-exo'>
      <TableCaption>
        Lista de preguntas actuales. (Máx. 8 preguntas)
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Contenido</TableHead>
          <TableHead>Creado Por</TableHead>
          <TableHead className='text-right'>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {preguntas.length > 0 ? (
          preguntas.map((pregunta, index) => (
            <TableRow key={pregunta.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{pregunta.contenido}</TableCell>
              <TableCell>{pregunta.creadoPor.name}</TableCell>
              <TableCell className='text-right'>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => handleEliminarPregunta(pregunta.id)}
                  disabled={loadingDelete === pregunta.id}
                >
                  {loadingDelete === pregunta.id ? (
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
            <TableCell colSpan={4} className='text-center'>
              No hay preguntas.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
