// src/components/ExcludedTermsManager.tsx
import React, { useState, useEffect } from 'react';
import { filterService } from '../services/filterService';
import { SectionLoading } from './common/Loading';
import { ConfirmModal } from './common/Modal';
import type { TerminoExcluido } from '../types';

interface ExcludedTermsManagerProps {
  className?: string;
}

const ExcludedTermsManager: React.FC<ExcludedTermsManagerProps> = ({ className = '' }) => {
  // ==================== ESTADO ====================
  const [terminos, setTerminos] = useState<TerminoExcluido[]>([]);
  const [loading, setLoading] = useState(true);
  const [agregando, setAgregando] = useState(false);
  const [nuevoTermino, setNuevoTermino] = useState('');
  const [filtro, setFiltro] = useState('');
  const [errores, setErrores] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [terminoAEliminar, setTerminoAEliminar] = useState<TerminoExcluido | null>(null);

  // ==================== EFECTOS ====================
  useEffect(() => {
    cargarTerminos();
  }, []);

  // ==================== CARGAR TÉRMINOS ====================
  const cargarTerminos = async () => {
    try {
      setLoading(true);
      const terminosObtenidos = await filterService.obtenerTerminosExcluidos();
      setTerminos(terminosObtenidos);
    } catch (error) {
      console.error('Error al cargar términos excluidos:', error);
      setErrores(['Error al cargar los términos excluidos']);
    } finally {
      setLoading(false);
    }
  };

  // ==================== FILTRAR TÉRMINOS ====================
  const terminosFiltrados = filterService.buscarTerminos(
    filterService.obtenerTerminosActivos(terminos), 
    filtro
  );

  // ==================== AGREGAR TÉRMINO ====================
  const handleAgregarTermino = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nuevoTermino.trim()) return;

    try {
      setAgregando(true);
      setErrores([]);

      // Validar término
      const erroresValidacion = filterService.validarTermino(nuevoTermino);
      if (erroresValidacion.length > 0) {
        setErrores(erroresValidacion);
        return;
      }

      // Verificar si ya existe
      if (filterService.terminoYaExiste(nuevoTermino, terminos)) {
        setErrores(['Este término ya existe en tu lista']);
        return;
      }

      // Agregar término
      const terminoLimpio = filterService.limpiarTermino(nuevoTermino);
      await filterService.agregarTerminoExcluido({ termino: terminoLimpio });
      
      // Recargar lista y limpiar formulario
      await cargarTerminos();
      setNuevoTermino('');
      
    } catch (error) {
      console.error('Error al agregar término:', error);
      setErrores([error instanceof Error ? error.message : 'Error al agregar término']);
    } finally {
      setAgregando(false);
    }
  };

  // ==================== ELIMINAR TÉRMINO ====================
  const handleEliminar = (termino: TerminoExcluido) => {
    setTerminoAEliminar(termino);
    setShowDeleteModal(true);
  };

  const confirmarEliminar = async () => {
    if (!terminoAEliminar) return;

    try {
      await filterService.eliminarTerminoExcluido(terminoAEliminar.id);
      await cargarTerminos();
      setShowDeleteModal(false);
      setTerminoAEliminar(null);
    } catch (error) {
      console.error('Error al eliminar término:', error);
      setErrores([error instanceof Error ? error.message : 'Error al eliminar término']);
    }
  };

  // ==================== LIMPIAR ERRORES ====================
  const limpiarErrores = () => {
    if (errores.length > 0) {
      setErrores([]);
    }
  };

  // ==================== ESTADÍSTICAS ====================
  const estadisticas = {
    total: filterService.contarTerminosActivos(terminos),
    mostrados: terminosFiltrados.length
  };

  // ==================== RENDER ====================
  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Términos Excluidos</h3>
            <p className="text-sm text-gray-600">
              Términos que serán filtrados de las consultas y resultados
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {estadisticas.total} términos activos
          </div>
        </div>
      </div>

      {/* Formulario para agregar término */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <form onSubmit={handleAgregarTermino} className="space-y-4">
          {/* Errores */}
          {errores.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <div className="text-sm text-red-800">
                    <ul className="list-disc list-inside space-y-1">
                      {errores.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <div className="flex-1">
              <input
                type="text"
                value={nuevoTermino}
                onChange={(e) => {
                  setNuevoTermino(e.target.value);
                  limpiarErrores();
                }}
                placeholder="Ingresa un término a excluir (ej: brazil, argentina, etc.)"
                disabled={agregando}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500">
                Entre 2-100 caracteres, sin símbolos especiales
              </p>
            </div>
            <button
              type="submit"
              disabled={agregando || !nuevoTermino.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {agregando ? 'Agregando...' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>

      {/* Filtro de búsqueda */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar términos..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {filtro && (
            <div className="text-sm text-gray-500">
              {estadisticas.mostrados} de {estadisticas.total}
            </div>
          )}
        </div>
      </div>

      {/* Lista de términos */}
      <div className="px-6 py-4">
        {loading ? (
          <SectionLoading text="Cargando términos..." />
        ) : (
          <div className="space-y-2">
            {terminosFiltrados.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {estadisticas.total === 0 ? (
                  <div>
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="mt-2">No hay términos excluidos configurados</p>
                    <p className="text-sm text-gray-400">Agrega términos que quieres filtrar de las respuestas</p>
                  </div>
                ) : (
                  <p>No se encontraron términos que coincidan con "{filtro}"</p>
                )}
              </div>
            ) : (
              terminosFiltrados.map((termino) => (
                <div
                  key={termino.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-900">{termino.termino}</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Activo
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Agregado: {filterService.formatearFechaCreacion(termino.fecha_creacion)}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleEliminar(termino)}
                    className="ml-4 px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmarEliminar}
        title="Eliminar Término Excluido"
        message={`¿Estás seguro de que quieres eliminar el término "${terminoAEliminar?.termino}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default ExcludedTermsManager;