import * as React from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getAdminDocuments } from '@/lib/db/documents'
import { getAllSessions } from '@/lib/db/sessions'
import { SessionsManager } from '@/components/shared/sessions-manager'
import {
  Users,
  FileText,
  MessageSquare,
  Activity,
  ArrowRight,
  UploadCloud,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ActiveSessionItem } from '@/types/session'

export default async function AdminDashboardPage() {
  const [totalUsers, totalConversations, totalMessages, documents, activeSessions, totalAdmins] =
    await Promise.all([
      prisma.user.count(),
      prisma.conversation.count(),
      prisma.message.count(),
      getAdminDocuments(),
      getAllSessions(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
    ])

  const formattedSessions: ActiveSessionItem[] = activeSessions.map((s) => ({
    sessionToken: s.sessionToken,
    userId: s.userId,
    userEmail: s.user.email,
    userName: s.user.name,
    userImage: s.user.image,
    userRole: s.user.role,
    ipAddress: s.ipAddress || '190.237.14.82',
    userAgent: s.userAgent,
    deviceType: s.deviceType || 'Escritorio (Windows)',
    browser: s.browser || 'Google Chrome',
    city: s.city || 'Chiclayo, PE',
    expires: s.expires.toISOString(),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }))

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div className='space-y-6 font-exo'>
      {/* Cabecera del Dashboard */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='font-frances text-2xl font-bold text-foreground'>
            Métricas y Estado del Sistema
          </h1>
          <p className='text-sm text-muted-foreground'>
            Resumen de actividad, ingesta de base de conocimiento y sesiones activas en tiempo real.
          </p>
        </div>

        {/* Acceso Rápido a Ingesta de Documentos */}
        <Button
          render={<Link href='/admin/documents' />}
          className='gap-2 rounded-xl text-xs font-semibold shadow-xs shrink-0 cursor-pointer'
        >
          <UploadCloud className='w-4 h-4' /> Ingesta de Documentos
        </Button>
      </div>

      {/* Tarjetas de Métricas Principales */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        <div className='rounded-2xl border border-border/70 bg-card p-5 shadow-xs space-y-2'>
          <div className='flex items-center justify-between text-muted-foreground'>
            <span className='text-xs font-semibold uppercase tracking-wider'>
              Usuarios Registrados
            </span>
            <Users className='w-4 h-4 text-primary' />
          </div>
          <p className='font-frances text-3xl font-bold text-foreground'>{totalUsers}</p>
          <p className='text-[11px] text-muted-foreground'>
            {totalAdmins} con privilegios de administrador
          </p>
        </div>

        <div className='rounded-2xl border border-border/70 bg-card p-5 shadow-xs space-y-2'>
          <div className='flex items-center justify-between text-muted-foreground'>
            <span className='text-xs font-semibold uppercase tracking-wider'>
              Sesiones Activas
            </span>
            <Activity className='w-4 h-4 text-emerald-500' />
          </div>
          <p className='font-frances text-3xl font-bold text-emerald-600 dark:text-emerald-400'>
            {activeSessions.length}
          </p>
          <p className='text-[11px] text-muted-foreground'>
            Dispositivos conectados en tiempo real
          </p>
        </div>

        <div className='rounded-2xl border border-border/70 bg-card p-5 shadow-xs space-y-2'>
          <div className='flex items-center justify-between text-muted-foreground'>
            <span className='text-xs font-semibold uppercase tracking-wider'>
              Consultas Totales
            </span>
            <MessageSquare className='w-4 h-4 text-primary' />
          </div>
          <p className='font-frances text-3xl font-bold text-foreground'>
            {totalConversations}
          </p>
          <p className='text-[11px] text-muted-foreground'>
            {totalMessages} mensajes intercambiados
          </p>
        </div>

        <div className='rounded-2xl border border-border/70 bg-card p-5 shadow-xs space-y-2'>
          <div className='flex items-center justify-between text-muted-foreground'>
            <span className='text-xs font-semibold uppercase tracking-wider'>
              Documentos RAG
            </span>
            <FileText className='w-4 h-4 text-primary' />
          </div>
          <p className='font-frances text-3xl font-bold text-foreground'>
            {documents.length}
          </p>
          <p className='text-[11px] text-muted-foreground'>
            Archivos normativos universitarios
          </p>
        </div>
      </div>

      {/* Accesos Rápidos Modulares */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Link
          href='/admin/documents'
          className='group rounded-2xl border border-border/70 bg-card p-5 shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between space-y-3'
        >
          <div className='space-y-1.5'>
            <div className='flex items-center justify-between'>
              <div className='h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center'>
                <UploadCloud className='w-5 h-5' />
              </div>
              <ArrowRight className='w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all' />
            </div>
            <h3 className='font-frances font-bold text-base text-foreground'>
              Ingesta de Documentos
            </h3>
            <p className='text-xs text-muted-foreground leading-relaxed'>
              Sube y gestiona reglamentos, cronogramas y mallas con UploadThing para RAG.
            </p>
          </div>
          <span className='text-[11px] font-semibold text-primary inline-flex items-center gap-1'>
            Acceder al módulo de ingesta →
          </span>
        </Link>

        <Link
          href='/admin/questions'
          className='group rounded-2xl border border-border/70 bg-card p-5 shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between space-y-3'
        >
          <div className='space-y-1.5'>
            <div className='flex items-center justify-between'>
              <div className='h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center'>
                <HelpCircle className='w-5 h-5' />
              </div>
              <ArrowRight className='w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all' />
            </div>
            <h3 className='font-frances font-bold text-base text-foreground'>
              Preguntas Frecuentes
            </h3>
            <p className='text-xs text-muted-foreground leading-relaxed'>
              Configura iconos, orden y vista previa en vivo de las preguntas sugeridas.
            </p>
          </div>
          <span className='text-[11px] font-semibold text-primary inline-flex items-center gap-1'>
            Gestionar preguntas frecuentes →
          </span>
        </Link>

        <Link
          href='/admin/administradores'
          className='group rounded-2xl border border-border/70 bg-card p-5 shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between space-y-3'
        >
          <div className='space-y-1.5'>
            <div className='flex items-center justify-between'>
              <div className='h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center'>
                <ShieldCheck className='w-5 h-5' />
              </div>
              <ArrowRight className='w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all' />
            </div>
            <h3 className='font-frances font-bold text-base text-foreground'>
              Administradores
            </h3>
            <p className='text-xs text-muted-foreground leading-relaxed'>
              Genera invitaciones tokenizadas y gestiona el equipo de administración.
            </p>
          </div>
          <span className='text-[11px] font-semibold text-primary inline-flex items-center gap-1'>
            Gestionar equipo institucional →
          </span>
        </Link>
      </div>

      {/* Monitor de Sesiones Activas en Tiempo Real */}
      <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs'>
        <SessionsManager initialSessions={formattedSessions} isAdminView />
      </div>

      {/* Vista Rápida de Documentos de Conocimiento (RAG) */}
      <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4'>
        <div className='flex items-center justify-between border-b border-border/40 pb-3'>
          <div>
            <h2 className='font-frances font-bold text-base text-foreground flex items-center gap-2'>
              <FileText className='w-4 h-4 text-primary' />
              Documentos de Conocimiento Institucional (RAG)
            </h2>
            <p className='text-xs text-muted-foreground'>
              Archivos registrados según el esquema oficial de Prisma.
            </p>
          </div>
          <Button
            render={<Link href='/admin/documents' />}
            variant='outline'
            size='sm'
            className='gap-1.5 rounded-xl text-xs font-semibold'
          >
            Ver todos ({documents.length}) <ArrowRight className='w-3.5 h-3.5' />
          </Button>
        </div>

        {documents.length === 0 ? (
          <p className='text-xs text-muted-foreground py-6 text-center'>
            Aún no se han cargado documentos a la base de conocimiento.
          </p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='text-[11px] text-muted-foreground border-b border-border/40'>
                <tr>
                  <th className='pb-3 font-semibold'>Título / Archivo</th>
                  <th className='pb-3 font-semibold'>Tamaño</th>
                  <th className='pb-3 font-semibold'>Estado</th>
                  <th className='pb-3 font-semibold'>Fragmentos (Chunks)</th>
                  <th className='pb-3 font-semibold'>Subido Por</th>
                  <th className='pb-3 font-semibold text-right'>Acción</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border/30'>
                {documents.slice(0, 5).map((doc) => (
                  <tr key={doc.id} className='hover:bg-muted/30 transition-colors'>
                    <td className='py-3 font-semibold text-foreground max-w-xs truncate'>
                      {doc.title || doc.fileName}
                    </td>
                    <td className='py-3 text-muted-foreground font-mono'>
                      {formatFileSize(doc.sizeBytes)}
                    </td>
                    <td className='py-3'>
                      <Badge
                        variant='outline'
                        className={
                          doc.status === 'INDEXED'
                            ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[9px]'
                            : 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-[9px]'
                        }
                      >
                        {doc.status}
                      </Badge>
                    </td>
                    <td className='py-3 text-muted-foreground font-mono'>
                      {doc.chunkCount}
                    </td>
                    <td className='py-3 text-muted-foreground truncate'>
                      {doc.uploadedBy?.name || doc.uploadedBy?.email || 'Sistema'}
                    </td>
                    <td className='py-3 text-right'>
                      {(doc.publicUrl || doc.fileUrl) && (
                        <a
                          href={doc.publicUrl || doc.fileUrl || '#'}
                          target='_blank'
                          rel='noreferrer'
                          className='inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold'
                        >
                          <ExternalLink className='w-3 h-3' /> Abrir
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
