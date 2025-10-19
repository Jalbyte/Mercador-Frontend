"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FiX } from "react-icons/fi";

interface LegalModalProps {
  open: boolean;
  onClose: () => void;
  type: "terms" | "privacy";
}

const TermsContent = () => (
  <div className="space-y-6">
    <section>
      <h3 className="text-lg font-bold text-gray-900 mb-3">1. Introducción</h3>
      <p className="text-gray-700 text-sm leading-relaxed">
        Bienvenido a <strong>Mercador</strong>, tu tienda confiable de licencias de software originales al mejor precio. Al acceder nuestros servicios, aceptas estar vinculado por estos Términos y Condiciones.
      </p>
    </section>

    <section>
      <h3 className="text-lg font-bold text-gray-900 mb-3">2. Seguridad y Autenticación</h3>
      <ul className="text-gray-700 text-sm space-y-2 ml-4">
        <li>✓ Verificación de correo electrónico obligatoria</li>
        <li>✓ Autenticación de dos factores (2FA) disponible</li>
        <li>✓ Encriptación de contraseñas con estándares altos</li>
      </ul>
    </section>

    <section>
      <h3 className="text-lg font-bold text-gray-900 mb-3">3. Pagos</h3>
      <p className="text-gray-700 text-sm leading-relaxed">
        Aceptamos pagos seguros a través de <strong>Mercado Pago</strong>. Todos los pagos son procesados de forma encriptada y segura.
      </p>
    </section>

    <section>
      <h3 className="text-lg font-bold text-gray-900 mb-3">4. Productos</h3>
      <p className="text-gray-700 text-sm leading-relaxed">
        Garantizamos que todas las licencias son 100% originales con garantía y soporte técnico completo.
      </p>
    </section>

    <section>
      <h3 className="text-lg font-bold text-gray-900 mb-3">5. Devoluciones</h3>
      <p className="text-gray-700 text-sm leading-relaxed">
        14 días de garantía de satisfacción. Si tienes problemas con tu licencia, ofrecemos reemplazo o reembolso.
      </p>
    </section>

    <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-4">
      <p className="text-sm text-gray-700">
        Para leer los términos completos, <Link href="/terms" className="text-blue-600 font-semibold hover:underline">haz clic aquí</Link>.
      </p>
    </div>
  </div>
);

const PrivacyContent = () => (
  <div className="space-y-6">
    <section>
      <h3 className="text-lg font-bold text-gray-900 mb-3">1. Tu Privacidad</h3>
      <p className="text-gray-700 text-sm leading-relaxed">
        En Mercador, valoramos tu privacidad. Protegemos todos tus datos personales con estándares de seguridad de la industria.
      </p>
    </section>

    <section>
      <h3 className="text-lg font-bold text-gray-900 mb-3">2. Datos que Recopilamos</h3>
      <ul className="text-gray-700 text-sm space-y-2 ml-4">
        <li>• Información de registro (nombre, email, teléfono)</li>
        <li>• Información de pago (procesada por Mercado Pago)</li>
        <li>• Datos de autenticación de 2FA</li>
        <li>• Historial de navegación y compras</li>
      </ul>
    </section>

    <section>
      <h3 className="text-lg font-bold text-gray-900 mb-3">3. Protección de Datos</h3>
      <ul className="text-gray-700 text-sm space-y-2 ml-4">
        <li>✓ Encriptación SSL/TLS</li>
        <li>✓ 2FA para mayor seguridad</li>
        <li>✓ NO vendemos tu información</li>
        <li>✓ Cumplimos con LPDP de Colombia</li>
      </ul>
    </section>

    <section>
      <h3 className="text-lg font-bold text-gray-900 mb-3">4. Tus Derechos</h3>
      <p className="text-gray-700 text-sm leading-relaxed">
        Tienes derecho a acceder, corregir, eliminar y portar tus datos personales en cualquier momento.
      </p>
    </section>

    <section>
      <h3 className="text-lg font-bold text-gray-900 mb-3">5. Contacto</h3>
      <p className="text-gray-700 text-sm">
        Email: <strong>contacto@mercador.com</strong>
      </p>
    </section>

    <div className="bg-green-50 border border-green-200 rounded p-4 mt-4">
      <p className="text-sm text-gray-700">
        Para leer la política completa, <Link href="/privacy" className="text-blue-600 font-semibold hover:underline">haz clic aquí</Link>.
      </p>
    </div>
  </div>
);

/**
 * Componente Modal para Términos y Condiciones / Política de Privacidad
 * Muestra resumen en modal o redirige a páginas completas
 */
export const LegalModal: React.FC<LegalModalProps> = ({ open, onClose, type }) => {
  if (!open) return null;

  const isTerms = type === "terms";
  const title = isTerms ? "Términos y Condiciones" : "Política de Privacidad";
  const content = isTerms ? <TermsContent /> : <PrivacyContent />;
  const fullPageLink = isTerms ? "/terms" : "/privacy";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-xl">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600 hover:text-gray-900"
            aria-label="Cerrar"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {content}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-xl flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Cerrar
          </button>
          <Link href={fullPageLink}>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Leer Completo
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};
