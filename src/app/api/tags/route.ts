import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const OLLAMA_URL =
      process.env.NEXT_PUBLIC_OLLAMA_URL || 'http://127.0.0.1:11434'

    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      next: { revalidate: 0 } // Asegura que no hay caché
    })

    if (!response.ok) {
      throw new Error(
        `La API de Ollama respondió con el estado: ${response.status}`
      )
    }

    const data = await response.json()

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    })
  } catch (error) {
    // console.error('Error fetching tags:', error)
    return NextResponse.json(
      { error: 'No se pudieron obtener las etiquetas de la API de Ollama' },
      { status: 500 }
    )
  }
}
