'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  createAdminInvitation,
  revokeAdminInvitation,
  removeAdminRole,
} from '@/lib/actions/admin-invitations'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ShieldCheck,
  UserPlus,
  Copy,
  Check,
  Trash2,
  Clock,
  Mail,
  UserX,
  Link as LinkIcon,
  ShieldAlert,
} from 'lucide-react'
import { isInitialAdminEmail } from '@/constants/admin'

interface AdminUserItem {
  id: string
  name: string | null
  firstName: string | null
  lastName: string | null
  email: string
  image: string | null
  role: string
  createdAt: Date
}

interface InvitationItem {
  id: string
  email: string
  token: string
  role: string
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'
  expiresAt: Date
  createdAt: Date
  invitedBy?: {
    name: string | null
    email: string
  } | null
}

interface AdministratorsManagerProps {
  initialAdmins: AdminUserItem[]
  initialInvitations: InvitationItem[]
}

export function AdministratorsManager({
  initialAdmins,
  initialInvitations,
}: AdministratorsManagerProps) {
  const [admins, setAdmins] = React.useState<AdminUserItem[]>(initialAdmins)
  const [invitations, setInvitations] = React.useState<InvitationItem[]>(initialInvitations)

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [email, setEmail] = React.useState('')
  const [daysValid, setDaysValid] = React.useState(7)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [createdInviteLink, setCreatedInviteLink] = React.useState<string | null>(null)
  const [copiedLink, setCopiedLink] = React.useState(false)

  const getInviteUrl = (token: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/invitacion/${token}`
    }
    return `/invitacion/${token}`
  }

  const handleCopyLink = async (url: string) => {
    await navigator.clipboard.writeText(url)
    setCopiedLink(true)
    toast.success('Enlace de invitación copiado al portapapeles')
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsSubmitting(true)
    try {
      const res = await createAdminInvitation(email, Number(daysValid))
      if (res.success && res.invitation) {
        const fullUrl = getInviteUrl(res.invitation.token)
        setCreatedInviteLink(fullUrl)
        setInvitations((prev) => [
          {
            ...res.invitation,
            invitedBy: null,
          } as InvitationItem,
          ...prev.filter((i) => i.id !== res.invitation.id),
        ])
        toast.success('Invitación y pre-registro generados exitosamente')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al generar la invitación')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRevokeInvitation = async (id: string) => {
    try {
      await revokeAdminInvitation(id)
      setInvitations((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, status: 'REVOKED' } : inv))
      )
      toast.success('Invitación cancelada')
    } catch (err: any) {
      toast.error(err.message || 'Error al cancelar la invitación')
    }
  }

  const handleRemoveAdmin = async (userId: string, adminEmail: string) => {
    if (isInitialAdminEmail(adminEmail)) {
      toast.error('No se puede revocar privilegios al Administrador Principal')
      return
    }

    if (!confirm(`¿Estás seguro de revocar el rol de administrador a ${adminEmail}?`)) {
      return
    }

    try {
      await removeAdminRole(userId)
      setAdmins((prev) => prev.filter((a) => a.id !== userId))
      toast.success(`Rol de administrador revocado a ${adminEmail}`)
    } catch (err: any) {
      toast.error(err.message || 'Error al revocar el rol')
    }
  }

  return (
    <div className='space-y-6 font-exo'>
      {/* Cabecera y Botón para Invitar Administrador */}
      <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div className='space-y-1'>
          <h2 className='font-frances text-xl font-bold text-foreground flex items-center gap-2'>
            <ShieldCheck className='w-5 h-5 text-primary' />
            Equipo de Administradores
          </h2>
          <p className='text-xs text-muted-foreground max-w-xl leading-relaxed'>
            Gestiona los administradores actuales y genera invitaciones con enlace único o pre-registro automático para nuevos colaboradores institucionales.
          </p>
        </div>

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) {
              setCreatedInviteLink(null)
              setEmail('')
            }
          }}
        >
          <DialogTrigger
            render={
              <Button className='gap-2 rounded-xl text-xs shrink-0 cursor-pointer shadow-xs'>
                <UserPlus className='w-4 h-4' /> Invitar Administrador
              </Button>
            }
          />
          <DialogContent className='max-w-md rounded-3xl p-6 font-exo'>
            <DialogHeader className='space-y-2'>
              <DialogTitle className='font-frances text-xl'>
                Generar Invitación de Administrador
              </DialogTitle>
              <DialogDescription className='text-xs text-muted-foreground'>
                Crea un enlace único y un pre-registro. Al autenticarse con este correo, el usuario recibirá automáticamente el rol de Administrador.
              </DialogDescription>
            </DialogHeader>

            {!createdInviteLink ? (
              <form onSubmit={handleCreateInvitation} className='space-y-4 pt-2'>
                <div className='space-y-2'>
                  <Label htmlFor='adminEmail' className='text-xs font-semibold'>
                    Correo Institucional
                  </Label>
                  <Input
                    id='adminEmail'
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='colaborador@uss.edu.pe'
                    className='rounded-xl text-xs'
                    required
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='daysValid' className='text-xs font-semibold'>
                    Vigencia del Enlace
                  </Label>
                  <select
                    id='daysValid'
                    value={daysValid}
                    onChange={(e) => setDaysValid(Number(e.target.value))}
                    className='w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-exo text-foreground focus:outline-none focus:ring-1 focus:ring-primary'
                  >
                    <option value={3}>3 días</option>
                    <option value={7}>7 días (Recomendado)</option>
                    <option value={14}>14 días</option>
                    <option value={30}>30 días</option>
                  </select>
                </div>

                <div className='flex justify-end gap-2 pt-2'>
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={() => setIsDialogOpen(false)}
                    className='rounded-xl text-xs'
                  >
                    Cancelar
                  </Button>
                  <Button
                    type='submit'
                    disabled={isSubmitting}
                    className='rounded-xl text-xs'
                  >
                    {isSubmitting ? 'Generando...' : 'Generar Enlace'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className='space-y-4 pt-2'>
                <div className='rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2 text-xs'>
                  <p className='font-semibold text-emerald-700 dark:text-emerald-300'>
                    ¡Invitación y Pre-registro Creados!
                  </p>
                  <p className='text-muted-foreground text-[11px] leading-relaxed'>
                    Comparte este enlace con el destinatario o pídele que inicie sesión con su cuenta institucional ({email}):
                  </p>
                  <div className='flex items-center gap-2 pt-1'>
                    <Input
                      readOnly
                      value={createdInviteLink}
                      className='text-xs font-mono bg-background'
                    />
                    <Button
                      type='button'
                      size='sm'
                      onClick={() => handleCopyLink(createdInviteLink)}
                      className='gap-1.5 rounded-xl shrink-0'
                    >
                      {copiedLink ? (
                        <Check className='w-4 h-4 text-emerald-400' />
                      ) : (
                        <Copy className='w-4 h-4' />
                      )}
                      Copiar
                    </Button>
                  </div>
                </div>

                <div className='flex justify-end pt-2'>
                  <Button
                    type='button'
                    onClick={() => {
                      setIsDialogOpen(false)
                      setCreatedInviteLink(null)
                    }}
                    className='rounded-xl text-xs'
                  >
                    Listo
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Sección 1: Administradores Actuales */}
      <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4'>
        <div className='border-b border-border/40 pb-3 flex items-center justify-between'>
          <h3 className='font-frances text-base font-bold text-foreground'>
            Administradores Activos ({admins.length})
          </h3>
          <Badge variant='outline' className='text-xs font-mono'>
            Rol ADMIN
          </Badge>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          {admins.map((admin) => {
            const isInitial = isInitialAdminEmail(admin.email)
            const dateStr = new Date(admin.createdAt).toLocaleDateString('es-PE', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })

            return (
              <div
                key={admin.id}
                className='rounded-2xl border border-border/70 p-4 space-y-3 bg-card/60 flex flex-col justify-between'
              >
                <div className='flex items-center gap-3'>
                  <Avatar className='h-10 w-10 rounded-2xl border border-border shrink-0'>
                    <AvatarImage src={admin.image || undefined} alt={admin.name || 'Admin'} />
                    <AvatarFallback className='rounded-2xl font-exo text-xs font-semibold bg-primary/10 text-primary'>
                      {admin.name ? admin.name.slice(0, 2).toUpperCase() : 'USS'}
                    </AvatarFallback>
                  </Avatar>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      <p className='truncate text-xs font-bold text-foreground'>
                        {admin.name || 'Administrador'}
                      </p>
                      {isInitial && (
                        <Badge variant='default' className='text-[8px] py-0 px-1.5 font-bold uppercase'>
                          Principal
                        </Badge>
                      )}
                    </div>
                    <p className='truncate text-[11px] text-muted-foreground'>
                      {admin.email}
                    </p>
                  </div>
                </div>

                <div className='flex items-center justify-between pt-2 border-t border-border/30 text-[11px] text-muted-foreground'>
                  <span>Desde: {dateStr}</span>
                  {!isInitial && (
                    <Button
                      variant='ghost'
                      size='xs'
                      onClick={() => handleRemoveAdmin(admin.id, admin.email)}
                      className='text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 text-[10px] gap-1 h-6 px-2 rounded-lg'
                    >
                      <UserX className='w-3 h-3' /> Revocar Rol
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sección 2: Invitaciones y Pre-registros Pendientes */}
      <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4'>
        <div className='border-b border-border/40 pb-3 flex items-center justify-between'>
          <h3 className='font-frances text-base font-bold text-foreground flex items-center gap-2'>
            <Clock className='w-4 h-4 text-primary' />
            Invitaciones y Pre-registros ({invitations.length})
          </h3>
        </div>

        {invitations.length === 0 ? (
          <div className='py-8 text-center text-xs text-muted-foreground space-y-1'>
            <Mail className='w-6 h-6 mx-auto text-muted-foreground/60 mb-2' />
            <p className='font-semibold text-foreground'>No hay invitaciones registradas</p>
            <p className='text-[11px]'>Genera un enlace para añadir nuevos administradores al sistema.</p>
          </div>
        ) : (
          <div className='space-y-2.5'>
            {invitations.map((inv) => {
              const inviteUrl = getInviteUrl(inv.token)
              const isPending = inv.status === 'PENDING'
              const isAccepted = inv.status === 'ACCEPTED'
              const isExpired = inv.status === 'EXPIRED'
              const isRevoked = inv.status === 'REVOKED'

              const expiresDate = new Date(inv.expiresAt).toLocaleDateString('es-PE', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })

              return (
                <div
                  key={inv.id}
                  className='rounded-2xl border border-border/70 p-3.5 sm:p-4 bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3'
                >
                  <div className='space-y-1 min-w-0 flex-1'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <span className='font-bold text-xs text-foreground truncate'>
                        {inv.email}
                      </span>
                      {isPending && (
                        <Badge variant='outline' className='border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-[9px] py-0'>
                          Pendiente / Pre-registro
                        </Badge>
                      )}
                      {isAccepted && (
                        <Badge variant='outline' className='border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[9px] py-0'>
                          Aceptada
                        </Badge>
                      )}
                      {isExpired && (
                        <Badge variant='outline' className='border-muted-foreground/40 text-muted-foreground text-[9px] py-0'>
                          Expirada
                        </Badge>
                      )}
                      {isRevoked && (
                        <Badge variant='outline' className='border-rose-500/40 text-rose-600 bg-rose-500/10 text-[9px] py-0'>
                          Cancelada
                        </Badge>
                      )}
                    </div>
                    <p className='text-[11px] text-muted-foreground'>
                      Vence: {expiresDate} {inv.invitedBy?.email ? `• Creada por ${inv.invitedBy.email}` : ''}
                    </p>
                  </div>

                  {isPending && (
                    <div className='flex items-center gap-2 shrink-0'>
                      <Button
                        size='xs'
                        variant='outline'
                        onClick={() => handleCopyLink(inviteUrl)}
                        className='gap-1 text-[11px] rounded-xl'
                      >
                        <LinkIcon className='w-3 h-3' /> Copiar Enlace
                      </Button>
                      <Button
                        size='xs'
                        variant='ghost'
                        onClick={() => handleRevokeInvitation(inv.id)}
                        className='text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 text-[11px] rounded-xl'
                      >
                        <Trash2 className='w-3 h-3' /> Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
