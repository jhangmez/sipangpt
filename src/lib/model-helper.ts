export function getSelectedModel(): string {
  if (typeof window !== 'undefined') {
    const storedModel = localStorage.getItem('selectedModel')
    return storedModel || 'hf.co/ussipan/SipanGPT-0.3-Llama-3.2-1B-GGUF:Q4_K_M'
  } else {
    // Default model
    return 'hf.co/ussipan/SipanGPT-0.3-Llama-3.2-1B-GGUF:Q4_K_M'
  }
}
