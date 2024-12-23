export function getSelectedModel(): string {
  if (typeof window !== 'undefined') {
    const storedModel = localStorage.getItem('selectedModel')
    return storedModel || 'hf.co/ussipan/Llama-3.2-SipanGPT-v0.5-GGUF:Q4_K_M'
  } else {
    // Default model
    return 'hf.co/ussipan/Llama-3.2-SipanGPT-v0.5-GGUF:Q4_K_M'
  }
}
