// @/features/settings/components/theme/provider.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

// Définir les types
export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeColor = 'blue' | 'gruvbox' | 'purple' | 'nord' | 'default';

interface ThemeContextType {
  themeMode: ThemeMode;
  themeColor: ThemeColor;
  setThemeMode: (mode: ThemeMode) => void;
  setThemeColor: (color: ThemeColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // État pour le mode (clair/sombre/système)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const storedThemeMode = localStorage.getItem('themeMode') as ThemeMode;
      if (
        storedThemeMode &&
        ['light', 'dark', 'system'].includes(storedThemeMode)
      ) {
        return storedThemeMode;
      }
    }
    return 'system';
  });

  // État pour la couleur du thème
  const [themeColor, setThemeColor] = useState<ThemeColor>(() => {
    if (typeof window !== 'undefined') {
      const storedThemeColor = localStorage.getItem('themeColor') as ThemeColor;
      if (
        storedThemeColor &&
        ['blue', 'purple', 'nord', 'default'].includes(storedThemeColor)
      ) {
        return storedThemeColor;
      }
    }
    return 'default';
  });

  // Appliquer le mode sombre/clair en fonction de la préférence système si nécessaire
  useEffect(() => {
    const updateTheme = () => {
      if (typeof window !== 'undefined') {
        // Si le thème est "system", on utilise la préférence système
        if (themeMode === 'system') {
          const isDark = window.matchMedia(
            '(prefers-color-scheme: dark)',
          ).matches;
          document.documentElement.classList.toggle('dark', isDark);
        } else {
          // Sinon on utilise la valeur explicite
          document.documentElement.classList.toggle(
            'dark',
            themeMode === 'dark',
          );
        }

        // Sauvegarder la préférence
        localStorage.setItem('themeMode', themeMode);
      }
    };

    // Appliquer la préférence initiale
    updateTheme();

    // Écouter les changements de préférence système
    if (themeMode === 'system' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => updateTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode]);

  // Appliquer le thème de couleur
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Nettoyer les classes de thème précédentes
      document.documentElement.classList.remove(
        'theme-blue',
        'theme-purple',
        'theme-nord',
      );

      // Ajouter la classe pour le thème de couleur
      if (themeColor !== 'default') {
        document.documentElement.classList.add(`theme-${themeColor}`);
      }

      // Sauvegarder la préférence
      localStorage.setItem('themeColor', themeColor);
    }
  }, [themeColor]);

  const value = {
    themeMode,
    themeColor,
    setThemeMode,
    setThemeColor,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
