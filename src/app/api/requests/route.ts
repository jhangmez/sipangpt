// app/api/requests/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export async function GET() {
  try {
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000) // Últimos 5 minutos

    // Peticiones exitosas (status 200)
    const successfulRequests = await prisma.requestLog.count({
      where: {
        timestamp: {
          gte: fiveMinutesAgo
        },
        status: 200
      }
    })

    // Peticiones fallidas (status distinto de 200)
    const failedRequests = await prisma.requestLog.count({
      where: {
        timestamp: {
          gte: fiveMinutesAgo
        },
        NOT: {
          status: 200
        }
      }
    })

    return NextResponse.json({
      successful: successfulRequests,
      failed: failedRequests,
      time: now.toISOString() // Incluir la hora actual para la sincronización del gráfico
    })
  } catch (error) {
    console.error('Error fetching request logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch request logs' },
      { status: 500 }
    )
  }
}
