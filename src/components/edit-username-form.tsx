'use client'

import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import React, { useEffect, useState } from 'react'
import { ModeToggle } from './mode-toggle'
import { toast } from 'sonner'

const formSchema = z.object({
  username: z.string().min(2, {
    message: 'El nombre debe tener al menos 2 caracteres.'
  })
})

interface EditUsernameFormProps {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export default function EditUsernameForm({ setOpen }: EditUsernameFormProps) {
  const [name, setName] = useState('')

  useEffect(() => {
    setName(localStorage.getItem('ollama_user') || 'Anonymous')
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: ''
    }
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    localStorage.setItem('ollama_user', values.username)
    window.dispatchEvent(new Event('storage'))
    toast.success('Nombre actualizado exitosamente')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    form.setValue('username', e.currentTarget.value)
    setName(e.currentTarget.value)
  }

  return (
    <Form {...form}>
      <div className='w-full flex flex-col gap-4 pt-8'>
        <FormLabel>Tema</FormLabel>
        <ModeToggle />
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <div className='md:flex gap-4'>
                  <Input
                    {...field}
                    type='text'
                    value={name}
                    onChange={(e) => handleChange(e)}
                  />
                  <Button type='submit'>Cambiar nombre</Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
