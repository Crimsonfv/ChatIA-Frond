// src/components/common/ProtectedRoute.tsx
import React from 'react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../utils/constants';
import Loading from './Loading';

// ==================== INTERFACES ====================
interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

// ==================== PROTECTED ROUTE COMPONENT ====================
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  redirectTo = ROUTES.LOGIN 
}) => {
  const { isAuthenticated, isAdmin, loading, user } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return <Loading text="Verificando autenticación..." />;
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    // Guardar la ruta actual para redirigir después del login
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Si requiere admin pero el usuario no es admin
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="mb-4">
            <svg 
              className="mx-auto h-12 w-12 text-red-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 mb-6">
            No tienes permisos de administrador para acceder a esta página.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Usuario actual: <span className="font-medium">{user?.username}</span> ({user?.rol})
            </p>
            <Navigate to={ROUTES.CHAT} replace />
          </div>
        </div>
      </div>
    );
  }

  // Si todo está bien, mostrar el contenido
  return <>{children}</>;
};

// ==================== COMPONENT PARA RUTAS ADMIN ====================
interface AdminRouteProps {
  children: ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  return (
    <ProtectedRoute requireAdmin={true}>
      {children}
    </ProtectedRoute>
  );
};

// ==================== COMPONENT PARA RUTAS DE GUEST (NO AUTENTICADO) ====================
interface GuestRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export const GuestRoute: React.FC<GuestRouteProps> = ({ 
  children, 
  redirectTo = ROUTES.CHAT 
}) => {
  const { isAuthenticated, loading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return <Loading text="Cargando..." />;
  }

  // Si ya está autenticado, redirigir al chat
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Si no está autenticado, mostrar el contenido (login/register)
  return <>{children}</>;
};

// ==================== HOOK PARA REDIRECCIÓN DESPUÉS DEL LOGIN ====================
export const useLoginRedirect = () => {
  const location = useLocation();
  
  // Obtener la ruta desde donde vino el usuario
  const from = (location.state as any)?.from?.pathname || ROUTES.CHAT;
  
  return {
    redirectTo: from,
    hasRedirect: from !== ROUTES.CHAT
  };
};

// ==================== COMPONENT PARA VERIFICACIÓN DE PERMISOS ====================
interface PermissionGuardProps {
  children: ReactNode;
  condition: boolean;
  fallback?: ReactNode;
  message?: string;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  condition,
  fallback,
  message = "No tienes permisos para ver este contenido"
}) => {
  if (!condition) {
    return (
      fallback || (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg 
                className="h-5 w-5 text-yellow-400" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{message}</p>
            </div>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
