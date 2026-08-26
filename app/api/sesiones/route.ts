import { auth } from '@/auth'
import { prisma, Role } from '@/lib/prisma'
import { headers } from 'next/headers'
import { upsertActiveSession } from '@/lib/auth/session-tracker'
import type { ActiveSessionItem } from '@/types/session'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const reqHeaders = await headers()

  const cookieToken =
    (request as unknown as { cookies?: { get: (k: string) => { value: string } | undefined } }).cookies?.get?.('authjs.session-token')?.value ||
    (request as unknown as { cookies?: { get: (k: string) => { value: string } | undefined } }).cookies?.get?.('__Secure-authjs.session-token')?.value

  const userSessionToken =
    cookieToken ||
    (session.user as { sessionToken?: string }).sessionToken ||
    `auth_session_${session.user.id}`

  // Registrar / actualizar automáticamente la sesión activa del dispositivo actual
  await upsertActiveSession({
    userId: session.user.id,
    sessionToken: userSessionToken,
    headers: reqHeaders,
  })

  const url = new URL(request.url)
  const isGlobalAdminRequest =
    url.searchParams.get('admin') === 'true' && session.user.role === Role.ADMIN

  const rawSessions = await prisma.session.findMany({
    where: isGlobalAdminRequest
      ? { expires: { gt: new Date() } }
      : { userId: session.user.id, expires: { gt: new Date() } },
    orderBy: { updatedAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
        },
      },
    },
  })

  const formatted: ActiveSessionItem[] = rawSessions.map((s) => ({
    sessionToken: s.sessionToken,
    userId: s.userId,
    userEmail: s.user.email,
    userName: s.user.name,
    userImage: s.user.image,
    userRole: s.user.role,
    ipAddress: s.ipAddress || '127.0.0.1',
    userAgent: s.userAgent,
    deviceType: s.deviceType || 'desktop',
    browserName: s.browserName || 'Google Chrome',
    osName: s.osName || 'Windows',
    location: s.location || null,
    browser: s.browserName || 'Google Chrome',
    city: s.location || null,
    expires: s.expires.toISOString(),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    isCurrent: s.sessionToken === userSessionToken,
  }))

  return Response.json(formatted)
}
