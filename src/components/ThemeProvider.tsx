'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  systemTheme: ResolvedTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default function ThemeProvider({ children }: { children?: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  // Get system theme preference
  const getSystemTheme = (): ResolvedTheme => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Resolve the actual theme to apply
  const resolveTheme = (themePreference: Theme, currentSystemTheme: ResolvedTheme): ResolvedTheme => {
    if (themePreference === 'system') {
      return currentSystemTheme;
    }
    return themePreference as ResolvedTheme;
  };

  // Apply theme to document
  const applyTheme = (appliedTheme: ResolvedTheme) => {
    if (typeof window === 'undefined') return;

    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(appliedTheme);
    document.documentElement.setAttribute('data-theme', appliedTheme);
  };

  useEffect(() => {
    // Initialize system theme
    const initialSystemTheme = getSystemTheme();
    setSystemTheme(initialSystemTheme);

    // Get saved theme preference or default to 'system'
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const initialTheme = savedTheme || 'system';

    setThemeState(initialTheme);

    // Resolve and apply initial theme
    const initialResolvedTheme = resolveTheme(initialTheme, initialSystemTheme);
    setResolvedTheme(initialResolvedTheme);
    applyTheme(initialResolvedTheme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? 'dark' : 'light';
      setSystemTheme(newSystemTheme);

      // If current theme is 'system', update resolved theme
      setThemeState(currentTheme => {
        if (currentTheme === 'system') {
          setResolvedTheme(newSystemTheme);
          applyTheme(newSystemTheme);
        }
        return currentTheme;
      });
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    const newResolvedTheme = resolveTheme(newTheme, systemTheme);
    setResolvedTheme(newResolvedTheme);
    applyTheme(newResolvedTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, systemTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}