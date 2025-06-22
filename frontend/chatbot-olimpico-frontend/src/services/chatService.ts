// src/services/chatService.ts - VERSIÓN OPTIMIZADA PARA RESPUESTAS LARGAS
import { apiClient } from './api';
import { filterService } from './filterService';
import { ENDPOINTS, API_CONFIG, MESSAGES } from '../utils/constants';
import type { 
  ConversacionCreate,
  ConversacionResponse,
  ConversacionConMensajes,
  ChatRequest,
  ChatResponse
} from '../types';

class ChatService {

  // ==================== CONVERSACIONES ====================

  async crearConversacion(conversacion: ConversacionCreate): Promise<ConversacionResponse> {
    try {
      const response = await apiClient.post<ConversacionResponse>(
        ENDPOINTS.CONVERSATIONS.BASE,
        conversacion,
        { timeout: API_CONFIG.TIMEOUTS.CONVERSATION } // ✅ 15 segundos para conversaciones
      );
      
      return response;
    } catch (error) {
      console.error('Error al crear conversación:', error);
      throw error;
    }
  }

  async obtenerConversaciones(): Promise<ConversacionResponse[]> {
    try {
      const response = await apiClient.get<ConversacionResponse[]>(
        ENDPOINTS.CONVERSATIONS.BASE,
        { timeout: API_CONFIG.TIMEOUTS.CONVERSATION } // ✅ 15 segundos
      );
      
      return response;
    } catch (error) {
      console.error('Error al obtener conversaciones:', error);
      throw error;
    }
  }

  async obtenerConversacion(id: number): Promise<ConversacionConMensajes> {
    try {
      const response = await apiClient.get<ConversacionConMensajes>(
        ENDPOINTS.CONVERSATIONS.BY_ID(id),
        { timeout: API_CONFIG.TIMEOUTS.CONVERSATION } // ✅ 15 segundos
      );
      
      return response;
    } catch (error) {
      console.error('Error al obtener conversación:', error);
      throw error;
    }
  }

  async eliminarConversacion(id: number): Promise<void> {
    try {
      await apiClient.delete(
        ENDPOINTS.CONVERSATIONS.BY_ID(id),
        { timeout: API_CONFIG.TIMEOUTS.NORMAL } // ✅ 30 segundos
      );
    } catch (error) {
      console.error('Error al eliminar conversación:', error);
      throw error;
    }
  }

  async actualizarTituloConversacion(id: number, nuevoTitulo: string): Promise<ConversacionResponse> {
    try {
      // El backend espera el título como query parameter, no en el body
      const response = await apiClient.put<ConversacionResponse>(
        `${ENDPOINTS.CONVERSATIONS.UPDATE_TITLE(id)}?nuevo_titulo=${encodeURIComponent(nuevoTitulo)}`,
        null, // No enviar body
        { 
          timeout: API_CONFIG.TIMEOUTS.NORMAL, // ✅ 30 segundos
        }
      );
      
      return response;
    } catch (error) {
      console.error('Error al actualizar título:', error);
      throw error;
    }
  }

  // ==================== FILTRADO DE TÉRMINOS EXCLUIDOS ====================

  /**
   * Aplicar filtros de términos excluidos a un mensaje
   */
  async aplicarFiltrosExcluidos(mensaje: string): Promise<string> {
    try {
      // Obtener términos excluidos del usuario
      const terminosExcluidos = await filterService.obtenerTerminosExcluidos();
      const terminosActivos = filterService.obtenerTerminosActivos(terminosExcluidos);
      
      if (terminosActivos.length === 0) {
        return mensaje; // No hay términos que filtrar
      }

      let mensajeFiltrado = mensaje;
      
      // Aplicar filtrado para cada término excluido
      for (const termino of terminosActivos) {
        // Crear expresión regular para buscar el término (case-insensitive, word boundaries)
        const regex = new RegExp(`\\b${this.escapeRegExp(termino.termino)}\\b`, 'gi');
        
        // Reemplazar con asteriscos manteniendo la longitud
        mensajeFiltrado = mensajeFiltrado.replace(regex, (match) => 
          '*'.repeat(match.length)
        );
      }

      // Log para debugging (solo en desarrollo)
      if (mensajeFiltrado !== mensaje) {
        console.log('🔒 Términos filtrados aplicados:', {
          mensaje_original_length: mensaje.length,
          mensaje_filtrado_length: mensajeFiltrado.length,
          terminos_aplicados: terminosActivos.length
        });
      }

      return mensajeFiltrado;
    } catch (error) {
      console.error('Error al aplicar filtros de términos excluidos:', error);
      // En caso de error, devolver el mensaje original
      return mensaje;
    }
  }

  /**
   * Escape caracteres especiales para usar en RegExp
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Verificar si un mensaje contiene términos excluidos
   */
  async verificarTerminosExcluidos(mensaje: string): Promise<{
    contiene: boolean;
    terminos: string[];
  }> {
    try {
      const terminosExcluidos = await filterService.obtenerTerminosExcluidos();
      const terminosActivos = filterService.obtenerTerminosActivos(terminosExcluidos);
      const terminosEncontrados: string[] = [];

      for (const termino of terminosActivos) {
        const regex = new RegExp(`\\b${this.escapeRegExp(termino.termino)}\\b`, 'gi');
        if (regex.test(mensaje)) {
          terminosEncontrados.push(termino.termino);
        }
      }

      return {
        contiene: terminosEncontrados.length > 0,
        terminos: terminosEncontrados
      };
    } catch (error) {
      console.error('Error al verificar términos excluidos:', error);
      return { contiene: false, terminos: [] };
    }
  }

  // ==================== CHAT CON TIMEOUT OPTIMIZADO ====================

  /**
   * Enviar mensaje - VERSIÓN OPTIMIZADA PARA RESPUESTAS LARGAS Y CON FILTRADO
   */
  async enviarMensaje(chatRequest: ChatRequest): Promise<ChatResponse> {
    try {
      console.log('🚀 Iniciando envío de mensaje al backend');
      console.log('📊 Configuración de timeout:', {
        timeout_chat: API_CONFIG.TIMEOUTS.CHAT,
        timeout_normal: API_CONFIG.TIMEOUTS.NORMAL,
        pregunta_length: chatRequest.pregunta.length
      });

      // ✅ APLICAR FILTROS DE TÉRMINOS EXCLUIDOS
      const preguntaFiltrada = await this.aplicarFiltrosExcluidos(chatRequest.pregunta);
      
      // Crear request con mensaje filtrado
      const requestFiltrado: ChatRequest = {
        ...chatRequest,
        pregunta: preguntaFiltrada
      };

      // ✅ USAR TIMEOUT LARGO ESPECÍFICO PARA CHAT (2 minutos)
      const response = await apiClient.post<ChatResponse>(
        ENDPOINTS.CHAT.BASE,
        requestFiltrado,
        { 
          timeout: API_CONFIG.TIMEOUTS.CHAT, // ✅ 120 segundos para chat
          // ✅ Headers adicionales para operaciones largas
          headers: {
            'Content-Type': 'application/json',
            'X-Operation-Type': 'chat',
            'X-Expect-Long-Response': 'true'
          }
        }
      );

      console.log('✅ Respuesta recibida exitosamente del backend');
      console.log('📈 Detalles de la respuesta:', {
        id_mensaje: response.id_mensaje,
        id_conversacion: response.id_conversacion,
        longitud_respuesta: response.respuesta.length,
        tiene_sql: !!response.consulta_sql,
        tiempo_procesamiento: 'completado'
      });

      return response;
    } catch (error) {
      console.error('❌ Error al enviar mensaje al backend:', error);
      
      // ✅ Mejorar el manejo de errores de timeout
      if (this.isTimeoutError(error)) {
        console.error('⏱️ Error de timeout detectado');
        throw new Error(MESSAGES.CHAT.ERROR_TIMEOUT);
      }
      
      // ✅ Mejorar el manejo de errores de conexión
      if (this.isNetworkError(error)) {
        console.error('🌐 Error de red detectado');
        throw new Error('Error de conexión. Verifica tu conexión a internet y el estado del servidor.');
      }

      throw error;
    }
  }

  // ==================== HELPERS PARA DETECCIÓN DE ERRORES ====================

  private isTimeoutError(error: any): boolean {
    return (
      error?.code === 'ECONNABORTED' ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('ECONNABORTED') ||
      error?.response?.status === 408
    );
  }

  private isNetworkError(error: any): boolean {
    return (
      !error?.response ||
      error?.code === 'ECONNREFUSED' ||
      error?.code === 'ENOTFOUND' ||
      error?.message?.includes('Network Error')
    );
  }

  // ==================== DETALLES DE CONTEXTO ====================
  
  async obtenerDetallesContexto(mensajeId: number): Promise<any> {
    try {
      const response = await apiClient.get(
        ENDPOINTS.DATA.DETAILS(mensajeId),
        { timeout: API_CONFIG.TIMEOUTS.NORMAL } // ✅ 30 segundos
      );
      
      return response;
    } catch (error) {
      console.error('Error al obtener detalles de contexto:', error);
      throw error;
    }
  }

  // ==================== HELPERS PARA CHAT ====================

  /**
   * Enviar mensaje en conversación existente
   */
  async enviarMensajeEnConversacion(pregunta: string, conversacionId: number): Promise<ChatResponse> {
    console.log('📝 Enviando mensaje en conversación existente:', conversacionId);
    return this.enviarMensaje({
      pregunta,
      id_conversacion: conversacionId
    });
  }

  /**
   * Enviar mensaje en nueva conversación
   */
  async enviarMensajeNuevaConversacion(pregunta: string): Promise<ChatResponse> {
    console.log('🆕 Enviando mensaje en nueva conversación');
    return this.enviarMensaje({
      pregunta
      // id_conversacion se omite para crear nueva conversación
    });
  }

  /**
   * Generar título automático para conversación basado en primera pregunta
   */
  generarTituloConversacion(pregunta: string): string {
    // Limpiar pregunta y tomar las primeras palabras
    const palabrasLimpio = pregunta
      .replace(/[^\w\s]/gi, '')
      .split(' ')
      .filter(palabra => palabra.length > 2)
      .slice(0, 5);
    
    if (palabrasLimpio.length === 0) {
      return 'Nueva conversación';
    }
    
    const titulo = palabrasLimpio.join(' ');
    return titulo.length > 50 ? titulo.substring(0, 47) + '...' : titulo;
  }

  /**
   * Validar mensaje antes de enviar
   */
  validarMensaje(pregunta: string): string[] {
    const errores: string[] = [];

    if (!pregunta?.trim()) {
      errores.push('El mensaje no puede estar vacío');
    }

    if (pregunta && pregunta.length > 1000) {
      errores.push('El mensaje no puede exceder 1000 caracteres');
    }

    if (pregunta && pregunta.trim().length < 3) {
      errores.push('El mensaje debe tener al menos 3 caracteres');
    }

    return errores;
  }

  /**
   * Formatear fecha de mensaje para mostrar en UI
   */
  formatearFechaMensaje(timestamp: string): string {
    const fecha = new Date(timestamp);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fecha.getTime();
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutos < 1) {
      return 'Ahora';
    } else if (diffMinutos < 60) {
      return `Hace ${diffMinutos} min`;
    } else if (diffHoras < 24) {
      return `Hace ${diffHoras}h`;
    } else if (diffDias < 7) {
      return `Hace ${diffDias} días`;
    } else {
      return fecha.toLocaleDateString();
    }
  }

  /**
   * Determinar si un mensaje tiene datos de contexto disponibles
   */
  tieneDetallesDisponibles(consulta_sql?: string): boolean {
    return !!consulta_sql?.trim();
  }

  /**
   * Estimar si una pregunta puede generar una respuesta larga
   */
  esConsultaCompleja(pregunta: string): boolean {
    const palabrasComplejas = [
      'todos', 'todas', 'lista', 'detallada', 'completo', 'completa',
      'explica', 'explícame', 'describe', 'analiza', 'compara',
      'historia', 'evolución', 'desarrollo', 'resumen',
      'características', 'diferencias', 'similitudes'
    ];

    const preguntaLower = pregunta.toLowerCase();
    return palabrasComplejas.some(palabra => preguntaLower.includes(palabra)) ||
           pregunta.length > 100;
  }

  /**
   * Obtener mensaje de estado para consultas complejas
   */
  getMensajeProcesamientoLargo(): string {
    return MESSAGES.CHAT.PROCESSING_LONG;
  }
}

// ==================== INSTANCIA SINGLETON ====================
export const chatService = new ChatService();

// ==================== HELPERS PARA DEBUGGING ====================
export const debugChat = {
  getTimeouts: () => API_CONFIG.TIMEOUTS,
  testConnection: async () => {
    try {
      await chatService.obtenerConversaciones();
      return true;
    } catch {
      return false;
    }
  },
  estimarComplejidad: (pregunta: string) => chatService.esConsultaCompleja(pregunta),
  validarMensaje: (pregunta: string) => chatService.validarMensaje(pregunta),
};