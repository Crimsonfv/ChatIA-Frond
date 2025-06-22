// src/services/api.ts
import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, STORAGE_KEYS, ROUTES } from '../utils/constants';

// ==================== CONFIGURACIÓN DE AXIOS ====================
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: API_CONFIG.HEADERS,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - agregar token automáticamente
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - manejar errores globales
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado o inválido
          this.clearAuth();
          window.location.href = ROUTES.LOGIN;
        }
        return Promise.reject(error);
      }
    );
  }

  private clearAuth() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }

  // ==================== MÉTODOS HTTP ====================

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== MANEJO DE ERRORES ====================

  private handleError(error: any): Error {
    console.error('API Error:', error);

    // Error de red
    if (!error.response) {
      return new Error('Error de conexión. Verifica tu conexión a internet.');
    }

    // Error del servidor
    const { status, data } = error.response;
    
    // Extraer mensaje de error del backend
    let message = 'Ha ocurrido un error inesperado';
    
    if (data?.detail) {
      message = data.detail;
    } else if (data?.message) {
      message = data.message;
    } else if (typeof data === 'string') {
      message = data;
    }

    // Personalizar mensajes según status code
    switch (status) {
      case 400:
        message = data?.detail || 'Datos inválidos';
        break;
      case 401:
        message = 'No tienes autorización para realizar esta acción';
        break;
      case 403:
        message = 'No tienes permisos para acceder a este recurso';
        break;
      case 404:
        message = 'Recurso no encontrado';
        break;
      case 422:
        message = this.extractValidationErrors(data);
        break;
      case 500:
        message = 'Error interno del servidor. Inténtalo más tarde';
        break;
      default:
        message = `Error ${status}: ${message}`;
    }

    return new Error(message);
  }

  private extractValidationErrors(data: any): string {
    if (data?.detail && Array.isArray(data.detail)) {
      const errors = data.detail.map((error: any) => {
        const field = error.loc?.[error.loc.length - 1] || 'campo';
        return `${field}: ${error.msg}`;
      });
      return errors.join(', ');
    }
    return data?.detail || 'Error de validación';
  }

  // ==================== UTILIDADES ====================

  setAuthToken(token: string) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    this.client.defaults.headers.Authorization = `Bearer ${token}`;
  }

  removeAuthToken() {
    this.clearAuth();
    delete this.client.defaults.headers.Authorization;
  }

  getAuthToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  // Método para probar conexión
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health');
      return true;
    } catch {
      return false;
    }
  }
}

// ==================== INSTANCIA SINGLETON ====================
export const apiClient = new ApiClient();

// ==================== EXPORTAR TIPOS ====================
export type { AxiosRequestConfig, AxiosResponse };

// ==================== HELPERS PARA DEBUGGING ====================
export const debugApi = {
  getBaseUrl: () => API_CONFIG.BASE_URL,
  getToken: () => apiClient.getAuthToken(),
  isAuthenticated: () => apiClient.isAuthenticated(),
  testConnection: () => apiClient.healthCheck(),
};