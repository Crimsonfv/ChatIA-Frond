// src/pages/ChatPage.tsx - VERSIÓN OPTIMIZADA CON CHAT EN TIEMPO REAL
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';
import Loading from '../components/common/Loading';
import { DataDetailsModal, ConfirmModal, FormModal } from '../components/common/Modal';
import ConversationDropdown from '../components/common/ConversationDropdown';
import { chatService } from '../services/chatService';
import { filterService } from '../services/filterService';
import type { Mensaje, TerminoExcluido } from '../types';

// ==================== COMPONENTE TYPING INDICATOR ====================
interface TypingIndicatorProps {
  show: boolean;
  isLongQuery?: boolean;
  tiempoTranscurrido?: number;
  className?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  show, 
  isLongQuery = false,
  tiempoTranscurrido = 0,
  className = '' 
}) => {
  if (!show) return null;

  const formatearTiempo = (segundos: number) => {
    if (segundos < 60) return `${segundos}s`;
    const min = Math.floor(segundos / 60);
    const sec = segundos % 60;
    return `${min}m ${sec}s`;
  };

  return (
    <div className={`flex items-start space-x-3 ${className}`}>
      {/* Avatar del asistente */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014.846 21H9.154a3.374 3.374 0 00-2.869-1.146l-.548-.547z" />
          </svg>
        </div>
      </div>

      {/* Burbuja de escritura */}
      <div className="bg-gray-100 rounded-lg rounded-tl-none px-4 py-3 max-w-md">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {isLongQuery 
              ? "Procesando consulta compleja, esto puede tardar unos momentos..."
              : "El asistente está escribiendo"
            }
          </span>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
        
        {/* ✅ Barra de progreso y tiempo para consultas largas */}
        {isLongQuery && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div className="bg-blue-500 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                Analizando datos olímpicos...
              </p>
              {tiempoTranscurrido > 0 && (
                <p className="text-xs text-blue-600 font-medium">
                  {formatearTiempo(tiempoTranscurrido)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== COMPONENTE MESSAGE ITEM MEJORADO ====================
interface MessageItemProps {
  mensaje: Mensaje;
  onShowDetails?: (mensaje: Mensaje) => void;
  formatearTiempo: (timestamp: string) => string;
}

const MessageItem: React.FC<MessageItemProps> = ({ mensaje, onShowDetails, formatearTiempo }) => {
  const isUser = mensaje.rol === 'user';
  
  // Debug para respuestas largas
  useEffect(() => {
    if (!isUser && mensaje.contenido) {
      console.log('🎨 Renderizando mensaje del asistente:', {
        id: mensaje.id,
        longitud: mensaje.contenido.length,
        preview: mensaje.contenido.substring(0, 100) + '...'
      });
    }
  }, [mensaje.contenido, isUser, mensaje.id]);
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="flex-shrink-0 mr-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014.846 21H9.154a3.374 3.374 0 00-2.869-1.146l-.548-.547z" />
            </svg>
          </div>
        </div>
      )}
      
      <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isUser ? 'order-first' : ''}`}>
        <div
          className={`px-4 py-3 rounded-lg shadow-sm ${
            isUser
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-sm'
              : 'bg-white text-gray-900 border border-gray-200 rounded-tl-sm'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {mensaje.contenido}
          </p>
          
          <div className={`flex items-center justify-between mt-3 pt-2 border-t ${
            isUser ? 'border-blue-500' : 'border-gray-100'
          }`}>
            <p className={`text-xs ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
              {formatearTiempo(mensaje.timestamp)}
            </p>
            
            {mensaje.consulta_sql && (
              <button
                onClick={() => onShowDetails?.(mensaje)}
                className={`text-xs underline hover:no-underline transition-all ${
                  isUser 
                    ? 'text-blue-100 hover:text-white' 
                    : 'text-blue-600 hover:text-blue-800'
                }`}
              >
                Ver datos
              </button>
            )}
          </div>
        </div>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 ml-3">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== CHAT PAGE COMPONENT ====================
const ChatPage: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { 
    conversaciones, 
    conversacionActual, 
    mensajes, 
    loading, 
    enviandoMensaje,
    cargarConversaciones,
    crearConversacion,
    seleccionarConversacion,
    eliminarConversacion,
    enviarMensaje,
    obtenerDetallesMensaje
  } = useChat();
  
  const navigate = useNavigate();

  // ==================== ESTADO LOCAL ====================
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mensajeInput, setMensajeInput] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Mensaje | null>(null);
  const [conversacionAEliminar, setConversacionAEliminar] = useState<number | null>(null);
  const [detallesContexto, setDetallesContexto] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [terminosExcluidos, setTerminosExcluidos] = useState<TerminoExcluido[]>([]);
  const [nuevoTermino, setNuevoTermino] = useState('');
  
  // Estados para edición de título
  const [showEditTitleModal, setShowEditTitleModal] = useState(false);
  const [editingConversationId, setEditingConversationId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  
  // ✅ Estados para manejar consultas largas
  const [mostrarAdvertenciaLarga, setMostrarAdvertenciaLarga] = useState(false);
  const [, setTiempoInicioConsulta] = useState<number | null>(null);
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0);

  // Refs para scroll automático
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ==================== EFECTOS ====================
  useEffect(() => {
    cargarConversaciones();
    cargarTerminosExcluidos();
  }, []);

  // Scroll mejorado que espera el renderizado completo
  useEffect(() => {
    const scrollToBottomDelayed = () => {
      // Usar setTimeout para asegurar que el DOM se haya actualizado
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    };
    
    scrollToBottomDelayed();
  }, [mensajes, enviandoMensaje]);

  // Auto-focus en el input cuando se selecciona una conversación
  useEffect(() => {
    if (conversacionActual && inputRef.current) {
      inputRef.current.focus();
    }
  }, [conversacionActual]);

  // Cerrar sidebar con tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

  // ✅ Monitorear consultas largas
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let intervalTimer: NodeJS.Timeout;
    
    if (enviandoMensaje) {
      // Marcar tiempo de inicio
      const inicioTiempo = Date.now();
      setTiempoInicioConsulta(inicioTiempo);
      setMostrarAdvertenciaLarga(false);
      setTiempoTranscurrido(0);
      
      // Actualizar tiempo transcurrido cada segundo
      intervalTimer = setInterval(() => {
        const tiempoActual = Math.floor((Date.now() - inicioTiempo) / 1000);
        setTiempoTranscurrido(tiempoActual);
      }, 1000);
      
      // Mostrar advertencia después de 15 segundos
      timer = setTimeout(() => {
        setMostrarAdvertenciaLarga(true);
        console.log('⏱️ Mostrando advertencia de consulta larga');
      }, 15000);
    } else {
      // Limpiar cuando termine
      setMostrarAdvertenciaLarga(false);
      setTiempoInicioConsulta(null);
      setTiempoTranscurrido(0);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (intervalTimer) clearInterval(intervalTimer);
    };
  }, [enviandoMensaje]);

  // ==================== FUNCIONES DE SCROLL MEJORADAS ====================
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      try {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
      } catch (error) {
        console.warn('Error en scroll automático:', error);
        // Fallback: scroll manual
        if (messagesEndRef.current.parentElement) {
          messagesEndRef.current.parentElement.scrollTop = messagesEndRef.current.parentElement.scrollHeight;
        }
      }
    }
  };

  // ==================== CARGAR TÉRMINOS EXCLUIDOS ====================
  const cargarTerminosExcluidos = async () => {
    try {
      console.log('🔄 Cargando términos excluidos...');
      const terminos = await filterService.obtenerTerminosExcluidos();
      setTerminosExcluidos(terminos);
      console.log(`✅ Términos excluidos cargados: ${terminos.length} términos`);
    } catch (error) {
      console.error('❌ Error al cargar términos excluidos:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.log(`❌ Detalles del error: ${errorMessage}`);
      // No mostrar alert aquí ya que es una carga inicial
    }
  };

  // ==================== MANEJO DE MENSAJES CON MEJOR ERROR HANDLING ====================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const mensaje = mensajeInput.trim();
    if (!mensaje || enviandoMensaje) return;

    console.log('📝 Iniciando handleSubmit con mensaje:', mensaje.substring(0, 50) + '...');

    // ✅ Detectar si es una consulta compleja
    const esCompleja = chatService.esConsultaCompleja(mensaje);
    console.log('🔍 Consulta detectada como:', esCompleja ? 'compleja' : 'simple');

    try {
      // ✅ Limpiar input inmediatamente para mejor UX
      setMensajeInput('');
      
      // ✅ El ChatContext optimizado maneja la actualización en tiempo real
      await enviarMensaje(mensaje);
      
      console.log('✅ Mensaje enviado exitosamente desde handleSubmit');
      
      // ✅ Auto-generar título si es el primer mensaje de la conversación
      if (conversacionActual && mensajes.length === 0) {
        try {
          const autoTitle = generateTitleFromMessage(mensaje);
          console.log('🏷️ Generando título automático:', autoTitle);
          
          // Actualizar título automáticamente usando el servicio
          await chatService.actualizarTituloConversacion(conversacionActual.id, autoTitle);
          
          // Recargar conversaciones para mostrar el nuevo título
          await cargarConversaciones();
          
          console.log('✅ Título automático actualizado exitosamente');
        } catch (error) {
          console.log('⚠️ No se pudo generar título automático:', error);
        }
      }
      
      // ✅ Mantener el foco en el input
      if (inputRef.current) {
        inputRef.current.focus();
      }
      
      // ✅ Scroll adicional después de un breve delay para respuestas largas
      setTimeout(() => {
        scrollToBottom();
      }, 500);
      
    } catch (error) {
      console.error('❌ Error en handleSubmit:', error);
      
      // Type guard para manejar el error correctamente
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const errorStack = error instanceof Error ? error.stack : undefined;
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      
      console.error('📊 Detalles completos del error:', {
        message: errorMessage,
        name: errorName,
        stack: errorStack,
        errorType: typeof error,
        esConsultaCompleja: esCompleja
      });
      
      // ✅ Restaurar mensaje en caso de error
      setMensajeInput(mensaje);
      
      // ✅ Mostrar error específico al usuario
      let mensajeError = errorMessage;
      if (errorMessage.includes('timeout') || errorMessage.includes('tardando')) {
        mensajeError = `Tu consulta está tomando más tiempo del esperado. ${esCompleja ? 'Las consultas complejas pueden tardar hasta 2 minutos.' : 'Por favor intenta de nuevo.'}`;
      }
      
      alert(`Error al enviar mensaje: ${mensajeError}`);
    }
  };

  // ==================== MANEJO DE CONVERSACIONES ====================
  const handleNuevaConversacion = async () => {
    try {
      await crearConversacion();
      setSidebarOpen(false); // Cerrar sidebar en móvil
    } catch (error) {
      console.error('Error al crear conversación:', error);
    }
  };

  const handleSeleccionarConversacion = async (id: number) => {
    try {
      await seleccionarConversacion(id);
      setSidebarOpen(false); // Cerrar sidebar en móvil
    } catch (error) {
      console.error('Error al seleccionar conversación:', error);
    }
  };

  const handleEliminarConversacion = (id: number) => {
    setConversacionAEliminar(id);
    setShowDeleteModal(true);
  };

  const confirmarEliminarConversacion = async () => {
    if (!conversacionAEliminar) return;
    
    try {
      await eliminarConversacion(conversacionAEliminar);
      setConversacionAEliminar(null);
    } catch (error) {
      console.error('Error al eliminar conversación:', error);
    }
  };

  // ==================== MANEJO DE EDICIÓN DE TÍTULO ====================
  const handleEditTitle = (conversationId: number, currentTitle: string) => {
    setEditingConversationId(conversationId);
    setNewTitle(currentTitle);
    setShowEditTitleModal(true);
  };

  const handleSaveTitle = async () => {
    if (!editingConversationId || !newTitle.trim()) return;
    
    try {
      // Usar el servicio de chat para actualizar el título
      const conversacionActualizada = await chatService.actualizarTituloConversacion(
        editingConversationId, 
        newTitle.trim()
      );
      
      // Actualizar la lista de conversaciones en el estado local
      await cargarConversaciones();
      
      // Si es la conversación actual, actualizar también el estado actual
      if (conversacionActual?.id === editingConversationId) {
        // Recargar la conversación actual para reflejar el nuevo título
        await seleccionarConversacion(editingConversationId);
      }
      
      setShowEditTitleModal(false);
      setEditingConversationId(null);
      setNewTitle('');
      
      console.log('✅ Título actualizado exitosamente:', conversacionActualizada.titulo);
    } catch (error) {
      console.error('❌ Error al actualizar título:', error);
      alert('Error al actualizar el título de la conversación. Por favor, inténtalo de nuevo.');
    }
  };

  const handleDeleteConversation = (conversationId: number, _title: string) => {
    setConversacionAEliminar(conversationId);
    setShowDeleteModal(true);
  };

  // ==================== AUTO-TÍTULO PARA PRIMERA PREGUNTA ====================
  const generateTitleFromMessage = (message: string): string => {
    // Generar título basado en la primera pregunta (máximo 50 caracteres)
    const cleanMessage = message.trim();
    if (cleanMessage.length <= 50) {
      return cleanMessage;
    }
    
    // Tomar las primeras palabras hasta 50 caracteres
    const words = cleanMessage.split(' ');
    let title = '';
    for (const word of words) {
      if ((title + ' ' + word).length > 47) break;
      title += (title ? ' ' : '') + word;
    }
    return title + '...';
  };

  // ==================== MANEJO DE DETALLES ====================
  const handleMostrarDetalles = async (mensaje: Mensaje) => {
    if (!mensaje.consulta_sql) return;

    setSelectedMessage(mensaje);
    setLoadingDetails(true);
    setShowDetailsModal(true);

    try {
      const detalles = await obtenerDetallesMensaje(mensaje.id);
      setDetallesContexto(detalles);
    } catch (error) {
      console.error('Error al obtener detalles:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  // ==================== MANEJO DE TÉRMINOS EXCLUIDOS ====================
  const handleAgregarTermino = async () => {
    const termino = nuevoTermino.trim();
    if (!termino) {
      alert('Por favor, ingresa un término válido');
      return;
    }

    if (termino.length < 2) {
      alert('El término debe tener al menos 2 caracteres');
      return;
    }

    try {
      await filterService.agregarTerminoExcluido({ termino });
      setNuevoTermino('');
      await cargarTerminosExcluidos();
      console.log(`✅ Término "${termino}" agregado exitosamente`);
    } catch (error) {
      console.error('Error al agregar término:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al agregar término: ${errorMessage}`);
    }
  };

  const handleEliminarTermino = async (id: number) => {
    // Encontrar el término para mostrar confirmación
    const termino = terminosExcluidos.find(t => t.id === id);
    const terminoTexto = termino ? termino.termino : 'este término';
    
    if (!confirm(`¿Estás seguro de que deseas eliminar "${terminoTexto}" de la lista de términos excluidos?`)) {
      return;
    }

    try {
      await filterService.eliminarTerminoExcluido(id);
      await cargarTerminosExcluidos();
      console.log(`✅ Término "${terminoTexto}" eliminado exitosamente`);
    } catch (error) {
      console.error('Error al eliminar término:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al eliminar término: ${errorMessage}`);
    }
  };

  // ==================== LOGOUT ====================
  const handleLogout = async () => {
    try {
      await logout();
      navigate(ROUTES.LOGIN);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // ==================== FORMATEAR TIEMPO ====================
  const formatearTiempo = (timestamp: string) => {
    return chatService.formatearFechaMensaje(timestamp);
  };

  // ==================== MANEJAR TECLAS ====================
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // ==================== RENDER ====================
  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Backdrop overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Hidden by default, slides in when opened */}
      <div className={`
        ${sidebarOpen ? 'w-80' : 'w-0'} 
        transition-all duration-300 bg-white border-r border-gray-200 flex flex-col overflow-hidden 
        absolute lg:relative z-30
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header del Sidebar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Conversaciones</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors duration-200"
              title="Cerrar panel"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <button
            onClick={handleNuevaConversacion}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Creando...' : '✨ Nueva Conversación'}
          </button>
        </div>

        {/* Lista de Conversaciones */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4">
              <Loading text="Cargando conversaciones..." />
            </div>
          ) : conversaciones.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="font-medium">No tienes conversaciones aún</p>
              <p className="text-sm mt-1">Crea una nueva para empezar</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {conversaciones.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSeleccionarConversacion(conv.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 group ${
                    conversacionActual?.id === conv.id
                      ? 'bg-blue-50 border border-blue-200 shadow-sm'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conv.titulo || 'Sin título'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatearTiempo(conv.fecha_ultima_actividad)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEliminarConversacion(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1 rounded hover:bg-red-50"
                      title="Eliminar conversación"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overlay para móviles */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Área Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header mejorado */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Lado izquierdo */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
                title={sidebarOpen ? "Cerrar conversaciones" : "Ver conversaciones"}
              >
                {sidebarOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                )}
              </button>
              
              {/* Conversation Switcher - always visible when in chat */}
              {conversacionActual ? (
                <div className="flex-1 max-w-sm">
                  <div className="flex flex-col">
                    <ConversationDropdown 
                      placeholder="Seleccionar chat..."
                      className="min-w-0"
                      onEditTitle={handleEditTitle}
                      onDeleteConversation={handleDeleteConversation}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {mensajes.length} mensaje{mensajes.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Chatbot Olímpico
                  </h1>
                </div>
              )}
            </div>

            {/* Lado derecho */}
            <div className="flex items-center space-x-2">
              {/* Info del usuario */}
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.rol}</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>

              {/* Botón de administración */}
              {isAdmin && (
                <button
                  onClick={() => navigate(ROUTES.ADMIN)}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
                  title="Panel de administración"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}

              {/* Botón de configuraciones */}
              <button
                onClick={() => setShowSettingsModal(true)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
                title="Configuraciones"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </button>

              {/* Botón de logout */}
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                title="Cerrar sesión"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Área de Mensajes */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
          {!conversacionActual ? (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center max-w-lg w-full">
                <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-6">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  🏅 Bienvenido al Chatbot Olímpico
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Pregúntame cualquier cosa sobre los Juegos Olímpicos: medallas, atletas, países, deportes y mucho más.
                </p>
                
                {/* Dropdown para seleccionar conversación existente */}
                {conversaciones.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selecciona una conversación existente:
                    </label>
                    <ConversationDropdown 
                      placeholder="Elegir conversación..."
                      className="mb-4"
                      onEditTitle={handleEditTitle}
                      onDeleteConversation={handleDeleteConversation}
                    />
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gray-50 text-gray-500">o</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={handleNuevaConversacion}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium"
                >
                  🚀 {conversaciones.length > 0 ? 'Crear Nueva Conversación' : 'Comenzar Chat'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4">
              {/* Mensajes */}
              <div className="max-w-4xl mx-auto">
                {mensajes.map((mensaje) => (
                  <MessageItem
                    key={mensaje.id}
                    mensaje={mensaje}
                    onShowDetails={handleMostrarDetalles}
                    formatearTiempo={formatearTiempo}
                  />
                ))}
                
                {/* ✅ Indicador de escritura mejorado */}
                <TypingIndicator 
                  show={enviandoMensaje} 
                  isLongQuery={mostrarAdvertenciaLarga}
                  tiempoTranscurrido={tiempoTranscurrido}
                />
                
                {/* Referencia para scroll automático */}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Área de Input mejorada */}
        {conversacionActual && (
          <div className="border-t border-gray-200 bg-white p-4">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={mensajeInput}
                    onChange={(e) => setMensajeInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu pregunta sobre datos olímpicos... (Shift+Enter para nueva línea)"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    style={{ minHeight: '52px', maxHeight: '120px' }}
                    disabled={enviandoMensaje}
                    rows={1}
                  />
                  
                  {/* Contador de caracteres */}
                  <div className="absolute bottom-1 right-2 text-xs text-gray-400">
                    {mensajeInput.length}/1000
                  </div>
                </div>

                {/* Quick new conversation button */}
                <button
                  type="button"
                  onClick={handleNuevaConversacion}
                  disabled={loading}
                  className="bg-gray-100 text-gray-600 px-3 py-3 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
                  title="Nueva conversación"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                
                <button
                  type="submit"
                  disabled={!mensajeInput.trim() || enviandoMensaje}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                >
                  {enviandoMensaje ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Enviando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>Enviar</span>
                    </div>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      <DataDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedMessage(null);
          setDetallesContexto(null);
        }}
        title="Detalles del Mensaje"
        sqlQuery={selectedMessage?.consulta_sql}
        data={detallesContexto?.muestra_datos || []}
        totalResults={detallesContexto?.total_resultados || 0}
        loading={loadingDetails}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setConversacionAEliminar(null);
        }}
        onConfirm={confirmarEliminarConversacion}
        title="Eliminar Conversación Permanentemente"
        message="¿Estás seguro de que quieres ELIMINAR PERMANENTEMENTE esta conversación y todos sus mensajes? Esta acción eliminará completamente todos los datos de la conversación de la base de datos y NO SE PUEDE DESHACER."
        confirmText="Eliminar Permanentemente"
        type="danger"
      />

      <FormModal
        isOpen={showEditTitleModal}
        onClose={() => {
          setShowEditTitleModal(false);
          setEditingConversationId(null);
          setNewTitle('');
        }}
        title="✏️ Editar Título de Conversación"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="conversation-title" className="block text-sm font-medium text-gray-700 mb-2">
              Nuevo título:
            </label>
            <input
              id="conversation-title"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Escribe el nuevo título..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={100}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newTitle.trim()) {
                  handleSaveTitle();
                }
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              {newTitle.length}/100 caracteres
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowEditTitleModal(false);
                setEditingConversationId(null);
                setNewTitle('');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveTitle}
              disabled={!newTitle.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Guardar
            </button>
          </div>
        </div>
      </FormModal>

      <FormModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="⚙️ Configuraciones"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              🚫 Términos Excluidos
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Términos que serán excluidos de los resultados de búsqueda. Los datos que contengan estos términos no aparecerán en las respuestas del chatbot.
            </p>
            
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={nuevoTermino}
                onChange={(e) => setNuevoTermino(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && nuevoTermino.trim()) {
                    handleAgregarTermino();
                  }
                }}
                placeholder="Agregar término... (presiona Enter para agregar)"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAgregarTermino}
                disabled={!nuevoTermino.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Agregar
              </button>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {terminosExcluidos.map((termino) => (
                <div key={termino.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                  <span className="text-sm text-gray-700">{termino.termino}</span>
                  <button
                    onClick={() => handleEliminarTermino(termino.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              {terminosExcluidos.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay términos excluidos
                </p>
              )}
            </div>
          </div>
        </div>
      </FormModal>
    </div>
  );
};

export default ChatPage;