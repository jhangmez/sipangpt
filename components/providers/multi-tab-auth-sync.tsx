'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { listenForMultiTabLogout } from '@/lib/auth/multi-tab-sync'
import { signOut } from 'next-auth/react'

export function MultiTabAuthSync() {
  const pathname = usePathname()

  React.useEffect(() => {
    const cleanup = listenForMultiTabLogout(async () => {
      try {
        await signOut({ redirect: false })
      } catch {
        // Ignorar si falla signOut de cliente
      } finally {
        // Si no está ya en el login, redirigir inmediatamente
        if (pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    })

    return cleanup
  }, [pathname])

  return null
}
