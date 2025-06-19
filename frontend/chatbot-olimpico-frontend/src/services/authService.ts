// src/services/authService.ts
import { apiClient } from './api';
import { ENDPOINTS, STORAGE_KEYS } from '../utils/constants';
import type { 
  UsuarioLogin, 
  UsuarioCreate, 
  Token, 
  Usuario 
} from '../types';

class AuthService {
  
  // ==================== LOGIN ====================
  async login(credentials: UsuarioLogin): Promise<Token> {
    try {
      const response = await apiClient.post<Token>(
        ENDPOINTS.AUTH.LOGIN, 
        credentials
      );
      
      // Guardar token y usuario en localStorage
      this.setAuthData(response);
      
      return response;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  // ==================== REGISTRO ====================
  async register(userData: UsuarioCreate): Promise<Usuario> {
    try {
      const response = await apiClient.post<Usuario>(
        ENDPOINTS.AUTH.REGISTER, 
        userData
      );
      
      return response;
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  }

  // ==================== OBTENER USUARIO ACTUAL ====================
  async getCurrentUser(): Promise<Usuario> {
    try {
      const response = await apiClient.get<Usuario>(ENDPOINTS.AUTH.ME);
      
      // Actualizar usuario en localStorage
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response));
      
      return response;
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      throw error;
    }
  }

  // ==================== LOGOUT ====================
  logout(): void {
    // Limpiar localStorage
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.LAST_CONVERSATION);
    
    // Limpiar token del cliente API
    apiClient.removeAuthToken();
  }

  // ==================== VALIDAR SESIÓN ====================
  async validateSession(): Promise<boolean> {
    const token = this.getToken();
    
    if (!token) {
      return false;
    }

    try {
      // Verificar que el token sigue siendo válido
      await this.getCurrentUser();
      return true;
    } catch {
      // Token inválido o expirado
      this.logout();
      return false;
    }
  }

  // ==================== GETTERS ====================
  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  getUser(): Usuario | null {
    const userJson = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userJson) return null;
    
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.rol === 'admin';
  }

  // ==================== HELPERS PRIVADOS ====================
  private setAuthData(tokenResponse: Token): void {
    // Guardar token
    localStorage.setItem(STORAGE_KEYS.TOKEN, tokenResponse.access_token);
    
    // Guardar usuario
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(tokenResponse.user));
    
    // Configurar token en cliente API
    apiClient.setAuthToken(tokenResponse.access_token);
  }

  // ==================== VALIDACIONES ====================
  validateLoginForm(credentials: UsuarioLogin): string[] {
    const errors: string[] = [];

    if (!credentials.username?.trim()) {
      errors.push('El nombre de usuario es requerido');
    }

    if (!credentials.password?.trim()) {
      errors.push('La contraseña es requerida');
    }

    return errors;
  }

  validateRegisterForm(userData: UsuarioCreate): string[] {
    const errors: string[] = [];

    // Username
    if (!userData.username?.trim()) {
      errors.push('El nombre de usuario es requerido');
    } else if (userData.username.length < 3) {
      errors.push('El nombre de usuario debe tener al menos 3 caracteres');
    } else if (userData.username.length > 50) {
      errors.push('El nombre de usuario no puede tener más de 50 caracteres');
    } else if (!/^[a-zA-Z0-9_]+$/.test(userData.username)) {
      errors.push('El nombre de usuario solo puede contener letras, números y guiones bajos');
    }

    // Email
    if (!userData.email?.trim()) {
      errors.push('El email es requerido');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.push('El formato del email no es válido');
    }

    // Password
    if (!userData.password?.trim()) {
      errors.push('La contraseña es requerida');
    } else if (userData.password.length < 6) {
      errors.push('La contraseña debe tener al menos 6 caracteres');
    } else if (userData.password.length > 100) {
      errors.push('La contraseña no puede tener más de 100 caracteres');
    }

    return errors;
  }

  // ==================== AUTO-LOGIN AL INICIO ====================
  async initializeAuth(): Promise<Usuario | null> {
    const token = this.getToken();
    
    if (!token) {
      return null;
    }

    try {
      // Configurar token en cliente API
      apiClient.setAuthToken(token);
      
      // Validar y obtener usuario actual
      const user = await this.getCurrentUser();
      return user;
    } catch {
      // Token inválido, limpiar sesión
      this.logout();
      return null;
    }
  }
}

// ==================== INSTANCIA SINGLETON ====================
export const authService = new AuthService();

// ==================== HELPERS PARA DEBUGGING ====================
export const debugAuth = {
  getToken: () => authService.getToken(),
  getUser: () => authService.getUser(),
  isAuthenticated: () => authService.isAuthenticated(),
  isAdmin: () => authService.isAdmin(),
  clearSession: () => authService.logout(),
};