// src/services/filterService.ts
import { apiClient } from './api';
import { ENDPOINTS } from '../utils/constants';
import type { 
  TerminoExcluido,
  TerminoExcluidoCreate,
  SuccessResponse
} from '../types';

class FilterService {

  // ==================== GESTIÓN DE TÉRMINOS EXCLUIDOS (Criterio E) ====================

  /**
   * Obtener todos los términos excluidos del usuario actual
   */
  async obtenerTerminosExcluidos(): Promise<TerminoExcluido[]> {
    try {
      const response = await apiClient.get<TerminoExcluido[]>(
        ENDPOINTS.FILTERS.EXCLUDED_TERMS
      );
      
      return response;
    } catch (error) {
      console.error('Error al obtener términos excluidos:', error);
      throw error;
    }
  }

  /**
   * Agregar nuevo término excluido
   */
  async agregarTerminoExcluido(termino: TerminoExcluidoCreate): Promise<TerminoExcluido> {
    try {
      const response = await apiClient.post<TerminoExcluido>(
        ENDPOINTS.FILTERS.EXCLUDED_TERMS,
        termino
      );
      
      return response;
    } catch (error) {
      console.error('Error al agregar término excluido:', error);
      throw error;
    }
  }

  /**
   * Eliminar término excluido por ID
   */
  async eliminarTerminoExcluido(terminoId: number): Promise<SuccessResponse> {
    try {
      const response = await apiClient.delete<SuccessResponse>(
        ENDPOINTS.FILTERS.EXCLUDED_TERM_BY_ID(terminoId)
      );
      
      return response;
    } catch (error) {
      console.error('Error al eliminar término excluido:', error);
      throw error;
    }
  }

  // ==================== HELPERS Y VALIDACIONES ====================

  /**
   * Validar término antes de agregar
   */
  validarTermino(termino: string): string[] {
    const errores: string[] = [];

    if (!termino?.trim()) {
      errores.push('El término no puede estar vacío');
    }

    if (termino && termino.trim().length < 2) {
      errores.push('El término debe tener al menos 2 caracteres');
    }

    if (termino && termino.trim().length > 100) {
      errores.push('El término no puede exceder 100 caracteres');
    }

    // Validar que no contenga caracteres especiales problemáticos
    if (termino && /[<>\"'&]/.test(termino)) {
      errores.push('El término no puede contener caracteres especiales como <, >, ", \', &');
    }

    return errores;
  }

  /**
   * Limpiar término antes de enviar
   */
  limpiarTermino(termino: string): string {
    return termino
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' '); // Reemplazar múltiples espacios por uno solo
  }

  /**
   * Verificar si un término ya existe en la lista
   */
  terminoYaExiste(termino: string, terminosExistentes: TerminoExcluido[]): boolean {
    const terminoLimpio = this.limpiarTermino(termino);
    
    return terminosExistentes.some(t => 
      this.limpiarTermino(t.termino) === terminoLimpio
    );
  }

  /**
   * Filtrar términos activos solamente
   */
  obtenerTerminosActivos(terminos: TerminoExcluido[]): TerminoExcluido[] {
    return terminos.filter(termino => termino.activo);
  }

  /**
   * Obtener lista de términos como strings simples
   */
  extraerListaTerminos(terminos: TerminoExcluido[]): string[] {
    return this.obtenerTerminosActivos(terminos).map(t => t.termino);
  }

  /**
   * Formatear fecha de creación para mostrar en UI
   */
  formatearFechaCreacion(fechaCreacion: string): string {
    const fecha = new Date(fechaCreacion);
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Contar términos activos
   */
  contarTerminosActivos(terminos: TerminoExcluido[]): number {
    return this.obtenerTerminosActivos(terminos).length;
  }

  /**
   * Buscar términos que coincidan con un filtro
   */
  buscarTerminos(terminos: TerminoExcluido[], filtro: string): TerminoExcluido[] {
    if (!filtro.trim()) {
      return terminos;
    }

    const filtroLimpio = filtro.toLowerCase().trim();
    
    return terminos.filter(termino => 
      termino.termino.toLowerCase().includes(filtroLimpio)
    );
  }

  /**
   * Agregar múltiples términos de una vez
   */
  async agregarMultiplesTerminos(terminos: string[]): Promise<{
    exitosos: TerminoExcluido[];
    fallidos: { termino: string; error: string }[];
  }> {
    const exitosos: TerminoExcluido[] = [];
    const fallidos: { termino: string; error: string }[] = [];

    for (const termino of terminos) {
      try {
        const terminoLimpio = this.limpiarTermino(termino);
        const errores = this.validarTermino(terminoLimpio);
        
        if (errores.length > 0) {
          fallidos.push({ termino, error: errores[0] });
          continue;
        }

        const resultado = await this.agregarTerminoExcluido({ termino: terminoLimpio });
        exitosos.push(resultado);
      } catch (error) {
        fallidos.push({ 
          termino, 
          error: error instanceof Error ? error.message : 'Error desconocido' 
        });
      }
    }

    return { exitosos, fallidos };
  }

  /**
   * Exportar términos excluidos a texto plano
   */
  exportarTerminosATexto(terminos: TerminoExcluido[]): string {
    const terminosActivos = this.obtenerTerminosActivos(terminos);
    
    if (terminosActivos.length === 0) {
      return 'No hay términos excluidos configurados.';
    }

    const lineas = [
      'Términos Excluidos - Chatbot Olímpico',
      '=====================================',
      `Total de términos: ${terminosActivos.length}`,
      `Exportado el: ${new Date().toLocaleString('es-ES')}`,
      '',
      'Términos:',
      ...terminosActivos.map((t, index) => 
        `${index + 1}. ${t.termino} (agregado: ${this.formatearFechaCreacion(t.fecha_creacion)})`
      )
    ];

    return lineas.join('\n');
  }
}

// ==================== INSTANCIA SINGLETON ====================
export const filterService = new FilterService();

// ==================== HELPERS PARA DEBUGGING ====================
export const debugFilter = {
  obtenerTerminos: () => filterService.obtenerTerminosExcluidos(),
  agregarTermino: (termino: string) => 
    filterService.agregarTerminoExcluido({ termino }),
  validarTermino: (termino: string) => 
    filterService.validarTermino(termino),
  limpiarTermino: (termino: string) => 
    filterService.limpiarTermino(termino),
};