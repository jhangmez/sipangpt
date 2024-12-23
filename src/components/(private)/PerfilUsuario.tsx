'use client'

import { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { User as Usuario } from '@prisma/client'

const formSchema = z.object({
  name: z.string().min(3, {
    message: 'El username debe tener al menos 3 caracteres.'
  }),
  first_name: z.string().optional(),
  last_name: z.string().optional()
})

export default function PerfilUsuario() {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      first_name: '',
      last_name: ''
    }
  })

  const fetchUsuario = async () => {
    try {
      const response = await fetch('/api/cuenta')
      if (response.ok) {
        const data = await response.json()
        setUsuario(data)
        form.reset({
          name: data.name || '',
          first_name: data.first_name || '',
          last_name: data.last_name || ''
        })
      } else {
        toast.error('Error al cargar los datos del usuario.')
      }
    } catch (error) {
      console.error('Error al cargar los datos del usuario:', error)
      toast.error('Error al cargar los datos del usuario.')
    }
  }

  useEffect(() => {
    fetchUsuario()
  }, [])

  const handleEditar = () => {
    setIsEditing(true)
  }

  const handleCancelar = () => {
    setIsEditing(false)
    form.reset({
      name: usuario?.name || '',
      first_name: usuario?.first_name || '',
      last_name: usuario?.last_name || ''
    })
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      // Validar que el nombre de usuario no esté vacío
      if (!values.name) {
        toast.error('El username no puede estar vacío.')
        setIsSubmitting(false)
        return
      }

      const response = await fetch('/api/cuenta', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      })

      if (response.ok) {
        toast.success('Perfil actualizado correctamente.')
        fetchUsuario() // Actualiza los datos del usuario
        setIsEditing(false)
      } else {
        toast.error('Error al actualizar el perfil.')
      }
    } catch (error) {
      console.error('Error al actualizar el perfil:', error)
      toast.error('Error al actualizar el perfil.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!usuario) {
    return <div>Cargando...</div>
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center space-x-4'>
        <Avatar className='h-20 w-20'>
          <AvatarImage src={usuario.image || ''} alt={usuario.name || ''} />
          <AvatarFallback>
            {(usuario.name || '').substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className='text-2xl font-bold'>{usuario.name}</h2>
          <p className='text-gray-500'>{usuario.email}</p>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div>
          <Label htmlFor='createdAt'>Fecha de creación</Label>
          <Input
            id='createdAt'
            value={format(usuario.createdAt, 'dd MMM yyyy', { locale: es })}
            readOnly
            className='mt-1'
          />
        </div>
        <div>
          <Label htmlFor='role'>Tipo de usuario</Label>
          <Input
            id='role'
            value={usuario.role === 'admin' ? 'Administrador' : 'Usuario'}
            readOnly
            className='mt-1'
          />
        </div>
      </div>

      {isEditing ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='ejemplo123' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='first_name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombres</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='last_name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellidos</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex gap-4'>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className='flex items-center justify-center'>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-gray-100'></div>
                  </div>
                ) : (
                  'Guardar cambios'
                )}
              </Button>
              <Button
                variant='outline'
                onClick={handleCancelar}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <>
          <div className='grid grid-cols-2 gap-4 mt-4'>
            <div>
              <Label htmlFor='username'>Username</Label>
              <Input
                id='username'
                value={usuario.name || ''}
                readOnly
                className='mt-1'
              />
            </div>
            <div>
              <Label htmlFor='first_name'>Nombre</Label>
              <Input
                id='first_name'
                value={usuario.first_name || ''}
                readOnly
                className='mt-1'
              />
            </div>
            <div>
              <Label htmlFor='last_name'>Apellido</Label>
              <Input
                id='last_name'
                value={usuario.last_name || ''}
                readOnly
                className='mt-1'
              />
            </div>
            <div>
              <Label htmlFor='emailVerified'>Correo verificado</Label>
              <div className='mt-1'>
                {usuario.emailVerified ? (
                  <Badge variant='secondary'>Verificado</Badge>
                ) : (
                  <Badge variant='destructive'>No verificado</Badge>
                )}
              </div>
            </div>
          </div>
          <Button onClick={handleEditar} className='mt-4'>
            Editar perfil
          </Button>
        </>
      )}
    </div>
  )
}
