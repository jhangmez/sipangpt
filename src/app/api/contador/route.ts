let requestCount = 0 // Total de peticiones
let successCount = 0 // Respuestas exitosas (200)
let errorCount = 0 // Errores (500)
let timeoutCount = 0 // Timeouts (408)

export async function GET() {
  // Devuelve todos los contadores
  return new Response(
    JSON.stringify({
      total: requestCount,
      success: successCount,
      errors: errorCount,
      timeouts: timeoutCount
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

export async function POST(req: Request) {
  requestCount++ // Incrementa el contador total
  const { status } = await req.json()

  // Incrementa los contadores según el código de estado recibido
  if (status === 200) {
    successCount++
  } else if (status === 500) {
    errorCount++
  } else if (status === 408) {
    timeoutCount++
  }

  return new Response('Contador actualizado', { status: 200 })
}
