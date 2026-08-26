'use client'

import { signOut } from 'next-auth/react'

const AUTH_CHANNEL_NAME = 'sipangpt_auth_channel'
const LOGOUT_STORAGE_KEY = 'sipangpt_auth_logout_timestamp'

/**
 * Notifica a todas las demás pestañas abiertas que se ha cerrado sesión
 * utilizando BroadcastChannel y localStorage como fallback para compatibilidad cruzada.
 */
export function broadcastAuthLogout() {
  if (typeof window === 'undefined') return

  // 1. Notificación vía BroadcastChannel API (tiempo real entre pestañas)
  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(AUTH_CHANNEL_NAME)
      channel.postMessage({ type: 'LOGOUT', timestamp: Date.now() })
      channel.close()
    }
  } catch (err) {
    console.warn('[AUTH_SYNC] Error enviando mensaje a BroadcastChannel:', err)
  }

  // 2. Notificación vía Storage Event de localStorage
  try {
    localStorage.setItem(LOGOUT_STORAGE_KEY, Date.now().toString())
  } catch (err) {
    console.warn('[AUTH_SYNC] Error escribiendo en localStorage:', err)
  }
}

/**
 * Cierre de sesión seguro y unificado que notifica a todas las pestañas
 * y redirige inmediatamente.
 */
export async function performSafeLogout(redirectTo: string = '/login') {
  if (typeof window === 'undefined') return

  broadcastAuthLogout()

  try {
    await signOut({ redirect: false })
  } catch {
    // Si la sesión ya expiró en el servidor o devuelve redirección directa, proceder al login
  } finally {
    window.location.href = redirectTo
  }
}

/**
 * Inicializa los listeners en las demás pestañas para detectar el cierre de sesión en tiempo real.
 */
export function listenForMultiTabLogout(onLogout: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  let channel: BroadcastChannel | null = null

  // 1. Escuchar BroadcastChannel
  try {
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(AUTH_CHANNEL_NAME)
      channel.onmessage = (event) => {
        if (event.data?.type === 'LOGOUT') {
          onLogout()
        }
      }
    }
  } catch (err) {
    console.warn('[AUTH_SYNC] BroadcastChannel no soportado o con error:', err)
  }

  // 2. Escuchar evento storage (fallback entre ventanas/pestañas)
  const handleStorage = (event: StorageEvent) => {
    if (event.key === LOGOUT_STORAGE_KEY && event.newValue) {
      onLogout()
    }
  }

  window.addEventListener('storage', handleStorage)

  return () => {
    if (channel) {
      channel.close()
    }
    window.removeEventListener('storage', handleStorage)
  }
}
