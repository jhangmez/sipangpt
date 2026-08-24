'use client'

import * as React from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Monitor,
  Smartphone,
  Laptop,
  Tablet,
  Globe,
  MapPin,
  Calendar,
  X,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'

export interface SessionData {
  sessionToken: string
  createdAt: string
  updatedAt?: string
  userAgent?: string
  ipAddress?: string
  deviceType?: string
  browserName?: string
  osName?: string
  location?: string | null
  isCurrent: boolean
}

export function ActiveSessionsManager() {
  const { data: session } = useSession()
  const [sessions, setSessions] = React.useState<SessionData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [terminating, setTerminating] = React.useState<string | null>(null)

  // Función para obtener las sesiones activas
  const fetchActiveSessions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/account/sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      } else {
        toast.error('Error al cargar las sesiones activas.')
      }
    } catch (error) {
      toast.error('Error de conexión al cargar sesiones.')
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Función para cerrar una sesión específica
  const terminateSession = async (sessionToken: string) => {
    if (terminating) return
    setTerminating(sessionToken)
    try {
      const response = await fetch('/api/account/sessions/terminate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken }),
      });
      if (response.ok) {
        toast.success('Sesión cerrada correctamente')
        setSessions((prev) =>
          prev.filter((s) => s.sessionToken !== sessionToken)
        )
      } else {
        const data = await response.json().catch(() => ({}))
        toast.error(data.error || 'Error al cerrar la sesión')
      }
    } catch (error) {
      toast.error('Error de conexión al cerrar sesión.')
      console.error('Error terminating session:', error)
    } finally {
      setTerminating(null)
    }
  }

  // Función para cerrar todas las sesiones excepto la actual
  const terminateAllOtherSessions = async () => {
    try {
      const response = await fetch('/api/account/sessions/terminate-others', {
        method: 'POST',
      })
      if (response.ok) {
        toast.success('Todas las otras sesiones han sido cerradas')
        fetchActiveSessions()
      } else {
        toast.error('Error al cerrar las otras sesiones')
      }
    } catch (error) {
      toast.error('Error de conexión')
      console.error('Error terminating other sessions:', error)
    }
  }

  React.useEffect(() => {
    if (session?.user) {
      fetchActiveSessions()
    }
  }, [session])

  // Función para obtener el ícono del dispositivo
  const getDeviceIcon = (deviceType?: string, userAgent?: string) => {
    const dt = (deviceType || '').toLowerCase()
    const ua = (userAgent || '').toLowerCase()

    if (dt === 'mobile' || ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
      return <Smartphone className='h-4 w-4 text-primary' />
    }
    if (dt === 'tablet' || ua.includes('tablet') || ua.includes('ipad')) {
      return <Tablet className='h-4 w-4 text-primary' />
    }
    if (dt === 'desktop' || ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) {
      return <Laptop className='h-4 w-4 text-primary' />
    }
    return <Monitor className='h-4 w-4 text-primary' />
  }

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInMinutes = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60)
      )
      if (diffInMinutes < 1) return 'Hace menos de un minuto'
      if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`
      if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60)
        return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`
      }
      return date.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  if (!session?.user) return null

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length

  return (
    <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs font-exo space-y-5'>
      {/* Encabezado */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40'>
        <div className='space-y-0.5'>
          <h2 className='font-frances font-bold text-lg text-foreground flex items-center gap-2'>
            <Monitor className='h-5 w-5 text-primary' />
            Dispositivos y Sesiones Activas
          </h2>
          <p className='text-xs text-muted-foreground'>
            {sessions.length} {sessions.length === 1 ? 'dispositivo conectado' : 'dispositivos conectados'}
          </p>
        </div>

        <div className='flex items-center gap-2 flex-wrap'>
          <Button
            variant='outline'
            size='sm'
            onClick={fetchActiveSessions}
            disabled={loading}
            className='rounded-xl text-xs cursor-pointer'
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`}
            />
            Actualizar
          </Button>

          {otherSessionsCount > 0 && (
            <Button
              variant='outline'
              size='sm'
              onClick={terminateAllOtherSessions}
              className='rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 cursor-pointer'
            >
              <X className='h-3.5 w-3.5 mr-1.5' />
              Cerrar Otras ({otherSessionsCount})
            </Button>
          )}
        </div>
      </div>

      {/* Contenido de Sesiones */}
      {loading ? (
        <div className='space-y-3'>
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className='flex items-center space-x-4 p-4 border border-border/60 rounded-2xl animate-pulse bg-muted/20'
            >
              <div className='h-8 w-8 bg-muted/60 rounded-xl'></div>
              <div className='flex-1 space-y-2'>
                <div className='h-3.5 bg-muted/60 rounded w-1/3'></div>
                <div className='h-2.5 bg-muted/40 rounded w-1/2'></div>
              </div>
              <div className='h-8 w-16 bg-muted/60 rounded-xl'></div>
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className='text-center py-10 text-muted-foreground space-y-2'>
          <Monitor className='h-10 w-10 mx-auto text-muted-foreground/40' />
          <p className='text-sm font-semibold text-foreground'>No se encontraron sesiones activas</p>
          <p className='text-xs'>Al iniciar sesión en un nuevo dispositivo aparecerá reflejado aquí.</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {sessions.map((sessionData) => (
            <div
              key={sessionData.sessionToken}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-2xl transition-all gap-4 ${
                sessionData.isCurrent
                  ? 'border-primary/40 bg-primary/5 shadow-xs'
                  : 'border-border/70 bg-card hover:border-border'
              }`}
            >
              <div className='flex items-start gap-3.5'>
                <div className='rounded-xl bg-primary/10 p-2.5 shrink-0 mt-0.5'>
                  {getDeviceIcon(
                    sessionData.deviceType,
                    sessionData.userAgent
                  )}
                </div>

                <div className='flex-1 min-w-0 space-y-1.5'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <p className='text-sm font-semibold text-foreground'>
                      {sessionData.browserName || 'Navegador Web'}
                      {sessionData.osName && ` en ${sessionData.osName}`}
                    </p>

                    {sessionData.isCurrent && (
                      <Badge className='text-[10px] py-0 bg-emerald-600 hover:bg-emerald-600 text-white gap-1'>
                        <CheckCircle2 className='w-3 h-3' /> Este Dispositivo (Actual)
                      </Badge>
                    )}
                  </div>

                  <div className='flex items-center gap-3.5 text-xs text-muted-foreground flex-wrap'>
                    {sessionData.ipAddress && (
                      <span className='flex items-center gap-1 font-mono text-[11px]'>
                        <Globe className='h-3.5 w-3.5 text-muted-foreground' />
                        {sessionData.ipAddress}
                      </span>
                    )}
                    {sessionData.location && (
                      <span className='flex items-center gap-1 text-[11px]'>
                        <MapPin className='h-3.5 w-3.5 text-muted-foreground' />
                        {sessionData.location}
                      </span>
                    )}
                    <span className='flex items-center gap-1 text-[11px]'>
                      <Calendar className='h-3.5 w-3.5 text-muted-foreground' />
                      {formatDate(sessionData.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {!sessionData.isCurrent && (
                <div className='self-end sm:self-center shrink-0'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => terminateSession(sessionData.sessionToken)}
                    disabled={terminating === sessionData.sessionToken}
                    className='rounded-xl text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 cursor-pointer'
                  >
                    {terminating === sessionData.sessionToken ? (
                      <RefreshCw className='h-4 w-4 animate-spin' />
                    ) : (
                      <>
                        <X className='h-3.5 w-3.5 mr-1' /> Cerrar Sesión
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
