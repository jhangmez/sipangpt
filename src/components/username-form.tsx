'use client'

import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import React from 'react'

const formSchema = z.object({
  username: z.string().min(2, {
    message: 'El nombre debe tener al menos 2 caracteres.'
  })
})

interface UsernameFormProps {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export default function UsernameForm({ setOpen }: UsernameFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: ''
    }
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    localStorage.setItem('ollama_user', values.username)
    window.dispatchEvent(new Event('storage'))
    setOpen(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8 pt-2'>
        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder='Escribe tu nombre' {...field} />
              </FormControl>
              <FormDescription>
                Esto no será publico, es solo para ti.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className='w-full' type='submit'>
          Enviar
        </Button>
      </form>
    </Form>
  )
}
