// src/services/chatService.ts
import { apiClient } from './api';
import { ENDPOINTS } from '../utils/constants';
import type { 
  ChatRequest, 
  ChatResponse,
  ConversacionCreate,
  ConversacionResponse,
  ConversacionConMensajes,
  SuccessResponse
} from '../types';

class ChatService {

  // ==================== CHAT PRINCIPAL (Criterio A + D) ====================
  async enviarMensaje(chatRequest: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await apiClient.post<ChatResponse>(
        ENDPOINTS.CHAT.BASE,
        chatRequest
      );
      
      return response;
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      throw error;
    }
  }

  // ==================== GESTIÓN DE CONVERSACIONES (Criterio B) ====================
  
  async crearConversacion(conversacion: ConversacionCreate): Promise<ConversacionResponse> {
    try {
      const response = await apiClient.post<ConversacionResponse>(
        ENDPOINTS.CONVERSATIONS.BASE,
        conversacion
      );
      
      return response;
    } catch (error) {
      console.error('Error al crear conversación:', error);
      throw error;
    }
  }

  async obtenerConversaciones(skip: number = 0, limit: number = 100): Promise<ConversacionResponse[]> {
    try {
      const response = await apiClient.get<ConversacionResponse[]>(
        `${ENDPOINTS.CONVERSATIONS.BASE}?skip=${skip}&limit=${limit}`
      );
      
      return response;
    } catch (error) {
      console.error('Error al obtener conversaciones:', error);
      throw error;
    }
  }

  async obtenerConversacion(conversacionId: number): Promise<ConversacionConMensajes> {
    try {
      const response = await apiClient.get<ConversacionConMensajes>(
        ENDPOINTS.CONVERSATIONS.BY_ID(conversacionId)
      );
      
      return response;
    } catch (error) {
      console.error('Error al obtener conversación:', error);
      throw error;
    }
  }

  async eliminarConversacion(conversacionId: number): Promise<SuccessResponse> {
    try {
      const response = await apiClient.delete<SuccessResponse>(
        ENDPOINTS.CONVERSATIONS.BY_ID(conversacionId)
      );
      
      return response;
    } catch (error) {
      console.error('Error al eliminar conversación:', error);
      throw error;
    }
  }

  async actualizarTituloConversacion(conversacionId: number, nuevoTitulo: string): Promise<ConversacionResponse> {
    try {
      const response = await apiClient.put<ConversacionResponse>(
        ENDPOINTS.CONVERSATIONS.UPDATE_TITLE(conversacionId),
        null,
        { params: { nuevo_titulo: nuevoTitulo } }
      );
      
      return response;
    } catch (error) {
      console.error('Error al actualizar título:', error);
      throw error;
    }
  }

  async obtenerEstadisticasConversaciones(): Promise<any> {
    try {
      const response = await apiClient.get(ENDPOINTS.CONVERSATIONS.STATS);
      return response;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }

  // ==================== DETALLES DE CONTEXTO (Criterio G) ====================
  
  async obtenerDetallesContexto(mensajeId: number): Promise<any> {
    try {
      const response = await apiClient.get(
        ENDPOINTS.DATA.DETAILS(mensajeId)
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
    return this.enviarMensaje({
      pregunta,
      id_conversacion: conversacionId
    });
  }

  /**
   * Enviar mensaje en nueva conversación
   */
  async enviarMensajeNuevaConversacion(pregunta: string): Promise<ChatResponse> {
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
    return !!consulta_sql && consulta_sql.trim().length > 0;
  }
}

// ==================== INSTANCIA SINGLETON ====================
export const chatService = new ChatService();

// ==================== HELPERS PARA DEBUGGING ====================
export const debugChat = {
  enviarMensajePrueba: (pregunta: string) => 
    chatService.enviarMensajeNuevaConversacion(pregunta),
  obtenerConversaciones: () => 
    chatService.obtenerConversaciones(),
  validarMensaje: (pregunta: string) => 
    chatService.validarMensaje(pregunta),
};