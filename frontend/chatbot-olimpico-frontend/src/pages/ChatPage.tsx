// src/pages/ChatPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';
import Loading, { DotsLoading } from '../components/common/Loading';
import { DataDetailsModal, ConfirmModal, FormModal } from '../components/common/Modal';
import { chatService } from '../services/chatService';
import { filterService } from '../services/filterService';
import type { Mensaje, TerminoExcluido } from '../types';

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  // Refs para scroll automático
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ==================== EFECTOS ====================
  useEffect(() => {
    cargarConversaciones();
    cargarTerminosExcluidos();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  // ==================== FUNCIONES DE SCROLL ====================
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ==================== CARGAR TÉRMINOS EXCLUIDOS ====================
  const cargarTerminosExcluidos = async () => {
    try {
      const terminos = await filterService.obtenerTerminosExcluidos();
      setTerminosExcluidos(terminos);
    } catch (error) {
      console.error('Error al cargar términos excluidos:', error);
    }
  };

  // ==================== MANEJO DE MENSAJES ====================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const mensaje = mensajeInput.trim();
    if (!mensaje || enviandoMensaje) return;

    try {
      setMensajeInput('');
      await enviarMensaje(mensaje);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      // Restaurar mensaje en caso de error
      setMensajeInput(mensaje);
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
    if (!termino) return;

    try {
      await filterService.agregarTerminoExcluido({ termino });
      setNuevoTermino('');
      await cargarTerminosExcluidos();
    } catch (error) {
      console.error('Error al agregar término:', error);
    }
  };

  const handleEliminarTermino = async (id: number) => {
    try {
      await filterService.eliminarTerminoExcluido(id);
      await cargarTerminosExcluidos();
    } catch (error) {
      console.error('Error al eliminar término:', error);
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

  // ==================== RENDER ====================
  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col overflow-hidden`}>
        {/* Header del Sidebar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Conversaciones</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <button
            onClick={handleNuevaConversacion}
            className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Nueva Conversación
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
              <p>No tienes conversaciones aún</p>
              <p className="text-sm mt-1">Crea una nueva para empezar</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {conversaciones.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSeleccionarConversacion(conv.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                    conversacionActual?.id === conv.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
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
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
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

      {/* Área Principal */}
      <div className="flex-1 flex flex-col">
        {/* ✅ HEADER ORIGINAL + BOTÓN DE LOGOUT */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-gray-900">
                {conversacionActual?.titulo || 'Chatbot Olímpico'}
              </h1>
            </div>

            <div className="flex items-center space-x-2">
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

              {/* Botón Admin */}
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

              {/* ✅ BOTÓN DE LOGOUT CON TEXTO */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                title="Cerrar sesión"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm font-medium">Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>

        {/* Área de Mensajes */}
        <div className="flex-1 overflow-y-auto p-4">
          {!conversacionActual ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Bienvenido al Chatbot Olímpico
                </h3>
                <p className="text-gray-500 mb-4">
                  Selecciona una conversación o crea una nueva para empezar a chatear
                </p>
                <button
                  onClick={handleNuevaConversacion}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Nueva Conversación
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {mensajes.map((mensaje) => (
                <div
                  key={mensaje.id}
                  className={`flex ${mensaje.rol === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      mensaje.rol === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{mensaje.contenido}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs opacity-75">
                        {formatearTiempo(mensaje.timestamp)}
                      </p>
                      {mensaje.consulta_sql && (
                        <button
                          onClick={() => handleMostrarDetalles(mensaje)}
                          className="text-xs underline opacity-75 hover:opacity-100"
                        >
                          Ver detalles
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {enviandoMensaje && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg">
                    <DotsLoading text="Escribiendo" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Área de Input */}
        {conversacionActual && (
          <div className="border-t border-gray-200 bg-white p-4">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={mensajeInput}
                onChange={(e) => setMensajeInput(e.target.value)}
                placeholder="Escribe tu pregunta sobre datos olímpicos..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={enviandoMensaje}
              />
              <button
                type="submit"
                disabled={!mensajeInput.trim() || enviandoMensaje}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Enviar
              </button>
            </form>
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
        title="Eliminar Conversación"
        message="¿Estás seguro de que quieres eliminar esta conversación? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        type="danger"
      />

      <FormModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Configuraciones"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Términos Excluidos
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Palabras que serán filtradas de tus preguntas antes de procesarlas.
            </p>
            
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={nuevoTermino}
                onChange={(e) => setNuevoTermino(e.target.value)}
                placeholder="Agregar término..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAgregarTermino}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Agregar
              </button>
            </div>
            
            <div className="max-h-40 overflow-y-auto">
              {terminosExcluidos.length === 0 ? (
                <p className="text-sm text-gray-500">No hay términos excluidos</p>
              ) : (
                <div className="space-y-2">
                  {terminosExcluidos.map((termino) => (
                    <div
                      key={termino.id}
                      className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                    >
                      <span className="text-sm">{termino.termino}</span>
                      <button
                        onClick={() => handleEliminarTermino(termino.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </FormModal>
    </div>
  );
};

export default ChatPage;