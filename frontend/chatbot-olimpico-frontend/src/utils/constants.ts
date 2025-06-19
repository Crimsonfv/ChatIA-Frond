// src/utils/constants.ts

// ==================== CONFIGURACIÓN DE API ====================
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000',
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
  }
} as const;

// ==================== ENDPOINTS ====================
export const ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    ME: '/auth/me',
  },
  
  // Conversaciones
  CONVERSATIONS: {
    BASE: '/conversations',
    BY_ID: (id: number) => `/conversations/${id}`,
    UPDATE_TITLE: (id: number) => `/conversations/${id}/title`,
    STATS: '/conversations/stats/summary',
  },
  
  // Chat
  CHAT: {
    BASE: '/chat',
  },
  
  // Filtros (Términos excluidos)
  FILTERS: {
    EXCLUDED_TERMS: '/filters/excluded-terms',
    EXCLUDED_TERM_BY_ID: (id: number) => `/filters/excluded-terms/${id}`,
  },
  
  // Admin
  ADMIN: {
    PROMPTS: '/admin/prompts',
    PROMPT_BY_ID: (id: number) => `/admin/prompts/${id}`,
  },
  
  // Detalles
  DATA: {
    DETAILS: (messageId: number) => `/data/details/${messageId}`,
  }
} as const;

// ==================== STORAGE KEYS ====================
export const STORAGE_KEYS = {
  TOKEN: 'chatbot_olimpico_token',
  USER: 'chatbot_olimpico_user',
  THEME: 'chatbot_olimpico_theme',
  LAST_CONVERSATION: 'chatbot_olimpico_last_conversation',
} as const;

// ==================== RUTAS DEL FRONTEND ====================
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  CHAT: '/chat',
  ADMIN: '/admin',
} as const;

// ==================== MENSAJES ====================
export const MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: 'Bienvenido de vuelta!',
    LOGIN_ERROR: 'Credenciales incorrectas',
    REGISTER_SUCCESS: 'Cuenta creada exitosamente!',
    REGISTER_ERROR: 'Error al crear la cuenta',
    LOGOUT_SUCCESS: 'Sesión cerrada correctamente',
    UNAUTHORIZED: 'No tienes permisos para acceder a esta página',
  },
  
  CHAT: {
    SENDING: 'Enviando mensaje...',
    ERROR: 'Error al enviar mensaje',
    LOADING_CONVERSATIONS: 'Cargando conversaciones...',
    NO_CONVERSATIONS: 'No tienes conversaciones aún',
    NEW_CONVERSATION: 'Nueva conversación',
    DELETE_CONFIRMATION: '¿Estás seguro de eliminar esta conversación?',
  },
  
  ADMIN: {
    SAVE_SUCCESS: 'Configuración guardada exitosamente',
    SAVE_ERROR: 'Error al guardar la configuración',
    DELETE_SUCCESS: 'Configuración eliminada exitosamente',
    DELETE_ERROR: 'Error al eliminar la configuración',
  },
  
  FILTERS: {
    TERM_ADDED: 'Término agregado a la lista de excluidos',
    TERM_REMOVED: 'Término eliminado de la lista de excluidos',
    TERM_EXISTS: 'Este término ya está en la lista',
  },
  
  GENERAL: {
    LOADING: 'Cargando...',
    ERROR: 'Ha ocurrido un error',
    SUCCESS: 'Operación exitosa',
    CONFIRM: '¿Estás seguro?',
    CANCEL: 'Cancelar',
    SAVE: 'Guardar',
    DELETE: 'Eliminar',
    EDIT: 'Editar',
    CREATE: 'Crear',
  }
} as const;

// ==================== CONFIGURACIÓN DE UI ====================
export const UI_CONFIG = {
  SIDEBAR_WIDTH: 280,
  HEADER_HEIGHT: 64,
  MESSAGE_MAX_LENGTH: 1000,
  TYPING_DELAY: 1000,
  AUTO_SCROLL_DELAY: 100,
  TOAST_DURATION: 3000,
} as const;

// ==================== CONTEXTOS DE PROMPT ====================
export const PROMPT_CONTEXTS = [
  { value: 'deportivo', label: 'Deportivo' },
  { value: 'paises', label: 'Países' },
  { value: 'atletas', label: 'Atletas' },
  { value: 'medallero', label: 'Medallero' },
  { value: 'general', label: 'General' },
] as const;

// ==================== VALIDACIONES ====================
export const VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 100,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  CONVERSATION_TITLE: {
    MAX_LENGTH: 200,
  },
  TERM: {
    MAX_LENGTH: 100,
    MIN_LENGTH: 2,
  },
  PROMPT: {
    MAX_LENGTH: 5000,
    MIN_LENGTH: 10,
  }
} as const;

// ==================== TEMAS Y COLORES ====================
export const THEME = {
  COLORS: {
    PRIMARY: '#2563eb',
    SECONDARY: '#64748b',
    SUCCESS: '#10b981',
    ERROR: '#ef4444',
    WARNING: '#f59e0b',
    INFO: '#3b82f6',
  },
  GRADIENTS: {
    PRIMARY: 'bg-gradient-to-r from-blue-600 to-blue-700',
    CHAT: 'bg-gradient-to-br from-gray-50 to-gray-100',
  }
} as const;