"use client";

import { useState, useEffect } from "react";

export type AccessibilitySettings = {
  fontSize: "small" | "normal" | "large" | "extra-large";
  contrast: "normal" | "high";
  textOnly: boolean;
};

export const useAccessibility = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    fontSize: "normal",
    contrast: "normal",
    textOnly: false,
  });

  const [isOpen, setIsOpen] = useState(false);

  // Cargar configuración desde localStorage al montar
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSettings = localStorage.getItem("accessibility-settings");
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings(parsed);
        } catch (error) {
          console.error("Error loading accessibility settings:", error);
        }
      }
    }
  }, []);

  // Aplicar estilos cada vez que cambian las configuraciones
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Guardar en localStorage
      localStorage.setItem("accessibility-settings", JSON.stringify(settings));

      // Aplicar estilos
      applyAccessibilityStyles(settings);
    }
  }, [settings]);

  // Manejar atajos de teclado
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + A para abrir/cerrar panel
      if (event.altKey && event.key.toLowerCase() === "a") {
        event.preventDefault();
        setIsOpen(!isOpen);
      }

      // Escape para cerrar panel
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        setIsOpen(false);
      }

      // Atajos rápidos para cambiar configuraciones
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "+":
          case "=":
            event.preventDefault();
            // Aumentar tamaño de fuente
            const currentIndex = [
              "small",
              "normal",
              "large",
              "extra-large",
            ].indexOf(settings.fontSize);
            if (currentIndex < 3) {
              const newSize = ["small", "normal", "large", "extra-large"][
                currentIndex + 1
              ] as AccessibilitySettings["fontSize"];
              updateSetting("fontSize", newSize);
            }
            break;
          case "-":
            event.preventDefault();
            // Disminuir tamaño de fuente
            const currentIndexMinus = [
              "small",
              "normal",
              "large",
              "extra-large",
            ].indexOf(settings.fontSize);
            if (currentIndexMinus > 0) {
              const newSize = ["small", "normal", "large", "extra-large"][
                currentIndexMinus - 1
              ] as AccessibilitySettings["fontSize"];
              updateSetting("fontSize", newSize);
            }
            break;
          case "0":
            event.preventDefault();
            // Restablecer configuración
            resetSettings();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, settings.fontSize]);

  const applyAccessibilityStyles = (settings: AccessibilitySettings) => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;

    // Aplicar tamaño de fuente
    const fontSizeMap = {
      small: "0.875rem",
      normal: "1rem",
      large: "1.125rem",
      "extra-large": "1.25rem",
    };

    root.style.setProperty("--base-font-size", fontSizeMap[settings.fontSize]);

    // Aplicar contraste
    if (settings.contrast === "high") {
      root.classList.add("high-contrast");
      root.classList.add("accessibility-high-contrast");
    } else {
      root.classList.remove("high-contrast");
      root.classList.remove("accessibility-high-contrast");
    }

    // Aplicar modo solo texto
    if (settings.textOnly) {
      root.classList.add("text-only");
      root.classList.add("accessibility-text-only");
    } else {
      root.classList.remove("text-only");
      root.classList.remove("accessibility-text-only");
    }
  };

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings({
      fontSize: "normal",
      contrast: "normal",
      textOnly: false,
    });
  };

  return {
    settings,
    isOpen,
    setIsOpen,
    updateSetting,
    resetSettings,
  };
};
