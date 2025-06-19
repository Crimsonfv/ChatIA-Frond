// src/components/common/Modal.tsx
import React, { useEffect } from 'react';
import type { ReactNode } from 'react';
import type { ModalProps } from '../../types';

// ==================== MODAL COMPONENT ====================
const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title,
  children 
}) => {
  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // No renderizar si el modal no está abierto
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal container */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {title && (
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Cerrar modal"
                >
                  <svg 
                    className="h-6 w-6" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M6 18L18 6M6 6l12 12" 
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-120px)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MODAL VARIANTS ====================

/**
 * Modal de confirmación
 */
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger'
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const typeStyles = {
    danger: {
      iconColor: 'text-red-600',
      confirmButton: 'bg-red-600 hover:bg-red-700 text-white'
    },
    warning: {
      iconColor: 'text-yellow-600',
      confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    info: {
      iconColor: 'text-blue-600',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  };

  const styles = typeStyles[type];

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center">
        {/* Icon */}
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <svg 
            className={`h-6 w-6 ${styles.iconColor}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>

        {/* Content */}
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="flex space-x-3 justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${styles.confirmButton}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

/**
 * Modal para mostrar detalles de datos (Criterio G)
 */
interface DataDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sqlQuery?: string;
  data?: any[];
  totalResults?: number;
  loading?: boolean;
}

export const DataDetailsModal: React.FC<DataDetailsModalProps> = ({
  isOpen,
  onClose,
  title,
  sqlQuery,
  data = [],
  totalResults = 0,
  loading = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando detalles...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Estadísticas */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Información</h4>
            <p className="text-sm text-gray-600">
              Total de resultados: <span className="font-medium">{totalResults}</span>
            </p>
            <p className="text-sm text-gray-600">
              Mostrando: <span className="font-medium">{data.length}</span> registros
            </p>
          </div>

          {/* SQL Query */}
          {sqlQuery && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Consulta SQL</h4>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <code className="text-green-400 text-sm whitespace-pre-wrap">
                  {sqlQuery}
                </code>
              </div>
            </div>
          )}

          {/* Data Table */}
          {data.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Datos</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(data[0]).map((key) => (
                        <th 
                          key={key}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {Object.values(row).map((value, cellIndex) => (
                          <td 
                            key={cellIndex}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                          >
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No data message */}
          {data.length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay datos disponibles para mostrar</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

/**
 * Modal de formulario
 */
interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onSubmit?: () => void;
  submitText?: string;
  cancelText?: string;
  submitDisabled?: boolean;
}

export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitText = 'Guardar',
  cancelText = 'Cancelar',
  submitDisabled = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        {children}
        
        {onSubmit && (
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onSubmit}
              disabled={submitDisabled}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitText}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default Modal;