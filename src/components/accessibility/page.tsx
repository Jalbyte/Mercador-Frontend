"use client";

import React from "react";
import { X, Type, Eye, FileText, Settings } from "lucide-react";
import {
  useAccessibility,
  AccessibilitySettings,
} from "@/hooks/use-accessibility";
import { usePathname } from "next/navigation";

// Componente del botón flotante
export const AccessibilityButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="size-fit fixed top-1/2 right-0 -translate-y-1/2 z-40 bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-200 focus:ring-4 focus:ring-blue-500/50 accessibility-button group"
    style={{
      clipPath: 'path("m 0 22 q 0 -7 12 -10 L 60 0 L 60 120 L 12 102.1 Q 0 97.1 0 90.1 z")',
      width: '60px',
      height: '120px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
    aria-label="Abrir panel de accesibilidad"
    title="Configuración de Accesibilidad (Alt + A)"
  >
    <Settings className="size-6 group-hover:rotate-90 transition-transform duration-300" />
  </button>
);

// Componente principal de la barra lateral
export const AccessibilitySidebar = () => {
  const pathname = usePathname();
  const { settings, isOpen, setIsOpen, updateSetting, resetSettings } =
    useAccessibility();

  // No renderizar en páginas de email (para PDFs y templates)
  if (pathname?.startsWith('/email')) {
    return null;
  }

  if (!isOpen) {
    return <AccessibilityButton onClick={() => setIsOpen(true)} />;
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={() => setIsOpen(false)}
        aria-label="Cerrar panel de accesibilidad"
      />

      {/* Sidebar */}
      <div
        className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 overflow-y-auto border-l border-gray-200 accessibility-sidebar"
        role="dialog"
        aria-labelledby="accessibility-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2
            id="accessibility-title"
            className="text-lg font-semibold text-gray-900 flex items-center gap-2"
          >
            <Settings className="h-5 w-5 text-blue-600" />
            Configuración de Accesibilidad
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/50 rounded-full transition-colors focus:ring-2 focus:ring-blue-500"
            aria-label="Cerrar panel de accesibilidad"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Tamaño de Fuente */}
          <div className="space-y-3">
            <h3 className="text-md font-medium text-gray-900 flex items-center gap-2">
              <Type className="h-4 w-4 text-blue-600" />
              Tamaño de Texto
            </h3>
            <p className="text-sm text-gray-600">
              Ajusta el tamaño de la fuente para mejorar la legibilidad
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  key: "small",
                  label: "Pequeño",
                  size: "14px",
                  description: "Texto compacto",
                },
                {
                  key: "normal",
                  label: "Normal",
                  size: "16px",
                  description: "Tamaño estándar",
                },
                {
                  key: "large",
                  label: "Grande",
                  size: "18px",
                  description: "Más legible",
                },
                {
                  key: "extra-large",
                  label: "Extra Grande",
                  size: "20px",
                  description: "Máxima legibilidad",
                },
              ].map(({ key, label, size, description }) => (
                <button
                  key={key}
                  onClick={() =>
                    updateSetting(
                      "fontSize",
                      key as AccessibilitySettings["fontSize"]
                    )
                  }
                  className={`p-3 rounded-lg border transition-all text-left hover:shadow-sm focus:ring-2 focus:ring-blue-500 ${
                    settings.fontSize === key
                      ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={{ fontSize: size }}
                  aria-pressed={settings.fontSize === key}
                >
                  <div className="font-medium">{label}</div>
                  <div className="text-xs opacity-75">{description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Contraste */}
          <div className="space-y-3">
            <h3 className="text-md font-medium text-gray-900 flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              Contraste
            </h3>
            <p className="text-sm text-gray-600">
              Aumenta el contraste para personas con baja visión
            </p>
            <div className="space-y-2">
              <button
                onClick={() => updateSetting("contrast", "normal")}
                className={`w-full p-4 rounded-lg border transition-all text-left hover:shadow-sm focus:ring-2 focus:ring-blue-500 ${
                  settings.contrast === "normal"
                    ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                aria-pressed={settings.contrast === "normal"}
              >
                <div className="font-medium mb-1">Contraste Normal</div>
                <div className="text-sm text-gray-600">
                  Colores estándar del sitio web
                </div>
              </button>
              <button
                onClick={() => updateSetting("contrast", "high")}
                className={`w-full p-4 rounded-lg border transition-all text-left hover:shadow-sm focus:ring-2 focus:ring-blue-500 ${
                  settings.contrast === "high"
                    ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                aria-pressed={settings.contrast === "high"}
              >
                <div className="font-medium mb-1">Alto Contraste</div>
                <div className="text-sm text-gray-600">
                  Colores en blanco y negro para mejor legibilidad
                </div>
              </button>
            </div>
          </div>

          {/* Modo Solo Texto */}
          <div className="space-y-3">
            <h3 className="text-md font-medium text-gray-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Modo de Visualización
            </h3>
            <p className="text-sm text-gray-600">
              Oculta elementos decorativos para una experiencia más simple
            </p>
            <div className="space-y-2">
              <button
                onClick={() => updateSetting("textOnly", false)}
                className={`w-full p-4 rounded-lg border transition-all text-left hover:shadow-sm focus:ring-2 focus:ring-blue-500 ${
                  !settings.textOnly
                    ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                aria-pressed={!settings.textOnly}
              >
                <div className="font-medium mb-1">Vista Completa</div>
                <div className="text-sm text-gray-600">
                  Muestra todas las imágenes y elementos visuales
                </div>
              </button>
              <button
                onClick={() => updateSetting("textOnly", true)}
                className={`w-full p-4 rounded-lg border transition-all text-left hover:shadow-sm focus:ring-2 focus:ring-blue-500 ${
                  settings.textOnly
                    ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                aria-pressed={settings.textOnly}
              >
                <div className="font-medium mb-1">Solo Texto</div>
                <div className="text-sm text-gray-600">
                  Oculta imágenes decorativas y enfoca el contenido
                </div>
              </button>
            </div>
          </div>

          {/* Reset Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={resetSettings}
              className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium focus:ring-2 focus:ring-gray-500"
            >
              Restablecer a valores por defecto
            </button>
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-1">
              <Settings className="h-4 w-4" />
              Información
            </h4>
            <p className="text-sm text-blue-700 leading-relaxed">
              Estas configuraciones se guardan automáticamente en tu navegador y
              se aplicarán en futuras visitas al sitio web.
            </p>
          </div>

          {/* Atajos de teclado */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">
              Atajos de teclado
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>
                <kbd className="bg-white px-2 py-1 rounded border text-xs">
                  Alt
                </kbd>{" "}
                +{" "}
                <kbd className="bg-white px-2 py-1 rounded border text-xs">
                  A
                </kbd>{" "}
                - Abrir/cerrar panel
              </div>
              <div>
                <kbd className="bg-white px-2 py-1 rounded border text-xs">
                  Esc
                </kbd>{" "}
                - Cerrar panel
              </div>
              <div>
                <kbd className="bg-white px-2 py-1 rounded border text-xs">
                  Ctrl
                </kbd>{" "}
                +{" "}
                <kbd className="bg-white px-2 py-1 rounded border text-xs">
                  +
                </kbd>{" "}
                - Aumentar texto
              </div>
              <div>
                <kbd className="bg-white px-2 py-1 rounded border text-xs">
                  Ctrl
                </kbd>{" "}
                +{" "}
                <kbd className="bg-white px-2 py-1 rounded border text-xs">
                  -
                </kbd>{" "}
                - Disminuir texto
              </div>
              <div>
                <kbd className="bg-white px-2 py-1 rounded border text-xs">
                  Ctrl
                </kbd>{" "}
                +{" "}
                <kbd className="bg-white px-2 py-1 rounded border text-xs">
                  0
                </kbd>{" "}
                - Restablecer
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
