// src/pages/AdminPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import { ROUTES, PROMPT_CONTEXTS } from '../utils/constants';
import { SectionLoading } from '../components/common/Loading';
import { ConfirmModal, FormModal } from '../components/common/Modal';
import ExcludedTermsManager from '../components/ExcludedTermsManager';
import UserManagement from '../components/admin/UserManagement';
import ConversationViewer from '../components/admin/ConversationViewer';
import type { ConfiguracionPrompt, ConfiguracionPromptCreate } from '../types';

// ==================== ADMIN PAGE COMPONENT ====================
const AdminPage: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  // ==================== ESTADO ====================
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [configSeleccionada, setConfigSeleccionada] = useState<ConfiguracionPrompt | null>(null);
  const [filtro, setFiltro] = useState('');
  const [soloActivas, setSoloActivas] = useState(false);
  const [activeTab, setActiveTab] = useState<'prompts' | 'excluded-terms' | 'users' | 'conversations'>('prompts');

  // Estado del formulario
  const [formData, setFormData] = useState<ConfiguracionPromptCreate>({
    contexto: '',
    prompt_sistema: ''
  });
  const [erroresForm, setErroresForm] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);

  // ==================== EFECTOS ====================
  useEffect(() => {
    // Verificar permisos de admin
    if (!isAdmin) {
      navigate(ROUTES.CHAT);
      return;
    }
    
    cargarConfiguraciones();
  }, [isAdmin, navigate]);

  // ==================== CARGAR CONFIGURACIONES ====================
  const cargarConfiguraciones = async () => {
    try {
      setLoading(true);
      const configs = await adminService.obtenerConfiguracionesPrompt();
      setConfiguraciones(configs);
    } catch (error) {
      console.error('Error al cargar configuraciones:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== FILTRAR CONFIGURACIONES ====================
  const configuracionesFiltradas = configuraciones.filter(config => {
    const coincideFiltro = !filtro || 
      config.contexto.toLowerCase().includes(filtro.toLowerCase()) ||
      config.prompt_sistema.toLowerCase().includes(filtro.toLowerCase());
    
    const coincideEstado = !soloActivas || config.activo;
    
    return coincideFiltro && coincideEstado;
  });

  // ==================== OBTENER ESTADÍSTICAS ====================
  const estadisticas = adminService.contarConfiguracionesPorEstado(configuraciones);

  // ==================== MANEJO DE FORMULARIO ====================
  const limpiarFormulario = () => {
    setFormData({ contexto: '', prompt_sistema: '' });
    setErroresForm([]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores al escribir
    if (erroresForm.length > 0) {
      setErroresForm([]);
    }
  };

  // ==================== CREAR CONFIGURACIÓN ====================
  const handleCrear = () => {
    limpiarFormulario();
    setShowCreateModal(true);
  };

  const confirmarCrear = async () => {
    try {
      setGuardando(true);
      
      // Validar formulario
      const errores = adminService.validarConfiguracionPrompt(formData);
      if (errores.length > 0) {
        setErroresForm(errores);
        return;
      }

      // Verificar que el contexto no exista
      if (adminService.contextoYaExiste(formData.contexto, configuraciones)) {
        setErroresForm(['Ya existe una configuración activa para este contexto']);
        return;
      }

      // Crear configuración
      await adminService.crearConfiguracionPrompt({
        ...formData,
        prompt_sistema: adminService.limpiarPrompt(formData.prompt_sistema)
      });

      // Recargar lista
      await cargarConfiguraciones();
      
      // Cerrar modal
      setShowCreateModal(false);
      limpiarFormulario();
      
    } catch (error) {
      console.error('Error al crear configuración:', error);
      setErroresForm([error instanceof Error ? error.message : 'Error al crear configuración']);
    } finally {
      setGuardando(false);
    }
  };

  // ==================== EDITAR CONFIGURACIÓN ====================
  const handleEditar = (config: ConfiguracionPrompt) => {
    setConfigSeleccionada(config);
    setFormData({
      contexto: config.contexto,
      prompt_sistema: config.prompt_sistema
    });
    setShowEditModal(true);
  };

  const confirmarEditar = async () => {
    if (!configSeleccionada) return;

    try {
      setGuardando(true);
      
      // Validar formulario
      const errores = adminService.validarConfiguracionPrompt(formData);
      if (errores.length > 0) {
        setErroresForm(errores);
        return;
      }

      // Actualizar configuración
      await adminService.actualizarConfiguracionPrompt(configSeleccionada.id, {
        contexto: formData.contexto,
        prompt_sistema: adminService.limpiarPrompt(formData.prompt_sistema)
      });

      // Recargar lista
      await cargarConfiguraciones();
      
      // Cerrar modal
      setShowEditModal(false);
      setConfigSeleccionada(null);
      limpiarFormulario();
      
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      setErroresForm([error instanceof Error ? error.message : 'Error al actualizar configuración']);
    } finally {
      setGuardando(false);
    }
  };

  // ==================== ACTIVAR/DESACTIVAR ====================
  const toggleActivar = async (config: ConfiguracionPrompt) => {
    try {
      if (config.activo) {
        await adminService.desactivarConfiguracionPrompt(config.id);
      } else {
        await adminService.activarConfiguracionPrompt(config.id);
      }
      
      await cargarConfiguraciones();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  // ==================== ELIMINAR CONFIGURACIÓN ====================
  const handleEliminar = (config: ConfiguracionPrompt) => {
    setConfigSeleccionada(config);
    setShowDeleteModal(true);
  };

  const confirmarEliminar = async () => {
    if (!configSeleccionada) return;

    try {
      await adminService.desactivarConfiguracionPrompt(configSeleccionada.id);
      await cargarConfiguraciones();
      setShowDeleteModal(false);
      setConfigSeleccionada(null);
    } catch (error) {
      console.error('Error al eliminar configuración:', error);
    }
  };

  // ==================== GENERAR PROMPT DE EJEMPLO ====================
  const generarEjemplo = () => {
    if (formData.contexto) {
      const ejemplo = adminService.generarPromptEjemplo(formData.contexto);
      setFormData(prev => ({
        ...prev,
        prompt_sistema: ejemplo
      }));
    }
  };

  // ==================== FORMATEAR FECHA ====================
  const formatearFecha = (fecha: string) => {
    return adminService.formatearFechaModificacion(fecha);
  };

  // ==================== RENDER ====================
  if (!isAdmin) {
    return null; // El useEffect ya redirige
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(ROUTES.CHAT)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
                <p className="text-sm text-gray-600">
                  {activeTab === 'prompts' && 'Configuración de prompts por contexto'}
                  {activeTab === 'excluded-terms' && 'Gestión de términos excluidos'}
                  {activeTab === 'users' && 'Gestión de usuarios del sistema'}
                  {activeTab === 'conversations' && 'Visualización de conversaciones de usuarios'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Administrador: {user?.username}
              </span>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('prompts')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'prompts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Configuración de Prompts
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Gestión de Usuarios
              </button>
              <button
                onClick={() => setActiveTab('conversations')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'conversations'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Conversaciones
              </button>
              <button
                onClick={() => setActiveTab('excluded-terms')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'excluded-terms'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Términos Excluidos
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'prompts' ? (
          loading ? (
            <SectionLoading text="Cargando configuraciones..." />
          ) : (
            <>
            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                    <p className="text-sm font-medium text-gray-500">Configuraciones Activas</p>
                    <p className="text-2xl font-bold text-gray-900">{estadisticas.activas}</p>
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
                    <p className="text-sm font-medium text-gray-500">Configuraciones Inactivas</p>
                    <p className="text-2xl font-bold text-gray-900">{estadisticas.inactivas}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{estadisticas.total}</p>
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
                      placeholder="Buscar configuraciones..."
                      value={filtro}
                      onChange={(e) => setFiltro(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={soloActivas}
                        onChange={(e) => setSoloActivas(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Solo activas</span>
                    </label>
                    
                    <button
                      onClick={handleCrear}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Nueva Configuración
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de Configuraciones */}
              <div className="divide-y divide-gray-200">
                {configuracionesFiltradas.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <p>No se encontraron configuraciones</p>
                  </div>
                ) : (
                  configuracionesFiltradas.map((config) => (
                    <div key={config.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {config.contexto}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              config.activo 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {config.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2 line-clamp-3">
                            {config.prompt_sistema}
                          </p>
                          
                          <p className="text-xs text-gray-500">
                            Modificado: {formatearFecha(config.fecha_modificacion)}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => toggleActivar(config)}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              config.activo
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {config.activo ? 'Desactivar' : 'Activar'}
                          </button>
                          
                          <button
                            onClick={() => handleEditar(config)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200 transition-colors"
                          >
                            Editar
                          </button>
                          
                          <button
                            onClick={() => handleEliminar(config)}
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
          </>
          )
        ) : activeTab === 'users' ? (
          <UserManagement />
        ) : activeTab === 'conversations' ? (
          <ConversationViewer />
        ) : (
          <ExcludedTermsManager />
        )}
      </div>

      {/* Modal Crear Configuración */}
      <FormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nueva Configuración de Prompt"
        onSubmit={confirmarCrear}
        submitText="Crear"
        submitDisabled={guardando}
      >
        <FormularioConfiguracion
          formData={formData}
          errores={erroresForm}
          onChange={handleChange}
          onGenerarEjemplo={generarEjemplo}
          guardando={guardando}
        />
      </FormModal>

      {/* Modal Editar Configuración */}
      <FormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Configuración de Prompt"
        onSubmit={confirmarEditar}
        submitText="Guardar"
        submitDisabled={guardando}
      >
        <FormularioConfiguracion
          formData={formData}
          errores={erroresForm}
          onChange={handleChange}
          onGenerarEjemplo={generarEjemplo}
          guardando={guardando}
          editando={true}
        />
      </FormModal>

      {/* Modal Confirmar Eliminación */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmarEliminar}
        title="Eliminar Configuración"
        message={`¿Estás seguro de que quieres eliminar la configuración "${configSeleccionada?.contexto}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

// ==================== COMPONENTE FORMULARIO ====================
interface FormularioConfiguracionProps {
  formData: ConfiguracionPromptCreate;
  errores: string[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onGenerarEjemplo: () => void;
  guardando: boolean;
  editando?: boolean;
}

const FormularioConfiguracion: React.FC<FormularioConfiguracionProps> = ({
  formData,
  errores,
  onChange,
  onGenerarEjemplo,
  guardando,
  editando = false
}) => {
  return (
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

      {/* Contexto */}
      <div>
        <label htmlFor="contexto" className="block text-sm font-medium text-gray-700 mb-1">
          Contexto
        </label>
        {editando ? (
          <input
            type="text"
            id="contexto"
            name="contexto"
            value={formData.contexto}
            onChange={onChange}
            disabled={guardando}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        ) : (
          <select
            id="contexto"
            name="contexto"
            value={formData.contexto}
            onChange={onChange}
            disabled={guardando}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecciona un contexto</option>
            {PROMPT_CONTEXTS.map((context) => (
              <option key={context.value} value={context.value}>
                {context.label}
              </option>
            ))}
          </select>
        )}
        <p className="mt-1 text-xs text-gray-500">
          El contexto define el área especializada del prompt
        </p>
      </div>

      {/* Prompt Sistema */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="prompt_sistema" className="block text-sm font-medium text-gray-700">
            Prompt del Sistema
          </label>
          {!editando && formData.contexto && (
            <button
              type="button"
              onClick={onGenerarEjemplo}
              disabled={guardando}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              Generar ejemplo
            </button>
          )}
        </div>
        <textarea
          id="prompt_sistema"
          name="prompt_sistema"
          value={formData.prompt_sistema}
          onChange={onChange}
          disabled={guardando}
          rows={8}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          placeholder="Ingresa el prompt del sistema para este contexto..."
        />
        <p className="mt-1 text-xs text-gray-500">
          Define el comportamiento del asistente para este contexto específico
        </p>
      </div>
    </div>
  );
};

export default AdminPage;