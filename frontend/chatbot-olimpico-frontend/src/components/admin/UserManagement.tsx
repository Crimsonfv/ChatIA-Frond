// src/components/admin/UserManagement.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { SectionLoading } from '../common/Loading';
import { ConfirmModal, FormModal } from '../common/Modal';
import type { AdminUser, AdminUserUpdate } from '../../types';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [mostrarSoloActivos, setMostrarSoloActivos] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [hardDelete, setHardDelete] = useState(false);
  const [formData, setFormData] = useState<AdminUserUpdate>({
    username: '',
    email: '',
    rol: 'user',
    activo: true
  });
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<string[]>([]);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const usuariosData = await adminService.obtenerUsuarios();
      setUsers(usuariosData);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const usuariosFiltrados = users.filter(user => {
    const coincideFiltro = !filtro || 
      user.username.toLowerCase().includes(filtro.toLowerCase()) ||
      user.email.toLowerCase().includes(filtro.toLowerCase());
    
    const coincideEstado = !mostrarSoloActivos || user.activo;
    
    return coincideFiltro && coincideEstado;
  });

  const handleEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      rol: user.rol,
      activo: user.activo
    });
    setShowEditModal(true);
  };

  const handleDelete = (user: AdminUser) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleActivate = async (user: AdminUser) => {
    try {
      await adminService.activarUsuario(user.id);
      await cargarUsuarios();
      toast.success(`Usuario "${user.username}" activado exitosamente`);
    } catch (error) {
      console.error('Error al activar usuario:', error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {detail?: string}}}).response?.data?.detail || 'Error al activar usuario'
        : 'Error al activar usuario';
      toast.error(`Error al activar usuario: ${errorMessage}`);
    }
  };

  const handleDeactivateClick = (user: AdminUser) => {
    setSelectedUser(user);
    setShowDeactivateModal(true);
  };

  const handleDeactivate = async () => {
    if (!selectedUser) return;
    
    try {
      await adminService.desactivarUsuario(selectedUser.id);
      await cargarUsuarios();
      toast.success(`Usuario "${selectedUser.username}" desactivado exitosamente`);
      setShowDeactivateModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error al desactivar usuario:', error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {detail?: string}}}).response?.data?.detail || 'Error al desactivar usuario'
        : 'Error al desactivar usuario';
      toast.error(`Error al desactivar usuario: ${errorMessage}`);
    }
  };

  const confirmarEditar = async () => {
    if (!selectedUser) return;

    try {
      setGuardando(true);
      setErrores([]);

      await adminService.actualizarUsuario(selectedUser.id, formData);
      await cargarUsuarios();
      
      setShowEditModal(false);
      setSelectedUser(null);
      
    } catch (error: unknown) {
      console.error('Error al actualizar usuario:', error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {detail?: string}}}).response?.data?.detail || 'Error al actualizar usuario'
        : 'Error al actualizar usuario';
      setErrores([errorMessage]);
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!selectedUser) return;

    try {
      await adminService.eliminarUsuario(selectedUser.id, hardDelete);
      await cargarUsuarios();
      setShowDeleteModal(false);
      setSelectedUser(null);
      setHardDelete(false);
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    if (errores.length > 0) {
      setErrores([]);
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

  if (loading) {
    return <SectionLoading text="Cargando usuarios..." />;
  }

  return (
    <div>
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Usuarios</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
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
              <p className="text-sm font-medium text-gray-500">Usuarios Activos</p>
              <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.activo).length}</p>
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
              <p className="text-sm font-medium text-gray-500">Administradores</p>
              <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.rol === 'admin').length}</p>
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
              <p className="text-sm font-medium text-gray-500">Usuarios Inactivos</p>
              <p className="text-2xl font-bold text-gray-900">{users.filter(u => !u.activo).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1 max-w-lg">
              <input
                type="text"
                placeholder="Buscar usuarios por username o email..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={mostrarSoloActivos}
                  onChange={(e) => setMostrarSoloActivos(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Solo usuarios activos</span>
              </label>
            </div>
          </div>
        </div>

        {/* Lista de Usuarios */}
        <div className="divide-y divide-gray-200">
          {usuariosFiltrados.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No se encontraron usuarios</p>
            </div>
          ) : (
            usuariosFiltrados.map((user) => (
              <div key={user.id} className={`p-6 hover:bg-gray-50 ${!user.activo ? 'bg-gray-50 border-l-4 border-gray-400' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className={`text-lg font-medium ${user.activo ? 'text-gray-900' : 'text-gray-500'}`}>
                        {user.username}
                        {!user.activo && ' (Inactivo)'}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.rol === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.rol === 'admin' ? 'Administrador' : 'Usuario'}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.activo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-1">
                      {user.email}
                    </p>
                    
                    <p className="text-xs text-gray-500">
                      Registrado: {formatearFecha(user.fecha_registro)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(user)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200 transition-colors"
                    >
                      Editar
                    </button>
                    
                    <button
                      onClick={() => {
                        if (user.activo) {
                          if (currentUser?.id === user.id) {
                            toast.error('No puedes desactivar tu propia cuenta');
                            return;
                          }
                          handleDeactivateClick(user);
                        } else {
                          handleActivate(user);
                        }
                      }}
                      disabled={user.activo && currentUser?.id === user.id}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        user.activo && currentUser?.id === user.id
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : user.activo
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {user.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    
                    <button
                      onClick={() => handleDelete(user)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Editar Usuario */}
      <FormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Usuario"
        onSubmit={confirmarEditar}
        submitText="Guardar"
        submitDisabled={guardando}
      >
        <div className="space-y-6">
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

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={guardando}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={guardando}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          {/* Rol */}
          <div>
            <label htmlFor="rol" className="block text-sm font-medium text-gray-700 mb-1">
              Rol
            </label>
            <select
              id="rol"
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              disabled={guardando}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {/* Activo */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="activo"
              name="activo"
              checked={formData.activo}
              onChange={handleChange}
              disabled={guardando}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="activo" className="ml-2 text-sm text-gray-700">
              Usuario activo
            </label>
          </div>
        </div>
      </FormModal>

      {/* Modal Confirmar Eliminación */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setHardDelete(false);
        }}
        onConfirm={confirmarEliminar}
        title="Eliminar Usuario"
        message={
          hardDelete 
            ? `¿Estás seguro de que quieres ELIMINAR PERMANENTEMENTE al usuario "${selectedUser?.username}"? Esta acción eliminará para siempre la cuenta del usuario y TODAS sus conversaciones y mensajes. Esta acción NO SE PUEDE DESHACER.`
            : `¿Estás seguro de que quieres desactivar al usuario "${selectedUser?.username}"? Esta acción desactivará la cuenta del usuario pero mantendrá sus datos.`
        }
        confirmText={hardDelete ? "Eliminar Permanentemente" : "Desactivar"}
        cancelText="Cancelar"
        type="danger"
      >
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="hardDelete"
              checked={hardDelete}
              onChange={(e) => setHardDelete(e.target.checked)}
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <label htmlFor="hardDelete" className="text-sm text-gray-700">
              <strong>Eliminación permanente:</strong> Eliminar todas las conversaciones y mensajes del usuario (no se puede deshacer)
            </label>
          </div>
        </div>
      </ConfirmModal>

      {/* Modal Confirmar Desactivación */}
      <ConfirmModal
        isOpen={showDeactivateModal}
        onClose={() => {
          setShowDeactivateModal(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDeactivate}
        title="Desactivar Usuario"
        message={`¿Estás seguro de que quieres desactivar al usuario "${selectedUser?.username}"? Esta acción impedirá que el usuario pueda iniciar sesión, pero mantendrá todos sus datos intactos.`}
        confirmText="Desactivar"
        cancelText="Cancelar"
        type="warning"
      />
    </div>
  );
};

export default UserManagement;