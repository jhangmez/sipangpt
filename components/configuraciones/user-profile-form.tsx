'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { updateUserProfile } from '@/lib/actions/user-settings'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, Shield, Calendar, Save, Check } from 'lucide-react'

interface UserProfileFormProps {
  user: {
    id: string
    name: string | null
    firstName: string | null
    lastName: string | null
    email: string
    image: string | null
    role: string
    createdAt: Date
  }
}

export function UserProfileForm({ user }: UserProfileFormProps) {
  const [firstName, setFirstName] = React.useState(user.firstName || '')
  const [lastName, setLastName] = React.useState(user.lastName || '')
  const [isSaving, setIsSaving] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await updateUserProfile({
        firstName,
        lastName,
      })
      if (res.success) {
        toast.success('Perfil actualizado correctamente')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar los cambios')
    } finally {
      setIsSaving(false)
    }
  }

  const formattedDate = new Date(user.createdAt).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* Tarjeta de Cabecera del Perfil */}
      <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center gap-5'>
        <Avatar className='h-20 w-20 rounded-3xl border border-border shadow-xs'>
          <AvatarImage src={user.image || undefined} alt={user.name || 'Usuario'} />
          <AvatarFallback className='rounded-3xl font-frances text-xl font-bold bg-primary/10 text-primary'>
            {user.name ? user.name.slice(0, 2).toUpperCase() : 'USS'}
          </AvatarFallback>
        </Avatar>

        <div className='space-y-1.5 text-center sm:text-left flex-1 min-w-0 font-exo'>
          <div className='flex flex-wrap items-center justify-center sm:justify-start gap-2'>
            <h2 className='font-frances text-xl font-bold text-foreground truncate'>
              {user.name || 'Estudiante USS'}
            </h2>
            <Badge
              variant={user.role === 'ADMIN' ? 'default' : 'secondary'}
              className='text-[10px] font-bold py-0.5 px-2'
            >
              {user.role}
            </Badge>
          </div>
          <p className='text-xs text-muted-foreground truncate'>{user.email}</p>
          <div className='flex items-center justify-center sm:justify-start gap-1.5 text-[11px] text-muted-foreground pt-1'>
            <Calendar className='w-3.5 h-3.5' />
            <span>Miembro desde el {formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Formulario de Datos Personales */}
      <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-5 font-exo'>
        <div className='border-b border-border/40 pb-3'>
          <h3 className='font-frances text-base font-bold text-foreground'>
            Información Personal
          </h3>
          <p className='text-xs text-muted-foreground'>
            Actualiza tus nombres y apellidos para la personalización de las respuestas.
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='firstName' className='text-xs font-semibold'>
              Nombres
            </Label>
            <Input
              id='firstName'
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder='Ej. Juan Carlos'
              className='rounded-xl border-border/80 text-sm'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='lastName' className='text-xs font-semibold'>
              Apellidos
            </Label>
            <Input
              id='lastName'
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder='Ej. Pérez Gómez'
              className='rounded-xl border-border/80 text-sm'
            />
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='email' className='text-xs font-semibold flex items-center justify-between'>
            <span>Correo Institucional USS</span>
            <span className='text-[10px] text-muted-foreground'>No modificable</span>
          </Label>
          <Input
            id='email'
            value={user.email}
            disabled
            className='rounded-xl border-border/60 bg-muted/40 text-muted-foreground text-sm cursor-not-allowed'
          />
        </div>

        <div className='flex justify-end pt-2'>
          <Button
            type='submit'
            disabled={isSaving}
            className='gap-2 rounded-xl text-xs font-semibold px-5'
          >
            {isSaving ? (
              <span>Guardando...</span>
            ) : (
              <>
                <Save className='w-4 h-4' /> Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
