'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

const formSchema = z.object({
  email: z.string().email({
    message: 'Por favor ingresa un correo electrónico válido.'
  })
})

interface PersonasFormProps {
  onPersonaCreada: () => void
  personas: {
    id: string
    email: string
    name: string | null
    role: string
  }[]
}

export default function PersonasForm({
  onPersonaCreada,
  personas
}: PersonasFormProps) {
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: ''
    }
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!session || !session.user) {
      toast.error('Debes iniciar sesión para agregar una persona.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/personas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: values.email
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.error === 'El correo electrónico no existe.') {
          toast.error('El correo electrónico no existe.')
        } else if (
          data.error === 'El usuario ya tiene el rol de administrador.'
        ) {
          toast.error('El usuario ya tiene el rol de administrador.')
        } else {
          toast.success('Se han otorgado credenciales de administrador.')
          form.reset()
          onPersonaCreada()
        }
      } else {
        toast.error('Hubo un problema al agregar a la persona.')
      }
    } catch (error) {
      toast.error('Hubo un problema al agregar a la persona.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-lg font-frances'>
                Correo Electrónico
              </FormLabel>
              <FormControl>
                <Input
                  type='email'
                  placeholder='Ingresa el correo electrónico...'
                  className='max-w-md'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type='submit'
          className='w-full sm:w-auto font-exo font-semibold'
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className='flex items-center justify-center'>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-gray-100'></div>
            </div>
          ) : (
            'Agregar Persona'
          )}
        </Button>
      </form>
    </Form>
  )
}
