import React, { useEffect, useState } from 'react';
import { Toaster as Sonner } from 'sonner';
import { useTheme } from '@/features/settings/components/theme/provider';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { themeMode } = useTheme();
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Résoudre le thème système si nécessaire
  useEffect(() => {
    if (themeMode === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setResolvedTheme(isDark ? 'dark' : 'light');

      // Écouter les changements de préférence système
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setResolvedTheme(themeMode === 'dark' ? 'dark' : 'light');
    }
  }, [themeMode]);

  return (
    <Sonner
      theme={resolvedTheme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'bg-background border border-border',
          content: 'bg-background',
          title: 'text-foreground',
          description: 'text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
          closeButton: 'text-foreground/50 hover:text-foreground',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
