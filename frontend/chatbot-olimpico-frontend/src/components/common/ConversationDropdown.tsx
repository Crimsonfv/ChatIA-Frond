// src/components/common/ConversationDropdown.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import type { ConversacionResponse } from '../../types';

interface ConversationDropdownProps {
  className?: string;
  placeholder?: string;
  required?: boolean;
  onEditTitle?: (conversationId: number, currentTitle: string) => void;
  onDeleteConversation?: (conversationId: number, title: string) => void;
}

const ConversationDropdown: React.FC<ConversationDropdownProps> = ({
  className = '',
  placeholder = 'Seleccionar conversación...',
  required = false,
  onEditTitle,
  onDeleteConversation
}) => {
  const { 
    conversaciones, 
    conversacionActual, 
    seleccionarConversacion, 
    crearConversacion,
    loading 
  } = useChat();
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrar conversaciones basado en búsqueda
  const conversacionesFiltradas = conversaciones.filter(conv =>
    (conv.titulo || 'Sin título').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectConversation = (conversacion: ConversacionResponse) => {
    seleccionarConversacion(conversacion.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleEditClick = (e: React.MouseEvent, conversacionId: number, title: string) => {
    e.stopPropagation();
    setIsOpen(false);
    if (onEditTitle) {
      onEditTitle(conversacionId, title);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, conversacionId: number, title: string) => {
    e.stopPropagation();
    setIsOpen(false);
    if (onDeleteConversation) {
      onDeleteConversation(conversacionId, title);
    }
  };

  const handleCreateNew = async () => {
    try {
      await crearConversacion('Nueva conversación');
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const getCurrentTitle = () => {
    if (conversacionActual) {
      return conversacionActual.titulo || 'Sin título';
    }
    return placeholder;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between px-4 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          hover:bg-gray-50 transition-colors duration-200
          ${required && !conversacionActual ? 'border-red-300 bg-red-50' : ''}
        `}
      >
        <span className={`block truncate ${!conversacionActual ? 'text-gray-500' : 'text-gray-900'}`}>
          {getCurrentTitle()}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Required field indicator */}
      {required && !conversacionActual && (
        <p className="mt-1 text-sm text-red-600">Selecciona una conversación para continuar</p>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Create New Button */}
          <div className="p-2 border-b border-gray-200">
            <button
              onClick={handleCreateNew}
              disabled={loading}
              className="w-full flex items-center px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200 disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva conversación
            </button>
          </div>

          {/* Conversations List */}
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-pulse">Cargando conversaciones...</div>
              </div>
            ) : conversacionesFiltradas.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'No se encontraron conversaciones' : 'No hay conversaciones disponibles'}
              </div>
            ) : (
              conversacionesFiltradas.map((conversacion) => (
                <div
                  key={conversacion.id}
                  className={`
                    group flex items-center px-4 py-3 hover:bg-gray-50 transition-colors duration-200
                    ${conversacionActual?.id === conversacion.id ? 'bg-blue-50' : ''}
                  `}
                >
                  <button
                    onClick={() => handleSelectConversation(conversacion)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium truncate ${
                        conversacionActual?.id === conversacion.id ? 'text-blue-700' : 'text-gray-900'
                      }`}>
                        {conversacion.titulo || 'Sin título'}
                      </p>
                      {conversacionActual?.id === conversacion.id && (
                        <svg className="w-4 h-4 text-blue-500 ml-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(conversacion.fecha_inicio).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </button>

                  {/* Action buttons - show on hover or for current conversation */}
                  {(onEditTitle || onDeleteConversation) && (
                    <div className={`flex items-center space-x-1 ml-2 ${
                      conversacionActual?.id === conversacion.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    } transition-opacity duration-200`}>
                      {onEditTitle && (
                        <button
                          onClick={(e) => handleEditClick(e, conversacion.id, conversacion.titulo || 'Sin título')}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors duration-200"
                          title="Editar título"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      {onDeleteConversation && (
                        <button
                          onClick={(e) => handleDeleteClick(e, conversacion.id, conversacion.titulo || 'Sin título')}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors duration-200"
                          title="Eliminar conversación"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationDropdown;