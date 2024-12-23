// lib/export-csv.ts
import { stringify } from 'csv-stringify/sync'

interface LogEntry {
  timestamp: Date
  status: number
  messageId: string | null
  userId: string | null
}

export function generateCSV(logs: LogEntry[], range: string): string {
  const now = new Date()
  const headers = ['Timestamp', 'Status', 'Message ID', 'User ID']

  const data = logs.map((log) => [
    new Date(log.timestamp).toLocaleString('es-ES', {
      timeZone: 'America/Lima'
    }),
    log.status,
    log.messageId || 'N/A',
    log.userId || 'N/A'
  ])

  const csv = stringify([headers, ...data], {
    header: false,
    delimiter: ','
  })

  return csv
}
