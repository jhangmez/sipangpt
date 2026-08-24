'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  createTopicCategoryAction,
  updateTopicCategoryAction,
  deleteTopicCategoryAction,
  createTopicSubcategoryAction,
  updateTopicSubcategoryAction,
  deleteTopicSubcategoryAction,
} from '@/lib/actions/admin-topics'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Tags,
  Plus,
  Trash2,
  Edit2,
  FolderTree,
  Layers,
  CornerDownRight,
} from 'lucide-react'

interface SubcategoryItem {
  id: string
  categoryId: string
  name: string
  code: string
  description: string | null
  _count?: {
    messages: number
  }
}

interface TopicCategoryItem {
  id: string
  name: string
  code: string
  description: string | null
  order: number
  subcategories: SubcategoryItem[]
  _count?: {
    documents: number
    messages: number
  }
}

interface TopicCategoriesManagerProps {
  initialCategories: TopicCategoryItem[]
}

export function TopicCategoriesManager({
  initialCategories,
}: TopicCategoriesManagerProps) {
  const [categories, setCategories] = React.useState<TopicCategoryItem[]>(initialCategories)

  // Modal para Categoría Principal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<TopicCategoryItem | null>(null)
  const [catName, setCatName] = React.useState('')
  const [catCode, setCatCode] = React.useState('')
  const [catDesc, setCatDesc] = React.useState('')
  const [catOrder, setCatOrder] = React.useState(0)

  // Modal para Subcategoría
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = React.useState(false)
  const [parentCategoryId, setParentCategoryId] = React.useState<string | null>(null)
  const [editingSubcategory, setEditingSubcategory] = React.useState<SubcategoryItem | null>(null)
  const [subName, setSubName] = React.useState('')
  const [subCode, setSubCode] = React.useState('')
  const [subDesc, setSubDesc] = React.useState('')

  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const openCreateCategory = () => {
    setEditingCategory(null)
    setCatName('')
    setCatCode('')
    setCatDesc('')
    setCatOrder(categories.length)
    setIsCategoryModalOpen(true)
  }

  const openEditCategory = (cat: TopicCategoryItem) => {
    setEditingCategory(cat)
    setCatName(cat.name)
    setCatCode(cat.code)
    setCatDesc(cat.description || '')
    setCatOrder(cat.order)
    setIsCategoryModalOpen(true)
  }

  const openCreateSubcategory = (catId: string) => {
    setParentCategoryId(catId)
    setEditingSubcategory(null)
    setSubName('')
    setSubCode('')
    setSubDesc('')
    setIsSubcategoryModalOpen(true)
  }

  const openEditSubcategory = (sub: SubcategoryItem) => {
    setParentCategoryId(sub.categoryId)
    setEditingSubcategory(sub)
    setSubName(sub.name)
    setSubCode(sub.code)
    setSubDesc(sub.description || '')
    setIsSubcategoryModalOpen(true)
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!catName.trim() || !catCode.trim()) return

    setIsSubmitting(true)
    try {
      if (editingCategory) {
        const res = await updateTopicCategoryAction({
          id: editingCategory.id,
          name: catName,
          code: catCode,
          description: catDesc,
          order: catOrder,
        })
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? { ...c, ...res.category } : c))
        )
        toast.success('Categoría temática actualizada')
      } else {
        const res = await createTopicCategoryAction({
          name: catName,
          code: catCode,
          description: catDesc,
          order: catOrder,
        })
        setCategories((prev) => [...prev, { ...res.category, subcategories: [] }])
        toast.success('Categoría temática creada')
      }
      setIsCategoryModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar categoría')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!parentCategoryId || !subName.trim() || !subCode.trim()) return

    setIsSubmitting(true)
    try {
      if (editingSubcategory) {
        const res = await updateTopicSubcategoryAction({
          id: editingSubcategory.id,
          name: subName,
          code: subCode,
          description: subDesc,
        })
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === parentCategoryId
              ? {
                  ...cat,
                  subcategories: cat.subcategories.map((s) =>
                    s.id === editingSubcategory.id ? { ...s, ...res.subcategory } : s
                  ),
                }
              : cat
          )
        )
        toast.success('Subtema actualizado')
      } else {
        const res = await createTopicSubcategoryAction({
          categoryId: parentCategoryId,
          name: subName,
          code: subCode,
          description: subDesc,
        })
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === parentCategoryId
              ? {
                  ...cat,
                  subcategories: [...cat.subcategories, res.subcategory],
                }
              : cat
          )
        )
        toast.success('Subtema agregado con éxito')
      }
      setIsSubcategoryModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar subtema')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la categoría "${name}" y todos sus subtemas asociados?`)) {
      return
    }

    try {
      await deleteTopicCategoryAction(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
      toast.success('Categoría eliminada')
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar categoría')
    }
  }

  const handleDeleteSubcategory = async (subId: string, catId: string) => {
    if (!confirm('¿Eliminar este subtema?')) return

    try {
      await deleteTopicSubcategoryAction(subId)
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === catId
            ? {
                ...cat,
                subcategories: cat.subcategories.filter((s) => s.id !== subId),
              }
            : cat
        )
      )
      toast.success('Subtema eliminado')
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar subtema')
    }
  }

  return (
    <div className='space-y-6 font-exo'>
      {/* Cabecera y Acciones Globales */}
      <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div className='space-y-1'>
          <h2 className='font-frances text-xl font-bold text-foreground flex items-center gap-2'>
            <FolderTree className='w-5 h-5 text-primary' />
            Catálogo de Categorías y Subtemas Temáticos
          </h2>
          <p className='text-xs text-muted-foreground max-w-xl leading-relaxed'>
            Estructura jerárquica para clasificar documentos RAG y preguntas de estudiantes. Permite generar analítica de temas más consultados en la USS.
          </p>
        </div>

        <Button
          size='sm'
          onClick={openCreateCategory}
          className='gap-1.5 rounded-xl text-xs font-semibold shadow-xs shrink-0'
        >
          <Plus className='w-4 h-4' /> Nueva Categoría
        </Button>
      </div>

      {/* Listado de Categorías y Subtemas */}
      {categories.length === 0 ? (
        <div className='rounded-3xl border border-border/80 bg-card p-12 text-center text-xs text-muted-foreground space-y-3'>
          <Tags className='w-8 h-8 mx-auto text-muted-foreground/60' />
          <p className='font-semibold text-foreground text-sm'>
            No hay categorías temáticas registradas
          </p>
          <Button onClick={openCreateCategory} className='rounded-xl text-xs gap-2 mt-2'>
            <Plus className='w-4 h-4' /> Crear Primera Categoría
          </Button>
        </div>
      ) : (
        <div className='space-y-4'>
          {categories.map((cat, idx) => (
            <div
              key={cat.id}
              className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4 hover:border-border transition-all'
            >
              {/* Encabezado de la Categoría Principal */}
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3'>
                <div className='space-y-1 min-w-0 flex-1'>
                  <div className='flex items-center gap-2.5 flex-wrap'>
                    <span className='font-mono font-bold text-xs text-muted-foreground'>
                      #{idx + 1}
                    </span>
                    <h3 className='font-frances font-bold text-base text-foreground truncate'>
                      {cat.name}
                    </h3>
                    <Badge variant='outline' className='font-mono text-[10px] font-bold text-primary border-primary/30 bg-primary/5 py-0'>
                      {cat.code}
                    </Badge>
                  </div>
                  {cat.description && (
                    <p className='text-xs text-muted-foreground leading-relaxed'>
                      {cat.description}
                    </p>
                  )}
                </div>

                <div className='flex items-center gap-2 shrink-0'>
                  <Button
                    size='xs'
                    variant='outline'
                    onClick={() => openCreateSubcategory(cat.id)}
                    className='gap-1 rounded-xl text-[11px] font-semibold'
                  >
                    <Plus className='w-3 h-3' /> Agregar Subtema
                  </Button>
                  <Button
                    size='icon-xs'
                    variant='ghost'
                    onClick={() => openEditCategory(cat)}
                    className='rounded-lg text-muted-foreground hover:text-foreground'
                    title='Editar categoría'
                  >
                    <Edit2 className='w-3.5 h-3.5' />
                  </Button>
                  <Button
                    size='icon-xs'
                    variant='ghost'
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    className='rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10'
                    title='Eliminar categoría'
                  >
                    <Trash2 className='w-3.5 h-3.5' />
                  </Button>
                </div>
              </div>

              {/* Subtemas de la Categoría */}
              <div className='space-y-2 pt-1'>
                <div className='flex items-center justify-between text-[11px] font-semibold text-muted-foreground px-1'>
                  <span className='flex items-center gap-1.5'>
                    <Layers className='w-3.5 h-3.5 text-primary' />
                    Subtemas ({cat.subcategories.length})
                  </span>
                  <div className='flex items-center gap-3 text-[10px]'>
                    <span>{cat._count?.documents || 0} Docs</span>
                    <span>•</span>
                    <span>{cat._count?.messages || 0} Mensajes</span>
                  </div>
                </div>

                {cat.subcategories.length === 0 ? (
                  <div className='rounded-2xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground'>
                    No hay subtemas en esta categoría. Agrega el primero con el botón "+ Agregar Subtema".
                  </div>
                ) : (
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
                    {cat.subcategories.map((sub) => (
                      <div
                        key={sub.id}
                        className='rounded-2xl border border-border/70 p-3 bg-muted/20 flex items-start justify-between gap-2 hover:bg-muted/40 transition-colors'
                      >
                        <div className='space-y-1 min-w-0 flex-1'>
                          <div className='flex items-center gap-1.5 flex-wrap'>
                            <CornerDownRight className='w-3 h-3 text-primary shrink-0' />
                            <span className='font-bold text-xs text-foreground truncate'>
                              {sub.name}
                            </span>
                            <span className='font-mono text-[9px] text-muted-foreground px-1.5 py-0.5 rounded-md bg-background border border-border/60'>
                              {sub.code}
                            </span>
                          </div>
                          {sub.description && (
                            <p className='text-[11px] text-muted-foreground leading-snug pl-4 line-clamp-2'>
                              {sub.description}
                            </p>
                          )}
                        </div>

                        <div className='flex items-center gap-1 shrink-0'>
                          <Button
                            size='icon-xs'
                            variant='ghost'
                            onClick={() => openEditSubcategory(sub)}
                            className='h-6 w-6 rounded-md text-muted-foreground hover:text-foreground'
                            title='Editar subtema'
                          >
                            <Edit2 className='w-3 h-3' />
                          </Button>
                          <Button
                            size='icon-xs'
                            variant='ghost'
                            onClick={() => handleDeleteSubcategory(sub.id, cat.id)}
                            className='h-6 w-6 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10'
                            title='Eliminar subtema'
                          >
                            <Trash2 className='w-3 h-3' />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para Crear / Editar Categoría Principal */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className='max-w-md rounded-3xl p-6 font-exo'>
          <DialogHeader className='space-y-1.5'>
            <DialogTitle className='font-frances text-xl'>
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría Principal'}
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground'>
              Define el tema macro para la clasificación de normativas y consultas universitarias.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className='space-y-4 pt-2'>
            <div className='space-y-1.5'>
              <Label htmlFor='catName' className='text-xs font-semibold'>
                Nombre de la Categoría
              </Label>
              <Input
                id='catName'
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder='Ej. Matrícula y Registro'
                className='rounded-xl text-xs'
                required
              />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <Label htmlFor='catCode' className='text-xs font-semibold'>
                  Código Único (Mayúsculas)
                </Label>
                <Input
                  id='catCode'
                  value={catCode}
                  onChange={(e) => setCatCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                  placeholder='MATRICULA'
                  className='rounded-xl text-xs font-mono'
                  required
                />
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='catOrder' className='text-xs font-semibold'>
                  Orden de Visualización
                </Label>
                <Input
                  id='catOrder'
                  type='number'
                  value={catOrder}
                  onChange={(e) => setCatOrder(Number(e.target.value))}
                  className='rounded-xl text-xs font-mono'
                />
              </div>
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='catDesc' className='text-xs font-semibold'>
                Descripción <span className='text-[10px] text-muted-foreground'>(Opcional)</span>
              </Label>
              <Textarea
                id='catDesc'
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder='Explica brevemente qué normativas o temas abarca...'
                className='rounded-2xl text-xs min-h-[70px]'
              />
            </div>

            <div className='flex justify-end gap-2 pt-2'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setIsCategoryModalOpen(false)}
                className='rounded-xl text-xs'
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={isSubmitting}
                className='rounded-xl text-xs font-semibold'
              >
                {isSubmitting ? 'Guardando...' : editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para Crear / Editar Subcategoría */}
      <Dialog open={isSubcategoryModalOpen} onOpenChange={setIsSubcategoryModalOpen}>
        <DialogContent className='max-w-md rounded-3xl p-6 font-exo'>
          <DialogHeader className='space-y-1.5'>
            <DialogTitle className='font-frances text-xl'>
              {editingSubcategory ? 'Editar Subtema' : 'Nuevo Subtema Específico'}
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground'>
              Crea una especialización temática subordinada a la categoría principal.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSubcategory} className='space-y-4 pt-2'>
            <div className='space-y-1.5'>
              <Label htmlFor='subName' className='text-xs font-semibold'>
                Nombre del Subtema
              </Label>
              <Input
                id='subName'
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                placeholder='Ej. Matrícula Extemporánea'
                className='rounded-xl text-xs'
                required
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='subCode' className='text-xs font-semibold'>
                Código del Subtema
              </Label>
              <Input
                id='subCode'
                value={subCode}
                onChange={(e) => setSubCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                placeholder='MAT_EXTEMPORANEA'
                className='rounded-xl text-xs font-mono'
                required
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='subDesc' className='text-xs font-semibold'>
                Descripción <span className='text-[10px] text-muted-foreground'>(Opcional)</span>
              </Label>
              <Textarea
                id='subDesc'
                value={subDesc}
                onChange={(e) => setSubDesc(e.target.value)}
                placeholder='Detalles sobre los trámites de este subtema...'
                className='rounded-2xl text-xs min-h-[70px]'
              />
            </div>

            <div className='flex justify-end gap-2 pt-2'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setIsSubcategoryModalOpen(false)}
                className='rounded-xl text-xs'
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={isSubmitting}
                className='rounded-xl text-xs font-semibold'
              >
                {isSubmitting ? 'Guardando...' : editingSubcategory ? 'Guardar Cambios' : 'Crear Subtema'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
