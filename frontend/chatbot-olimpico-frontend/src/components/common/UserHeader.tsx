// src/components/common/UserHeader.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../utils/constants';

interface UserHeaderProps {
  title?: string;
  showSidebarToggle?: boolean;
  onSidebarToggle?: () => void;
  showAdminButton?: boolean;
  showSettingsButton?: boolean;
  onSettingsClick?: () => void;
  className?: string;
}

export const UserHeader: React.FC<UserHeaderProps> = ({
  title = 'Chatbot Olímpico',
  showSidebarToggle = false,
  onSidebarToggle,
  showAdminButton = true,
  showSettingsButton = false,
  onSettingsClick,
  className = ''
}) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate(ROUTES.LOGIN);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className={`bg-white border-b border-gray-200 px-4 py-3 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Lado izquierdo: Menú y título */}
        <div className="flex items-center space-x-3">
          {showSidebarToggle && (
            <button
              onClick={onSidebarToggle}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 lg:hidden"
              title="Toggle sidebar"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <h1 className="text-lg font-semibold text-gray-900">
            {title}
          </h1>
        </div>

        {/* Lado derecho: Info usuario y acciones */}
        <div className="flex items-center space-x-3">
          {/* Información del usuario */}
          <div className="hidden sm:flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.username}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.rol}</p>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center space-x-1">
            {/* Botón de configuraciones */}
            {showSettingsButton && onSettingsClick && (
              <button
                onClick={onSettingsClick}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
                title="Configuraciones"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </button>
            )}

            {/* Botón Admin (solo si es admin) */}
            {showAdminButton && isAdmin && (
              <button
                onClick={() => navigate(ROUTES.ADMIN)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
                title="Panel de administración"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}

            {/* Botón Chat (para ir desde admin al chat) */}
            {window.location.pathname.includes('/admin') && (
              <button
                onClick={() => navigate(ROUTES.CHAT)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
                title="Ir al chat"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
            )}

            {/* Menú móvil con dropdown */}
            <div className="sm:hidden relative">
              <button
                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
                onClick={() => {
                  // Toggle dropdown - podrías implementar esto con estado si quieres
                  const dropdown = document.getElementById('mobile-user-menu');
                  dropdown?.classList.toggle('hidden');
                }}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              
              {/* Dropdown móvil */}
              <div id="mobile-user-menu" className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 hidden">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.rol}</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => navigate(ROUTES.ADMIN)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Panel de administración
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>

            {/* Botón de Logout (solo desktop) */}
            <button
              onClick={handleLogout}
              className="hidden sm:flex text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
              title="Cerrar sesión"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserHeader;