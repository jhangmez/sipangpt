interface ModelInfo {
  nombre_comercial: string
  model_id: string
  nombre_original_modelo: string
  descripcion: string
  status: string
  link_hf: string
  base_model: string
}

export const INITIAL_MODELS: ModelInfo[] = [
  {
    nombre_comercial: 'SipánGPT-0.3',
    model_id: 'hf.co/ussipan/SipanGPT-0.3-Llama-3.2-1B-GGUF:Q4_K_M',
    nombre_original_modelo: 'Llama-3.2-1B-SipanGPT-0.3-GGUF',
    descripcion:
      'Modelo optimizado para responder preguntas en general sobre la Universidad Señor de Sipán',
    status: 'desactivado',
    link_hf: 'https://huggingface.co/ussipan/SipanGPT-0.3-Llama-3.2-1B-GGUF',
    base_model: 'Llama 3.2 1B'
  },
  {
    nombre_comercial: 'SipánGPT-0.5',
    model_id: 'hf.co/ussipan/Llama-3.2-SipanGPT-v0.5-GGUF:Q4_K_M',
    nombre_original_modelo: 'Llama-3.2-SipanGPT-v0.5-GGUF',
    descripcion:
      'Modelo para responder preguntas en general sobre la Universidad Señor de Sipán',
    status: 'activo',
    link_hf: 'https://huggingface.co/ussipan/Llama-3.2-SipanGPT-v0.5-GGUF',
    base_model: 'Llama 3.2 1B'
  }
]
