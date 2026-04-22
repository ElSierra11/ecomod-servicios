import { useState, useEffect, useCallback, useMemo } from "react";

// Temas predefinidos
const THEMES = {
  DARK: "dark",
  LIGHT: "light",
  SYSTEM: "system",
};

// Colores del sistema para cada tema
const THEME_COLORS = {
  [THEMES.DARK]: {
    primary: "#00ff88",
    secondary: "#00d4ff",
    background: "#0a0a0f",
    surface: "#1e1e2e",
    text: "#f0f0f8",
    success: "#00ff88",
    warning: "#fbbf24",
    error: "#ff6b6b",
  },
  [THEMES.LIGHT]: {
    primary: "#00b894",
    secondary: "#0984e3",
    background: "#f5f7fa",
    surface: "#ffffff",
    text: "#1a1a2e",
    success: "#00b894",
    warning: "#fdcb6e",
    error: "#e17055",
  },
};

// Preferencia del sistema
const getSystemTheme = () => {
  if (typeof window === "undefined") return THEMES.DARK;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? THEMES.DARK
    : THEMES.LIGHT;
};

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("ecomod_theme");
    if (saved && Object.values(THEMES).includes(saved)) return saved;
    return THEMES.SYSTEM;
  });

  const [systemTheme, setSystemTheme] = useState(THEMES.DARK);
  const [mounted, setMounted] = useState(false);
  const [themeTransitioning, setThemeTransitioning] = useState(false);

  // Escuchar cambios del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e) => {
      setSystemTheme(e.matches ? THEMES.DARK : THEMES.LIGHT);
    };

    setSystemTheme(mediaQuery.matches ? THEMES.DARK : THEMES.LIGHT);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Aplicar tema actual
  const currentTheme = theme === THEMES.SYSTEM ? systemTheme : theme;

  useEffect(() => {
    if (!mounted) {
      setMounted(true);
      return;
    }

    setThemeTransitioning(true);

    // Aplicar atributo data-theme
    document.documentElement.setAttribute("data-theme", currentTheme);

    // Aplicar colores CSS personalizados
    const colors = THEME_COLORS[currentTheme];
    const root = document.documentElement;

    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });

    // Agregar clase para animación de transición
    document.body.classList.add("theme-transition");

    setTimeout(() => {
      setThemeTransitioning(false);
      document.body.classList.remove("theme-transition");
    }, 300);
  }, [currentTheme, mounted]);

  // Guardar tema en localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("ecomod_theme", theme);
    }
  }, [theme, mounted]);

  // Cambiar tema con animación
  const toggle = useCallback(() => {
    const themes = [THEMES.DARK, THEMES.LIGHT, THEMES.SYSTEM];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  }, [theme]);

  // Cambiar a tema específico
  const setSpecificTheme = useCallback((newTheme) => {
    if (Object.values(THEMES).includes(newTheme)) {
      setTheme(newTheme);
    }
  }, []);

  // Cambiar a tema oscuro
  const setDarkTheme = useCallback(
    () => setSpecificTheme(THEMES.DARK),
    [setSpecificTheme],
  );

  // Cambiar a tema claro
  const setLightTheme = useCallback(
    () => setSpecificTheme(THEMES.LIGHT),
    [setSpecificTheme],
  );

  // Cambiar a tema del sistema
  const setSystemThemeMode = useCallback(
    () => setSpecificTheme(THEMES.SYSTEM),
    [setSpecificTheme],
  );

  // Obtener colores del tema actual
  const colors = useMemo(() => THEME_COLORS[currentTheme], [currentTheme]);

  // Verificar si es modo oscuro
  const isDark = currentTheme === THEMES.DARK;

  // Verificar si es modo claro
  const isLight = currentTheme === THEMES.LIGHT;

  // Verificar si usa tema del sistema
  const isSystem = theme === THEMES.SYSTEM;

  return {
    theme,
    currentTheme,
    systemTheme,
    isDark,
    isLight,
    isSystem,
    colors,
    mounted,
    themeTransitioning,
    toggle,
    setDarkTheme,
    setLightTheme,
    setSystemThemeMode,
    setTheme: setSpecificTheme,
  };
}

// Hook para usar colores del tema
export const useThemeColors = () => {
  const { colors, isDark } = useTheme();
  return { colors, isDark };
};

// Hook para CSS-in-JS con tema
export const useThemedStyles = (styles) => {
  const { colors, isDark, currentTheme } = useTheme();

  return useMemo(() => {
    if (typeof styles === "function") {
      return styles({ colors, isDark, theme: currentTheme });
    }
    return styles;
  }, [colors, isDark, currentTheme, styles]);
};

// Componente para agregar CSS de transición
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  .theme-transition * {
    transition: background-color 0.3s ease,
                color 0.2s ease,
                border-color 0.2s ease,
                box-shadow 0.2s ease !important;
  }
`;
if (typeof document !== "undefined") {
  document.head.appendChild(styleSheet);
}
