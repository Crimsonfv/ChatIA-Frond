// src/types/index.ts
// Interfaces basadas en los schemas del backend FastAPI

// ==================== ENUMS ====================
export const RolUsuario = {
  USER: "user",
  ADMIN: "admin"
} as const;

export const RolMensaje = {
  USER: "user",
  ASSISTANT: "assistant"
} as const;

export const TipoMedalla = {
  GOLD: "Gold",
  SILVER: "Silver", 
  BRONZE: "Bronze"
} as const;

// Tipos derivados
export type RolUsuario = typeof RolUsuario[keyof typeof RolUsuario];
export type RolMensaje = typeof RolMensaje[keyof typeof RolMensaje];
export type TipoMedalla = typeof TipoMedalla[keyof typeof TipoMedalla];

// ==================== INTERFACES DE AUTENTICACIÓN ====================
export interface Usuario {
  id: number;
  username: string;
  email: string;
  rol: RolUsuario;
  fecha_registro: string;
  activo: boolean;
}

export interface UsuarioCreate {
  username: string;
  email: string;
  password: string;
  rol?: RolUsuario;
}

export interface UsuarioLogin {
  username: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  user: Usuario;
}

// ==================== INTERFACES DE CONVERSACIONES ====================
export interface ConversacionCreate {
  titulo?: string;
}

export interface ConversacionResponse {
  id: number;
  id_usuario: number;
  titulo?: string;
  fecha_inicio: string;
  fecha_ultima_actividad: string;
  activa: boolean;
}

export interface Mensaje {
  id: number;
  id_conversacion: number;
  rol: RolMensaje;
  contenido: string;
  consulta_sql?: string;
  timestamp: string;
}

export interface MensajeCreate {
  contenido: string;
  rol: RolMensaje;
  consulta_sql?: string;
}

export interface ConversacionConMensajes extends ConversacionResponse {
  mensajes: Mensaje[];
}

// ==================== INTERFACES DE CHAT ====================
export interface ChatRequest {
  pregunta: string;
  id_conversacion?: number;
}

export interface ChatResponse {
  respuesta: string;
  consulta_sql?: string;
  id_conversacion: number;
  id_mensaje: number;
  datos_contexto?: DatosContexto;
}

export interface DatosContexto {
  total_resultados: number;
  muestra_datos: any[];
  sql_ejecutado: string;
}

// ==================== INTERFACES DE TÉRMINOS EXCLUIDOS ====================
export interface TerminoExcluido {
  id: number;
  id_usuario: number;
  termino: string;
  activo: boolean;
  fecha_creacion: string;
}

export interface TerminoExcluidoCreate {
  termino: string;
}

// ==================== INTERFACES DE CONFIGURACIÓN PROMPT ====================
export interface ConfiguracionPrompt {
  id: number;
  contexto: string;
  prompt_sistema: string;
  creado_por: number;
  fecha_modificacion: string;
  activo: boolean;
}

export interface ConfiguracionPromptCreate {
  contexto: string;
  prompt_sistema: string;
}

export interface ConfiguracionPromptUpdate {
  contexto?: string;
  prompt_sistema?: string;
  activo?: boolean;
}

// ==================== INTERFACES DE DATOS OLÍMPICOS ====================
export interface MedallaOlimpica {
  id: number;
  city: string;
  year: number;
  sport: string;
  discipline: string;
  event: string;
  athlete: string;
  nombre?: string;
  apellido?: string;
  nombre_completo?: string;
  gender: string;
  country_code: string;
  country: string;
  event_gender: string;
  medal: string;
}

// ==================== INTERFACES COMUNES ====================
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

export interface ErrorResponse {
  detail: string;
  error_code?: string;
}

export interface SuccessResponse {
  message: string;
  data?: any;
}

// ==================== INTERFACES DEL FRONTEND ====================
export interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  login: (credentials: UsuarioLogin) => Promise<boolean>;
  register: (userData: UsuarioCreate) => Promise<boolean>;
  logout: () => void;
  refreshUser?: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
}

export interface ChatContextType {
  // Estado
  conversaciones: ConversacionResponse[];
  conversacionActual: ConversacionConMensajes | null;
  mensajes: Mensaje[];
  loading: boolean;
  enviandoMensaje: boolean;
  
  // Métodos principales
  crearConversacion: (titulo?: string) => Promise<void>;
  seleccionarConversacion: (id: number) => Promise<void>;
  eliminarConversacion: (id: number) => Promise<void>;
  enviarMensaje: (pregunta: string) => Promise<void>;
  cargarConversaciones: () => Promise<void>;
  
  // Métodos adicionales
  actualizarTituloConversacion: (id: number, nuevoTitulo: string) => Promise<void>;
  obtenerDetallesMensaje: (mensajeId: number) => Promise<any>;
  limpiarChat: () => void;
  
  // Helpers
  obtenerConversacionPorId: (id: number) => ConversacionResponse | undefined;
  tieneConversaciones: () => boolean;
  ultimaConversacion: () => ConversacionResponse | undefined;
  obtenerEstadisticas: () => {
    totalConversaciones: number;
    totalMensajes: number;
    hayConversacionActual: boolean;
    enviandoMensaje: boolean;
  };
}

// ==================== TIPOS DE PROPS ====================
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export interface MessageItemProps {
  mensaje: Mensaje;
  onShowDetails?: (mensaje: Mensaje) => void;
}

export interface ConversationItemProps {
  conversacion: ConversacionResponse;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}