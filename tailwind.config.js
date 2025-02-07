/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: 'rgb(255, 255, 255)',
      black: 'rgb(0, 0, 0)',

      // Couleurs principales ISA-101 et shadcn
      background: 'rgb(224, 224, 224)',
      foreground: 'rgb(63, 63, 63)',

      card: {
        DEFAULT: 'rgb(224, 224, 224)',
        foreground: 'rgb(63, 63, 63)',
      },

      popover: {
        DEFAULT: 'rgb(224, 224, 224)',
        foreground: 'rgb(63, 63, 63)',
      },

      primary: {
        DEFAULT: 'rgb(71, 92, 167)',
        foreground: 'rgb(255, 255, 255)',
      },

      secondary: {
        DEFAULT: 'rgb(198, 198, 198)',
        foreground: 'rgb(63, 63, 63)',
      },

      muted: {
        DEFAULT: 'rgb(232, 232, 232)',
        foreground: 'rgb(145, 145, 145)',
      },

      accent: {
        DEFAULT: 'rgb(71, 92, 167)',
        foreground: 'rgb(255, 255, 255)',
      },

      destructive: {
        DEFAULT: 'rgb(226, 32, 40)',
        foreground: 'rgb(255, 255, 255)',
      },

      // ISA-101 specific
      alarm: {
        urgent: 'rgb(226, 32, 40)', // Priority 4
        high: 'rgb(236, 134, 41)', // Priority 2
        medium: 'rgb(245, 225, 27)', // Priority 3
        low: 'rgb(145, 106, 173)', // Priority 1
        info: 'rgb(71, 92, 167)', // Priority 0
      },

      process: {
        active: 'rgb(240, 240, 240)',
        inactive: 'rgb(128, 128, 128)',
        transition: 'rgb(147, 194, 228)',
      },

      border: 'rgb(160, 160, 164)',
      input: 'rgb(160, 160, 164)',
      ring: 'rgb(160, 160, 164)',
    },

    borderRadius: {
      lg: 'var(--radius)',
      md: 'calc(var(--radius) - 2px)',
      sm: 'calc(var(--radius) - 4px)',
      none: '0',
      full: '9999px',
    },

    fontSize: {
      xs: ['0.6875rem', { lineHeight: '1.3' }], // 11px
      sm: ['0.75rem', { lineHeight: '1.3' }], // 12px
      base: ['0.875rem', { lineHeight: '1.5' }], // 14px
      lg: ['1rem', { lineHeight: '1.5' }], // 16px
      xl: ['1.25rem', { lineHeight: '1.2' }], // 20px
      '2xl': ['1.5rem', { lineHeight: '1.2' }], // 24px
      '3xl': ['2.25rem', { lineHeight: '1.15' }], // 36px
    },

    spacing: {
      0: '0',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      5: '24px',
      6: '36px',
      8: '48px',
      10: '72px',
    },

    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
