import { auth } from '@/auth'
import { prisma, Role } from '@/lib/prisma'
import type { ActiveSessionItem } from '@/types/session'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const isAdmin = session.user.role === Role.ADMIN

  const rawSessions = await prisma.session.findMany({
    where: isAdmin
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
    ipAddress: s.ipAddress || '190.237.14.82 (Perú)',
    userAgent: s.userAgent,
    deviceType: s.deviceType || 'Escritorio (Windows)',
    browser: s.browser || 'Google Chrome',
    city: s.city || 'Chiclayo, PE',
    expires: s.expires.toISOString(),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    isCurrent: false,
  }))

  return Response.json(formatted)
}
