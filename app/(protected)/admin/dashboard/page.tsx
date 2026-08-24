import { prisma } from '@/lib/prisma'
import { getAdminDocuments } from '@/lib/db/documents'
import { Users, FileText, MessageSquare, ShieldCheck } from 'lucide-react'

export default async function AdminDashboardPage() {
  const [totalUsers, totalConversations, totalMessages, documents] = await Promise.all([
    prisma.user.count(),
    prisma.conversation.count(),
    prisma.message.count(),
    getAdminDocuments(),
  ])

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='font-frances text-2xl font-bold text-foreground'>
          Métricas y Estado del Sistema
        </h1>
        <p className='text-sm text-muted-foreground font-exo'>
          Resumen general de actividad y base de conocimiento.
        </p>
      </div>

      {/* Tarjetas de Métricas */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div className='rounded-2xl border border-border/60 bg-card p-5 shadow-sm'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              Usuarios Registrados
            </span>
            <Users className='w-4 h-4 text-primary' />
          </div>
          <p className='font-frances text-3xl font-bold text-foreground mt-3'>
            {totalUsers}
          </p>
        </div>

        <div className='rounded-2xl border border-border/60 bg-card p-5 shadow-sm'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              Consultas Totales
            </span>
            <MessageSquare className='w-4 h-4 text-primary' />
          </div>
          <p className='font-frances text-3xl font-bold text-foreground mt-3'>
            {totalConversations}
          </p>
        </div>

        <div className='rounded-2xl border border-border/60 bg-card p-5 shadow-sm'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              Documentos RAG
            </span>
            <FileText className='w-4 h-4 text-primary' />
          </div>
          <p className='font-frances text-3xl font-bold text-foreground mt-3'>
            {documents.length}
          </p>
        </div>
      </div>

      {/* Lista de Documentos Cargados */}
      <div className='rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-4'>
        <h2 className='font-frances font-bold text-lg text-foreground'>
          Documentos de Conocimiento (RAG)
        </h2>

        {documents.length === 0 ? (
          <p className='text-sm text-muted-foreground py-6 text-center'>
            Aún no se han cargado documentos a la base de conocimiento.
          </p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-sm'>
              <thead className='text-xs text-muted-foreground border-b border-border/60'>
                <tr>
                  <th className='pb-3 font-semibold'>Título / Archivo</th>
                  <th className='pb-3 font-semibold'>Estado</th>
                  <th className='pb-3 font-semibold'>Fragmentos</th>
                  <th className='pb-3 font-semibold'>Subido Por</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border/40'>
                {documents.map((doc) => (
                  <tr key={doc.id} className='hover:bg-muted/40'>
                    <td className='py-3 font-medium text-foreground'>{doc.title}</td>
                    <td className='py-3'>
                      <span className='inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary'>
                        {doc.status}
                      </span>
                    </td>
                    <td className='py-3 text-muted-foreground'>{doc.chunkCount}</td>
                    <td className='py-3 text-muted-foreground'>{doc.uploadedBy?.name || 'Sistema'}</td>
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
