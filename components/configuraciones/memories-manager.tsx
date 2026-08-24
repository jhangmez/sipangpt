'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  toggleUserMemory,
  deleteUserMemory,
  createUserMemory,
} from '@/lib/actions/user-settings'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Brain, Plus, Trash2, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react'
import { getErrorMessage } from '@/lib/utils'

interface UserMemoryItem {
  id: string
  fact: string
  category: string | null
  isActive: boolean
  createdAt: Date
}

interface MemoriesManagerProps {
  initialMemories: UserMemoryItem[]
}

export function MemoriesManager({ initialMemories }: MemoriesManagerProps) {
  const [memories, setMemories] = React.useState<UserMemoryItem[]>(initialMemories)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [newFact, setNewFact] = React.useState('')
  const [newCategory, setNewCategory] = React.useState('academico')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleToggle = async (id: string, currentActive: boolean) => {
    const nextState = !currentActive
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isActive: nextState } : m))
    )

    try {
      await toggleUserMemory(id, nextState)
      toast.success(
        nextState ? 'Recuerdo activado' : 'Recuerdo pausado para inferencias'
      )
    } catch (err: unknown) {
      setMemories((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isActive: currentActive } : m))
      )
      toast.error(getErrorMessage(err) || 'Error al actualizar el recuerdo')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteUserMemory(id)
      setMemories((prev) => prev.filter((m) => m.id !== id))
      toast.success('Recuerdo eliminado')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al eliminar el recuerdo')
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFact.trim()) return

    setIsSubmitting(true)
    try {
      const res = await createUserMemory(newFact, newCategory)
      if (res.success && res.memory) {
        setMemories((prev) => [res.memory, ...prev])
        setNewFact('')
        setIsDialogOpen(false)
        toast.success('Nuevo recuerdo registrado')
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al guardar el recuerdo')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='space-y-6 font-exo'>
      {/* Cabecera y Botón Nuevo Recuerdo */}
      <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div className='space-y-1'>
          <h3 className='font-frances text-base font-bold text-foreground flex items-center gap-2'>
            <Brain className='w-4 h-4 text-primary' />
            Memoria Personalizada de SipánGPT
          </h3>
          <p className='text-xs text-muted-foreground max-w-xl leading-relaxed'>
            SipánGPT recuerda datos académicos y preferencias que le proporciones para adaptar sus respuestas sin tener que repetirlas en cada conversación.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            render={
              <Button size='sm' className='gap-1.5 rounded-xl text-xs shrink-0 cursor-pointer'>
                <Plus className='w-4 h-4' /> Agregar Recuerdo
              </Button>
            }
          />
          <DialogContent className='max-w-md rounded-3xl p-6 font-exo'>
            <DialogHeader className='space-y-2'>
              <DialogTitle className='font-frances text-xl'>
                Nuevo Recuerdo de Usuario
              </DialogTitle>
              <DialogDescription className='text-xs text-muted-foreground'>
                Ingresa un dato sobre tu carrera, ciclo o intereses para que SipánGPT lo tenga en cuenta en futuras consultas.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreate} className='space-y-4 pt-2'>
              <div className='space-y-2'>
                <Label htmlFor='fact' className='text-xs font-semibold'>
                  Dato o Preferencia
                </Label>
                <Input
                  id='fact'
                  value={newFact}
                  onChange={(e) => setNewFact(e.target.value)}
                  placeholder='Ej. Estudiante de 6to ciclo de Ingeniería de Sistemas'
                  className='rounded-xl text-xs'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='category' className='text-xs font-semibold'>
                  Categoría
                </Label>
                <select
                  id='category'
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className='w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-exo text-foreground focus:outline-none focus:ring-1 focus:ring-primary'
                >
                  <option value='academico'>Académico (Carrera, Ciclo, Modalidad)</option>
                  <option value='preferencia'>Preferencia de Respuesta</option>
                  <option value='tramite'>Trámites de Interés</option>
                  <option value='general'>General</option>
                </select>
              </div>

              <div className='flex justify-end gap-2 pt-2'>
                <Button
                  type='button'
                  variant='ghost'
                  onClick={() => setIsDialogOpen(false)}
                  className='rounded-xl text-xs'
                >
                  Cancelar
                </Button>
                <Button
                  type='submit'
                  disabled={isSubmitting}
                  className='rounded-xl text-xs'
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Recuerdo'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Recuerdos */}
      <div className='space-y-3'>
        {memories.length === 0 ? (
          <div className='rounded-3xl border border-dashed border-border p-8 text-center space-y-2'>
            <Brain className='w-8 h-8 text-muted-foreground mx-auto' />
            <p className='text-xs font-semibold text-foreground'>
              Aún no tienes recuerdos registrados
            </p>
            <p className='text-[11px] text-muted-foreground max-w-sm mx-auto'>
              Agrega tu carrera o ciclo actual para que SipánGPT te brinde información precisa en trámites y asignaturas.
            </p>
          </div>
        ) : (
          memories.map((mem) => (
            <div
              key={mem.id}
              className={`rounded-2xl border p-4 transition-all flex items-center justify-between gap-4 ${
                mem.isActive
                  ? 'border-border/80 bg-card shadow-xs'
                  : 'border-border/40 bg-muted/30 opacity-60'
              }`}
            >
              <div className='space-y-1 min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                  <Badge variant='outline' className='text-[9px] uppercase font-bold py-0'>
                    {mem.category || 'general'}
                  </Badge>
                  {!mem.isActive && (
                    <span className='text-[10px] text-muted-foreground'>(Pausado)</span>
                  )}
                </div>
                <p className='text-xs font-medium text-foreground leading-relaxed'>
                  {mem.fact}
                </p>
              </div>

              <div className='flex items-center gap-3 shrink-0'>
                <Switch
                  checked={mem.isActive}
                  onCheckedChange={() => handleToggle(mem.id, mem.isActive)}
                  aria-label='Activar o desactivar recuerdo'
                />
                <Button
                  variant='ghost'
                  size='icon-xs'
                  onClick={() => handleDelete(mem.id)}
                  aria-label='Eliminar recuerdo'
                  className='h-7 w-7 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10'
                  title='Eliminar recuerdo'
                >
                  <Trash2 className='w-3.5 h-3.5' />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
