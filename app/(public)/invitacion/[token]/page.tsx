import * as React from 'react'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { AcceptInvitationCard } from '@/components/admin/accept-invitation-card'

export default async function InvitacionPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const currentUser = await getCurrentUser()

  const invitation = await prisma.adminInvitation.findUnique({
    where: { token },
  })

  let isValid = true
  let errorMessage: string | undefined

  if (!invitation) {
    isValid = false
    errorMessage = 'El enlace de invitación no es válido o no existe.'
  } else if (invitation.status === 'ACCEPTED') {
    isValid = false
    errorMessage = 'Esta invitación ya fue aceptada previamente.'
  } else if (invitation.status === 'REVOKED') {
    isValid = false
    errorMessage = 'Esta invitación fue cancelada por un administrador.'
  } else if (new Date() > invitation.expiresAt) {
    isValid = false
    errorMessage = 'Esta invitación ha expirado.'
  }

  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-background'>
      <AcceptInvitationCard
        token={token}
        invitationEmail={invitation?.email || ''}
        currentUserEmail={currentUser?.email}
        expiresAt={invitation?.expiresAt ? invitation.expiresAt.toISOString() : ''}
        isValid={isValid}
        errorMessage={errorMessage}
      />
    </div>
  )
}
