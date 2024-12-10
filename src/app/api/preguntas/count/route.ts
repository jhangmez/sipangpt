import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET() {
  try {
    const count = await prisma.pregunta.count()
    return NextResponse.json(count)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Error al obtener el conteo de preguntas' },
      { status: 500 }
    )
  }
}
