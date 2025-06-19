// src/context/ChatContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { chatService } from '../services/chatService';
import { useAuth } from './AuthContext';
import type { 
  ChatContextType,
  ConversacionResponse,
  ConversacionConMensajes,
  Mensaje,
  ChatResponse
} from '../types';

// ==================== CREAR CONTEXT ====================
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// ==================== PROVIDER PROPS ====================
interface ChatProviderProps {
  children: ReactNode;
}

// ==================== CHAT PROVIDER ====================
export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  // ==================== ESTADO ====================
  const [conversaciones, setConversaciones] = useState<ConversacionResponse[]>([]);
  const [conversacionActual, setConversacionActual] = useState<ConversacionConMensajes | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [enviandoMensaje, setEnviandoMensaje] = useState<boolean>(false);

  // ==================== EFECTOS ====================
  useEffect(() => {
    if (isAuthenticated) {
      cargarConversaciones();
    } else {
      // Limpiar estado cuando se desautentica
      setConversaciones([]);
      setConversacionActual(null);
      setMensajes([]);
    }
  }, [isAuthenticated]);

  // ==================== CARGAR CONVERSACIONES ====================
  const cargarConversaciones = async (): Promise<void> => {
    try {
      setLoading(true);
      const conversacionesData = await chatService.obtenerConversaciones();
      setConversaciones(conversacionesData);
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ==================== CREAR CONVERSACIÓN ====================
  const crearConversacion = async (titulo?: string): Promise<void> => {
    try {
      setLoading(true);
      
      const nuevaConversacion = await chatService.crearConversacion({
        titulo: titulo || 'Nueva conversación'
      });
      
      // Agregar a la lista de conversaciones
      setConversaciones(prev => [nuevaConversacion, ...prev]);
      
      // Seleccionar automáticamente la nueva conversación
      await seleccionarConversacion(nuevaConversacion.id);
      
    } catch (error) {
      console.error('Error al crear conversación:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ==================== SELECCIONAR CONVERSACIÓN ====================
  const seleccionarConversacion = async (id: number): Promise<void> => {
    try {
      setLoading(true);
      
      const conversacionCompleta = await chatService.obtenerConversacion(id);
      
      setConversacionActual(conversacionCompleta);
      setMensajes(conversacionCompleta.mensajes);
      
    } catch (error) {
      console.error('Error al seleccionar conversación:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ==================== ELIMINAR CONVERSACIÓN ====================
  const eliminarConversacion = async (id: number): Promise<void> => {
    try {
      setLoading(true);
      
      await chatService.eliminarConversacion(id);
      
      // Remover de la lista de conversaciones
      setConversaciones(prev => prev.filter(conv => conv.id !== id));
      
      // Si era la conversación actual, limpiar
      if (conversacionActual?.id === id) {
        setConversacionActual(null);
        setMensajes([]);
      }
      
    } catch (error) {
      console.error('Error al eliminar conversación:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ==================== ENVIAR MENSAJE ====================
  const enviarMensaje = async (pregunta: string): Promise<void> => {
    try {
      setEnviandoMensaje(true);

      // Validar mensaje
      const errores = chatService.validarMensaje(pregunta);
      if (errores.length > 0) {
        throw new Error(errores[0]);
      }

      let chatResponse: ChatResponse;
      
      // Si hay conversación actual, enviar en esa conversación
      if (conversacionActual) {
        chatResponse = await chatService.enviarMensajeEnConversacion(
          pregunta, 
          conversacionActual.id
        );
      } else {
        // Enviar en nueva conversación
        chatResponse = await chatService.enviarMensajeNuevaConversacion(pregunta);
        
        // Recargar conversaciones para incluir la nueva
        await cargarConversaciones();
        
        // Seleccionar la nueva conversación
        await seleccionarConversacion(chatResponse.id_conversacion);
        return; // seleccionarConversacion ya actualiza los mensajes
      }

      // Recargar mensajes de la conversación actual
      if (conversacionActual) {
        await seleccionarConversacion(conversacionActual.id);
      }

    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      throw error;
    } finally {
      setEnviandoMensaje(false);
    }
  };

  // ==================== ACTUALIZAR TÍTULO CONVERSACIÓN ====================
  const actualizarTituloConversacion = async (id: number, nuevoTitulo: string): Promise<void> => {
    try {
      const conversacionActualizada = await chatService.actualizarTituloConversacion(id, nuevoTitulo);
      
      // Actualizar en la lista de conversaciones
      setConversaciones(prev => 
        prev.map(conv => 
          conv.id === id ? conversacionActualizada : conv
        )
      );
      
      // Actualizar conversación actual si es la misma
      if (conversacionActual?.id === id) {
        setConversacionActual(prev => 
          prev ? { ...prev, titulo: nuevoTitulo } : null
        );
      }
      
    } catch (error) {
      console.error('Error al actualizar título:', error);
      throw error;
    }
  };

  // ==================== OBTENER DETALLES DE MENSAJE ====================
  const obtenerDetallesMensaje = async (mensajeId: number): Promise<any> => {
    try {
      return await chatService.obtenerDetallesContexto(mensajeId);
    } catch (error) {
      console.error('Error al obtener detalles de mensaje:', error);
      throw error;
    }
  };

  // ==================== LIMPIAR CHAT ====================
  const limpiarChat = (): void => {
    setConversacionActual(null);
    setMensajes([]);
  };

  // ==================== HELPERS ====================
  const obtenerConversacionPorId = (id: number): ConversacionResponse | undefined => {
    return conversaciones.find(conv => conv.id === id);
  };

  const tieneConversaciones = (): boolean => {
    return conversaciones.length > 0;
  };

  const ultimaConversacion = (): ConversacionResponse | undefined => {
    return conversaciones[0]; // Las conversaciones vienen ordenadas por fecha
  };

  // ==================== ESTADÍSTICAS ====================
  const obtenerEstadisticas = () => {
    return {
      totalConversaciones: conversaciones.length,
      totalMensajes: mensajes.length,
      hayConversacionActual: !!conversacionActual,
      enviandoMensaje
    };
  };

  // ==================== CONTEXT VALUE ====================
  const contextValue: ChatContextType = {
    // Estado
    conversaciones,
    conversacionActual,
    mensajes,
    loading,
    enviandoMensaje,
    
    // Métodos principales
    crearConversacion,
    seleccionarConversacion,
    eliminarConversacion,
    enviarMensaje,
    cargarConversaciones,
    
    // Métodos adicionales
    actualizarTituloConversacion,
    obtenerDetallesMensaje,
    limpiarChat,
    
    // Helpers
    obtenerConversacionPorId,
    tieneConversaciones,
    ultimaConversacion,
    obtenerEstadisticas,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

// ==================== HOOK PERSONALIZADO ====================
export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  
  if (context === undefined) {
    throw new Error('useChat debe ser usado dentro de un ChatProvider');
  }
  
  return context;
};

// ==================== HOOKS ESPECIALIZADOS ====================

/**
 * Hook para manejar el envío de mensajes
 */
export const useSendMessage = () => {
  const { enviarMensaje, enviandoMensaje } = useChat();
  
  const enviar = async (pregunta: string) => {
    if (enviandoMensaje) return;
    
    const preguntaLimpia = pregunta.trim();
    if (!preguntaLimpia) return;
    
    await enviarMensaje(preguntaLimpia);
  };
  
  return {
    enviar,
    enviando: enviandoMensaje
  };
};

/**
 * Hook para gestión de conversaciones
 */
export const useConversations = () => {
  const { 
    conversaciones, 
    conversacionActual,
    crearConversacion,
    seleccionarConversacion,
    eliminarConversacion,
    tieneConversaciones,
    loading
  } = useChat();
  
  return {
    conversaciones,
    conversacionActual,
    crearConversacion,
    seleccionarConversacion,
    eliminarConversacion,
    tieneConversaciones: tieneConversaciones(),
    loading
  };
};

/**
 * Hook para mensajes de la conversación actual
 */
export const useCurrentMessages = () => {
  const { mensajes, conversacionActual, obtenerDetallesMensaje } = useChat();
  
  const mensajesOrdenados = [...mensajes].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  return {
    mensajes: mensajesOrdenados,
    totalMensajes: mensajes.length,
    conversacionTitulo: conversacionActual?.titulo,
    obtenerDetallesMensaje
  };
};

// ==================== EXPORT DEFAULT ====================
export default ChatContext;