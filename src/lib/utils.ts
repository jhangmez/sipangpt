import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { INITIAL_MODELS } from '@/utils/initial-models'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getModelInfo = (modelName: string) => {
  return (
    INITIAL_MODELS.find((m) => m.model_id === modelName) || {
      modelo: '---',
      nombre_original_modelo: '---',
      descripcion: '--',
      status: '---',
      base_model: '---',
      link_hf: 'https://huggingface.co/jhangmez',
      model_id: modelName,
      nombre_comercial: '---'
    }
  )
}
