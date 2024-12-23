// app/api/sesiones/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET() {
  try {
    const now = new Date()

    const sesiones = await prisma.session.findMany({
      where: {
        expires: {
          gt: now // Filtrar por sesiones que expiran después de la fecha y hora actuales
        }
      },
      select: {
        // Seleccionar solo los campos necesarios
        sessionToken: true,
        expires: true,
        createdAt: true,
        updatedAt: true,
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
