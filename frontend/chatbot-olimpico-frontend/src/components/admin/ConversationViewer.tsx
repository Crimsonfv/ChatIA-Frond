// src/components/admin/ConversationViewer.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { SectionLoading } from '../common/Loading';
import { ConfirmModal } from '../common/Modal';
import type { AdminConversation, AdminConversationDetail, AdminUser } from '../../types';

const ConversationViewer: React.FC = () => {
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<AdminConversationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  
  // Estados para modales de confirmación
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToModify, setConversationToModify] = useState<AdminConversation | null>(null);

  useEffect(() => {
    cargarDatos();
  }, [selectedUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar usuarios para el filtro
      const usuariosData = await adminService.obtenerUsuarios();
      setUsers(usuariosData);
      
      // Cargar conversaciones
      const conversacionesData = await adminService.obtenerTodasConversaciones(
        selectedUserId || undefined
      );
      setConversations(conversacionesData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const conversacionesFiltradas = conversations.filter(conv => 
    !filtro || 
    conv.titulo?.toLowerCase().includes(filtro.toLowerCase()) ||
    conv.usuario.username.toLowerCase().includes(filtro.toLowerCase()) ||
    conv.usuario.email.toLowerCase().includes(filtro.toLowerCase())
  );

  const handleViewConversation = async (conversationId: number) => {
    try {
      setLoadingDetail(true);
      const detalle = await adminService.obtenerConversacionAdmin(conversationId);
      setSelectedConversation(detalle);
    } catch (error) {
      console.error('Error al cargar detalle de conversación:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDeactivate = (conversation: AdminConversation) => {
    setConversationToModify(conversation);
    setShowDeactivateModal(true);
  };

  const handleActivate = async (conversation: AdminConversation) => {
    try {
      await adminService.activarConversacionAdmin(conversation.id);
      await cargarDatos(); // Recargar datos para actualizar conteos
    } catch (error) {
      console.error('Error al reactivar conversación:', error);
    }
  };

  const handleDelete = (conversation: AdminConversation) => {
    setConversationToModify(conversation);
    setShowDeleteModal(true);
  };

  const confirmarDesactivar = async () => {
    if (!conversationToModify) return;

    try {
      await adminService.desactivarConversacionAdmin(conversationToModify.id);
      await cargarDatos(); // Recargar datos para actualizar conteos
      setShowDeactivateModal(false);
      setConversationToModify(null);
    } catch (error) {
      console.error('Error al desactivar conversación:', error);
    }
  };

  const confirmarEliminar = async () => {
    if (!conversationToModify) return;

    try {
      await adminService.eliminarConversacionAdmin(conversationToModify.id);
      await cargarDatos(); // Recargar datos para actualizar conteos
      setShowDeleteModal(false);
      setConversationToModify(null);
    } catch (error) {
      console.error('Error al eliminar conversación:', error);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearFechaCompleta = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return <SectionLoading text="Cargando conversaciones..." />;
  }

  return (
    <div className="space-y-8">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Conversaciones</p>
              <p className="text-2xl font-bold text-gray-900">{conversations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Conversaciones Activas</p>
              <p className="text-2xl font-bold text-gray-900">{conversations.filter(c => c.activa).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Conversaciones Inactivas</p>
              <p className="text-2xl font-bold text-gray-900">{conversations.filter(c => !c.activa).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Usuarios Únicos</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(conversations.map(c => c.usuario.id)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1 max-w-lg">
              <input
                type="text"
                placeholder="Buscar conversaciones por título o usuario..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedUserId || ''}
                onChange={(e) => setSelectedUserId(e.target.value ? parseInt(e.target.value) : null)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los usuarios</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Conversaciones */}
        <div className="divide-y divide-gray-200">
          {conversacionesFiltradas.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No se encontraron conversaciones</p>
            </div>
          ) : (
            conversacionesFiltradas.map((conversation) => (
              <div key={conversation.id} className={`p-6 hover:bg-gray-50 ${!conversation.activa ? 'bg-gray-50 border-l-4 border-gray-400' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className={`text-lg font-medium ${conversation.activa ? 'text-gray-900' : 'text-gray-500'}`}>
                        {conversation.titulo || `Conversación ${conversation.id}`}
                        {!conversation.activa && ' (Inactiva)'}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        conversation.activa 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {conversation.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-600 mb-2">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                        </svg>
                        <span>{conversation.usuario.username}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        <span>{conversation.usuario.email}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-xs text-gray-500">
                      <span>Iniciada: {formatearFecha(conversation.fecha_inicio)}</span>
                      <span>Última actividad: {formatearFecha(conversation.fecha_ultima_actividad)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleViewConversation(conversation.id)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200 transition-colors flex items-center space-x-1"
                      title="Ver detalles de la conversación"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>Ver Detalles</span>
                    </button>
                    
                    {conversation.activa ? (
                      <button
                        onClick={() => handleDeactivate(conversation)}
                        className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm font-medium hover:bg-yellow-200 transition-colors flex items-center space-x-1"
                        title="Desactivar conversación (soft delete)"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 12M6 6l12 12" />
                        </svg>
                        <span>Desactivar</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivate(conversation)}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium hover:bg-green-200 transition-colors flex items-center space-x-1"
                        title="Reactivar conversación"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Reactivar</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(conversation)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200 transition-colors flex items-center space-x-1"
                      title="Eliminar conversación permanentemente (hard delete)"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Detalle de Conversación */}
      {selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedConversation.titulo || `Conversación ${selectedConversation.id}`}
                </h2>
                <p className="text-sm text-gray-600">
                  Usuario: {selectedConversation.usuario.username} ({selectedConversation.usuario.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedConversation(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Cargando mensajes...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedConversation.mensajes.map((mensaje) => (
                    <div
                      key={mensaje.id}
                      className={`flex ${mensaje.rol === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          mensaje.rol === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium">
                            {mensaje.rol === 'user' ? 'Usuario' : 'Asistente'}
                          </span>
                          <span className="text-xs opacity-75">
                            {formatearFechaCompleta(mensaje.timestamp)}
                          </span>
                        </div>
                        <div className="whitespace-pre-wrap break-words">
                          {mensaje.contenido}
                        </div>
                        {mensaje.consulta_sql && mensaje.consulta_sql.trim() !== '' && (
                          <div className="mt-3 p-2 bg-black bg-opacity-20 rounded text-xs">
                            <div className="font-medium mb-1">Consulta SQL:</div>
                            <code className="whitespace-pre-wrap">{mensaje.consulta_sql}</code>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {selectedConversation.mensajes.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <p>No hay mensajes en esta conversación</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Desactivación */}
      <ConfirmModal
        isOpen={showDeactivateModal}
        onClose={() => {
          setShowDeactivateModal(false);
          setConversationToModify(null);
        }}
        onConfirm={confirmarDesactivar}
        title="Desactivar Conversación"
        message={`¿Estás seguro de que quieres desactivar la conversación "${conversationToModify?.titulo || `Conversación ${conversationToModify?.id}`}"? Esta acción marcará la conversación como inactiva pero mantendrá todos los datos.`}
        confirmText="Desactivar"
        cancelText="Cancelar"
        type="warning"
      />

      {/* Modal Confirmar Eliminación */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setConversationToModify(null);
        }}
        onConfirm={confirmarEliminar}
        title="Eliminar Conversación Permanentemente"
        message={`¿Estás seguro de que quieres ELIMINAR PERMANENTEMENTE la conversación "${conversationToModify?.titulo || `Conversación ${conversationToModify?.id}`}" y todos sus mensajes? Esta acción eliminará completamente todos los datos de la base de datos y NO SE PUEDE DESHACER.`}
        confirmText="Eliminar Permanentemente"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default ConversationViewer;