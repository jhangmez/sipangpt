'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  Laptop,
  Smartphone,
  Globe,
  Shield,
  LogOut,
  RefreshCw,
  Clock,
  MapPin,
  CheckCircle2
} from 'lucide-react'
import {
  closeSessionAction,
  closeOtherSessionsAction
} from '@/lib/actions/sessions'
import { performSafeLogout } from '@/lib/auth/multi-tab-sync'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/utils'
import type { ActiveSessionItem } from '@/types/session'

interface SessionsManagerProps {
  initialSessions?: ActiveSessionItem[]
  isAdminView?: boolean
}

export function SessionsManager({
  initialSessions = [],
  isAdminView = false
}: SessionsManagerProps) {
  const [sessions, setSessions] =
    React.useState<ActiveSessionItem[]>(initialSessions)
  const [isLoading, setIsLoading] = React.useState(false)

  const fetchSessions = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/sesiones')
      if (res.ok) {
        const data = await res.json()
        setSessions(data)
      }
    } catch (err) {
      console.error('Error al actualizar sesiones:', err)
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    if (initialSessions.length > 0) {
      setSessions(initialSessions)
    } else {
      fetchSessions()
    }
    const interval = setInterval(fetchSessions, 15000)
    return () => clearInterval(interval)
  }, [initialSessions])

  const handleCloseSession = async (
    sessionToken: string,
    isCurrent: boolean
  ) => {
    if (isCurrent) {
      if (
        confirm(
          '¿Deseas cerrar la sesión en este dispositivo? Serás redirigido al inicio de sesión.'
        )
      ) {
        await performSafeLogout('/login')
      }
      return
    }

    try {
      const res = await closeSessionAction(sessionToken)
      if (res.success) {
        toast.success(res.message)
        setSessions((prev) =>
          prev.filter((s) => s.sessionToken !== sessionToken)
        )
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al cerrar la sesión.')
    }
  }

  const handleCloseOtherSessions = async () => {
    try {
      const res = await closeOtherSessionsAction()
      if (res.success) {
        toast.success(res.message)
        fetchSessions()
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al cerrar otras sesiones.')
    }
  }

  const formatDateTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd MMM yyyy, HH:mm', { locale: es })
    } catch {
      return dateStr
    }
  }

  const getDeviceIcon = (deviceType?: string | null) => {
    const lower = (deviceType || '').toLowerCase()
    if (
      lower.includes('móvil') ||
      lower.includes('android') ||
      lower.includes('iphone')
    ) {
      return <Smartphone className='w-5 h-5 text-primary' />
    }
    return <Laptop className='w-5 h-5 text-primary' />
  }

  return (
    <div className='space-y-4 font-exo'>
      <div className='flex items-center justify-between gap-4 flex-wrap'>
        <div>
          <h3 className='font-frances font-bold text-lg text-foreground'>
            {isAdminView
              ? 'Sesiones Activas en el Sistema'
              : 'Dispositivos y Sesiones Conectadas'}
          </h3>
          <p className='text-xs text-muted-foreground'>
            {sessions.length}{' '}
            {sessions.length === 1
              ? 'dispositivo conectado'
              : 'dispositivos conectados'}
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='icon-sm'
            onClick={fetchSessions}
            disabled={isLoading}
            className='rounded-xl cursor-pointer'
            title='Actualizar lista'
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
            />
          </Button>

          {!isAdminView && sessions.length > 1 && (
            <Button
              variant='outline'
              size='sm'
              onClick={handleCloseOtherSessions}
              className='rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 cursor-pointer'
            >
              <LogOut className='w-3.5 h-3.5 mr-1.5' /> Cerrar todas las demás
            </Button>
          )}
        </div>
      </div>

      <div className='space-y-2.5'>
        {sessions.length === 0 ? (
          <div className='rounded-2xl border border-border/60 p-8 text-center text-xs text-muted-foreground'>
            No hay sesiones activas registradas.
          </div>
        ) : (
          sessions.map((s) => (
            <div
              key={s.sessionToken}
              className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs transition-all ${
                s.isCurrent
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border/70 bg-card/60'
              }`}
            >
              <div className='flex items-start gap-3.5'>
                <div className='rounded-xl bg-primary/10 p-2.5 shrink-0 mt-0.5'>
                  {getDeviceIcon(s.deviceType)}
                </div>

                <div className='space-y-1.5 text-xs'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <span className='font-semibold text-foreground text-sm'>
                      {s.deviceType || 'Dispositivo'}
                    </span>
                    <Badge
                      variant='outline'
                      className='text-[10px] py-0 font-normal'
                    >
                      {s.browser || 'Navegador Web'}
                    </Badge>
                    {s.isCurrent && (
                      <Badge className='text-[10px] py-0 bg-emerald-600 hover:bg-emerald-600 text-white gap-1'>
                        <CheckCircle2 className='w-3 h-3' /> Este Dispositivo
                        (Actual)
                      </Badge>
                    )}
                    {isAdminView && s.userEmail && (
                      <Badge
                        variant='secondary'
                        className='text-[10px] py-0 font-mono'
                      >
                        {s.userEmail}
                      </Badge>
                    )}
                  </div>

                  <div className='flex items-center gap-3 text-muted-foreground flex-wrap text-[11px]'>
                    <span className='flex items-center gap-1'>
                      <MapPin className='w-3 h-3 text-muted-foreground' />
                      {s.city
                        ? `${s.city} • IP: ${s.ipAddress}`
                        : `IP: ${s.ipAddress}`}
                    </span>
                    <span
                      suppressHydrationWarning
                      className='flex items-center gap-1'
                    >
                      <Clock className='w-3 h-3 text-muted-foreground' />
                      Última actividad: {formatDateTime(s.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className='self-end sm:self-center shrink-0'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    handleCloseSession(s.sessionToken, !!s.isCurrent)
                  }
                  className='rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 cursor-pointer'
                >
                  <LogOut className='w-3.5 h-3.5 mr-1.5' />
                  {s.isCurrent ? 'Cerrar esta sesión' : 'Cerrar sesión'}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
