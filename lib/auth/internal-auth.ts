import crypto from 'crypto'
import { prisma, Role } from '@/lib/prisma'
import {
  INTERNAL_AUTH_HEADER_API_KEY,
  INTERNAL_AUTH_HEADER_AUTHORIZATION,
  PERF_TEST_USER_EMAIL,
  PERF_TEST_USER_NAME,
} from '@/constants'

export interface SyntheticAuthSession {
  user: {
    id: string
    email: string
    name: string | null
    role: Role
  }
}

// Caché en memoria para evitar consultar la base de datos en cada petición de benchmarking
let cachedBenchmarkUser: { id: string; email: string; name: string | null; role: Role } | null = null

/**
 * Valida si la solicitud entrante contiene una API Key interna autorizada
 * para pruebas de rendimiento, benchmarks o microservicios autorizados.
 *
 * Soporta:
 * - Cabecera 'x-api-key: <clave>'
 * - Cabecera 'Authorization: Bearer <clave>'
 */
export async function validateInternalAuth(req: Request): Promise<SyntheticAuthSession | null> {
  const configuredKey =
    process.env.INTERNAL_API_KEY ||
    process.env.PERF_TEST_API_KEY ||
    process.env.SIPANGPT_API_KEY ||
    (process.env.NODE_ENV !== 'production' ? 'sipangpt-local-perf-key' : undefined)

  if (!configuredKey) {
    return null
  }

  // 1. Extraer token de las cabeceras HTTP
  const headerKey = req.headers.get(INTERNAL_AUTH_HEADER_API_KEY)
  const authHeader = req.headers.get(INTERNAL_AUTH_HEADER_AUTHORIZATION)

  let incomingToken: string | null = null

  if (headerKey) {
    incomingToken = headerKey.trim()
  } else if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i)
    if (match && match[1]) {
      incomingToken = match[1].trim()
    }
  }

  if (!incomingToken) {
    return null
  }

  // 2. Comparación segura contra ataques de temporización
  const incomingBuffer = Buffer.from(incomingToken)
  const configuredBuffer = Buffer.from(configuredKey)

  if (incomingBuffer.length !== configuredBuffer.length) {
    return null
  }

  const isValid = crypto.timingSafeEqual(incomingBuffer, configuredBuffer)
  if (!isValid) {
    return null
  }

  // 3. Resolver usuario sintético en base de datos para mantener integridad referencial (FK)
  if (cachedBenchmarkUser) {
    return { user: cachedBenchmarkUser }
  }

  try {
    let user = await prisma.user.findUnique({
      where: { email: PERF_TEST_USER_EMAIL },
      select: { id: true, email: true, name: true, role: true },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: PERF_TEST_USER_EMAIL,
          name: PERF_TEST_USER_NAME,
          role: Role.ADMIN,
        },
        select: { id: true, email: true, name: true, role: true },
      }).catch(async () => {
        // Fallback en caso de carrera de concurrencia: buscar primer admin existente
        return prisma.user.findFirst({
          where: { role: Role.ADMIN },
          select: { id: true, email: true, name: true, role: true },
        })
      })
    }

    if (user) {
      cachedBenchmarkUser = user
      return { user }
    }
  } catch (err) {
    console.warn('[INTERNAL_AUTH_USER_RESOLVE_WARN]', err)
  }

  // Si fallara la BD temporalmente, retornar sesión sintética de emergencia
  return {
    user: {
      id: 'perf-agent-benchmark-id',
      email: PERF_TEST_USER_EMAIL,
      name: PERF_TEST_USER_NAME,
      role: Role.ADMIN,
    },
  }
}
