import type { Metadata } from 'next'
import { getAllAIModels } from '@/lib/db/system'
import { requireRole } from '@/lib/session'
import { Role, ModelStatus } from '@/lib/prisma'
import {
  updateModelStatusAction,
  setDefaultModelAction,
  toggleModelActiveAction,
} from '@/lib/actions/admin-models'
import { Sparkles, CheckCircle2, Activity, Server, AlertTriangle, XCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Modelos de IA • Panel Administrador',
  description: 'Supervisión de salud, latencia en tiempo real y configuración de modelos de IA en SipánGPT.',
}

export default async function AdminModelsPage() {
  await requireRole(Role.ADMIN)
  const models = await getAllAIModels()

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='font-frances text-2xl font-bold text-foreground'>
          Gestión de Modelos de Inteligencia Artificial
        </h1>
        <p className='text-sm text-muted-foreground font-exo'>
          Supervisa el estado de salud, la latencia en tiempo real y define el modelo predeterminado del sistema.
        </p>
      </div>

      <div className='grid grid-cols-1 gap-4'>
        {models.map((model) => (
          <div
            key={model.id}
            className='rounded-2xl border border-border/70 bg-card p-5 space-y-4 shadow-xs'
          >
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4'>
              <div className='space-y-1'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <h3 className='font-frances font-bold text-base text-foreground'>
                    {model.name}
                  </h3>
                  <span className='rounded-lg bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground'>
                    {model.modelCode}
                  </span>
                  <span className='rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary'>
                    {model.provider}
                  </span>
                  {model.isDefault && (
                    <span className='rounded-lg bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400'>
                      ★ Predeterminado
                    </span>
                  )}
                </div>
                <p className='text-xs text-muted-foreground font-exo'>
                  {model.description || 'Sin descripción configurada.'}
                </p>
              </div>

              {/* Acciones Rápidas */}
              <div className='flex items-center gap-2 shrink-0'>
                {!model.isDefault && (
                  <form
                    action={async () => {
                      'use server'
                      await setDefaultModelAction(model.id)
                    }}
                  >
                    <button
                      type='submit'
                      className='rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition shadow-xs'
                    >
                      Hacer Predeterminado
                    </button>
                  </form>
                )}

                <form
                  action={async () => {
                    'use server'
                    await toggleModelActiveAction(model.id, !model.isActive)
                  }}
                >
                  <button
                    type='submit'
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition shadow-xs ${
                      model.isActive
                        ? 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                    }`}
                  >
                    {model.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                </form>
              </div>
            </div>

            {/* Configuración de Estado de Salud y Latencia */}
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1'>
              <div className='flex items-center gap-4 text-xs font-exo'>
                <span className='text-muted-foreground'>Estado actual:</span>
                {model.status === 'ONLINE' && (
                  <span className='inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400'>
                    <span className='h-2 w-2 rounded-full bg-emerald-500 animate-pulse' />
                    🟢 Estable / Online ({model.latencyMs || 150}ms)
                  </span>
                )}
                {model.status === 'DEGRADED' && (
                  <span className='inline-flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400'>
                    <span className='h-2 w-2 rounded-full bg-amber-500' />
                    🟡 Inestable / Ping Alto ({model.latencyMs || 850}ms)
                  </span>
                )}
                {model.status === 'OFFLINE' && (
                  <span className='inline-flex items-center gap-1.5 font-semibold text-rose-600 dark:text-rose-400'>
                    <span className='h-2 w-2 rounded-full bg-rose-500' />
                    🔴 Sin Respuesta / Offline
                  </span>
                )}
                {model.status === 'DISABLED' && (
                  <span className='inline-flex items-center gap-1.5 font-semibold text-muted-foreground'>
                    ⚪ Desactivado
                  </span>
                )}
              </div>

              {/* Botones para forzar estado de prueba */}
              <div className='flex items-center gap-1.5'>
                <form
                  action={async () => {
                    'use server'
                    await updateModelStatusAction(model.id, ModelStatus.ONLINE, 120)
                  }}
                >
                  <button
                    type='submit'
                    title='Marcar como Estable'
                    className='rounded-lg border border-border/60 p-1.5 text-xs text-emerald-600 hover:bg-emerald-500/10 transition'
                  >
                    🟢 Online
                  </button>
                </form>

                <form
                  action={async () => {
                    'use server'
                    await updateModelStatusAction(model.id, ModelStatus.DEGRADED, 950)
                  }}
                >
                  <button
                    type='submit'
                    title='Marcar como Inestable / Ping Alto'
                    className='rounded-lg border border-border/60 p-1.5 text-xs text-amber-600 hover:bg-amber-500/10 transition'
                  >
                    🟡 Degraded
                  </button>
                </form>

                <form
                  action={async () => {
                    'use server'
                    await updateModelStatusAction(model.id, ModelStatus.OFFLINE)
                  }}
                >
                  <button
                    type='submit'
                    title='Marcar como Offline'
                    className='rounded-lg border border-border/60 p-1.5 text-xs text-rose-600 hover:bg-rose-500/10 transition'
                  >
                    🔴 Offline
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
