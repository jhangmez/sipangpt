export const ROUTES = {
  PUBLIC: {
    HOME: '/',
    LOGIN: '/login',
    UNAUTHORIZED: '/unauthorized',
  },
  PROTECTED: {
    CHAT: '/chat',
    CHAT_ID: (id: string) => `/chat/${id}`,
    CONFIGURACIONES: '/configuraciones/usuario',
    CONFIGURACIONES_USUARIO: '/configuraciones/usuario',
    CONFIGURACIONES_SESIONES: '/configuraciones/sesiones',
    CONFIGURACIONES_CONSUMO: '/configuraciones/consumo',
    CONFIGURACIONES_MEMORIAS: '/configuraciones/memorias',
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
  },
} as const
