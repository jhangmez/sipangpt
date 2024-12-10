import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET() {
  try {
    const sesiones = await prisma.session.findMany({
      include: {
        user: {
          select: {
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json(sesiones)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Error al obtener las sesiones' },
      { status: 500 }
    )
  }
}
