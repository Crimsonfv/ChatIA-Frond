// src/context/ChatContext.tsx - VERSIÓN OPTIMIZADA
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

  // ==================== ENVIAR MENSAJE - VERSIÓN CON MEJOR DEBUG ====================
  const enviarMensaje = async (pregunta: string): Promise<void> => {
    const tempId = -Date.now(); // ID temporal negativo único
    
    try {
      setEnviandoMensaje(true);
      console.log('🚀 Iniciando envío de mensaje:', pregunta);

      // Validar mensaje
      const errores = chatService.validarMensaje(pregunta);
      if (errores.length > 0) {
        throw new Error(errores[0]);
      }

      // ✅ VERIFICAR SI HAY TÉRMINOS EXCLUIDOS EN EL MENSAJE
      const verificacionTerminos = await chatService.verificarTerminosExcluidos(pregunta);
      if (verificacionTerminos.contiene) {
        console.log('🔒 Términos excluidos detectados en el mensaje:', verificacionTerminos.terminos);
      }

      // 1. AGREGAR MENSAJE DEL USUARIO INMEDIATAMENTE
      const mensajeUsuario: Mensaje = {
        id: tempId,
        id_conversacion: conversacionActual?.id || 0,
        rol: 'user',
        contenido: pregunta,
        timestamp: new Date().toISOString()
      };

      setMensajes(prev => {
        console.log('✅ Agregando mensaje del usuario, total mensajes:', prev.length + 1);
        return [...prev, mensajeUsuario];
      });

      // 2. ENVIAR AL BACKEND Y ESPERAR RESPUESTA
      console.log('📡 Enviando al backend...');
      let chatResponse: ChatResponse;
      
      if (conversacionActual) {
        // Enviar en conversación existente
        console.log('📝 Enviando en conversación existente ID:', conversacionActual.id);
        chatResponse = await chatService.enviarMensajeEnConversacion(
          pregunta, 
          conversacionActual.id
        );
      } else {
        // Enviar en nueva conversación
        console.log('🆕 Creando nueva conversación');
        chatResponse = await chatService.enviarMensajeNuevaConversacion(pregunta);
        
        // Si es nueva conversación, actualizar el contexto
        if (!conversacionActual) {
          console.log('🔄 Actualizando contexto de nueva conversación');
          await cargarConversaciones();
          const nuevaConversacion = await chatService.obtenerConversacion(chatResponse.id_conversacion);
          setConversacionActual(nuevaConversacion);
          
          // Actualizar el ID del mensaje del usuario con la conversación correcta
          setMensajes(prev => prev.map(msg => 
            msg.id === tempId 
              ? { ...msg, id_conversacion: chatResponse.id_conversacion }
              : msg
          ));
        }
      }

      console.log('✅ Respuesta recibida del backend:', {
        id_mensaje: chatResponse.id_mensaje,
        longitud_respuesta: chatResponse.respuesta.length,
        tiene_sql: !!chatResponse.consulta_sql
      });

      // 3. AGREGAR RESPUESTA DEL ASISTENTE DIRECTAMENTE
      const mensajeAsistente: Mensaje = {
        id: chatResponse.id_mensaje,
        id_conversacion: chatResponse.id_conversacion,
        rol: 'assistant',
        contenido: chatResponse.respuesta,
        consulta_sql: chatResponse.consulta_sql,
        timestamp: new Date().toISOString()
      };

      // Agregar la respuesta al final
      setMensajes(prev => {
        const nuevoArray = [...prev, mensajeAsistente];
        console.log('✅ Agregando respuesta del asistente, total mensajes:', nuevoArray.length);
        console.log('📄 Longitud de la respuesta:', chatResponse.respuesta.length, 'caracteres');
        return nuevoArray;
      });

      // 4. ACTUALIZAR FECHA DE ÚLTIMA ACTIVIDAD
      if (conversacionActual) {
        setConversacionActual(prev => prev ? {
          ...prev,
          fecha_ultima_actividad: new Date().toISOString()
        } : null);
      }

      console.log('🎉 Mensaje enviado y respuesta agregada exitosamente');

    } catch (error) {
      console.error('❌ Error al enviar mensaje:', error);
      
      // Type guard para manejar el error correctamente
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      console.error('📊 Detalles del error:', {
        message: errorMessage,
        stack: errorStack,
        tempId: tempId,
        conversacionActual: conversacionActual?.id,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name
      });
      
      // En caso de error, remover solo el mensaje temporal del usuario
      setMensajes(prev => {
        const filtrado = prev.filter(msg => msg.id !== tempId);
        console.log('🧹 Removiendo mensaje temporal, mensajes restantes:', filtrado.length);
        return filtrado;
      });
      
      // Re-lanzar el error para que el componente lo pueda manejar
      throw error;
    } finally {
      console.log('🏁 Finalizando envío de mensaje');
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