// src/services/adminService.ts
import { apiClient } from './api';
import { ENDPOINTS, PROMPT_CONTEXTS } from '../utils/constants';
import type { 
  ConfiguracionPrompt,
  ConfiguracionPromptCreate,
  ConfiguracionPromptUpdate,
  AdminUser,
  AdminUserUpdate,
  AdminConversation,
  AdminConversationDetail,
  AdminExcludedTerm,
  SuccessResponse
} from '../types';

class AdminService {

  // ==================== GESTIÓN DE USUARIOS (Admin) ====================

  /**
   * Obtener todos los usuarios (solo admin)
   */
  async obtenerUsuarios(): Promise<AdminUser[]> {
    try {
      const response = await apiClient.get<AdminUser[]>(
        ENDPOINTS.ADMIN.USERS
      );
      
      return response;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  }

  /**
   * Obtener usuario específico (solo admin)
   */
  async obtenerUsuario(userId: number): Promise<AdminUser> {
    try {
      const response = await apiClient.get<AdminUser>(
        ENDPOINTS.ADMIN.USER_BY_ID(userId)
      );
      
      return response;
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      throw error;
    }
  }

  /**
   * Actualizar usuario (solo admin)
   */
  async actualizarUsuario(userId: number, userData: AdminUserUpdate): Promise<AdminUser> {
    try {
      const response = await apiClient.put<AdminUser>(
        ENDPOINTS.ADMIN.USER_BY_ID(userId),
        userData
      );
      
      return response;
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw error;
    }
  }

  /**
   * Eliminar usuario (solo admin)
   */
  async eliminarUsuario(userId: number): Promise<SuccessResponse> {
    try {
      const response = await apiClient.delete<SuccessResponse>(
        ENDPOINTS.ADMIN.USER_BY_ID(userId)
      );
      
      return response;
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      throw error;
    }
  }

  // ==================== GESTIÓN DE CONVERSACIONES (Admin) ====================

  /**
   * Obtener todas las conversaciones (solo admin)
   */
  async obtenerTodasConversaciones(userId?: number): Promise<AdminConversation[]> {
    try {
      const params = userId ? `?user_id=${userId}` : '';
      const response = await apiClient.get<AdminConversation[]>(
        `${ENDPOINTS.ADMIN.CONVERSATIONS}${params}`
      );
      
      return response;
    } catch (error) {
      console.error('Error al obtener conversaciones:', error);
      throw error;
    }
  }

  /**
   * Obtener conversación específica con mensajes (solo admin)
   */
  async obtenerConversacionAdmin(conversationId: number): Promise<AdminConversationDetail> {
    try {
      const response = await apiClient.get<AdminConversationDetail>(
        ENDPOINTS.ADMIN.CONVERSATION_BY_ID(conversationId)
      );
      
      return response;
    } catch (error) {
      console.error('Error al obtener conversación:', error);
      throw error;
    }
  }

  // ==================== GESTIÓN DE TÉRMINOS EXCLUIDOS (Admin) ====================

  /**
   * Obtener todos los términos excluidos (solo admin)
   */
  async obtenerTodosTerminosExcluidos(userId?: number): Promise<AdminExcludedTerm[]> {
    try {
      const params = userId ? `?user_id=${userId}` : '';
      const response = await apiClient.get<AdminExcludedTerm[]>(
        `${ENDPOINTS.ADMIN.EXCLUDED_TERMS}${params}`
      );
      
      return response;
    } catch (error) {
      console.error('Error al obtener términos excluidos:', error);
      throw error;
    }
  }

  /**
   * Eliminar término excluido como admin
   */
  async eliminarTerminoExcluidoAdmin(termId: number): Promise<SuccessResponse> {
    try {
      const response = await apiClient.delete<SuccessResponse>(
        ENDPOINTS.ADMIN.EXCLUDED_TERM_BY_ID(termId)
      );
      
      return response;
    } catch (error) {
      console.error('Error al eliminar término excluido:', error);
      throw error;
    }
  }

  // ==================== GESTIÓN DE CONFIGURACIONES DE PROMPT (Criterio F) ====================

  /**
   * Obtener todas las configuraciones de prompt (solo admin)
   */
  async obtenerConfiguracionesPrompt(): Promise<ConfiguracionPrompt[]> {
    try {
      const response = await apiClient.get<ConfiguracionPrompt[]>(
        ENDPOINTS.ADMIN.PROMPTS
      );
      
      return response;
    } catch (error) {
      console.error('Error al obtener configuraciones de prompt:', error);
      throw error;
    }
  }

  /**
   * Crear nueva configuración de prompt (solo admin)
   */
  async crearConfiguracionPrompt(config: ConfiguracionPromptCreate): Promise<ConfiguracionPrompt> {
    try {
      const response = await apiClient.post<ConfiguracionPrompt>(
        ENDPOINTS.ADMIN.PROMPTS,
        config
      );
      
      return response;
    } catch (error) {
      console.error('Error al crear configuración de prompt:', error);
      throw error;
    }
  }

  /**
   * Actualizar configuración de prompt existente (solo admin)
   */
  async actualizarConfiguracionPrompt(
    configId: number, 
    configUpdate: ConfiguracionPromptUpdate
  ): Promise<ConfiguracionPrompt> {
    try {
      const response = await apiClient.put<ConfiguracionPrompt>(
        ENDPOINTS.ADMIN.PROMPT_BY_ID(configId),
        configUpdate
      );
      
      return response;
    } catch (error) {
      console.error('Error al actualizar configuración de prompt:', error);
      throw error;
    }
  }

  /**
   * Desactivar configuración de prompt (soft delete)
   */
  async desactivarConfiguracionPrompt(configId: number): Promise<ConfiguracionPrompt> {
    try {
      const response = await this.actualizarConfiguracionPrompt(configId, {
        activo: false
      });
      
      return response;
    } catch (error) {
      console.error('Error al desactivar configuración de prompt:', error);
      throw error;
    }
  }

  /**
   * Activar configuración de prompt
   */
  async activarConfiguracionPrompt(configId: number): Promise<ConfiguracionPrompt> {
    try {
      const response = await this.actualizarConfiguracionPrompt(configId, {
        activo: true
      });
      
      return response;
    } catch (error) {
      console.error('Error al activar configuración de prompt:', error);
      throw error;
    }
  }

  // ==================== HELPERS Y VALIDACIONES ====================

  /**
   * Validar configuración de prompt antes de crear/actualizar
   */
  validarConfiguracionPrompt(config: ConfiguracionPromptCreate | ConfiguracionPromptUpdate): string[] {
    const errores: string[] = [];

    // Validar contexto
    if ('contexto' in config && config.contexto !== undefined) {
      if (!config.contexto?.trim()) {
        errores.push('El contexto es requerido');
      } else if (config.contexto.length > 100) {
        errores.push('El contexto no puede exceder 100 caracteres');
      }
    }

    // Validar prompt_sistema
    if ('prompt_sistema' in config && config.prompt_sistema !== undefined) {
      if (!config.prompt_sistema?.trim()) {
        errores.push('El prompt del sistema es requerido');
      } else if (config.prompt_sistema.length < 10) {
        errores.push('El prompt del sistema debe tener al menos 10 caracteres');
      } else if (config.prompt_sistema.length > 5000) {
        errores.push('El prompt del sistema no puede exceder 5000 caracteres');
      }
    }

    return errores;
  }

  /**
   * Verificar si un contexto ya existe
   */
  contextoYaExiste(contexto: string, configuraciones: ConfiguracionPrompt[]): boolean {
    const contextoLimpio = contexto.trim().toLowerCase();
    
    return configuraciones.some(config => 
      config.activo && config.contexto.toLowerCase() === contextoLimpio
    );
  }

  /**
   * Obtener configuraciones activas solamente
   */
  obtenerConfiguracionesActivas(configuraciones: ConfiguracionPrompt[]): ConfiguracionPrompt[] {
    return configuraciones.filter(config => config.activo);
  }

  /**
   * Obtener configuración por contexto
   */
  obtenerConfiguracionPorContexto(
    contexto: string, 
    configuraciones: ConfiguracionPrompt[]
  ): ConfiguracionPrompt | undefined {
    return configuraciones.find(config => 
      config.activo && config.contexto.toLowerCase() === contexto.toLowerCase()
    );
  }

  /**
   * Formatear fecha de modificación para mostrar en UI
   */
  formatearFechaModificacion(fechaModificacion: string): string {
    const fecha = new Date(fechaModificacion);
    return fecha.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Contar configuraciones por estado
   */
  contarConfiguracionesPorEstado(configuraciones: ConfiguracionPrompt[]): {
    activas: number;
    inactivas: number;
    total: number;
  } {
    const activas = configuraciones.filter(c => c.activo).length;
    const inactivas = configuraciones.filter(c => !c.activo).length;
    
    return {
      activas,
      inactivas,
      total: configuraciones.length
    };
  }

  /**
   * Obtener lista de contextos disponibles
   */
  obtenerContextosDisponibles(): { value: string; label: string }[] {
    return [...PROMPT_CONTEXTS];
  }

  /**
   * Obtener contextos no utilizados
   */
  obtenerContextosNoUtilizados(configuraciones: ConfiguracionPrompt[]): { value: string; label: string }[] {
    const contextosUsados = this.obtenerConfiguracionesActivas(configuraciones)
      .map(c => c.contexto.toLowerCase());
    
    return this.obtenerContextosDisponibles().filter(contexto => 
      !contextosUsados.includes(contexto.value.toLowerCase())
    );
  }

  /**
   * Buscar configuraciones por texto
   */
  buscarConfiguraciones(
    configuraciones: ConfiguracionPrompt[], 
    filtro: string
  ): ConfiguracionPrompt[] {
    if (!filtro.trim()) {
      return configuraciones;
    }

    const filtroLimpio = filtro.toLowerCase().trim();
    
    return configuraciones.filter(config => 
      config.contexto.toLowerCase().includes(filtroLimpio) ||
      config.prompt_sistema.toLowerCase().includes(filtroLimpio)
    );
  }

  /**
   * Limpiar y formatear prompt antes de guardar
   */
  limpiarPrompt(prompt: string): string {
    return prompt
      .trim()
      .replace(/\n{3,}/g, '\n\n') // Reemplazar múltiples saltos de línea
      .replace(/[ \t]+$/gm, ''); // Eliminar espacios al final de líneas
  }

  /**
   * Generar prompt de ejemplo para un contexto
   */
  generarPromptEjemplo(contexto: string): string {
    const ejemplos: Record<string, string> = {
      deportivo: `Eres un asistente especializado en análisis deportivo olímpico. 
Proporciona respuestas precisas sobre deportes, disciplinas y competencias olímpicas.
Enfócate en datos técnicos y estadísticas deportivas.`,
      
      paises: `Eres un asistente especializado en análisis geográfico y por países en los Juegos Olímpicos.
Proporciona información detallada sobre la participación de países, medalleros nacionales y representación geográfica.
Incluye contexto histórico y comparaciones entre naciones.`,
      
      atletas: `Eres un asistente especializado en análisis de atletas olímpicos.
Proporciona información biografica, logros deportivos y trayectorias de atletas.
Enfócate en historias humanas y logros deportivos individuales.`,
      
      medallero: `Eres un asistente especializado en análisis de medalleros olímpicos.
Proporciona estadísticas detalladas sobre distribución de medallas, rankings y comparaciones.
Incluye análisis cuantitativos y tendencias históricas.`,
      
      general: `Eres un asistente experto en datos olímpicos con amplio conocimiento general.
Proporciona respuestas equilibradas que combinen información deportiva, histórica y estadística.
Adapta tu respuesta al contexto específico de la consulta.`
    };

    return ejemplos[contexto.toLowerCase()] || ejemplos.general;
  }

  /**
   * Exportar configuraciones a formato texto
   */
  exportarConfiguracionesATexto(configuraciones: ConfiguracionPrompt[]): string {
    if (configuraciones.length === 0) {
      return 'No hay configuraciones de prompt disponibles.';
    }

    const lineas = [
      'Configuraciones de Prompt - Chatbot Olímpico',
      '============================================',
      `Total de configuraciones: ${configuraciones.length}`,
      `Exportado el: ${new Date().toLocaleString('es-ES')}`,
      ''
    ];

    configuraciones.forEach((config, index) => {
      lineas.push(
        `${index + 1}. CONTEXTO: ${config.contexto}`,
        `   Estado: ${config.activo ? 'Activo' : 'Inactivo'}`,
        `   Modificado: ${this.formatearFechaModificacion(config.fecha_modificacion)}`,
        `   Prompt:`,
        `   ${config.prompt_sistema.replace(/\n/g, '\n   ')}`,
        ''
      );
    });

    return lineas.join('\n');
  }
}

// ==================== INSTANCIA SINGLETON ====================
export const adminService = new AdminService();

// ==================== HELPERS PARA DEBUGGING ====================
export const debugAdmin = {
  obtenerConfiguraciones: () => adminService.obtenerConfiguracionesPrompt(),
  crearConfiguracion: (contexto: string, prompt: string) => 
    adminService.crearConfiguracionPrompt({ contexto, prompt_sistema: prompt }),
  validarConfiguracion: (config: ConfiguracionPromptCreate) => 
    adminService.validarConfiguracionPrompt(config),
  obtenerContextosDisponibles: () => adminService.obtenerContextosDisponibles(),
};