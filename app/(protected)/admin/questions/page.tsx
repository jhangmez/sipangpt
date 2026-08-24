import { getAllSuggestedQuestions } from '@/lib/db/system'
import { requireRole } from '@/lib/session'
import { Role } from '@/lib/prisma'
import {
  createQuestionAction,
  updateQuestionAction,
  toggleQuestionActiveAction,
  deleteQuestionAction,
} from '@/lib/actions/admin-questions'
import { HelpCircle, Plus, Trash2, CheckCircle2, ListOrdered, Tag } from 'lucide-react'

export default async function AdminQuestionsPage() {
  await requireRole(Role.ADMIN)
  const questions = await getAllSuggestedQuestions()

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='font-frances text-2xl font-bold text-foreground'>
            Preguntas Frecuentes y Sugeridas
          </h1>
          <p className='text-sm text-muted-foreground font-exo'>
            Administra las preguntas que aparecen en la pantalla inicial de los usuarios del chat.
          </p>
        </div>
      </div>

      {/* Formulario de Creación de Nueva Pregunta (RSC con Server Action) */}
      <div className='rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-xs'>
        <h2 className='font-frances font-bold text-base text-foreground flex items-center gap-2'>
          <Plus className='w-4 h-4 text-primary' />
          Agregar Nueva Pregunta Sugerida
        </h2>

        <form action={createQuestionAction} className='grid grid-cols-1 sm:grid-cols-12 gap-3'>
          <div className='sm:col-span-1'>
            <label className='block text-[11px] font-semibold text-muted-foreground mb-1'>Ícono</label>
            <input
              name='icon'
              defaultValue='📋'
              required
              className='w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary'
            />
          </div>

          <div className='sm:col-span-6'>
            <label className='block text-[11px] font-semibold text-muted-foreground mb-1'>Pregunta o Consulta</label>
            <input
              name='text'
              placeholder='Ej: ¿Cuáles son las fechas de exámenes finales?'
              required
              className='w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-exo'
            />
          </div>

          <div className='sm:col-span-3'>
            <label className='block text-[11px] font-semibold text-muted-foreground mb-1'>Categoría</label>
            <select
              name='category'
              className='w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-exo'
            >
              <option value='matricula'>Matrícula</option>
              <option value='tramites'>Trámites</option>
              <option value='carreras'>Carreras</option>
              <option value='admision'>Admisión</option>
              <option value='general'>General</option>
            </select>
          </div>

          <div className='sm:col-span-1'>
            <label className='block text-[11px] font-semibold text-muted-foreground mb-1'>Orden</label>
            <input
              name='order'
              type='number'
              defaultValue={questions.length}
              className='w-full rounded-xl border border-border bg-background px-2 py-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary'
            />
          </div>

          <div className='sm:col-span-1 flex items-end'>
            <button
              type='submit'
              className='w-full rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-xs'
            >
              Guardar
            </button>
          </div>
        </form>
      </div>

      {/* Listado de Preguntas Existentes */}
      <div className='space-y-3'>
        <h2 className='font-frances font-bold text-base text-foreground'>
          Preguntas Configuradas ({questions.length})
        </h2>

        {questions.length === 0 ? (
          <p className='text-xs text-muted-foreground font-exo'>No hay preguntas configuradas.</p>
        ) : (
          questions.map((q) => (
            <div
              key={q.id}
              className='rounded-2xl border border-border/70 bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs'
            >
              <div className='flex items-center gap-3'>
                <span className='text-xl p-2 rounded-xl bg-muted/60'>{q.icon}</span>
                <div className='space-y-0.5'>
                  <p className='text-sm font-semibold text-foreground font-exo'>{q.text}</p>
                  <div className='flex items-center gap-2 text-xs text-muted-foreground font-exo'>
                    <span className='rounded-md bg-muted px-2 py-0.5 text-[11px]'>
                      Orden: #{q.order}
                    </span>
                    <span className='rounded-md bg-primary/10 px-2 py-0.5 text-[11px] text-primary font-medium'>
                      {q.category}
                    </span>
                    {q.isActive ? (
                      <span className='text-emerald-600 dark:text-emerald-400 font-medium'>● Activa</span>
                    ) : (
                      <span className='text-muted-foreground'>○ Inactiva</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Acciones de la Pregunta */}
              <div className='flex items-center gap-2 self-end sm:self-center'>
                <form
                  action={async () => {
                    'use server'
                    await toggleQuestionActiveAction(q.id, !q.isActive)
                  }}
                >
                  <button
                    type='submit'
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                      q.isActive
                        ? 'bg-muted text-muted-foreground hover:text-foreground'
                        : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                    }`}
                  >
                    {q.isActive ? 'Ocultar' : 'Mostrar'}
                  </button>
                </form>

                <form
                  action={async () => {
                    'use server'
                    await deleteQuestionAction(q.id)
                  }}
                >
                  <button
                    type='submit'
                    className='rounded-xl bg-rose-500/10 p-2 text-xs text-rose-600 hover:bg-rose-500/20 transition'
                    title='Eliminar pregunta'
                  >
                    <Trash2 className='w-3.5 h-3.5' />
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
