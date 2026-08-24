import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

// Función auxiliar para obtener información del User-Agent
function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase()

  // Detectar navegador
  let browserName = 'Navegador Web'
  if (ua.includes('edg/')) browserName = 'Microsoft Edge'
  else if (ua.includes('opr/') || ua.includes('opera')) browserName = 'Opera'
  else if (ua.includes('brave')) browserName = 'Brave Browser'
  else if (ua.includes('chrome') && !ua.includes('edg')) browserName = 'Google Chrome'
  else if (ua.includes('firefox')) browserName = 'Mozilla Firefox'
  else if (ua.includes('safari') && !ua.includes('chrome')) browserName = 'Apple Safari'

  // Detectar sistema operativo
  let osName = 'Sistema Operativo'
  if (ua.includes('windows nt 10.0')) osName = 'Windows 10/11'
  else if (ua.includes('windows')) osName = 'Windows'
  else if (ua.includes('iphone')) osName = 'iOS (iPhone)'
  else if (ua.includes('ipad')) osName = 'iPadOS'
  else if (ua.includes('macintosh') || ua.includes('mac os')) osName = 'macOS'
  else if (ua.includes('android')) osName = 'Android'
  else if (ua.includes('linux')) osName = 'Linux'

  // Detectar tipo de dispositivo
  let deviceType = 'desktop'
  if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
    deviceType = ua.includes('ipad') || ua.includes('tablet') ? 'tablet' : 'mobile'
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'tablet'
  }

  return { browserName, osName, deviceType }
}

// Función para obtener información de geolocalización por IP
async function getLocationFromIP(ip: string, headersList: Headers): Promise<string | null> {
  const headerCity = headersList.get('x-vercel-ip-city') || headersList.get('cf-ipcity') || headersList.get('x-geo-city')
  const headerCountry = headersList.get('x-vercel-ip-country') || headersList.get('cf-ipcountry') || headersList.get('x-geo-country')

  if (headerCity) {
    return headerCountry ? `${headerCity}, ${headerCountry}` : headerCity
  }

  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return 'Red Local / Desarrollo'
  }

  return null
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const headersList = await headers()
    const currentUserAgent = headersList.get('user-agent') || 'Mozilla/5.0'
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const cfIp = headersList.get('cf-connecting-ip')

    // Obtener la IP real del cliente
    const ipAddress =
      cfIp ||
      (forwardedFor ? forwardedFor.split(',')[0].trim() : null) ||
      realIp ||
      '127.0.0.1'

    // Obtener el sessionToken actual determinístico desde las cookies
    const cookieToken =
      request.cookies.get('authjs.session-token')?.value ||
      request.cookies.get('__Secure-authjs.session-token')?.value ||
      request.cookies.get('next-auth.session-token')?.value ||
      request.cookies.get('__Secure-next-auth.session-token')?.value

    const currentSessionToken = cookieToken || `auth_session_${session.user.id}`

    const { browserName, osName, deviceType } = parseUserAgent(currentUserAgent)
    const location = await getLocationFromIP(ipAddress, headersList)

    // 1. Limpiar sesiones expiradas
    await prisma.session.deleteMany({
      where: {
        userId: session.user.id,
        expires: { lt: new Date() },
      },
    })

    // 2. Registrar o actualizar de forma determinística la sesión actual
    await prisma.session.upsert({
      where: { sessionToken: currentSessionToken },
      create: {
        sessionToken: currentSessionToken,
        userId: session.user.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        ipAddress,
        userAgent: currentUserAgent,
        deviceType,
        browserName,
        osName,
        location,
      },
      update: {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ipAddress,
        userAgent: currentUserAgent,
        deviceType,
        browserName,
        osName,
        location,
        updatedAt: new Date(),
      },
    })

    // 3. Obtener todas las sesiones activas persistidas en la base de datos
    const activeSessions = await prisma.session.findMany({
      where: {
        userId: session.user.id,
        expires: { gt: new Date() },
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        sessionToken: true,
        createdAt: true,
        updatedAt: true,
        expires: true,
        userAgent: true,
        ipAddress: true,
        deviceType: true,
        browserName: true,
        osName: true,
        location: true,
      },
    })

    // 4. Formatear la lista de sesiones
    const sessionsWithDetails = activeSessions.map((s) => {
      const ua = s.userAgent || currentUserAgent
      const parsed = parseUserAgent(ua)

      return {
        sessionToken: s.sessionToken,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        userAgent: s.userAgent,
        ipAddress: s.ipAddress || '127.0.0.1',
        browserName: s.browserName || parsed.browserName,
        osName: s.osName || parsed.osName,
        deviceType: s.deviceType || parsed.deviceType,
        location: s.location || null,
        isCurrent: s.sessionToken === currentSessionToken,
      }
    })

    return NextResponse.json({
      sessions: sessionsWithDetails,
      total: sessionsWithDetails.length,
    })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
