// src/components/common/SideModal.tsx
import React, { useEffect } from 'react';
import type { ReactNode } from 'react';

// ==================== SIDE MODAL COMPONENT ====================
interface SideModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
}

const SideModal: React.FC<SideModalProps> = ({ 
  isOpen, 
  onClose, 
  title,
  children,
  width = 'lg'
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
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Configuración de anchos
  const widthClasses = {
    sm: 'w-80',  // 20rem
    md: 'w-96',  // 24rem
    lg: 'w-[32rem]', // 32rem
    xl: 'w-[40rem]'  // 40rem
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-25 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Panel lateral */}
      <div className="fixed inset-y-0 right-0 flex max-w-full">
        <div 
          className={`relative ${widthClasses[width]} bg-white shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                aria-label="Cerrar panel"
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== DATA DETAILS SIDE MODAL ====================
interface DataDetailsSideModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sqlQuery?: string;
  data?: any[];
  totalResults?: number;
  loading?: boolean;
}

export const DataDetailsSideModal: React.FC<DataDetailsSideModalProps> = ({
  isOpen,
  onClose,
  title,
  sqlQuery,
  data = [],
  totalResults = 0,
  loading = false
}) => {
  return (
    <SideModal isOpen={isOpen} onClose={onClose} title={title} width="xl">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando detalles...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Estadísticas */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Información de la consulta
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-blue-600 uppercase tracking-wide font-medium">Total de resultados</p>
                <p className="text-2xl font-bold text-blue-900">{totalResults.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600 uppercase tracking-wide font-medium">Mostrando</p>
                <p className="text-2xl font-bold text-blue-900">{data.length}</p>
              </div>
            </div>
          </div>

          {/* SQL Query - OCULTA PARA USUARIOS */}
          {/* La consulta SQL se oculta por seguridad - los usuarios no deben ver las consultas internas */}

          {/* Data Table */}
          {data.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Datos ({data.length} registros)
              </h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {Object.keys(data[0]).map((key) => (
                          <th 
                            key={key}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                          >
                            {key.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          {Object.values(row).map((value, cellIndex) => (
                            <td 
                              key={cellIndex}
                              className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"
                            >
                              {value === null || value === undefined ? (
                                <span className="text-gray-400 italic">null</span>
                              ) : (
                                String(value)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {totalResults > data.length && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  * Mostrando los primeros {data.length} de {totalResults.toLocaleString()} resultados totales
                </p>
              )}
            </div>
          )}

          {/* No data message */}
          {data.length === 0 && !loading && (
            <div className="text-center py-12">
              <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-sm">No hay datos disponibles para mostrar</p>
            </div>
          )}
        </div>
      )}
    </SideModal>
  );
};

export default SideModal;