'use client'

import { Button } from '@Components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface BotonEliminarProps {
  id: number
}

export default function BotonEliminar({ id }: BotonEliminarProps) {
  const handleEliminarPregunta = async () => {
    try {
      const response = await fetch(`/api/preguntas/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Pregunta eliminada correctamente.')
      } else {
        toast.error('Error al eliminar la pregunta.')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error al eliminar la pregunta.')
    }
  }

  return (
    <Button variant='ghost' size='icon' onClick={handleEliminarPregunta}>
      <Trash2 className='h-4 w-4' />
    </Button>
  )
}
