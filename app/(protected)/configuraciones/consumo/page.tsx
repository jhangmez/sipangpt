import type { Metadata } from 'next'
import * as React from 'react'
import { getAuthenticatedUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getUserSettingsData } from '@/lib/actions/user-settings'
import { SYSTEM_MODELS } from '@/constants/models'
import { Badge } from '@/components/ui/badge'
import { Cpu, Zap, MessageSquare, Flame, Sparkles, BarChart3 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Consumo y Tokens • Configuraciones',
  description: 'Monitorea tu uso de tokens, límites diarios y actividad en los modelos de IA de SipánGPT.',
}

export default async function ConsumoSettingsPage() {
  const authUser = await getAuthenticatedUser()
  if (!authUser) redirect('/login')

  const { usage, messageCount, totalConversations } = await getUserSettingsData()
  const dailyLimit = 50000
  const dailyTokens = usage.dailyTokens || 0
  const totalTokens = usage.totalTokens || 0
  const usagePercentage = Math.min(100, Math.round((dailyTokens / dailyLimit) * 100))

  return (
    <div className='space-y-6 font-exo'>
      <div className='space-y-1'>
        <h1 className='font-frances text-2xl font-bold text-foreground'>
          Uso de Modelos y Tokens
        </h1>
        <p className='text-xs text-muted-foreground'>
          Estadísticas de consumo de inferencia y límites de cuota asignados a tu cuenta.
        </p>
      </div>

      {/* Grid de Métricas Principales */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        <div className='rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-2'>
          <div className='flex items-center justify-between text-muted-foreground'>
            <span className='text-xs font-semibold'>Tokens de Hoy</span>
            <Flame className='w-4 h-4 text-amber-500' />
          </div>
          <p className='text-2xl font-bold font-mono text-foreground'>
            {dailyTokens.toLocaleString()}
          </p>
          <p className='text-[10px] text-muted-foreground'>
            Límite diario: {dailyLimit.toLocaleString()} tokens
          </p>
        </div>

        <div className='rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-2'>
          <div className='flex items-center justify-between text-muted-foreground'>
            <span className='text-xs font-semibold'>Tokens Acumulados</span>
            <Zap className='w-4 h-4 text-primary' />
          </div>
          <p className='text-2xl font-bold font-mono text-foreground'>
            {totalTokens.toLocaleString()}
          </p>
          <p className='text-[10px] text-muted-foreground'>
            Consumo histórico total
          </p>
        </div>

        <div className='rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-2'>
          <div className='flex items-center justify-between text-muted-foreground'>
            <span className='text-xs font-semibold'>Mensajes Enviados</span>
            <MessageSquare className='w-4 h-4 text-emerald-500' />
          </div>
          <p className='text-2xl font-bold font-mono text-foreground'>
            {messageCount}
          </p>
          <p className='text-[10px] text-muted-foreground'>
            Consultas a la IA
          </p>
        </div>

        <div className='rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-2'>
          <div className='flex items-center justify-between text-muted-foreground'>
            <span className='text-xs font-semibold'>Conversaciones</span>
            <BarChart3 className='w-4 h-4 text-sky-500' />
          </div>
          <p className='text-2xl font-bold font-mono text-foreground'>
            {totalConversations}
          </p>
          <p className='text-[10px] text-muted-foreground'>
            Sesiones de chat guardadas
          </p>
        </div>
      </div>

      {/* Barra de Consumo Diario */}
      <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='font-frances text-base font-bold text-foreground'>
              Cuota Diaria de Inferencia
            </h3>
            <p className='text-xs text-muted-foreground'>
              Se reinicia automáticamente a las 00:00 UTC cada día.
            </p>
          </div>
          <Badge variant='outline' className='font-mono text-xs'>
            {usagePercentage}% utilizado
          </Badge>
        </div>

        <div className='space-y-1.5'>
          <div className='h-3 w-full rounded-full bg-muted overflow-hidden'>
            <div
              className={`h-full transition-all rounded-full ${
                usagePercentage > 85 ? 'bg-rose-500' : 'bg-primary'
              }`}
              style={{ width: `${Math.max(2, usagePercentage)}%` }}
            />
          </div>
          <div className='flex justify-between text-[11px] text-muted-foreground font-mono'>
            <span>0 tokens</span>
            <span>{dailyLimit.toLocaleString()} tokens</span>
          </div>
        </div>
      </div>

      {/* Modelos Disponibles y sus características */}
      <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4'>
        <div className='border-b border-border/40 pb-3'>
          <h3 className='font-frances text-base font-bold text-foreground flex items-center gap-2'>
            <Sparkles className='w-4 h-4 text-primary' />
            Modelos de IA Disponibles para tu Cuenta
          </h3>
          <p className='text-xs text-muted-foreground'>
            Modelos institucionales optimizados para responder normativas y reglamentos de la USS.
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1'>
          {SYSTEM_MODELS.map((model) => (
            <div
              key={model.id}
              className='rounded-2xl border border-border/70 p-4 space-y-2 bg-card/60'
            >
              <div className='flex items-center justify-between gap-2'>
                <span className='font-semibold text-xs text-foreground'>
                  {model.name}
                </span>
                <Badge variant='outline' className='text-[10px] font-mono py-0'>
                  {model.provider}
                </Badge>
              </div>
              <p className='text-xs text-muted-foreground leading-relaxed'>
                {model.description}
              </p>
              {model.isDefault && (
                <span className='inline-block text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md'>
                  Por Defecto
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
