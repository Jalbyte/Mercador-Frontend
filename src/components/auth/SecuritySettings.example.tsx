/**
 * Ejemplo de uso de MFA en la página de perfil/configuración
 * 
 * Este archivo muestra cómo integrar la funcionalidad de MFA
 * en la sección de seguridad del perfil del usuario
 */

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useMFA } from "@/components/auth/MFAProvider";
import { MFASetup } from "@/components/auth/MFASetup";
import { FiShield, FiLock, FiUnlock, FiAlertCircle } from "react-icons/fi";

export function SecuritySettings() {
  const { user } = useAuth();
  const { listFactors, unenrollFactor } = useMFA();
  
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMFAFactors();
  }, []);

  const loadMFAFactors = async () => {
    try {
      setIsLoading(true);
      const factors = await listFactors();
      setMfaFactors(factors.filter(f => f.status === "verified"));
    } catch (err) {
      console.error("Error loading MFA factors:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableMFA = () => {
    setShowMFASetup(true);
  };

  const handleMFASetupComplete = () => {
    setShowMFASetup(false);
    loadMFAFactors();
  };

  const handleDisableMFA = async (factorId: string) => {
    if (!confirm("¿Estás seguro de que deseas desactivar la autenticación en dos pasos?")) {
      return;
    }

    try {
      await unenrollFactor(factorId);
      await loadMFAFactors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al desactivar MFA");
    }
  };

  const hasMFA = mfaFactors.length > 0;

  if (showMFASetup) {
    return (
      <MFASetup
        onComplete={handleMFASetupComplete}
        onCancel={() => setShowMFASetup(false)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Configuración de Seguridad</h1>

      {/* MFA Status Card */}
      <div className={`rounded-lg border-2 p-6 mb-6 ${
        hasMFA 
          ? "border-green-500 bg-green-50" 
          : "border-yellow-500 bg-yellow-50"
      }`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${
            hasMFA ? "bg-green-200" : "bg-yellow-200"
          }`}>
            {hasMFA ? (
              <FiShield className="text-2xl text-green-700" />
            ) : (
              <FiAlertCircle className="text-2xl text-yellow-700" />
            )}
          </div>
          
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">
              Autenticación en dos pasos (2FA)
            </h2>
            
            {hasMFA ? (
              <>
                <p className="text-gray-700 mb-4">
                  ✅ Tu cuenta está protegida con autenticación en dos pasos.
                  Se te solicitará un código de verificación cada vez que inicies sesión.
                </p>
                
                <div className="space-y-3">
                  {mfaFactors.map((factor) => (
                    <div 
                      key={factor.id}
                      className="flex items-center justify-between bg-white rounded-lg p-4 border"
                    >
                      <div className="flex items-center gap-3">
                        <FiLock className="text-green-600" />
                        <div>
                          <p className="font-medium">
                            {factor.friendly_name || "Aplicación autenticadora"}
                          </p>
                          <p className="text-sm text-gray-500">
                            Configurado el {new Date(factor.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDisableMFA(factor.id)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Desactivar
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-700 mb-4">
                  ⚠️ Tu cuenta no está protegida con autenticación en dos pasos.
                  Te recomendamos activarla para mayor seguridad.
                </p>
                
                <button
                  onClick={handleEnableMFA}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Activar autenticación en dos pasos
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info boxes */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-3">¿Qué es 2FA?</h3>
          <p className="text-gray-600 text-sm">
            La autenticación en dos pasos añade una capa extra de seguridad 
            a tu cuenta. Además de tu contraseña, necesitarás un código de 
            verificación de 6 dígitos que cambia cada 30 segundos.
          </p>
        </div>

        <div className="border rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-3">Aplicaciones compatibles</h3>
          <ul className="text-gray-600 text-sm space-y-1">
            <li>• Google Authenticator</li>
            <li>• Microsoft Authenticator</li>
            <li>• Authy</li>
            <li>• 1Password</li>
            <li>• Bitwarden</li>
          </ul>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
