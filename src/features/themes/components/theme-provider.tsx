import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemePlugin } from '@/types/theme';
import { themeManager } from '@/lib/theme-manager';

interface ThemeContextType {
  currentTheme: string;
  setTheme: (themeName: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  plugins: ThemePlugin[];
  defaultTheme?: string;
}

export function ThemeProvider({
  children,
  plugins,
  defaultTheme = 'default'
}: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState(defaultTheme);

  useEffect(() => {
    // Register all theme plugins
    plugins.forEach(plugin => {
      themeManager.registerTheme(plugin);
    });

    // Set default theme
    if (defaultTheme) {
      themeManager.setTheme(defaultTheme);
      setCurrentTheme(defaultTheme);
    }
  }, [plugins, defaultTheme]);

  const value = {
    currentTheme,
    setTheme: (themeName: string) => {
      themeManager.setTheme(themeName);
      setCurrentTheme(themeName);
    }
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}