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
    DOCUMENTS: '/admin/documents',
    MODELS: '/admin/models',
    QUESTIONS: '/admin/questions',
    ADMINISTRADORES: '/admin/administradores',
    INVITACION: (token: string) => `/invitacion/${token}`,
  },
} as const
