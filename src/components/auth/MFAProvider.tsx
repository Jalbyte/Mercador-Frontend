"use client";

/**
 * Contexto de MFA (Multi-Factor Authentication) para Mercador
 * Maneja la configuración y verificación de autenticación de dos factores
 */

import React, { createContext, useContext, useState } from "react";
import { useAuth } from "./AuthProvider";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3010`
    : "");

export interface MFAFactor {
  id: string;
  type: string;
  status: "verified" | "unverified";
  friendly_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MFAEnrollResponse {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
}

interface MFAContextType {
  // Estado
  isEnrolling: boolean;
  enrollData: MFAEnrollResponse | null;
  
  // Funciones para configuración inicial de MFA
  startEnrollment: () => Promise<MFAEnrollResponse>;
  verifyEnrollment: (factorId: string, code: string) => Promise<void>;
  cancelEnrollment: () => void;
  
  // Funciones para gestión de MFA
  listFactors: () => Promise<MFAFactor[]>;
  unenrollFactor: (factorId: string) => Promise<void>;
  
  // Funciones para login con MFA
  verifyMFALogin: (factorId: string, code: string, tempToken: string) => Promise<void>;
}

const MFAContext = createContext<MFAContextType | undefined>(undefined);

export function MFAProvider({ children }: { children: React.ReactNode }) {
  const { refreshUser } = useAuth();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollData, setEnrollData] = useState<MFAEnrollResponse | null>(null);

  /**
   * Inicia el proceso de configuración de MFA
   * Devuelve el QR code y el secreto para configurar en la app autenticadora
   */
  const startEnrollment = async (): Promise<MFAEnrollResponse> => {
    setIsEnrolling(true);
    
    try {
      const response = await fetch(`${API_BASE}/auth/mfa/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al iniciar MFA");
      }

      const data = await response.json();
      const enrollResponse: MFAEnrollResponse = {
        factorId: data.factorId,
        qrCode: data.qrCode,
        secret: data.secret,
        uri: data.uri,
      };

      setEnrollData(enrollResponse);
      return enrollResponse;
    } catch (error) {
      setIsEnrolling(false);
      throw error;
    }
  };

  /**
   * Verifica el código TOTP durante la configuración inicial de MFA
   * Una vez verificado, el MFA queda activado para el usuario
   */
  const verifyEnrollment = async (factorId: string, code: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/auth/mfa/verify-setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ factorId, code }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Código inválido");
      }

      // MFA activado exitosamente
      setIsEnrolling(false);
      setEnrollData(null);
      
      // Refrescar datos del usuario para actualizar el estado de MFA
      await refreshUser();
    } catch (error) {
      throw error;
    }
  };

  /**
   * Cancela el proceso de configuración de MFA
   */
  const cancelEnrollment = () => {
    setIsEnrolling(false);
    setEnrollData(null);
  };

  /**
   * Lista todos los factores MFA del usuario
   */
  const listFactors = async (): Promise<MFAFactor[]> => {
    const response = await fetch(`${API_BASE}/auth/mfa/factors`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al obtener factores MFA");
    }

    const data = await response.json();
    return data.factors || [];
  };

  /**
   * Desactiva un factor MFA del usuario
   */
  const unenrollFactor = async (factorId: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/auth/mfa/unenroll`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ factorId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al desactivar MFA");
    }

    // Refrescar datos del usuario
    await refreshUser();
  };

  /**
   * Verifica el código TOTP durante el login
   * Completa la autenticación después de ingresar usuario/contraseña
   */
  const verifyMFALogin = async (
    factorId: string,
    code: string,
    tempToken: string
  ): Promise<void> => {
    const response = await fetch(`${API_BASE}/auth/mfa/verify-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ factorId, code, tempToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Código MFA inválido");
    }

    // Login completado, refrescar usuario
    await refreshUser();
  };

  const value: MFAContextType = {
    isEnrolling,
    enrollData,
    startEnrollment,
    verifyEnrollment,
    cancelEnrollment,
    listFactors,
    unenrollFactor,
    verifyMFALogin,
  };

  return <MFAContext.Provider value={value}>{children}</MFAContext.Provider>;
}

/**
 * Hook para usar el contexto de MFA
 */
export function useMFA() {
  const context = useContext(MFAContext);
  if (context === undefined) {
    throw new Error("useMFA must be used within an MFAProvider");
  }
  return context;
}
