import { prisma } from '@/lib/prisma'

export interface UserAgentDetails {
  deviceType: string
  browser: string
  os: string
}

/**
 * Parsea con fidelidad el User-Agent real del navegador y sistema operativo del usuario.
 */
export function parseUserAgentDetails(userAgent: string | null): UserAgentDetails {
  if (!userAgent) {
    return {
      deviceType: 'desktop',
      browser: 'Google Chrome',
      os: 'Windows 10/11',
    }
  }

  const ua = userAgent

  // 1. Detección de Sistema Operativo y Tipo de Dispositivo
  let os = 'Sistema Operativo'
  let formFactor = 'desktop'

  if (/windows/i.test(ua)) {
    if (/windows nt 10.0/i.test(ua)) os = 'Windows 10/11'
    else if (/windows nt 6.3/i.test(ua)) os = 'Windows 8.1'
    else if (/windows nt 6.1/i.test(ua)) os = 'Windows 7'
    else os = 'Windows'
    formFactor = 'desktop'
  } else if (/iphone/i.test(ua)) {
    const match = ua.match(/cpu iphone os (\d+[._\d]+)/i)
    os = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS (iPhone)'
    formFactor = 'mobile'
  } else if (/ipad/i.test(ua)) {
    os = 'iPadOS'
    formFactor = 'tablet'
  } else if (/android/i.test(ua)) {
    const match = ua.match(/android (\d+[._\d]*)/i)
    os = match ? `Android ${match[1]}` : 'Android'
    formFactor = /mobile/i.test(ua) ? 'mobile' : 'tablet'
  } else if (/macintosh|mac os x/i.test(ua)) {
    const match = ua.match(/mac os x (\d+[._\d]+)/i)
    os = match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS'
    formFactor = 'desktop'
  } else if (/linux/i.test(ua)) {
    os = 'Linux'
    formFactor = 'desktop'
  } else if (/cros/i.test(ua)) {
    os = 'ChromeOS'
    formFactor = 'desktop'
  }

  // 2. Detección de Navegador
  let browser = 'Navegador Web'

  if (/edg\/(\d+[\.\d]*)/i.test(ua)) {
    const match = ua.match(/edg\/(\d+[\.\d]*)/i)
    browser = `Microsoft Edge ${match ? match[1].split('.')[0] : ''}`.trim()
  } else if (/opr\/(\d+[\.\d]*)/i.test(ua) || /opera/i.test(ua)) {
    const match = ua.match(/opr\/(\d+[\.\d]*)/i)
    browser = `Opera ${match ? match[1].split('.')[0] : ''}`.trim()
  } else if (/brave/i.test(ua)) {
    browser = 'Brave Browser'
  } else if (/chrome\/(\d+[\.\d]*)/i.test(ua)) {
    const match = ua.match(/chrome\/(\d+[\.\d]*)/i)
    browser = `Google Chrome ${match ? match[1].split('.')[0] : ''}`.trim()
  } else if (/firefox\/(\d+[\.\d]*)/i.test(ua)) {
    const match = ua.match(/firefox\/(\d+[\.\d]*)/i)
    browser = `Mozilla Firefox ${match ? match[1].split('.')[0] : ''}`.trim()
  } else if (/safari\/(\d+[\.\d]*)/i.test(ua) && !/chrome/i.test(ua)) {
    const match = ua.match(/version\/(\d+[\.\d]*)/i)
    browser = `Apple Safari ${match ? match[1].split('.')[0] : ''}`.trim()
  }

  return { deviceType: formFactor, browser, os }
}

/**
 * Extrae la IP y geolocalización real a partir de las cabeceras HTTP de red.
 */
export function extractLocationAndIp(headers: Headers): { ipAddress: string; city: string | null } {
  const forwardedFor = headers.get('x-forwarded-for')
  const realIp = headers.get('x-real-ip')
  const cfIp = headers.get('cf-connecting-ip')

  let ip = cfIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : realIp) || '127.0.0.1'

  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1'
  }

  const headerCity = headers.get('x-vercel-ip-city') || headers.get('cf-ipcity') || headers.get('x-geo-city')
  const headerCountry = headers.get('x-vercel-ip-country') || headers.get('cf-ipcountry') || headers.get('x-geo-country')

  let city: string | null = null

  if (headerCity) {
    city = headerCountry ? `${headerCity}, ${headerCountry}` : headerCity
  } else if (ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    city = 'Red Local / Desarrollo'
  }

  return {
    ipAddress: ip,
    city,
  }
}

/**
 * Registra o actualiza la sesión activa del dispositivo en la base de datos con los datos reales.
 */
export async function upsertActiveSession({
  userId,
  sessionToken,
  headers,
}: {
  userId: string
  sessionToken: string
  headers: Headers
}) {
  if (!userId || !sessionToken) return null

  try {
    const userAgent = headers.get('user-agent') || null
    const { deviceType, browser, os } = parseUserAgentDetails(userAgent)
    const { ipAddress, city } = extractLocationAndIp(headers)

    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días

    const session = await prisma.session.upsert({
      where: { sessionToken },
      create: {
        sessionToken,
        userId,
        expires,
        ipAddress,
        userAgent,
        deviceType,
        browserName: browser,
        osName: os,
        location: city,
      },
      update: {
        expires,
        ipAddress,
        userAgent,
        deviceType,
        browserName: browser,
        osName: os,
        location: city,
        updatedAt: new Date(),
      },
    })

    return session
  } catch (err) {
    console.error('[UPSERT_ACTIVE_SESSION_ERROR]', err)
    return null
  }
}
