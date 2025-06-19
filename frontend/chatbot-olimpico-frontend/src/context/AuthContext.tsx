// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import type { 
  AuthContextType, 
  Usuario, 
  UsuarioLogin, 
  UsuarioCreate 
} from '../types';

// ==================== CREAR CONTEXT ====================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==================== PROVIDER PROPS ====================
interface AuthProviderProps {
  children: ReactNode;
}

// ==================== AUTH PROVIDER ====================
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // ==================== INICIALIZACIÓN ====================
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      
      // Intentar restaurar sesión desde localStorage
      const storedToken = authService.getToken();
      const storedUser = authService.getUser();

      if (storedToken && storedUser) {
        // Validar que la sesión sigue siendo válida
        const isValid = await authService.validateSession();
        
        if (isValid) {
          setToken(storedToken);
          setUser(storedUser);
        } else {
          // Sesión inválida, limpiar
          await logout();
        }
      }
    } catch (error) {
      console.error('Error al inicializar autenticación:', error);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  // ==================== LOGIN ====================
  const login = async (credentials: UsuarioLogin): Promise<boolean> => {
    try {
      setLoading(true);

      // Validar credenciales en el cliente
      const validationErrors = authService.validateLoginForm(credentials);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors[0]);
      }

      // Hacer login en el backend
      const tokenResponse = await authService.login(credentials);
      
      // Actualizar estado
      setToken(tokenResponse.access_token);
      setUser(tokenResponse.user);

      return true;
    } catch (error) {
      console.error('Error en login:', error);
      
      // Limpiar estado en caso de error
      await logout();
      
      // Re-lanzar error para que el componente lo maneje
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ==================== REGISTRO ====================
  const register = async (userData: UsuarioCreate): Promise<boolean> => {
    try {
      setLoading(true);

      // Validar datos en el cliente
      const validationErrors = authService.validateRegisterForm(userData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors[0]);
      }

      // Registrar usuario en el backend
      await authService.register(userData);
      
      // Después del registro exitoso, hacer login automático
      const loginResult = await login({
        username: userData.username,
        password: userData.password
      });

      return loginResult;
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ==================== LOGOUT ====================
  const logout = async (): Promise<void> => {
    try {
      // Limpiar servicio de auth
      authService.logout();
      
      // Limpiar estado
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  // ==================== REFRESH USER ====================
  const refreshUser = async (): Promise<void> => {
    try {
      if (!token) return;
      
      const updatedUser = await authService.getCurrentUser();
      setUser(updatedUser);
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      // Si falla, probablemente el token expiró
      await logout();
    }
  };

  // ==================== COMPUTED VALUES ====================
  const isAuthenticated = !!user && !!token;
  const isAdmin = user?.rol === 'admin';

  // ==================== CONTEXT VALUE ====================
  const contextValue: AuthContextType = {
    // Estado
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    
    // Métodos
    login,
    register,
    logout,
    
    // Método adicional para refrescar usuario
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ==================== HOOK PERSONALIZADO ====================
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
};

// ==================== HOOK PARA VERIFICAR ADMIN ====================
export const useRequireAdmin = (): AuthContextType => {
  const auth = useAuth();
  
  if (!auth.isAuthenticated) {
    throw new Error('Usuario no autenticado');
  }
  
  if (!auth.isAdmin) {
    throw new Error('Se requieren permisos de administrador');
  }
  
  return auth;
};

// ==================== HELPERS PARA COMPONENTES ====================

/**
 * Hook para mostrar información del usuario actual
 */
export const useUserInfo = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  
  return {
    username: user?.username || '',
    email: user?.email || '',
    rol: user?.rol || 'user',
    fechaRegistro: user?.fecha_registro || '',
    isAuthenticated,
    isAdmin,
    userDisplay: user ? `${user.username} (${user.rol})` : 'No autenticado'
  };
};

/**
 * Hook para manejar redirecciones basadas en autenticación
 */
export const useAuthRedirect = () => {
  const { isAuthenticated, loading } = useAuth();
  
  const shouldRedirectToLogin = !loading && !isAuthenticated;
  const shouldRedirectToChat = !loading && isAuthenticated;
  
  return {
    shouldRedirectToLogin,
    shouldRedirectToChat,
    isReady: !loading
  };
};

// ==================== EXPORT DEFAULT ====================
export default AuthContext;