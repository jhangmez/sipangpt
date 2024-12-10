'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const formSchema = z.object({
  contenido: z
    .string()
    .min(2, {
      message: 'La pregunta debe tener al menos 2 caracteres.'
    })
    .max(200, {
      message: 'La pregunta no puede tener más de 200 caracteres.'
    })
})

export default function PreguntasForm() {
  const { data: session } = useSession()
  const [preguntaCount, setPreguntaCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contenido: ''
    }
  })

  useEffect(() => {
    const fetchPreguntaCount = async () => {
      try {
        const response = await fetch('/api/preguntas/count')
        if (response.ok) {
          const count = await response.json()
          setPreguntaCount(count)
        } else {
          console.error('Error al obtener el conteo de preguntas')
        }
      } catch (error) {
        console.error('Error al obtener el conteo de preguntas:', error)
      }
    }

    fetchPreguntaCount()
  }, [])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!session || !session.user) {
      toast.error('Debes iniciar sesión para crear una pregunta.')
      return
    }

    if (preguntaCount >= 8) {
      toast.error('No se pueden agregar más de 8 preguntas.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/preguntas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...values,
          creadoPorId: session.user.id
        })
      })

      if (response.ok) {
        toast.success('Pregunta creada correctamente.')
        form.reset()
        setPreguntaCount(preguntaCount + 1)
        router.refresh()
      } else {
        toast.error('Hubo un problema al crear la pregunta.')
      }
    } catch (error) {
      toast.error('Hubo un problema al crear la pregunta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='contenido'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-lg'>Pregunta</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Escribe tu pregunta aquí (máximo 200 caracteres)...'
                  className='resize-none'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type='submit'
          className='w-full sm:w-auto'
          disabled={preguntaCount >= 8 || isSubmitting}
        >
          {isSubmitting ? (
            <div className='flex items-center justify-center'>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-gray-100'></div>
            </div>
          ) : preguntaCount >= 8 ? (
            'Máximo de preguntas alcanzado'
          ) : (
            'Agregar Pregunta'
          )}
        </Button>
      </form>
    </Form>
  )
}
