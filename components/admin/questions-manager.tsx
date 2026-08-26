'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  createQuestionDirect,
  toggleQuestionActiveAction,
  deleteQuestionAction,
  moveQuestionOrderAction
} from '@/lib/actions/admin-questions'
import { IconPicker } from './icon-picker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Questionnaire,
  QuestionnaireItem,
  QuestionnaireTitle,
  QuestionnaireDescription,
  QuestionnaireChoices,
  QuestionnaireChoice
} from '@/components/ui/questionnaire'
import {
  HelpCircle,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  Bot,
  Tags
} from 'lucide-react'
import { getErrorMessage } from '@/lib/utils'
import type { QuestionItem, TopicCategoryItem } from '@/types'

interface QuestionsManagerProps {
  initialQuestions: QuestionItem[]
  topicCategories: TopicCategoryItem[]
}

export function QuestionsManager({
  initialQuestions,
  topicCategories
}: QuestionsManagerProps) {
  const [questions, setQuestions] =
    React.useState<QuestionItem[]>(initialQuestions)
  const [text, setText] = React.useState('')
  const [icon, setIcon] = React.useState('📋')
  const [selectedCategoryId, setSelectedCategoryId] =
    React.useState<string>('none')
  const [selectedSubcategoryId, setSelectedSubcategoryId] =
    React.useState<string>('none')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Subcategorías disponibles según la categoría seleccionada
  const availableSubcategories = React.useMemo(() => {
    if (selectedCategoryId === 'none') return []
    const cat = topicCategories.find((c) => c.id === selectedCategoryId)
    return cat?.subcategories || []
  }, [selectedCategoryId, topicCategories])

  // Preguntas activas ordenadas para la vista previa
  const activeQuestionsForPreview = React.useMemo(() => {
    return questions.filter((q) => q.isActive).sort((a, b) => a.order - b.order)
  }, [questions])

  const handleCategorySelectChange = (newCatId: string) => {
    setSelectedCategoryId(newCatId)
    setSelectedSubcategoryId('none')
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return

    const catObj = topicCategories.find((c) => c.id === selectedCategoryId)
    const subObj = availableSubcategories.find(
      (s) => s.id === selectedSubcategoryId
    )

    setIsSubmitting(true)
    try {
      const res = await createQuestionDirect({
        text,
        icon,
        category: catObj ? catObj.name : 'General',
        categoryId: selectedCategoryId !== 'none' ? selectedCategoryId : null,
        subcategoryId:
          selectedSubcategoryId !== 'none' ? selectedSubcategoryId : null,
        order: questions.length
      })

      if (res.success && res.question) {
        setQuestions((prev) => [
          ...prev,
          {
            ...res.question,
            categoryRel: catObj
              ? { id: catObj.id, name: catObj.name, code: catObj.code }
              : null,
            subcategoryRel: subObj
              ? { id: subObj.id, name: subObj.name, code: subObj.code }
              : null
          } as QuestionItem
        ])
        setText('')
        setIcon('📋')
        setSelectedCategoryId('none')
        setSelectedSubcategoryId('none')
        toast.success('Pregunta sugerida agregada exitosamente')
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al guardar la pregunta')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggle = async (id: string, currentActive: boolean) => {
    const nextState = !currentActive
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, isActive: nextState } : q))
    )

    try {
      await toggleQuestionActiveAction(id, nextState)
      toast.success(
        nextState ? 'Pregunta activada en el chat' : 'Pregunta desactivada'
      )
    } catch (err: unknown) {
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, isActive: currentActive } : q))
      )
      toast.error(getErrorMessage(err) || 'Error al cambiar el estado')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta pregunta sugerida?')) return

    try {
      await deleteQuestionAction(id)
      setQuestions((prev) => prev.filter((q) => q.id !== id))
      toast.success('Pregunta eliminada')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al eliminar')
    }
  }

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const index = questions.findIndex((q) => q.id === id)
    if (index === -1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= questions.length) return

    const newQuestions = [...questions]
    const temp = newQuestions[index]
    newQuestions[index] = newQuestions[targetIndex]
    newQuestions[targetIndex] = temp

    const updatedOrders = newQuestions.map((q, idx) => ({ ...q, order: idx }))
    setQuestions(updatedOrders)

    try {
      await moveQuestionOrderAction(id, direction)
      toast.success('Orden actualizado')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al guardar el nuevo orden')
    }
  }

  return (
    <div className='space-y-6 font-exo'>
      {/* Cabecera */}
      <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div className='space-y-1'>
          <h2 className='font-frances text-xl font-bold text-foreground flex items-center gap-2'>
            <HelpCircle className='w-5 h-5 text-primary' />
            Gestión de Preguntas Frecuentes y Sugeridas
          </h2>
          <p className='text-xs text-muted-foreground max-w-xl leading-relaxed'>
            Personaliza las opciones del cuestionario inicial para los
            estudiantes. Vincula opcionalmente cada pregunta a una categoría y
            subtema de la USS.
          </p>
        </div>
      </div>

      {/* Formulario de Creación con Categorías y Subtemas */}
      <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4'>
        <div className='border-b border-border/40 pb-3 flex items-center justify-between'>
          <h3 className='font-frances text-base font-bold text-foreground flex items-center gap-2'>
            <Plus className='w-4 h-4 text-primary' />
            Agregar Nueva Pregunta Sugerida
          </h3>
        </div>

        <form onSubmit={handleCreate} className='space-y-3.5 pt-1'>
          <div className='grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end'>
            <div className='sm:col-span-3 space-y-1.5'>
              <Label className='text-xs font-semibold'>Ícono / Emoji</Label>
              <IconPicker value={icon} onChange={setIcon} />
            </div>

            <div className='sm:col-span-9 space-y-1.5'>
              <Label htmlFor='qText' className='text-xs font-semibold'>
                Texto de la Pregunta
              </Label>
              <Input
                id='qText'
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder='Ej. ¿Cuáles son los requisitos para obtener el grado de Bachiller?'
                className='rounded-xl text-xs h-10'
                required
              />
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end'>
            {/* Selector de Categoría Temática USS */}
            <div className='sm:col-span-5 space-y-1.5'>
              <Label
                htmlFor='qCatId'
                className='text-xs font-semibold flex items-center gap-1.5'
              >
                <Tags className='w-3 h-3 text-primary' />
                Categoría Temática (Opcional)
              </Label>
              <select
                id='qCatId'
                value={selectedCategoryId}
                onChange={(e) => handleCategorySelectChange(e.target.value)}
                className='w-full h-10 rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-exo text-foreground focus:outline-none focus:ring-1 focus:ring-primary'
              >
                <option value='none'>Sin categoría temática / General</option>
                {topicCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Subtema Temático Dependiente */}
            <div className='sm:col-span-5 space-y-1.5'>
              <Label htmlFor='qSubId' className='text-xs font-semibold'>
                Subtema Específico (Opcional)
              </Label>
              <select
                id='qSubId'
                value={selectedSubcategoryId}
                onChange={(e) => setSelectedSubcategoryId(e.target.value)}
                disabled={
                  selectedCategoryId === 'none' ||
                  availableSubcategories.length === 0
                }
                className='w-full h-10 rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-exo text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-40 disabled:cursor-not-allowed'
              >
                <option value='none'>
                  {selectedCategoryId === 'none'
                    ? 'Selecciona una categoría primero'
                    : availableSubcategories.length === 0
                      ? 'Sin subtemas disponibles'
                      : 'Sin subtema específico'}
                </option>
                {availableSubcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
            </div>

            <div className='sm:col-span-2'>
              <Button
                type='submit'
                disabled={isSubmitting}
                className='w-full h-10 rounded-xl text-xs font-semibold gap-1.5 cursor-pointer shadow-xs'
              >
                <Plus className='w-4 h-4' />{' '}
                {isSubmitting ? 'Guardando...' : 'Agregar'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Listado de Preguntas con Reordenamiento y Badges Temáticos */}
      <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4'>
        <div className='border-b border-border/40 pb-3 flex items-center justify-between'>
          <h3 className='font-frances text-base font-bold text-foreground'>
            Preguntas Registradas ({questions.length})
          </h3>
          <span className='text-xs text-muted-foreground'>
            Usa las flechas 🔼 🔽 para ordenar
          </span>
        </div>

        {questions.length === 0 ? (
          <div className='py-8 text-center text-xs text-muted-foreground space-y-1'>
            <HelpCircle className='w-6 h-6 mx-auto text-muted-foreground/60 mb-2' />
            <p className='font-semibold text-foreground'>
              No hay preguntas configuradas
            </p>
            <p className='text-[11px]'>
              Agrega sugerencias arriba para los estudiantes.
            </p>
          </div>
        ) : (
          <div className='space-y-2.5'>
            {questions.map((q, idx) => {
              const categoryLabel =
                q.categoryRel?.name || q.category || 'General'
              const subcategoryLabel = q.subcategoryRel?.name

              return (
                <div
                  key={q.id}
                  className={`rounded-2xl border p-3.5 sm:p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    q.isActive
                      ? 'border-border/80 bg-card/60 shadow-xs'
                      : 'border-border/40 bg-muted/20 opacity-60'
                  }`}
                >
                  <div className='flex items-center gap-3 min-w-0 flex-1'>
                    {/* Botones de Reordenar */}
                    <div className='flex flex-col gap-0.5 shrink-0'>
                      <button
                        type='button'
                        disabled={idx === 0}
                        onClick={() => handleMove(q.id, 'up')}
                        className='p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer'
                        title='Subir posición'
                      >
                        <ArrowUp className='w-3.5 h-3.5' />
                      </button>
                      <button
                        type='button'
                        disabled={idx === questions.length - 1}
                        onClick={() => handleMove(q.id, 'down')}
                        className='p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer'
                        title='Bajar posición'
                      >
                        <ArrowDown className='w-3.5 h-3.5' />
                      </button>
                    </div>

                    <span className='font-mono font-bold text-xs text-muted-foreground w-6 text-center shrink-0'>
                      #{idx + 1}
                    </span>

                    <span className='text-2xl shrink-0 p-1.5 rounded-xl bg-muted/40 border border-border/60'>
                      {q.icon}
                    </span>

                    <div className='min-w-0 flex-1 space-y-1'>
                      <p className='font-semibold text-xs text-foreground truncate'>
                        {q.text}
                      </p>
                      <div className='flex items-center gap-1.5 flex-wrap'>
                        <Badge
                          variant='outline'
                          className='text-[9px] uppercase font-bold py-0'
                        >
                          {categoryLabel}
                        </Badge>
                        {subcategoryLabel ? (
                          <Badge
                            variant='outline'
                            className='text-[9px] text-primary border-primary/30 bg-primary/5 py-0'
                          >
                            {subcategoryLabel}
                          </Badge>
                        ) : (
                          <Badge
                            variant='outline'
                            className='text-[9px] text-muted-foreground/70 border-border/60 py-0 font-normal'
                          >
                            Sin subtema en específico
                          </Badge>
                        )}
                        {!q.isActive && (
                          <span className='text-[10px] text-muted-foreground'>
                            (Desactivada)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/30'>
                    <Switch
                      checked={q.isActive}
                      onCheckedChange={() => handleToggle(q.id, q.isActive)}
                      aria-label='Activar o desactivar pregunta'
                    />
                    <Button
                      size='icon-xs'
                      variant='ghost'
                      onClick={() => handleDelete(q.id)}
                      className='text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-lg'
                      title='Eliminar pregunta'
                    >
                      <Trash2 className='w-3.5 h-3.5' />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* VISTA PREVIA EN VIVO (LIVE PREVIEW) */}
      <div className='rounded-3xl border border-primary/30 bg-card p-5 sm:p-6 shadow-sm space-y-4 relative overflow-hidden'>
        <div className='flex items-center justify-between border-b border-border/40 pb-3'>
          <div className='flex items-center gap-2'>
            <div className='p-1.5 rounded-xl bg-primary/10 text-primary'>
              <Eye className='w-4 h-4' />
            </div>
            <div>
              <h3 className='font-frances text-base font-bold text-foreground'>
                Vista Previa en Vivo (Live Preview)
              </h3>
              <p className='text-xs text-muted-foreground'>
                Así es exactamente como se visualiza el cuestionario para los
                estudiantes en la pantalla de inicio del chat.
              </p>
            </div>
          </div>
          <Badge variant='default' className='text-[10px] font-bold py-0.5'>
            En Vivo
          </Badge>
        </div>

        <div className='p-4 sm:p-6 rounded-2xl bg-background/60 border border-border/60 max-w-xl mx-auto space-y-4 text-center'>
          <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20'>
            <Bot className='h-6 w-6' />
          </div>

          <div className='space-y-1 font-exo'>
            <h4 className='font-frances text-lg font-bold text-foreground'>
              ¡Hola, Estudiante USS!
            </h4>
            <p className='text-xs text-muted-foreground'>
              ¿En qué puedo orientarte hoy sobre la Universidad Señor de Sipán?
            </p>
          </div>

          {activeQuestionsForPreview.length === 0 ? (
            <p className='text-xs text-muted-foreground py-4'>
              No hay preguntas activas para mostrar en el chat.
            </p>
          ) : (
            <div className='text-left pt-2'>
              <Questionnaire>
                <QuestionnaireItem name='preview-questions'>
                  <QuestionnaireTitle className='font-frances text-xs text-muted-foreground px-1 pb-1'>
                    Consultas Rápidas Sugeridas
                  </QuestionnaireTitle>
                  <QuestionnaireDescription className='text-[11px] text-muted-foreground px-1 pb-2 font-exo'>
                    Selecciona un tema frecuente para consultar reglamentos y
                    trámites oficiales:
                  </QuestionnaireDescription>

                  <QuestionnaireChoices className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
                    {activeQuestionsForPreview.map((q) => {
                      const badgeText =
                        q.subcategoryRel?.name ||
                        q.categoryRel?.name ||
                        q.category ||
                        'General'

                      return (
                        <QuestionnaireChoice
                          key={q.id}
                          value={q.id}
                          className='flex items-start gap-2.5 rounded-2xl border border-border/70 p-3 text-xs font-exo hover:border-primary/50 hover:bg-primary/5 transition-all text-left shadow-xs'
                        >
                          <span className='text-base shrink-0'>{q.icon}</span>
                          <div className='space-y-0.5 min-w-0'>
                            <span className='font-medium text-foreground block line-clamp-2 leading-relaxed'>
                              {q.text}
                            </span>
                            <span className='text-[9px] text-primary uppercase font-bold tracking-wider block'>
                              {badgeText}
                            </span>
                          </div>
                        </QuestionnaireChoice>
                      )
                    })}
                  </QuestionnaireChoices>
                </QuestionnaireItem>
              </Questionnaire>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
