// src/components/admin/AdminExcludedTerms.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { SectionLoading } from '../common/Loading';
import { ConfirmModal } from '../common/Modal';
import type { AdminExcludedTerm, AdminUser } from '../../types';

const AdminExcludedTerms: React.FC = () => {
  const [terms, setTerms] = useState<AdminExcludedTerm[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<AdminExcludedTerm | null>(null);

  useEffect(() => {
    cargarDatos();
  }, [selectedUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar usuarios para el filtro
      const usuariosData = await adminService.obtenerUsuarios();
      setUsers(usuariosData);
      
      // Cargar términos excluidos
      const termsData = await adminService.obtenerTodosTerminosExcluidos(
        selectedUserId || undefined
      );
      setTerms(termsData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const terminosFiltrados = terms.filter(term => 
    !filtro || 
    term.termino.toLowerCase().includes(filtro.toLowerCase()) ||
    term.usuario.username.toLowerCase().includes(filtro.toLowerCase()) ||
    term.usuario.email.toLowerCase().includes(filtro.toLowerCase())
  );

  const handleDeactivate = (term: AdminExcludedTerm) => {
    setSelectedTerm(term);
    setShowDeactivateModal(true);
  };

  const handleActivate = async (term: AdminExcludedTerm) => {
    try {
      await adminService.activarTerminoExcluidoAdmin(term.id);
      await cargarDatos(); // Recargar datos para actualizar estadísticas
    } catch (error) {
      console.error('Error al reactivar término:', error);
    }
  };

  const handleDelete = (term: AdminExcludedTerm) => {
    setSelectedTerm(term);
    setShowDeleteModal(true);
  };

  const confirmarDesactivar = async () => {
    if (!selectedTerm) return;

    try {
      await adminService.desactivarTerminoExcluidoAdmin(selectedTerm.id);
      await cargarDatos(); // Recargar datos para actualizar estadísticas
      setShowDeactivateModal(false);
      setSelectedTerm(null);
    } catch (error) {
      console.error('Error al desactivar término:', error);
    }
  };

  const confirmarEliminar = async () => {
    if (!selectedTerm) return;

    try {
      await adminService.eliminarTerminoExcluidoAdmin(selectedTerm.id);
      await cargarDatos(); // Recargar datos para actualizar estadísticas
      setShowDeleteModal(false);
      setSelectedTerm(null);
    } catch (error) {
      console.error('Error al eliminar término:', error);
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

  // Estadísticas
  const estadisticas = {
    totalTerminos: terms.length,
    terminosActivos: terms.filter(t => t.activo).length,
    terminosInactivos: terms.filter(t => !t.activo).length,
    usuariosConTerminos: new Set(terms.map(t => t.usuario.id)).size,
    terminosPorUsuario: terms.reduce((acc, term) => {
      const userId = term.usuario.id;
      acc[userId] = (acc[userId] || 0) + 1;
      return acc;
    }, {} as Record<number, number>)
  };

  if (loading) {
    return <SectionLoading text="Cargando términos excluidos..." />;
  }

  return (
    <div className="space-y-8">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Términos Excluidos</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.totalTerminos}</p>
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
              <p className="text-sm font-medium text-gray-500">Términos Activos</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.terminosActivos}</p>
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
              <p className="text-sm font-medium text-gray-500">Términos Inactivos</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.terminosInactivos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Usuarios con Términos</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.usuariosConTerminos}</p>
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
                placeholder="Buscar por término, usuario o email..."
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

        {/* Lista de términos excluidos */}
        <div className="divide-y divide-gray-200">
          {terminosFiltrados.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p>No se encontraron términos excluidos</p>
            </div>
          ) : (
            terminosFiltrados.map((term) => (
              <div key={term.id} className={`p-6 hover:bg-gray-50 ${!term.activo ? 'bg-gray-50 border-l-4 border-gray-400' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`text-lg font-medium px-3 py-1 rounded-full border ${
                        term.activo 
                          ? 'text-gray-900 bg-red-50 border-red-200' 
                          : 'text-gray-500 bg-gray-100 border-gray-300'
                      }`}>
                        {term.termino}
                        {!term.activo && ' (Inactivo)'}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        term.activo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {term.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-600 mb-2">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{term.usuario.username}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        <span>{term.usuario.email}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-xs text-gray-500">
                      <span>Creado: {formatearFecha(term.fecha_creacion)}</span>
                      <span>Usuario ID: {term.usuario.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {term.activo ? (
                      <button
                        onClick={() => handleDeactivate(term)}
                        className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm font-medium hover:bg-yellow-200 transition-colors flex items-center space-x-1"
                        title="Desactivar término excluido (soft delete)"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 12M6 6l12 12" />
                        </svg>
                        <span>Desactivar</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivate(term)}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium hover:bg-green-200 transition-colors flex items-center space-x-1"
                        title="Reactivar término excluido"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Reactivar</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(term)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200 transition-colors flex items-center space-x-1"
                      title="Eliminar término excluido permanentemente (hard delete)"
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

      {/* Modal de confirmación de desactivación */}
      <ConfirmModal
        isOpen={showDeactivateModal}
        onClose={() => {
          setShowDeactivateModal(false);
          setSelectedTerm(null);
        }}
        onConfirm={confirmarDesactivar}
        title="Desactivar Término Excluido"
        message={
          selectedTerm 
            ? `¿Estás seguro de que quieres desactivar el término "${selectedTerm.termino}" del usuario ${selectedTerm.usuario.username}? Esta acción marcará el término como inactivo pero mantendrá el registro en la base de datos.`
            : ''
        }
        confirmText="Desactivar"
        cancelText="Cancelar"
        type="warning"
      />

      {/* Modal de confirmación de eliminación */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedTerm(null);
        }}
        onConfirm={confirmarEliminar}
        title="Eliminar Término Excluido Permanentemente"
        message={
          selectedTerm 
            ? `¿Estás seguro de que quieres ELIMINAR PERMANENTEMENTE el término "${selectedTerm.termino}" del usuario ${selectedTerm.usuario.username}? Esta acción eliminará completamente el registro de la base de datos y NO SE PUEDE DESHACER.`
            : ''
        }
        confirmText="Eliminar Permanentemente"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default AdminExcludedTerms;