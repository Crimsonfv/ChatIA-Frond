// src/components/common/Loading.tsx
import React from 'react';
import type { LoadingProps } from '../../types';

// ==================== LOADING COMPONENT ====================
const Loading: React.FC<LoadingProps> = ({ 
  size = 'md', 
  text = 'Cargando...' 
}) => {
  // Tamaños del spinner
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  // Tamaños del texto
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      {/* Spinner animado */}
      <div 
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`}
        role="status"
        aria-label="Cargando"
      >
        <span className="sr-only">Cargando...</span>
      </div>
      
      {/* Texto de carga */}
      {text && (
        <p className={`${textSizeClasses[size]} text-gray-600 text-center`}>
          {text}
        </p>
      )}
    </div>
  );
};

// ==================== LOADING VARIANTS ====================

/**
 * Loading de pantalla completa
 */
export const FullScreenLoading: React.FC<{ text?: string }> = ({ 
  text = 'Cargando...' 
}) => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <Loading size="lg" text={text} />
    </div>
  );
};

/**
 * Loading inline para botones
 */
export const ButtonLoading: React.FC = () => {
  return (
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
  );
};

/**
 * Loading para contenido de página
 */
export const PageLoading: React.FC<{ text?: string }> = ({ 
  text = 'Cargando contenido...' 
}) => {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Loading size="lg" text={text} />
    </div>
  );
};

/**
 * Loading para contenido de card/sección
 */
export const SectionLoading: React.FC<{ text?: string }> = ({ 
  text = 'Cargando...' 
}) => {
  return (
    <div className="py-12 flex items-center justify-center">
      <Loading size="md" text={text} />
    </div>
  );
};

/**
 * Loading con skeleton para listas
 */
export const ListLoading: React.FC<{ items?: number }> = ({ 
  items = 3 
}) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="flex space-x-3">
            <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Loading con puntos animados
 */
export const DotsLoading: React.FC<{ text?: string }> = ({ 
  text = 'Escribiendo' 
}) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-gray-600">{text}</span>
      <div className="flex space-x-1">
        <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
};

// ==================== EXPORT DEFAULT ====================
export default Loading;