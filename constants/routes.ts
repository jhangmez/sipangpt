export const ROUTES = {
  PUBLIC: {
    HOME: '/',
    LOGIN: '/login',
    UNAUTHORIZED: '/unauthorized',
  },
  PROTECTED: {
    CHAT: '/chat',
    CHAT_ID: (id: string) => `/chat/${id}`,
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
  },
} as const
