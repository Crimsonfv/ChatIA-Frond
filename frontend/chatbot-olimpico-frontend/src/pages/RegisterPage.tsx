// src/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES, VALIDATION } from '../utils/constants';
import { ButtonLoading } from '../components/common/Loading';
import type { UsuarioCreate } from '../types';

// ==================== REGISTER PAGE COMPONENT ====================
const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  // ==================== ESTADO DEL FORMULARIO ====================
  const [formData, setFormData] = useState<UsuarioCreate & { confirmPassword: string }>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    rol: 'user'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ==================== MANEJO DE CAMBIOS ====================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  // ==================== VALIDACIÓN CLIENT-SIDE ====================
  const validateForm = (): string[] => {
    const validationErrors: string[] = [];

    // Validar username
    if (!formData.username.trim()) {
      validationErrors.push('El nombre de usuario es requerido');
    } else if (formData.username.length < VALIDATION.USERNAME.MIN_LENGTH) {
      validationErrors.push(`El nombre de usuario debe tener al menos ${VALIDATION.USERNAME.MIN_LENGTH} caracteres`);
    } else if (formData.username.length > VALIDATION.USERNAME.MAX_LENGTH) {
      validationErrors.push(`El nombre de usuario no puede tener más de ${VALIDATION.USERNAME.MAX_LENGTH} caracteres`);
    } else if (!VALIDATION.USERNAME.PATTERN.test(formData.username)) {
      validationErrors.push('El nombre de usuario solo puede contener letras, números y guiones bajos');
    }

    // Validar email
    if (!formData.email.trim()) {
      validationErrors.push('El email es requerido');
    } else if (!VALIDATION.EMAIL.PATTERN.test(formData.email)) {
      validationErrors.push('El formato del email no es válido');
    }

    // Validar password
    if (!formData.password.trim()) {
      validationErrors.push('La contraseña es requerida');
    } else if (formData.password.length < VALIDATION.PASSWORD.MIN_LENGTH) {
      validationErrors.push(`La contraseña debe tener al menos ${VALIDATION.PASSWORD.MIN_LENGTH} caracteres`);
    } else if (formData.password.length > VALIDATION.PASSWORD.MAX_LENGTH) {
      validationErrors.push(`La contraseña no puede tener más de ${VALIDATION.PASSWORD.MAX_LENGTH} caracteres`);
    }

    // Validar confirmación de contraseña
    if (!formData.confirmPassword.trim()) {
      validationErrors.push('La confirmación de contraseña es requerida');
    } else if (formData.password !== formData.confirmPassword) {
      validationErrors.push('Las contraseñas no coinciden');
    }

    return validationErrors;
  };

  // ==================== MANEJO DEL SUBMIT ====================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulario
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors([]);

      // Preparar datos para registro (sin confirmPassword)
      const { confirmPassword, ...registerData } = formData;

      // Intentar registro
      await register(registerData);
      
      // Redirigir al chat después del registro exitoso
      navigate(ROUTES.CHAT);
      
    } catch (error) {
      console.error('Error en registro:', error);
      setErrors([error instanceof Error ? error.message : 'Error al crear la cuenta']);
    } finally {
      setLoading(false);
    }
  };

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Crear Cuenta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Regístrate para acceder al chatbot de análisis olímpico
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Error Messages */}
            {errors.length > 0 && (
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
                        {errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Ingresa tu nombre de usuario"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Solo letras, números y guiones bajos. Mínimo 3 caracteres.
              </p>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="tu@ejemplo.com"
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 pr-10"
                  placeholder="Ingresa tu contraseña"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.46 8.46m1.418 1.418l4.242 4.242M19.542 12a9.97 9.97 0 01-1.563 3.029M15.582 17.167L19.542 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    )}
                  </svg>
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Mínimo 6 caracteres.
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 pr-10"
                  placeholder="Confirma tu contraseña"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {showConfirmPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.46 8.46m1.418 1.418l4.242 4.242M19.542 12a9.97 9.97 0 01-1.563 3.029M15.582 17.167L19.542 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <ButtonLoading />
                    <span className="ml-2">Creando cuenta...</span>
                  </>
                ) : (
                  'Crear Cuenta'
                )}
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes una cuenta?{' '}
                <Link
                  to={ROUTES.LOGIN}
                  className="font-medium text-green-600 hover:text-green-500 transition-colors"
                >
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Al registrarte, aceptas nuestros términos de servicio y política de privacidad
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;