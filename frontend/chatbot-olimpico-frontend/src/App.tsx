// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import ProtectedRoute, { AdminRoute, GuestRoute } from './components/common/ProtectedRoute';
import { ROUTES } from './utils/constants';

// Páginas
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';

// ==================== APP COMPONENT ====================
const App: React.FC = () => {
  return (
    <AuthProvider>
      <ChatProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Ruta raíz - redirige al chat */}
              <Route 
                path="/" 
                element={<Navigate to={ROUTES.CHAT} replace />} 
              />

              {/* Rutas de autenticación (solo para usuarios no autenticados) */}
              <Route
                path={ROUTES.LOGIN}
                element={
                  <GuestRoute>
                    <LoginPage />
                  </GuestRoute>
                }
              />
              
              <Route
                path={ROUTES.REGISTER}
                element={
                  <GuestRoute>
                    <RegisterPage />
                  </GuestRoute>
                }
              />

              {/* Ruta principal del chat (requiere autenticación) */}
              <Route
                path={ROUTES.CHAT}
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />

              {/* Ruta de administración (requiere permisos de admin) */}
              <Route
                path={ROUTES.ADMIN}
                element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                }
              />

              {/* Ruta 404 - redirige al chat */}
              <Route 
                path="*" 
                element={<Navigate to={ROUTES.CHAT} replace />} 
              />
            </Routes>
          </div>
        </Router>
      </ChatProvider>
    </AuthProvider>
  );
};

export default App;