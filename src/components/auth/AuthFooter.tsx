import React from "react";
import { FiShield, FiShoppingCart, FiUser } from "react-icons/fi";

interface AuthFooterProps {
  isLogin: boolean;
  onToggleMode: () => void;
}

export const AuthFooter = ({ isLogin, onToggleMode }: AuthFooterProps) => (
  <>
    <div className="mt-8 text-center">
      <span className="text-sm text-gray-600">
        {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
      </span>
      <button
        type="button"
        onClick={onToggleMode}
        className="ml-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
      >
        {isLogin ? "Regístrate aquí" : "Inicia sesión"}
      </button>
    </div>

    {/* Features */}
    <div className="mt-8 grid grid-cols-3 gap-4 text-center">
      <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg">
        <FiShield className="mx-auto mb-2 text-green-600" size={24} />
        <div className="text-xs text-gray-600">Pagos Seguros</div>
      </div>
      <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg">
        <FiShoppingCart className="mx-auto mb-2 text-blue-600" size={24} />
        <div className="text-xs text-gray-600">Licencias Originales</div>
      </div>
      <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg">
        <FiUser className="mx-auto mb-2 text-purple-600" size={24} />
        <div className="text-xs text-gray-600">Soporte 24/7</div>
      </div>
    </div>
  </>
);
