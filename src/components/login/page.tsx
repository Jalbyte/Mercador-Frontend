import React, { useState } from "react";
import {
  FiEye,
  FiEyeOff,
  FiUser,
  FiMail,
  FiLock,
  FiArrowLeft,
  FiShield,
} from "react-icons/fi";

const AuthDemo = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    acceptTerms: false,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      console.log("Login:", {
        email: formData.email,
        password: formData.password,
      });
      alert("¡Login simulado! Revisa la consola.");
    } else {
      console.log("Register:", formData);
      alert("¡Registro simulado! Revisa la consola.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4">
      {/* Header simplificado */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.history.back()}
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              >
                <FiArrowLeft size={18} />
              </button>
              <div className="text-xl font-bold text-blue-600">Mercador</div>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <FiShield size={14} />
              <span>Conexión Segura</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center px-3 py-6">
        <div className="w-full max-w-sm">
          {/* Card Principal */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header del Card */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-center text-white">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-full mb-3">
                <FiUser size={26} />
              </div>
              <h2 className="text-xl font-bold mb-1">
                {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
              </h2>
              <p className="text-blue-100 text-sm">
                {isLogin
                  ? "Accede a las mejores licencias de software"
                  : "Únete a miles de usuarios satisfechos"}
              </p>
            </div>

            {/* Form */}
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Tu nombre"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apellido
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Tu apellido"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <FiMail
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <FiLock
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <FiEyeOff size={20} />
                      ) : (
                        <FiEye size={20} />
                      )}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar Contraseña
                    </label>
                    <div className="relative">
                      <FiLock
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={20}
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                )}

                {isLogin && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">
                        Recordarme
                      </span>
                    </label>
                    <a
                      href="#"
                      className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>
                )}

                {!isLogin && (
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                      required
                    />
                    <label className="ml-2 text-sm text-gray-600">
                      Acepto los{" "}
                      <a
                        href="#"
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        términos y condiciones
                      </a>{" "}
                      y la{" "}
                      <a
                        href="#"
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        política de privacidad
                      </a>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-500/50 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-3 text-xs text-gray-500">
                  O continúa con
                </span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <img
                    src="https://developers.google.com/identity/images/g-logo.png"
                    alt="Google"
                    className="w-5 h-5 mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Google
                  </span>
                </button>
              </div>

              {/* Switch Mode */}
              <div className="mt-6 text-center">
                <span className="text-xs text-gray-600">
                  {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="ml-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {isLogin ? "Regístrate aquí" : "Inicia sesión"}
                </button>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/70 backdrop-blur-sm p-3 rounded-lg">
              <FiShield className="mx-auto mb-1 text-green-600" size={20} />
              <div className="text-[11px] text-gray-600">Pagos Seguros</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm p-3 rounded-lg">
              <FiUser className="mx-auto mb-1 text-blue-600" size={20} />
              <div className="text-[11px] text-gray-600">Licencias Originales</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm p-3 rounded-lg">
              <FiUser className="mx-auto mb-1 text-purple-600" size={20} />
              <div className="text-[11px] text-gray-600">Soporte 24/7</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthDemo;
