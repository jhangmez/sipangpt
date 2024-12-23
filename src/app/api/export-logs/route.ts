// app/api/export-logs/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'
import { generateCSV } from '@/lib/export-csv'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const range = searchParams.get('range')

    let fromDate: Date
    const now = new Date()

    switch (range) {
      case '1h':
        fromDate = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case '7h':
        fromDate = new Date(now.getTime() - 7 * 60 * 60 * 1000)
        break
      case '24h':
        fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'all':
        fromDate = new Date(0) // Fecha mínima (desde el inicio de los tiempos)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid range parameter' },
          { status: 400 }
        )
    }

    const logs = await prisma.requestLog.findMany({
      where: {
        timestamp: {
          gte: fromDate
        }
      },
      select: {
        timestamp: true,
        status: true,
        messageId: true,
        userId: true
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    const csv = generateCSV(logs, range)

    const fileName = `log_${now.toISOString().replace(/[:.]/g, '-')}.csv` // Formato: log_YYYY-MM-DDTHH-mm-ss-SSSZ

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=${fileName}`
      }
    })
  } catch (error) {
    console.error('Error exporting logs:', error)
    return NextResponse.json(
      { error: 'Failed to export logs' },
      { status: 500 }
    )
  }
}
