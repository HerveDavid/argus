import { ThemePlugin } from '@/types/theme';

export const nordTheme: ThemePlugin = {
  name: 'nord',
  tokens: {
    colors: {
      background: '#ECEFF4',
      foreground: '#2E3440',
      primary: {
        DEFAULT: '#5E81AC',
        foreground: '#ECEFF4'
      },
      secondary: {
        DEFAULT: '#81A1C1',
        foreground: '#2E3440'
      },
      muted: {
        DEFAULT: '#4C566A',
        foreground: '#D8DEE9'
      },
      accent: {
        DEFAULT: '#88C0D0',
        foreground: '#2E3440'
      },
      destructive: {
        DEFAULT: '#BF616A',
        foreground: '#ECEFF4'
      },
      card: {
        DEFAULT: '#E5E9F0',
        foreground: '#2E3440'
      },
      border: '#D8DEE9',
      ring: '#5E81AC'
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.5rem',
      lg: '1rem',
      full: '9999px'
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    },
    fonts: {
      body: 'system-ui, sans-serif',
      heading: 'system-ui, sans-serif',
      mono: 'ui-monospace, monospace'
    }
  }
};
