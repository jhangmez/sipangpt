'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  updateUserProfile,
  setPasswordAction,
  changePasswordAction,
  sendVerificationEmailAction,
} from '@/lib/actions/user-settings'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  User,
  Mail,
  Shield,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  GraduationCap,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Send,
  Building,
} from 'lucide-react'
import { getErrorMessage } from '@/lib/utils'
import { getInstitutionalAffiliation } from '@/lib/utils/institutional'
import { validatePasswordPolicy } from '@/lib/auth/password'
import type { UserProfileData } from '@/types'

interface UserProfileFormProps {
  user: UserProfileData
}

export function UserProfileForm({ user }: UserProfileFormProps) {
  const [firstName, setFirstName] = React.useState(user.firstName || '')
  const [lastName, setLastName] = React.useState(user.lastName || '')
  const [isSaving, setIsSaving] = React.useState(false)
  const [hasPassword, setHasPassword] = React.useState(user.hasPassword)
  const [isSendingVerification, setIsSendingVerification] = React.useState(false)

  // Modales de Contraseña
  const [isSetPasswordOpen, setIsSetPasswordOpen] = React.useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false)

  // Campos para Establecer Contraseña
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [showNewPassword, setShowNewPassword] = React.useState(false)

  // Campos para Cambiar Contraseña
  const [currentPassword, setCurrentPassword] = React.useState('')
  const [changeNewPassword, setChangeNewPassword] = React.useState('')
  const [changeConfirmPassword, setChangeConfirmPassword] = React.useState('')
  const [showChangePassword, setShowChangePassword] = React.useState(false)

  const [isPasswordSubmitting, setIsPasswordSubmitting] = React.useState(false)

  // Afiliación institucional
  const affiliation = React.useMemo(
    () => getInstitutionalAffiliation(user.email),
    [user.email]
  )

  const isEmailVerified = !!user.emailVerified

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
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al guardar los cambios')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendVerification = async () => {
    setIsSendingVerification(true)
    try {
      const res = await sendVerificationEmailAction()
      if (res.isAlreadyVerified) {
        toast.info(res.message)
      } else {
        toast.success(res.message || 'Enlace de verificación enviado a tu correo.')
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al enviar validación de correo.')
    } finally {
      setIsSendingVerification(false)
    }
  }

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden.')
      return
    }

    const policy = validatePasswordPolicy(newPassword)
    if (!policy.isValid) {
      toast.error(policy.message)
      return
    }

    setIsPasswordSubmitting(true)
    try {
      const res = await setPasswordAction(newPassword)
      toast.success(res.message)
      setHasPassword(true)
      setIsSetPasswordOpen(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al establecer la contraseña')
    } finally {
      setIsPasswordSubmitting(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword) {
      toast.error('Ingresa tu contraseña actual.')
      return
    }

    if (changeNewPassword !== changeConfirmPassword) {
      toast.error('La nueva contraseña y su confirmación no coinciden.')
      return
    }

    const policy = validatePasswordPolicy(changeNewPassword)
    if (!policy.isValid) {
      toast.error(policy.message)
      return
    }

    setIsPasswordSubmitting(true)
    try {
      const res = await changePasswordAction(currentPassword, changeNewPassword)
      toast.success(res.message)
      setIsChangePasswordOpen(false)
      setCurrentPassword('')
      setChangeNewPassword('')
      setChangeConfirmPassword('')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al actualizar la contraseña')
    } finally {
      setIsPasswordSubmitting(false)
    }
  }

  const formattedDate = new Date(user.createdAt).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  // Validación en tiempo real para checklist
  const passwordChecklist = (pwd: string) => ({
    minChars: pwd.length >= 8,
    hasUpper: /[A-Z]/.test(pwd),
    hasNumber: /[0-9]/.test(pwd),
    hasSpecial: /[^A-Za-z0-9]/.test(pwd),
  })

  const setPwdCheck = passwordChecklist(newPassword)
  const changePwdCheck = passwordChecklist(changeNewPassword)

  return (
    <div className='space-y-6 font-exo'>
      {/* Tarjeta de Identidad y Afiliación Institucional USS */}
      <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <Avatar className='h-16 w-16 rounded-2xl border-2 border-primary/20 shadow-xs'>
            <AvatarImage src={user.image || undefined} alt={user.name || 'Usuario'} />
            <AvatarFallback className='rounded-2xl bg-primary/10 font-frances text-xl font-bold text-primary'>
              {(user.name || user.email || 'U')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className='space-y-1'>
            <div className='flex items-center gap-2 flex-wrap'>
              <h2 className='font-frances text-xl font-bold text-foreground'>
                {user.name || 'Estudiante USS'}
              </h2>
              <Badge variant='outline' className='text-[10px] font-mono uppercase font-bold py-0'>
                {user.role}
              </Badge>
              {affiliation.isUssStudent ? (
                <Badge className='text-[10px] bg-primary/15 text-primary border-primary/30 hover:bg-primary/20 py-0 gap-1'>
                  <GraduationCap className='w-3 h-3' />
                  {affiliation.badgeLabel}
                </Badge>
              ) : (
                <Badge variant='secondary' className='text-[10px] py-0 gap-1'>
                  <Building className='w-3 h-3' />
                  {affiliation.badgeLabel}
                </Badge>
              )}
            </div>
            <p className='text-xs text-muted-foreground'>{user.email}</p>
          </div>
        </div>

        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
          <Calendar className='w-4 h-4' />
          <span>Miembro desde: {formattedDate}</span>
        </div>
      </div>

      {/* Banner Informativo de Afiliación Universitaria */}
      <div className='rounded-3xl border border-border/80 bg-card p-5 shadow-xs flex items-start gap-3.5'>
        <div className='p-2 rounded-2xl bg-primary/10 text-primary shrink-0'>
          <Sparkles className='w-5 h-5' />
        </div>
        <div className='space-y-1 flex-1'>
          <h3 className='font-frances font-bold text-sm text-foreground'>
            {affiliation.statusTitle}
          </h3>
          <p className='text-xs text-muted-foreground leading-relaxed'>
            {affiliation.statusDescription}
          </p>
        </div>
      </div>

      {/* Formulario de Información Personal */}
      <form onSubmit={handleSubmit} className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-6'>
        <div className='border-b border-border/40 pb-3 flex items-center justify-between'>
          <h3 className='font-frances text-base font-bold text-foreground flex items-center gap-2'>
            <User className='w-4 h-4 text-primary' />
            Datos Personales
          </h3>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='firstName' className='text-xs font-semibold'>
              Nombres
            </Label>
            <Input
              id='firstName'
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder='Tus nombres'
              className='rounded-xl text-xs'
            />
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='lastName' className='text-xs font-semibold'>
              Apellidos
            </Label>
            <Input
              id='lastName'
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder='Tus apellidos'
              className='rounded-xl text-xs'
            />
          </div>
        </div>

        {/* Sección de Correo Electrónico y Validación */}
        <div className='space-y-3 pt-2 border-t border-border/40'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2'>
            <Label htmlFor='email' className='text-xs font-semibold flex items-center gap-1.5'>
              <Mail className='w-3.5 h-3.5 text-primary' />
              Correo Electrónico
            </Label>
            {isEmailVerified ? (
              <Badge variant='outline' className='border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[10px] py-0 gap-1 w-fit'>
                <CheckCircle2 className='w-3 h-3' /> Correo Verificado
              </Badge>
            ) : (
              <Badge variant='outline' className='border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-[10px] py-0 gap-1 w-fit'>
                <AlertCircle className='w-3 h-3' /> Pendiente de Validación
              </Badge>
            )}
          </div>

          <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3'>
            <Input
              id='email'
              value={user.email}
              disabled
              className='rounded-xl text-xs bg-muted/40 font-mono text-muted-foreground flex-1'
            />

            {!isEmailVerified && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleSendVerification}
                disabled={isSendingVerification}
                className='rounded-xl text-xs font-semibold gap-1.5 shrink-0'
              >
                <Send className='w-3.5 h-3.5 text-primary' />
                {isSendingVerification ? 'Enviando...' : 'Validar Correo'}
              </Button>
            )}
          </div>
          <p className='text-[11px] text-muted-foreground'>
            El correo electrónico es el identificador principal de tu cuenta y no puede ser modificado manualmente.
          </p>
        </div>

        <div className='flex justify-end pt-2'>
          <Button
            type='submit'
            disabled={isSaving}
            className='rounded-xl text-xs font-semibold gap-2 shadow-xs'
          >
            <Save className='w-4 h-4' />
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>

      {/* Tarjeta de Seguridad y Gestión de Contraseña */}
      <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4'>
        <div className='border-b border-border/40 pb-3 flex items-center justify-between'>
          <h3 className='font-frances text-base font-bold text-foreground flex items-center gap-2'>
            <KeyRound className='w-4 h-4 text-primary' />
            Seguridad y Contraseña de Acceso
          </h3>
        </div>

        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-muted/20 border border-border/70'>
          <div className='space-y-1 min-w-0 flex-1'>
            <div className='flex items-center gap-2 flex-wrap'>
              <span className='font-semibold text-xs text-foreground'>
                {hasPassword ? 'Contraseña Local Activa' : 'Sin Contraseña Local Asignada'}
              </span>
              <Badge variant={hasPassword ? 'default' : 'secondary'} className='text-[10px] py-0'>
                {hasPassword ? 'Protegido' : 'Acceso por Enlace / Google'}
              </Badge>
            </div>
            <p className='text-xs text-muted-foreground leading-relaxed'>
              {hasPassword
                ? 'Puedes ingresar a SipánGPT con tu contraseña o continuar usando tu proveedor de correo autenticado.'
                : 'Actualmente ingresas mediante tu cuenta de Google o enlace de correo. Puedes establecer una contraseña local si lo deseas.'}
            </p>
          </div>

          <div className='shrink-0'>
            {hasPassword ? (
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setIsChangePasswordOpen(true)}
                className='rounded-xl text-xs font-semibold gap-1.5'
              >
                <Lock className='w-3.5 h-3.5 text-primary' />
                Cambiar Contraseña
              </Button>
            ) : (
              <Button
                type='button'
                size='sm'
                onClick={() => setIsSetPasswordOpen(true)}
                className='rounded-xl text-xs font-semibold gap-1.5 shadow-xs'
              >
                <KeyRound className='w-3.5 h-3.5' />
                Establecer Contraseña
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: ESTABLECER CONTRASEÑA */}
      <Dialog open={isSetPasswordOpen} onOpenChange={setIsSetPasswordOpen}>
        <DialogContent className='max-w-md rounded-3xl p-6 font-exo'>
          <DialogHeader className='space-y-1.5'>
            <DialogTitle className='font-frances text-xl flex items-center gap-2'>
              <KeyRound className='w-5 h-5 text-primary' />
              Establecer Contraseña Local
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground leading-relaxed'>
              Crea una contraseña para ingresar directamente con tu correo. Podrás seguir usando Google o enlaces mágicos.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSetPassword} className='space-y-4 pt-2'>
            <div className='space-y-1.5'>
              <Label htmlFor='newPwd' className='text-xs font-semibold'>
                Nueva Contraseña
              </Label>
              <div className='relative'>
                <Input
                  id='newPwd'
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder='Crea una contraseña segura'
                  className='rounded-xl text-xs pr-10'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer'
                >
                  {showNewPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                </button>
              </div>
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='confirmPwd' className='text-xs font-semibold'>
                Confirmar Contraseña
              </Label>
              <Input
                id='confirmPwd'
                type={showNewPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder='Repite la contraseña'
                className='rounded-xl text-xs'
                required
              />
            </div>

            {/* Checklist de Políticas de Seguridad */}
            <div className='rounded-2xl p-3 bg-muted/30 border border-border/70 space-y-1 text-[11px]'>
              <p className='font-semibold text-foreground text-[11px] pb-0.5'>Requisitos de seguridad:</p>
              <p className={setPwdCheck.minChars ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
                {setPwdCheck.minChars ? '✓' : '•'} Al menos 8 caracteres
              </p>
              <p className={setPwdCheck.hasUpper ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
                {setPwdCheck.hasUpper ? '✓' : '•'} Al menos una letra mayúscula (A-Z)
              </p>
              <p className={setPwdCheck.hasNumber ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
                {setPwdCheck.hasNumber ? '✓' : '•'} Al menos un número (0-9)
              </p>
              <p className={setPwdCheck.hasSpecial ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
                {setPwdCheck.hasSpecial ? '✓' : '•'} Al menos un carácter especial (ej. !@#$%)
              </p>
            </div>

            <div className='flex justify-end gap-2 pt-2'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setIsSetPasswordOpen(false)}
                className='rounded-xl text-xs'
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={isPasswordSubmitting}
                className='rounded-xl text-xs font-semibold'
              >
                {isPasswordSubmitting ? 'Guardando...' : 'Establecer Contraseña'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: CAMBIAR CONTRASEÑA */}
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent className='max-w-md rounded-3xl p-6 font-exo'>
          <DialogHeader className='space-y-1.5'>
            <DialogTitle className='font-frances text-xl flex items-center gap-2'>
              <Lock className='w-5 h-5 text-primary' />
              Cambiar Contraseña
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground leading-relaxed'>
              Ingresa tu contraseña actual y define tu nueva clave de acceso seguro.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleChangePassword} className='space-y-4 pt-2'>
            <div className='space-y-1.5'>
              <Label htmlFor='currPwd' className='text-xs font-semibold'>
                Contraseña Actual
              </Label>
              <Input
                id='currPwd'
                type='password'
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder='Tu contraseña actual'
                className='rounded-xl text-xs'
                required
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='changeNewPwd' className='text-xs font-semibold'>
                Nueva Contraseña
              </Label>
              <div className='relative'>
                <Input
                  id='changeNewPwd'
                  type={showChangePassword ? 'text' : 'password'}
                  value={changeNewPassword}
                  onChange={(e) => setChangeNewPassword(e.target.value)}
                  placeholder='Nueva clave segura'
                  className='rounded-xl text-xs pr-10'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer'
                >
                  {showChangePassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                </button>
              </div>
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='changeConfirmPwd' className='text-xs font-semibold'>
                Confirmar Nueva Contraseña
              </Label>
              <Input
                id='changeConfirmPwd'
                type={showChangePassword ? 'text' : 'password'}
                value={changeConfirmPassword}
                onChange={(e) => setChangeConfirmPassword(e.target.value)}
                placeholder='Repite la nueva clave'
                className='rounded-xl text-xs'
                required
              />
            </div>

            {/* Checklist de Requisitos */}
            <div className='rounded-2xl p-3 bg-muted/30 border border-border/70 space-y-1 text-[11px]'>
              <p className='font-semibold text-foreground text-[11px] pb-0.5'>Requisitos de seguridad:</p>
              <p className={changePwdCheck.minChars ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
                {changePwdCheck.minChars ? '✓' : '•'} Al menos 8 caracteres
              </p>
              <p className={changePwdCheck.hasUpper ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
                {changePwdCheck.hasUpper ? '✓' : '•'} Al menos una letra mayúscula (A-Z)
              </p>
              <p className={changePwdCheck.hasNumber ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
                {changePwdCheck.hasNumber ? '✓' : '•'} Al menos un número (0-9)
              </p>
              <p className={changePwdCheck.hasSpecial ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
                {changePwdCheck.hasSpecial ? '✓' : '•'} Al menos un carácter especial (ej. !@#$%)
              </p>
            </div>

            <div className='flex justify-end gap-2 pt-2'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setIsChangePasswordOpen(false)}
                className='rounded-xl text-xs'
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={isPasswordSubmitting}
                className='rounded-xl text-xs font-semibold'
              >
                {isPasswordSubmitting ? 'Guardando...' : 'Actualizar Contraseña'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
